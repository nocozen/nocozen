<template>
  <NFlex class="h-full w-full select-none" :size="0">
    <NFlex v-if="isReadonly" :size="0" class="px-4 border-b-1 h-10 w-full" align="center">
      <NFlex class="flex-1">
        <ButtonIcon @click="onPrintClick" size="small" class="" icon="mdi:printer-outline" title="打印" />
        <ButtonIcon @click="onEditClick" size="small" class="" icon="line-md--edit" title="编辑" />
        <ButtonIcon @click="onDelete" size="small" class="" icon="mdi:trash-can-outline" title="删除" />
      </NFlex>
      <NPagination @update:page="onPageChange" v-model:page="currIndex" :page-count="dataList?.length" simple />
    </NFlex>
    <SmoothScrollbar class="rounded-t" :style="cptHeight">
      <NCard class="rounded-none" size="small" :bordered="false">
        <VglPanel ref="vglPanel" v-if="formLayouts?.length > 0" :readonly="isReadonly"></VglPanel>
      </NCard>
    </SmoothScrollbar>
    <NCard v-if="!isReadonly" class="rounded-none border-dashed border-t-1" :bordered="false" size="small">
      <NFlex :size="0">
        <NButton v-if="buttons.includes('submit')" class="mr-2 w-25" type="info"
          @click="onFormEvent(FormOpt.Confirmed)">提交</NButton>
        <!-- <NButton class="w-25" @click="onFormEvent(FormOpt.Draft)">保存草稿</NButton> -->
        <NButton v-if="buttons.includes('cancel')" class="mr-2 w-25" @click="onFormEvent(FormOpt.Cancel)">取消</NButton>
      </NFlex>
    </NCard>
  </NFlex>
</template>

<script setup lang="ts">
import { toRaw, ref, Ref, provide, watch, computed, onMounted } from 'vue';
import { fetchGetModuleConfig } from '@/service/api';
import { fetchInsertBusiData, fetchFindBusiData, fetchUpdateBusiData, fetchDelteBusiData } from '@/service/api/busi';
import { useRoute } from 'vue-router';
import { ModuleType, ProviderName, ComplatedState, FormOpt, FormElType } from '@/enum';
import Uid from '@/utils/uid';
import * as _ from 'lodash-es';
import { isEmpty } from 'radashi';
import { getFormData } from '../shared';

interface Props {
  moduleConfig_id: string,
  dataList?: Array<any>,
  rowIndex?: number,
  readonly?: boolean,
  buttons?: Array<'cancel' | 'submit'>,
  hOffset?: number,
}

const props = withDefaults(defineProps<Props>(), {
  rowEdit: true,
  dataList: () => [],
  rowIndex: 0,
  hOffset: 0,
  readonly: false,
  buttons: () => ['submit'],
});

interface Emits {
  (e: 'onFormEvent', formOpt: FormOpt, id?: string): void;
}
const emit = defineEmits<Emits>();

const cptHeight = computed(() => {
  let offset = 112;
  props.hOffset != 0 && (offset = offset + props.hOffset);
  if (props.readonly) {
    return `height: calc(100vh - ${offset}px)`;
  } else {
    return "height: calc(100vh - 112px)";
  }
})

const vglPanel = ref();
const route = useRoute();
const moduleType = ref()
const moduleNode = ref();
// 模块id => 模块配置 => 权限组列表、表单内容、表单数据；权限控制；
// 默认权限组权限解析：依据值解析，不依赖组标识，默认组增加不需要修改代码逻辑；
// 定义一个类型映射，支持数据存储类型的定义和转换；
const formLayouts = ref<Array<Meta.LayoutNode>>([]);
const compConfigs = ref<Array<Meta.CompConfig>>([]);

const formLayoutConfig: Ref<Meta.FormLayoutConfig> = ref({} as any)
const formConfig = ref<Meta.FormConfig>({} as any)

const currIndex = ref();
const isReadonly = ref(false);
const currOpenType = ref('add')

// 表单：草稿、确认、作废
// 操作：草稿、启动、审批/回退...确认、作废
// 实例：进行中、完成、作废

const onPrintClick = () => {
  vglPanel.value.print();
}

/** 查询初始化模块元数据 */
const initModuleData = async () => {
  // 查询模块配置并初始化；
  if (props.moduleConfig_id) {
    const result = await fetchGetModuleConfig(props.moduleConfig_id);
    if ('ok' == result.msg && result.data?.length > 0) {
      // 在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
      formLayouts.value.length = 0;   // init
      compConfigs.value.length = 0;   // init
      formConfig.value = {} as any;   // init
      moduleNode.value = {} as any;

      moduleType.value = result.data[0].moduleType;
      compConfigs.value.push(...result.data[0].compConfigs);
      moduleNode.value = result.data[0].moduleNode;   // 关联查询moduleNode
      formConfig.value = result.data[0].formConfig;

      // 初始化布局，并添加监听标记
      if (result.data[0].layouts?.length > 0) {
        result.data[0].layouts?.forEach((node: any) => {
          formLayouts.value.push({ ...node, initFlag: Uid.NextNumber() });
        })
      }
      const formVglConfig: Meta.FormLayoutConfig = result.data[0].defVglConfig;
      formVglConfig.vglHeightPadding = 136;   // 临时辅助参数
      formVglConfig.isEditable = false;   // 临时辅助参数
      formVglConfig.draggable = false;
      // vglConfig 不存在，或者配置：默认，取defVglConfig
      if (isEmpty(result.data[0].vglConfig)) {
        formLayoutConfig.value = formVglConfig;
      } else {
        formLayoutConfig.value = { ...formVglConfig, ...result.data[0].vglConfig };
      }

    }
  }
}

// 清空form表单组件值
const resetForm = () => {
  compConfigs.value?.forEach((config: any) => {
    config.fieldValue = null;
  })
}

//
const submitForm = async () => {
  const collName = formConfig.value.collName;
  const { formData, formMeta } = getFormData(compConfigs.value);
  if (collName && Object.keys(formData)?.length > 0) {
    // 区分【草稿】【启动/确认】
    // 如果_id存在更新，不存在新增；
    if (props.rowIndex) {   // 【更新】第一条: 1
      // console.log(props.dataList[props.rowIndex - 1])
      const _id = props.dataList[props.rowIndex - 1]._id;
      // 去掉空值导致无法原来有值无法置空；
      // let filterNullFormData = _.omitBy(formData, _.isNull);
      // const reuslt = await fetchUpdateBusiData(collName, { _id, ...filterNullFormData });
      const reuslt = await fetchUpdateBusiData(collName, { _id, ...formData });
      if ('ok' == reuslt.msg) {
        emit('onFormEvent', FormOpt.Update);
      }

    } else {  // 【新增】, 插入时不能清除初始化空值，确保字段完整；？？
      if (ModuleType.Form == moduleType.value) {
        formData['complatedState'] = ComplatedState.Confirmed;    // 表单提交直接确认
      } else {
        formData['complatedState'] = ComplatedState.Review;       // 流程表单启动
      }
      // 树形结构的提交需要用insertTreeNode接口；或修改现有接口，否则无法实现suf_id排序；
      // 【暂时不启用suf_id】todo: 下一个版本增加排序控制；启用后节点维护现有InsertBusiData等方法不可用；
      const insertResult: Fetch.InsertResult = await fetchInsertBusiData(collName, formData);
      const inserId = insertResult.data.insertedIds[0];
      const findResult: Fetch.FindResult = await fetchFindBusiData(collName, { _id: inserId });

      // 插入失败但是未出错会返回ok的情况
      if ('ok' == insertResult.msg && 'ok' == findResult.msg) {
        emit('onFormEvent', FormOpt.Update);
      } else {
        console.log('提交表单出错！' + insertResult.msg)
      }
    }
  }
}

const onDelete = async () => {
  const collName = formConfig.value.collName;
  if (props.rowIndex && collName) {
    const _id = props.dataList[props.rowIndex - 1]._id;
    const result = await fetchDelteBusiData(collName, _id);
    if ('ok' == result.msg) {
      window.$message?.info("删除成功！");
      emit('onFormEvent', FormOpt.Delete, _id)
    }
  }
}

const onFormEvent = (opt: FormOpt) => {
  if (FormOpt.Cancel == opt) {
    isReadonly.value = true;
  } else if (FormOpt.Confirmed == opt) {
    submitForm();
    isReadonly.value = true;
  }
  emit('onFormEvent', opt);
}

const onEditClick = () => {
  isReadonly.value = false;
  currOpenType.value = 'edit';
}

// 目前只是单页浏览，目前认为不必要做全数据浏览；
const initFormData = async (rowIndex?: number) => {
  resetForm();
  const index = rowIndex ? rowIndex : props.rowIndex;
  currIndex.value = index;
  let data = props.dataList[index - 1];
  if (data && compConfigs) {
    compConfigs.value?.forEach(config => {
      config.fieldName && data[config.fieldName] && (config.fieldValue = data[config.fieldName]);
    })
  }
}

const onPageChange = async (index: number) => {
  currIndex.value = index;
  await initFormData(currIndex.value)
}

const init = async () => {
  isReadonly.value = props.readonly;
  await initModuleData();
  if (props.readonly) {
    await initFormData(); // 浏览表单切换需要刷新
  } else {
    // resetForm();   // 空表单打开不需要刷新
  }
}

onMounted(() => {
  init();
})


watch(
  () => route.query.open,
  (newValue, oldValue) => {// 第一次没有加载vgl，所以二次刷新不重复
    newValue && initModuleData();
  },
  { immediate: true, deep: true }
);

// 使用 provide 提供 handleEvent 函数
// provide(ProviderName.ModuleFormEventProvide, moduleFormEvent);
provide(ProviderName.FormConfigProvider, formConfig);
provide(ProviderName.LayoutConfigProvide, formLayoutConfig);
provide(ProviderName.LayoutsProvide, formLayouts.value);
provide(ProviderName.CompConfigsProvide, compConfigs.value);
// provide(ProviderName.FlowDefsPorvide, flowDefs.value);

defineExpose({
  resetForm
})
</script>
