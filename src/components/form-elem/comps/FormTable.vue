<template>
  <NCard content-style="padding: 0;" :bordered="false" class="w-full h-full" size="small">
    <NFlex class="h-10 font-semibold" align="center" justify="space-between">
      <NFlex>
        <span v-if="compConfig?.showTitle">{{ compConfig?.title }}</span><span>{{ relationModule?.name }}</span>
      </NFlex>
      <NFlex align="center">
        <ButtonIcon v-if="optPerm.includes('add')" @click="onAddClick" type="info" title="添加" icon="mdi:add" level=""
          size="small"></ButtonIcon>
      </NFlex>
    </NFlex>
    <NDataTable @wheel.stop :min-height="20" :style="cptTableHeight" flex-height
      @update:checked-row-keys="onTableChecked" :row-key="rowKey" :single-line="false" size="small" :columns="columns"
      :data="data" :pagination="false" :scroll-x="scrollX" :row-props="rowProps" />
    <NFlex class="h-12 mt-1" align="center" justify="space-between">
      <span>{{ `总共 ${dataCount} 条` }}</span>
      <NPagination v-model:page="currentPage" :display-order="['pages', 'size-picker']" show-quick-jumper
        :page-count="totalPages" :page-size="pageSize" :page-slot="6" show-size-picker :page-sizes="pageSizes"
        @update:page="onPageChange" @update:page-size="onPageSizeChange" />
    </NFlex>
    <FormDialog v-if="clickEventType == 'rowEdit' && relationModule" ref="refFormDialog" @refresh="loadData"
      :module-node="relationModule" />
  </NCard>
</template>

<script lang="ts" setup>
import { ref, h, watch, watchEffect, Ref, computed } from 'vue';
import { NDataTable, PaginationProps, useMessage } from 'naive-ui';
import { fetchFindBusiData } from '@/service/api/busi';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchGetAppModules, fetchGetModuleConfig } from '@/service/api';
import { BaseComparOpt, ElTypeGroup, FormOpt, FormElType, ProviderName } from '@/enum';
import { isEmpty } from 'lodash-es';
import dayjs from 'dayjs';
import { isObject } from 'radashi';

interface Props {
  i?: string,
  config?: Meta.FormComp,
  height: number,
  optPerm: Array<'add' | 'filter'>,
  clickEventType: 'rowSelected' | 'rowEdit' | 'colView',
  rowData?: any,
}

const props = withDefaults(defineProps<Props>(), {
  clickEventType: 'rowSelected',
  height: 200,
  optPerm: () => []
});

interface Emits {
  (e: 'rowSelected', rowData: any): void;
}
const emit = defineEmits<Emits>();

const scrollX = ref();   // 设置scrollX会影响设置列宽
const defColWidth = 150;
const pageSize = ref(10);
const pageSizes = ref([10, 50, 100])
const currentPage = ref(1);
const totalPages = ref(1);
const dataCount = ref(0);

const columns = ref([] as any);
const data = ref([] as any);
const selectedOption = ref({} as any);
const fieldOptions = ref([] as any);
const refFormDialog = ref();
const relation = ref();
const cascadeFilter = ref({} as any);
const relationModule = ref();
const compConfig = ref();

const { compConfigs } = useModuleInject();
const rowKey = (row: any) => row._id;

const cptTableHeight = computed(() => {
  return `height:${props.height - 140}px`
})

const rowProps = (rowData: object, rowIndex: number) => {
  return {
    style: 'cursor: pointer',
    onClick: (e: any) => {
      onRowClick(e, rowData, rowIndex);
    }
  }
}

const onRowClick = (e: any, rowData: object, rowIndex: number) => {
  if (props.clickEventType == 'rowSelected') {
    emit('rowSelected', rowData);
  } else if (props.clickEventType == 'rowEdit') {
    let className = e.target.className.toString();
    if (refFormDialog.value) {
      if (className.includes('n-checkbox') || e.target.closest('.n-data-table-td.n-data-table-td--expand')) {
      } else {
        refFormDialog.value.show('view', data.value, rowIndex);
      }
    }
  }
}

const onAddClick = () => {
  refFormDialog.value.show('add')
}

const onPageChange = (page: number) => {
  loadData(page);
}

const onTableChecked = (rowKeys: Array<any>) => {
}

const onPageSizeChange = async (size: number) => {
  pageSize.value = size;
  await loadData(1);
}

const getConfig = async (config_id: string) => {
  fieldOptions.value = [{ key: '0', label: '全部字段' }];
  const result = await fetchGetModuleConfig(config_id);
  if ('ok' == result.msg && result.data?.length == 1 && result.data[0].compConfigs && result.data[0].compConfigs?.length > 0) {
    let cols = result.data[0].compConfigs.map((config: Meta.FormComp, index: number) => {
      fieldOptions.value.push({
        key: config.fieldName,
        label: config.title,
      })
      let column = {
        title: config.title,
        key: config.fieldName,
        minWidth: 150,
        // fixed: index == 0 ? 'left' : 'false',
        titleAlign: 'start',
        align: 'start',
        ellipsis: {
          tooltip: true
        },
      }
      return column;
    })
    columns.value = [{ type: 'selection', fixed: 'left' }, ...cols];
    scrollX.value = defColWidth * cols.length + 40;
    selectedOption.value = fieldOptions.value[0];
  }
}

const getRelationModule = async (id: string) => {
  const result = await fetchGetAppModules({ _id: id });
  if ('ok' == result.msg && result.data?.length == 1) {
    relationModule.value = result.data[0];
  }
}

const init = async () => {
  if (compConfig.value) {
    relation.value = compConfig.value.relation;
    // relation.moduleConfig_id 查询获取组件配置
    compConfig.value.relation.moduleConfig_id && await getConfig(compConfig.value.relation.moduleConfig_id);
  }
  await loadData(1);
}

const loadData = async (pageNumber: number = 1) => {
  if (!relation.value || !relation.value?.module_id) {
    data.value = [];
    return;
  }
  // 区分：
  // 1.选择数据: 初始加载数据，不需要关联过滤， click事件选择和关闭，不需要修改弹窗；
  // 2.关联表单：初始不加载数据，需要关联过滤条件，click事件编辑数据，弹出修改窗口；
  let filter = {};
  await getRelationModule(relation.value.module_id);
  if (compConfig.value.type == FormElType.NestViewTable) {
    compConfig.value.fieldValue = relationModule.value.name;
  }
  if (props.clickEventType == 'rowEdit') {
    if (isEmpty(cascadeFilter.value)) { // 初始关联未输入数据置空
      data.value = [];
      return;
    }
    filter = cascadeFilter.value;
  } else if (props.clickEventType == 'colView') {
    filter = cascadeFilter.value;
  }

  // 查询；todo: 字段、排序从metas中获取
  // todo: 排序；字段显示；
  const findResult = await fetchFindBusiData(relation.value.collName, filter, pageNumber, pageSize.value);
  data.value = [] as any;
  if (findResult.msg == 'ok') {
    data.value = findResult.data;
    if (findResult.count && findResult.count >= 0) {
      dataCount.value = findResult.count;
      totalPages.value = Math.ceil(findResult.count / pageSize.value);
    }
  }
}

init();

const mapCascadeFilters = (cascadeFilters: Array<Meta.CascadeFilter>) => {
  const filter: Record<string, any> = {};
  if (cascadeFilters.length > 0) {
    for (const cf of cascadeFilters) {
      let triggerValue = null;
      let fieldValue = null;
      if (props.clickEventType == 'colView') {
        if (cf.triggerFieldName && props.rowData[cf.triggerFieldName]) {
          fieldValue = props.rowData[cf.triggerFieldName];
        } else {
          continue;
        }
      } else {
        let trigger = compConfigs?.find((c: Meta.CompBase) => c.fieldName == cf.triggerFieldName);
        if (trigger?.fieldValue) {
          // 类型：值、对象、数组；fieldValue值uid==name; trigger.type == cf.triggerFieldType
          fieldValue = trigger?.fieldValue;
        } else {
          continue;
        }
      }

      if (Array.isArray(fieldValue)) {
        triggerValue = { $in: fieldValue.map((v: Meta.Base) => v.name) }
      } else if (isObject(fieldValue) && ('name' in fieldValue)) {
        triggerValue = fieldValue.name;
      } else {
        triggerValue = fieldValue;
      }

      switch (cf.comparison) {
        case BaseComparOpt.Equal:
          if (triggerValue) {
            // 类型：值、对象、数组;fieldValue值uid==name;
            // todo: 测试==========
            if (ElTypeGroup.simpleTypes.includes(cf.filterFieldType as FormElType)) {
              filter[cf.filterFieldName!] = triggerValue;
            } else if (Array.isArray(cf.filterFieldType)) {
              filter[cf.filterFieldName!].name = triggerValue;
            } else {
              filter[cf.filterFieldName!].name = triggerValue;
            }
          }
          break;
        default:
          throw new Error(`Unsupported comparison operator: ${cf.comparison}`);
      }
    }
  }
  cascadeFilter.value = filter;
  return filter;
}

const cptMapCascadeFilters = computed(() => {
  let compConfig = compConfigs?.find((item: any) => item.i == props.i);
  if (compConfig?.cascadeFilters?.length > 0) {
    return mapCascadeFilters(compConfig!.cascadeFilters);
  } else if (props.config && props.config.cascadeFilters) {
    return mapCascadeFilters(props.config.cascadeFilters);
  }
})

watch(
  () => cptMapCascadeFilters,
  (newValue, oldValue) => {
    if (newValue.value) {
      loadData(1)
    }
  },
  { immediate: true, deep: true }
)

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (props.config) {
      compConfig.value = props.config;
    } else {
      const comp = compConfigs?.find((item: any) => item.i == props.i);
      comp && (compConfig.value = comp);
    }
    init();
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);


</script>

<style lang="scss" scoped>
.box-with-shadows {
  /* 添加四边阴影 */
  box-shadow:
    0 10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 底部阴影 */
    0 -10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 顶部阴影 */
    10px 0 10px -5px rgba(0, 0, 0, 0.2),
    /* 右侧阴影 */
    -10px 0 10px -5px rgba(0, 0, 0, 0.2);
  /* 左侧阴影 */
}

:deep(.n-data-table-td--last-row) {
  border-bottom: solid 1px var(--n-merged-border-color) !important
}
</style>
