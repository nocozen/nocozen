<template>
  <NFlex align="center" justify="space-between">
    <span>数据源</span>
  </NFlex>
  <NFlex align="center" class="border-b-1 pb-3" justify="start" :size="0">
    <FromTreeSelect @update-value="onSelectForm" :options="formOptions" v-model="currBindValue" class="w-40!"
      placeholder="请选择数据源" />
    <!-- 数据同步：绑定的元数据刷新；数据浏览绑定：选择更多的数据员类型和数据明细查看 -->
    <ButtonIcon icon="prime-sync" type="info" level="text" />
    <!-- <ButtonIcon icon="mdi:database-search-outline" type="info" level="text" /> -->
  </NFlex>
  <span class="mt-2 mb-1">字段</span>
  <SmoothScrollbar>
    <NFlex vertical>
      <Drag v-for="m in metaList" :key="m.key" :type="m.type" :data="m" class="pl-3 h-5 w-fit align-center">
        <ButtonIcon level="text" :title="m.label" size="tiny" class="justify-start" iconClass="text-blue text-sm"
          :icon="getIconByType(m.type)" :focusable="false" />
      </Drag>
    </NFlex>
  </SmoothScrollbar>
</template>

<script setup lang="ts">
import { ref, watch, computed, h } from 'vue';
import { BiType, FormElType } from '@/enum';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchGetModuleConfig, getAllModuleTree } from '@/service/api';
import { useRoute } from 'vue-router';
import { arrayToTree } from '@/utils/arrayToTree';


interface Props {
  dataBind: any
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'updateDataBind', dataBind: any): void;
}

const emit = defineEmits<Emits>();

const route = useRoute();
const { compConfigs } = useModuleInject();
// 绑定的-模块配置_id，compConfigs，
// 模块类型：【表单】【流程表单】；  todo: 【报表】类型后续在扩展，用以支持复制；
// 取到的是模块配置数组，需要迭代获取【字段元数据】
const metaList = ref<Array<Meta.DropItem>>([])
const expandedKeys = ref([] as any);

const formOptions = ref<Array<any>>([]);  // [currFormBind.node.moduleConfig_id]
let currFormBind = ref(null as any);    // 当前表单树菜单项数据绑定结构 currFormBind.node.moduleConfig_id
let currDataBind: Meta.DataBind = {     // 数据绑定存储结构
  moduleConfig_id: null,
  collName: null,
  metaData: [] as any
}
const currBindValue = ref();

const findInTree = (tree: any[], moduleConfigId: string): any => {
  for (const node of tree) {
    // 检查当前节点是否匹配
    if (node.node?.moduleConfig_id === moduleConfigId) {
      return node;
    }
    // 如果有子节点，递归查找
    if (node.children?.length) {
      const found = findInTree(node.children, moduleConfigId);
      if (found) return found;
    }
  }
  return; // 未找到返回
};

const getAppMenus = async () => {
  const appId = route.query.app_id?.toString();
  const result = await getAllModuleTree(appId, ['form', 'flow']);
  if (result) {
    formOptions.value = result[0].children;
    // 下拉菜单创建后添加 currFormBind 显示名称实现模块名称同步,
    // dataBind 不存名称，关联：currFormBind.node.moduleConfig_id == props.dataBind.moduleConfig_id
    if (props.dataBind?.moduleConfig_id) {
      currFormBind.value = findInTree(formOptions.value, props.dataBind.moduleConfig_id);
      currBindValue.value = currFormBind.value.key;
    };
  }
}


// const dataBind = ref('676138f65ce1462e10694a71'); // 绑定的表单

// todo: 嵌套关联映射需要特殊处理，不能直接映射；
// todo: fieldType未启用，biType用type映射；
const mapBiType = (fieldType: string) => {
  if (FormElType.FeNumber == fieldType) {
    return BiType.Number;
  } else if (FormElType.FeDatetime == fieldType) {
    return BiType.Date;
  } else {
    // 暂时统一都直接映射Text
    return BiType.Text;
  }
}

// 生成元数据字段列表
const initMetaData = async () => {
  metaList.value = [] as any;
  if (props.dataBind) {
    if (props.dataBind.hasOwnProperty('collName')) {
      currDataBind.collName = props.dataBind.collName;
    }
    if (props.dataBind.hasOwnProperty('moduleConfig_id')) {
      currDataBind.moduleConfig_id = props.dataBind.moduleConfig_id;
    }
    if (props.dataBind.hasOwnProperty('metaData') && props.dataBind.metaData?.length > 0) {
      // console.log(props.dataBind.metaData)
      metaList.value = props.dataBind.metaData
        .filter((meta: Meta.FormComp) => !meta.fieldType?.startsWith(FormElType.Nest))
        .map((meta: Meta.FormComp) => ({
          key: meta.fieldName,
          label: meta.title,
          type: mapBiType(meta.fieldType),
          fieldType: meta.fieldType
        }))
    } else {
      await resetMetaData();
    }
  } else {
    await resetMetaData();
  }

}

const resetMetaData = async () => {
  if (!currFormBind.value || !currFormBind.value.node.moduleConfig_id) return;

  const result = await fetchGetModuleConfig(currFormBind.value.node.moduleConfig_id);
  if ('ok' == result.msg && result.data?.length > 0 && result.data[0].compConfigs?.length > 0) {
    currDataBind.moduleConfig_id = currFormBind.value.node.moduleConfig_id;
    currDataBind.collName = result.data[0].formConfig.collName;
    // NestEditTable提前提取出来
    const editTables = result.data[0].compConfigs.filter((meta: Meta.FormComp) => meta.type == FormElType.NestEditTable)
      .reduce((acc: Record<string, Meta.FormComp>, current: Meta.FormComp) => {
        acc[current.nestUid![0]] = current;
        return acc;
      }, {} as Record<string, Meta.FormComp>);
    let metaData = [] as any;
    metaList.value = result.data[0].compConfigs
      .filter((meta: Meta.FormComp) => !meta.fieldType?.startsWith(FormElType.Nest))
      .map((comp: Meta.FormComp) => {
        const nestName = comp.nodeUid && editTables[comp.nodeUid]?.type == FormElType.NestEditTable
          ? `${editTables[comp.nodeUid]?.fieldName}.${comp.fieldName}` : comp.fieldName;
        metaData.push({
          title: comp.title,
          fieldName: nestName,
          fieldType: comp.type      // todo: fieldType未启用，biType用type映射；
        })
        return {
          key: nestName,
          label: comp.title,
          type: comp.type == FormElType.FeNumber ? BiType.Number : BiType.Text
        }
      })
    currDataBind.metaData = metaData;
  }
}

watch(
  () => props.dataBind,
  (newValue, oldValue) => {
    getAppMenus();
    initMetaData();
  },
  { immediate: true, deep: true }
);

const getIconByType = (type: string) => {
  if (BiType.Text == type) {
    return 'mdi:format-title'
  } else if (BiType.Date == type) {
    return 'mingcute--time-line'
  } else if (BiType.Number == type) {
    return 'material-symbols--numbers-rounded'
  }
}

const onSelectForm = async (key: string, option: any) => {
  currFormBind.value = option;
  currBindValue.value = key;
  // 保存dataBind
  await resetMetaData();
  emit('updateDataBind', currDataBind);
}

</script>

<style lang="scss" scoped>
:deep(.n-tree-select-menu) {
  min-width: auto !important;
  width: max-content !important;
}
</style>
