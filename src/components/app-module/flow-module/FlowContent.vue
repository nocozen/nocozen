<template>
  <NFlex class="h-full w-full select-none" :size="0">
    <SmoothScrollbar class="rounded-t" :style="cptHeight">
      <NCard :style="cptMinCardHeight" class="h-full rounded-none" size="small" :bordered="false">
        <VglPanel ref="vglPanel" v-if="formLayouts?.length > 0" :readonly="isReadonly" class="w-full h-full"></VglPanel>
      </NCard>
    </SmoothScrollbar>
    <NCard v-if="!isReadonly" class="rounded-none border-dashed border-t-1" :bordered="false" size="small">
      <NFlex :size="0" align="center">
        <NFormItem v-if="'todo' == openType && showOpinion" label="审批意见" label-placement="left" :show-feedback="false"
          class="mr-2 w-80">
          <NInputGroup>
            <NInput size="small" v-model:value="currOpinion" class="" />
            <NButton @click="currOpinion = '同意'" size="small" type="info" ghost class="ml-1">同意</NButton>
          </NInputGroup>
        </NFormItem>
        <NFormItem v-if="'form' == openType && creatorDeptOption?.length > 1" label="审批部门" label-placement="left"
          :show-feedback="false" class="mr-2 w-60">
          <NSelect size="small" v-model:value="currApproveDeptId" :options="creatorDeptOption" class="" />
        </NFormItem>
        <NButton :disabled="currFlowDef == undefined && 'form' == openType" class="mr-2 w-25" type="info"
          @click="submitForm(FormOpt.Approve)">提交</NButton>
        <NButton v-if="nodeOpt.reject" :disabled="currFlowDef == undefined" class="mr-2 w-25" type="info"
          @click="submitForm(FormOpt.Reject)">否决</NButton>
        <NButton v-if="nodeOpt.cancel" :disabled="currFlowDef == undefined" class="mr-2 w-25" type="info"
          @click="submitForm(FormOpt.Reject)">结束流程</NButton>
        <!-- <NButton class="w-25" @click="onSubmit()">保存草稿</NButton> -->
        <span v-if="currFlowDef && !currFlowDef.enable" class="text-red text-sm">流程未启用！</span>
      </NFlex>
    </NCard>
    <NCard v-if="'table' == openType && isReadonly" class="h-20 rounded-none border-dashed border-t-1 pl-2"
      :bordered="false" size="small">
      <NFlex :size="0" class="text-xs my-2">
        <span class="w-20">提交人</span><span class="w-22 mx-1 text-blue">{{ flow?.createBy?.name }}</span>
        <span class="ml-3 w-20">提交时间</span><span class="w-38 mx-1 text-blue">{{ flow?.createAt && new
          Date(flow.createAt).toLocaleString() }}</span>
        <span class="ml-3 w-20">更新时间</span><span class="w-38 mx-1 text-blue">{{ flow?.updateAt && new
          Date(flow.updateAt).toLocaleString() }}</span>
      </NFlex>
      <NFlex :size="0" class="text-xs">
        <span class="w-20">流程状态</span><span class="w-22 mx-1 text-blue">{{ flow?.status && FlowStatusName[flow?.status]
          }}</span>
        <span class="ml-3 w-20">流程节点</span><span v-for="node in flow?.activeNodes" class="mx-1 text-blue">{{ node.name
          }}</span>
      </NFlex>
    </NCard>
    <NDrawer v-model:show="flowChart" to="#flow-card-modal"
      content-style="--n-header-padding: 8px;--n-title-font-size:14px" :trap-focus="false" :block-scroll="false"
      :width="800" placement="right" closable>
      <NDrawerContent :title="`流程版本V${flow?.flowDef.verId}`" closable body-content-style="padding: 0;margin:0">
        <FlowSvg ref="refSvg" :readonly="true" :flow-ins="flow"></FlowSvg>
      </NDrawerContent>
    </NDrawer>
  </NFlex>
</template>

<script setup lang="ts">
import { onMounted, ref, Ref, provide, watch, toRaw, computed, nextTick } from 'vue';
import { fetchGetModuleConfig, fetchGetModuleConfigByNodeId, fetchGetUserInfo } from '@/service/api';
import { fetchInsertBusiData, fetchFindBusiData } from '@/service/api/busi';
import { useRoute } from 'vue-router';
import { FlowStatusName, ModuleType, ProviderName, FormElType, FormOpt, TaskOpt, ComplatedState } from '@/enum';
import Uid from '@/utils/uid';
import { fetchExecutTask, fetchExecutFlowNext } from '@/service/api/flow';
import { useAuthStore } from '@/store/modules/auth';
import { isEmpty } from 'radashi';
import { getFormData } from '../shared';

interface Emits {
  (e: 'onFormEvent', formOpt: FormOpt): void;
}
const emit = defineEmits<Emits>();

interface Props {
  moduleConfig_id?: string,
  flow?: Meta.FlowInstance,
  readonly?: boolean,
  buttons?: Array<'cancel' | 'submit'>,
  hOffset?: number,
  openType: 'table' | 'form' | 'start' | 'todo' | 'handle' | 'received' | 'started',
}

const props = withDefaults(defineProps<Props>(), {
  openType: 'table',  // table | form | start | todo | handle | received | started
  flowList: () => [],
  // rowIndex: 0,
  hOffset: 0,
  readonly: false,
  buttons: () => ['submit']
});

const authStore = useAuthStore();
const route = useRoute();
const moduleType = ref();
const moduleNode = ref();
const flowDefs = ref<Array<Meta.FlowDefinition>>([]);
const currFlowDef = ref<Meta.FlowDefinition>();
const formLayouts = ref<Array<Meta.LayoutNode>>([]);
const compConfigs = ref<Array<Meta.CompConfig>>([]);
const formLayoutConfig: Ref<Meta.FormLayoutConfig> = ref({} as any);
const formConfig = ref<Meta.FormConfig>({} as any);
const isReadonly = ref(false);
const currApproveDeptId = ref('')           // 当前选中的审批部门id;
const creatorDeptOption = ref([] as any);   // 审批部门下拉列表
const currOpinion = ref('');    // 审批意见
const showOpinion = ref(false);
const nodeOpt = ref({
  sendBack: false,
  addSign: false,
  transfer: false,
  cancel: false,
  reject: false,
})
const flowChart = ref(false);
const refSvg = ref();

const cptHeight = computed(() => {
  let offset = 112;
  props.hOffset != 0 && (offset = offset + props.hOffset);
  if (props.readonly) {
    return `height: calc(100vh - 200px)`;
  } else {
    return `height: calc(100vh - ${offset}px)`;
  }
})

const cptMinCardHeight = computed(() => {
  let offset = 112;
  props.hOffset != 0 && (offset = offset + props.hOffset);
  if (props.readonly) {
    return `min-height: calc(100vh - 200px)`;
  } else {
    return `min-height: calc(100vh - ${offset}px)`;
  }
})

const showFlowChart = () => {
  flowChart.value = !flowChart.value;
  nextTick(() => {
    if (flowChart.value && refSvg.value) {
      refSvg.value.initFlowDef(props.flow?.flowDef.uid)
      refSvg.value.initSvg()
      refSvg.value.drawFlow();
    }
  })
}

// 流程实例中包含了表单数据
// 表单元数据、字段权限要从node.fieldPerm中获取，保存到compConfig.viewPerm / editPerm; formMeta元数据【废弃】
// 当前激活节点、哪个用户在操作？定位取哪个节点权限；1、启动前：取开始节点；2、启动后：非readonly，取激活任务对应的节点；
const initModuleData = async () => {
  let result = null as any;
  if (props.moduleConfig_id) {
    result = await fetchGetModuleConfig(props.moduleConfig_id);
  } else {
    props.flow && (result = await fetchGetModuleConfigByNodeId(props.flow.module_id));
  }

  if ('ok' == result.msg && result.data?.length > 0) {
    // 在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
    formLayouts.value.length = 0;   // init
    compConfigs.value.length = 0;   // init
    flowDefs.value.length = 0;      // init
    formConfig.value = {} as any;   // init
    moduleNode.value = {} as any;

    moduleType.value = result.data[0].moduleType;
    formConfig.value = result.data[0].formConfig;
    compConfigs.value.push(...result.data[0].compConfigs);
    result.data[0].flowDefs?.length > 0 && flowDefs.value.push(...result.data[0].flowDefs);
    currFlowDef.value = flowDefs.value.find((def: Meta.FlowDefinition) => def.enable);
    moduleNode.value = result.data[0].moduleNode;   // 关联查询moduleNode
    initFieldPerm();
    // 初始化布局，并添加监听标记
    if (result.data[0].layouts?.length > 0) {
      result.data[0].layouts?.forEach((node: any) => {
        formLayouts.value.push({ ...node, initFlag: Uid.NextNumber() });
      })
    }
    const formVglConfig = result.data[0].defVglConfig;
    formVglConfig.vglHeightPadding = 180;   // 临时辅助参数
    formVglConfig.isEditable = false;   // 临时辅助参数
    formVglConfig.draggable = false;
    // vglConfig 不存在，或者配置：默认，取defVglConfig
    if (isEmpty(result.data[0].vglConfig)) {
      formLayoutConfig.value = formVglConfig;
    } else {
      formLayoutConfig.value = { ...formVglConfig, ...result.data[0].vglConfig };
    }
  }

  // 初始化流程发起人选择审批部门；当前账户可以不传参数，后续可以支持发起人不是申请人；
  const resultUser = await fetchGetUserInfo();
  if ('ok' == resultUser.msg) {
    const depts = resultUser.data[0].dept;
    currApproveDeptId.value = depts[0]._id;
    creatorDeptOption.value = depts.map((d: Meta.Base) => ({ value: d._id, label: d.name }));
  }
}

/** 查询初始化数据 */
const initFormData = computed(() => {
  let data = props.flow?.formData;
  if (data) {
    compConfigs.value?.forEach(config => {
      config.fieldName && data[config.fieldName] && (config.fieldValue = data[config.fieldName]);
    })
  }
  return compConfigs.value;
})

// 组件配置修改：先流程停用才可以修改，
// 选中流程节点同步字段权限，同步删除、添加；已执行的流程字段权限配置不存在的默认无权限；
// 流程实例中的流程定义？激活节点中有无副本？
// 已运行实例不再同步，组件配置中的流程定义同步即可；【容错处理下】；
const traverFieldPerm = (fieldPerm: Array<Meta.FieldPerm>, pViewPerm: boolean) => {
  fieldPerm?.forEach((fp: Meta.FieldPerm) => {
    let comp = null;
    // 处理嵌套类型，tab组件
    if (fp.fieldType == FormElType.NestTabPane) {
      comp = compConfigs.value.find((c: Meta.CompBase) => c.nestUid?.includes(+fp.fieldName));
    } else {
      comp = compConfigs.value.find((c: Meta.FormComp) => c.fieldName == fp.fieldName);
    }

    if (comp) {
      comp.editPerm = fp.editPerm;
      if (pViewPerm) {
        comp.viewPerm = fp.viewPerm
      } else {
        comp.viewPerm = false;
      }
      if (fp.children) {
        traverFieldPerm(toRaw(fp.children), comp.viewPerm)
      }
    }
  })
}

// 初始化字段权限fieldPerm；
const initFieldPerm = () => {
  // 一个实例中有当前用户多个任务，激活任务只有一个；
  // table：有只读控制，可以不处理fieldPerm；
  // started、handle：流程实例-定义-开始节点；有只读控制，可以不处理fieldPerm；
  // received：流程实例-抄送任务-定义节点；有只读控制，可以不处理fieldPerm；
  let fieldPerm = [] as any;
  if (props.openType == 'form' || props.openType == 'start') {
    // 获取开始节点fieldPerm，流程定义-开始节点
    fieldPerm = currFlowDef.value?.nodes[0].fieldPerm;
    fieldPerm && traverFieldPerm(fieldPerm, true);
  } else if (props.openType == 'todo') {
    // 流程实例-我的任务-激活节点
    const actNode = props.flow!.activeNodes[0];
    showOpinion.value = actNode.opinion != undefined;
    actNode.nodeOpt && (nodeOpt.value = actNode.nodeOpt);
    fieldPerm = actNode.fieldPerm;
    fieldPerm && traverFieldPerm(fieldPerm, true);
  }
}

const init = async () => {
  isReadonly.value = props.readonly;
  await initModuleData();
}

onMounted(() => {
  init();
})

// 必须的初始化表单数据计算属性，
// 表单init中初始化，流程表单可能不行；
watch(
  () => initFormData,
  (newValue, oldValue) => {
  },
  { immediate: true, deep: true }
);

watch(
  () => route.query.open,
  (newValue, oldValue) => {// 第一次没有加载vgl，所以二次刷新不重复
    newValue && initModuleData();
  },
  { immediate: true, deep: true }
);

// 操作意见：所有更新任务的操作都增加【操作意见|意见附件 / 手写签名】字段；
const submitForm = async (opt: FormOpt) => {
  const collName = formConfig.value.collName;
  const { formData, formMeta } = getFormData(compConfigs.value)
  // return;
  if (collName && Object.keys(formData)?.length > 0) {
    if (props.flow) {
      if (collName && Object.keys(formData)?.length > 0) {
        // 流程完成、终止：修改保存formData，并更新业务表；
        let flowIns = props.flow;
        // 审批意见
        flowIns.activeTasks[0].opinion = currOpinion.value;
        // todo: formData并发会签覆盖冲突？
        // 只能更新有权限操作的字段；
        flowIns.formData = { ...flowIns.formData, ...formData };
        // 当前实例只有当前任务，不能全量更新；
        // 流程未完成，更新数据，更新任务状态，驱动到下一节点：1.移除当前激活节点，移除当前激活任务，插入历史任务；，
        // 提交操作要注意获取最新的数据
        const execResult = await fetchExecutTask(toRaw(flowIns), TaskOpt.Approve);
        if ('ok' != execResult.msg) {
          console.log('流程出错！' + execResult.msg)
        } else {
          // formDialog.value.show(false);
          emit("onFormEvent", FormOpt.Update)
        }
      }
    } else {
      formData['complatedState'] = ComplatedState.Review;       // 流程表单启动
      const insertResult: Fetch.InsertResult = await fetchInsertBusiData(collName, formData);
      const inserId = insertResult.data.insertedIds[0];
      const findResult: Fetch.FindResult = await fetchFindBusiData(collName, { _id: inserId });

      if ('ok' == insertResult.msg && 'ok' == findResult.msg) {
        const app_id = route.query.app_id?.toString();
        if (app_id && currFlowDef.value && moduleNode) {
          const flowIns: Meta.FlowInstance = {
            app_id: app_id,
            module_id: moduleNode.value._id!,
            moduleName: moduleNode.value.name,
            collName: collName,
            formMeta: formMeta,
            formData: findResult.data[0],
            flowDef: currFlowDef.value,
            activeNodes: [],
            activeTasks: [],
            activeCCopy: [],
            status: 'active',
            en_id: '',
            createBy: { // 临时用，提交后会被覆盖；
              _id: authStore.userInfo._id, // 临时用，提交后会被覆盖
              name: authStore.userInfo.name, // 临时用，提交后会被覆盖
            },
            creatorDeptId: currApproveDeptId.value    // 逐级审批：流程发起人所属多个部门时，界面提供部门下拉选择；
          }
          const execResult = await fetchExecutFlowNext(flowIns, FormOpt.Start);
          console.log('创建流程实例完成！')
          if ('ok' != execResult.msg) {
            console.log('创建流程实例出错！' + execResult.msg)
          }
        }
        emit('onFormEvent', FormOpt.Update);
      } else {
        console.log('提交表单出错！' + insertResult.msg)
      }
    }
  }

}

// 使用 provide 提供 handleEvent 函数
// provide(ProviderName.ModuleFormEventProvide, moduleFormEvent);
provide(ProviderName.FormConfigProvider, formConfig);
provide(ProviderName.LayoutConfigProvide, formLayoutConfig);
provide(ProviderName.LayoutsProvide, formLayouts.value);
provide(ProviderName.CompConfigsProvide, compConfigs.value);
provide(ProviderName.FlowDefsPorvide, flowDefs.value);

const vglPanel = ref();
const print = () => {
  vglPanel.value.print();
}

defineExpose({
  showFlowChart,
  print
})

</script>
<style lang="scss" scoped></style>
