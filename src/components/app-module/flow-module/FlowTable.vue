<template>
  <NFlex class="px-3 pt-3 bg-gray-100" :size="0">
    <NCard class="box-with-shadows" size="small" style="height: calc(100vh - 52px);">
      <NFlex class="mb-2">
        <NInputGroup size="small" class="w-60">
          <!-- <DropSelect :options="fieldOptions" @select="onFieldSelect"></DropSelect> -->
          <NSelect default-value="all" :options="fieldOptions" size="small" @update:value="updateFilterField"></NSelect>
          <NInput size="small" clearable @update:value="updateFilterValue"></NInput>
        </NInputGroup>
        <ButtonIcon @click="onAddClick" type="info" title="添加" icon="mdi:add" level="" size="small"></ButtonIcon>
        <!-- <ButtonIcon @click="onImportClick" :disabled="exportDisabled" size="small" level="" icon="mdi:import" title="导入"
          type="default" /> -->
        <ButtonIcon @click="onExportClick" :disabled="exportDisabled" size="small" level="" icon="mdi:export" title="导出"
          type="default" />
      </NFlex>
      <NDataTable v-model:checked-row-keys="checkRowKeys" :row-key="rowKey" :single-line="false"
        style="height: calc(100% - 80px);" flex-height size="small" :columns="columns" :data="data" :pagination="false"
        :scroll-x="scrollX" :row-props="onRowClick">
      </NDataTable>
      <NFlex class="h-12 mt-1" align="center" justify="space-between">
        <span>{{ `总共 ${dataCount} 条` }}</span>
        <NPagination v-model:page="currentPage" :display-order="['pages', 'size-picker']" show-quick-jumper
          :page-count="totalPages" :page-size="pageSize" :page-slot="6" show-size-picker :page-sizes="pageSizes"
          @update:page="onPageChange" @update:page-size="onPageSizeChange" />
      </NFlex>
    </NCard>
    <FlowDialog ref="refFormDialog" @refresh="loadData" openType="table"></FlowDialog>
    <ModalDialog ref="refDataViewDialog" title="浏览数据" modal-class="w-200 h-fit">
      <FormTable :config="currNestComp" :rowData="currRowData" :optPerm="['filter']" :height="450" class="px-4"
        :click-event-type="'colView'" />
    </ModalDialog>
    <!-- <DataImport ref="dataImport" @refresh="loadData(1)" /> -->
  </NFlex>
</template>

<script lang="ts" setup>
import { ref, h, toRaw, inject, Ref } from 'vue';
import { NDataTable, NFlex } from 'naive-ui';
import { FormElType, ProviderName, FlowStautNames, PermGroupType } from '@/enum';
import { fetchGetModuleConfig } from '@/service/api';
import { fetchFindAllBusiData } from '@/service/api/busi';
import { fetchTasksBy } from '@/service/api/flow';
import { merge } from 'radashi';
import { useRoute } from 'vue-router';
import { renderModuleTableComp } from '../shared';
import dayjs from 'dayjs';
import { exportArrayToExcel } from '@/utils/excelHelper';
import { mapQuery } from '@/utils/filterHelper';

interface Props {
  viewType: PermGroupType
}

const props = withDefaults(defineProps<Props>(), {
});
// 高度适应容器：100vh
const emit = defineEmits(['openEditForm'])
// max-height <= 实际高度 < 100%容器高度 表格高度超出【实际高度】时设置max-height flex-height;否则不设置；
const dataImport = ref();
const exportDisabled = ref(false);
const router = useRoute();
const scrollX = ref();   // 设置scrollX会影响设置列宽
const defColWidth = 150;
const pageSize = ref(20);
const pageSizes = ref([20, 50, 100])
const currentPage = ref(1);
const totalPages = ref(1);
const dataCount = ref(0);
const filterValue = ref();
const selectedFilterField = ref('all');
const selectedOption = ref({} as any);

const columns = ref([] as any);
const data = ref([] as any);
const fieldOptions = ref([] as any);
const refFormDialog = ref();
const rowKey = (row: any) => row._id;

let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);
const compConfigs = ref<Array<Meta.CompConfig>>([]);
const formConfig = ref<Meta.FormConfig>({} as any);
const layoutNodes = ref([] as any);
const flows = ref([] as any);

const currNestComp = ref();
const currRowData = ref();
const refDataViewDialog = ref();
const checkRowKeys = ref();

/** 查询初始化表单元数据 */
const initModuleData = async () => {
  // 查询模块配置并初始化；
  if (currModuleNode?.value.moduleConfig_id) {
    const result = await fetchGetModuleConfig(currModuleNode?.value.moduleConfig_id);
    if ('ok' == result.msg && result.data?.length > 0) {
      // 在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
      compConfigs.value.length = 0;   // init
      formConfig.value = {} as any;   // init

      // moduleType.value = result.data[0].moduleType;
      formConfig.value = result.data[0].formConfig;
      compConfigs.value.push(...result.data[0].compConfigs);
      layoutNodes.value.push(...result.data[0].layouts)
    }
  }

}

const onRowClick = (rowData: object, rowIndex: number) => {
  return {
    style: 'cursor: pointer',
    onClick: (e: any) => {
      let className = e.target.className.toString();
      if (refFormDialog.value) {
        if (className.includes('n-checkbox') || e.target.closest('.n-data-table-td.n-data-table-td--expand')) {
        } else {
          refFormDialog.value.show('view', toRaw(currModuleNode?.value), flows.value, rowIndex);
        }
      }
    }
  }
}

const onAddClick = () => {
  refFormDialog.value.show('add', toRaw(currModuleNode?.value))
}

const onPageChange = (page: number) => {
  loadData(page);
}

const onPageSizeChange = async (size: number) => {
  pageSize.value = size;
  await loadData(1);
}

const nestViewTableColClick = (e: any, row: any, name: string) => {
  currRowData.value = row;
  const comp = compConfigs.value.find((c: Meta.FormComp) => c.fieldName == name);
  currNestComp.value = comp;
  refDataViewDialog.value.show(true);
  e.stopPropagation();
}

const renderNestTable = (f: any, row: any) => {
  let result = [] as any;
  const currLayout = layoutNodes?.value.find((l: Meta.LayoutNode) => l.uid == f.nestUid[0])?.layout;
  const currNestComp = compConfigs.value.filter((c: Meta.CompConfig) => c.nodeUid == f.nestUid[0]);    // ??? nestUid 数组处理
  // radashi merge(顺序覆盖，属性覆盖)，lodash merge(属性覆盖, 顺序覆盖)
  const compList = merge([...currLayout], [...currNestComp], (f: any) => f.i);
  result.push(h('strong', { style: 'display: block;' }, f.title));
  result.push(h(
    NDataTable,
    {
      columns: compList.map((config: any) => {
        return {
          key: config.fieldName,
          title: config.title,
          minWidth: 50,
          width: 150,
          maxWidth: 300,
          ellipsis: {
            tooltip: true
          },
          render(row: any) {
            return renderModuleTableComp(row, config, nestViewTableColClick); // 渲染单元格，主要特殊处理表格类型显示Tag
          }
        }
      }),
      data: row[f.fieldName],
      bordered: true,
      size: 'small',
      style: { width: `${compList?.length * 150}px` },
    }
  ))
  return result;
}

const renderNest = (nestFileds: Array<any>, row: any) => {
  let result = [] as any;
  nestFileds?.forEach((f: any) => {
    if (FormElType.NestEditTable == f.type) {
      result = renderNestTable(f, row)
    } else {

    }
  })
  return result;
}

const newColumm = (config: any) => {
  let column = {
    title: config.title,
    key: config.fieldName,
    minWidth: 50,
    width: 150,
    maxWidth: 300,
    // fixed: index == 0 ? 'left' : 'false',
    titleAlign: 'start',
    align: 'start',
    ellipsis: {
      tooltip: true
    },
    render(row: any) {
      return renderModuleTableComp(row, config, nestViewTableColClick); // 渲染单元格，主要特殊处理表格类型显示Tag
    }
  } as any;
  if (FormElType.NestTabPane == config.type) {
    column.titleAlign = 'center';
    column.children = [] as any;
  }
  return column;
}

// scrollX.value = viewConfig.base.columnWidth * (viewConfig.compsConfig?.length + 1);
// 需要支持嵌套组件
const init = async () => {
  await initModuleData();
  if (compConfigs) {
    let cols = [] as any;
    // 过滤字段
    fieldOptions.value = compConfigs.value.filter((c: Meta.CompConfig) => !c.type.startsWith(FormElType.Nest))
      .map((c: Meta.CompConfig) => ({
        key: c.fieldName,
        value: c.fieldName,
        type: c.type,
        label: c.title
      }))
    fieldOptions.value = [
      { key: 'all', value: 'all', label: '全部字段' },
      ...fieldOptions.value
    ];

    // 嵌套表格字段集合
    const nestFileds: Array<any> = compConfigs.value.filter((c: Meta.CompConfig) => c.type == FormElType.NestEditTable);
    compConfigs.value.filter((c: Meta.CompConfig) => c.nodeUid == 0 &&
      ![FormElType.FeDivider, FormElType.FeButton].includes(c.type as FormElType))?.forEach((config: Meta.CompConfig) => {
        if (FormElType.NestTabPane == config.type) {
          config.nestUid?.forEach((uid: number) => {
            if (compConfigs.value.find((c: Meta.CompConfig) => c.nodeUid == uid)) {
              let nestConfig = { key: uid, title: config.tabs?.find((t: Meta.Tab) => t.uid == uid)?.name, type: FormElType.NestTabPane };
              let nestCol = newColumm(nestConfig) as any;
              compConfigs.value.filter((c: Meta.CompConfig) => c.nodeUid == uid &&
                ![FormElType.FeDivider, FormElType.FeButton].includes(c.type as FormElType))?.forEach((config: Meta.CompConfig) => {
                  nestCol.children.push(newColumm(config))
                })
              cols.push(nestCol);
            }
          })
        } else {
          cols.push(newColumm(config));
        }
      })

    // 获取嵌套字段名称，支持多个；
    columns.value = [
      { type: 'selection', fixed: 'left' },
      {
        type: 'expand',
        expandable: (row: any) => {
          const index = nestFileds.findIndex((f: any) => f.fieldName in row && row[f.fieldName]?.length != 0);
          return index != -1
        },
        renderExpand: (row: any) => {
          return h(
            NFlex,
            {
              vertical: true,
              class: ''
            },
            () => renderNest(nestFileds, row)
          );
        },
      },
      ...cols,
      {
        title: '流程状态',
        key: 'status',
        minWidth: 150,
        // fixed: index == 0 ? 'left' : 'false',
        titleAlign: 'start',
        align: 'start',
        ellipsis: {
          tooltip: true
        },
        render(row: any) {
          return FlowStautNames[row.status]
        }
      },
      newColumm({ fieldName: 'activeNodes', title: '当前节点', type: FormElType.FeMulSelect }),
      newColumm({ fieldName: 'createBy', title: '提交人', type: FormElType.FeUserSelect }),
      {
        title: '提交时间',
        key: 'createAt',
        minWidth: 150,
        // fixed: index == 0 ? 'left' : 'false',
        titleAlign: 'start',
        align: 'start',
        ellipsis: {
          tooltip: true
        },
        render(row: any) {
          return dayjs(row.createAt).format('YYYY-MM-DD HH:mm:ss');
        }
      },
      {
        title: '更新时间',
        key: 'updateAt',
        minWidth: 150,
        // fixed: index == 0 ? 'left' : 'false',
        titleAlign: 'start',
        align: 'start',
        ellipsis: {
          tooltip: true
        },
        render(row: any) {
          return dayjs(row.updateAt).format('YYYY-MM-DD HH:mm:ss');
        }
      },
    ];
    scrollX.value = defColWidth * (compConfigs.value.filter((c: Meta.CompConfig) => c.type != FormElType.NestEditTable)?.length + 6);
    selectedOption.value = fieldOptions.value[0]
    selectedFilterField.value = fieldOptions.value[0].value;
    filterValue.value = '';
  }
  // console.log(columns.value)
  await loadData(1);
}


// 修改过滤字段
const updateFilterField = (value: string, option: any) => {
  selectedFilterField.value = value;
  loadData(1);
}
// 修改过滤条件值
const updateFilterValue = (value: any) => {
  filterValue.value = value;
  loadData(1);
}


const loadData = async (pageNumber: number = 1) => {
  if (!formConfig) return;
  // 流程没有个人权限，个人直接在流程中心查看；只有管理员有列表查看权限；
  // const app_id = router.query.app_id?.toString();
  const module_id = currModuleNode?.value._id;

  let newFilter = {} as any;
  if (filterValue.value) {
    newFilter[selectedFilterField.value] = filterValue.value
  }
  const query = mapQuery(newFilter, [...fieldOptions.value], module_id);
  if (module_id) {
    const flowInsResult = await fetchTasksBy(query, pageNumber, pageSize.value);
    data.value = [] as any;
    if (flowInsResult.msg == 'ok' && flowInsResult.data && flowInsResult.data?.length > 0) {
      flows.value = flowInsResult.data;
      if (flowInsResult.count && flowInsResult.count >= 0) {
        dataCount.value = flowInsResult.count;
        totalPages.value = Math.ceil(flowInsResult.count / pageSize.value);
      }
      flowInsResult.data?.forEach((flow: Meta.FlowInstance) => {
        const { status, activeNodes, createBy, createAt, updateAt } = flow;
        data.value.push({ ...flow.formData, status, activeNodes, createBy, createAt, updateAt })
      })
    }
  }
}

init();

const onExportClick = async () => {
  exportDisabled.value = true;

  let newFilter = {} as any;
  if (checkRowKeys.value && checkRowKeys.value?.length > 0) {
    newFilter = { _id: [...checkRowKeys.value] }
  } else if (filterValue.value) {
    newFilter[selectedFilterField.value] = filterValue.value;
    newFilter = mapQuery(newFilter, [...fieldOptions.value]);
  }

  const dataResult = await fetchFindAllBusiData(formConfig.value.collName, newFilter);
  if ('ok' == dataResult.msg && dataResult.data?.length > 0) {
    // 表头翻译；
    const [header, ...data] = dataResult.data;
    let headerNames = [] as any;
    for (let name of header) {
      const comp = compConfigs.value.find((comp: Meta.CompConfig) => comp.fieldName == name);
      if (comp && [FormElType.FeText, FormElType.FeNumber, FormElType.FeTextArea, FormElType.FeCheckboxGroup, FormElType.FeRadioGroup,
      FormElType.FeSelect, FormElType.FeMulSelect,
      FormElType.FeDeptSelect, FormElType.FeMulDeptSelect, FormElType.FeUserSelect, FormElType.FeMulUserSelect,
      FormElType.FeDatetime].includes(comp.type as FormElType)) {
        headerNames.push(comp.title);
      }
    }
    let newData = [] as any;
    for (let row of data) {
      let newRow = [] as any;
      row?.forEach((value: string, index: number) => {
        const compType = compConfigs.value.find((comp: Meta.CompConfig) => comp.fieldName == header[index])?.type;
        if (compType) {
          if ([FormElType.FeText, FormElType.FeNumber, FormElType.FeTextArea].includes(compType as FormElType)) {
            row[index] ? newRow.push(row[index]) : newRow.push('');
          } else if ([FormElType.FeSelect, FormElType.FeRadioGroup, FormElType.FeDeptSelect, FormElType.FeUserSelect].includes(compType as FormElType)) {
            row[index] ? newRow.push(row[index].name) : newRow.push('');
          } else if ([FormElType.FeMulSelect, FormElType.FeCheckboxGroup, FormElType.FeMulDeptSelect, FormElType.FeMulUserSelect].includes(compType as FormElType)) {
            row[index] ? newRow.push(row[index].map((d: any) => d.name).join(',')) : newRow.push('');
          } else if (FormElType.FeDatetime == compType) {
            row[index] ? newRow.push(dayjs(row[index]).format('YYYY-MM-DD')) : newRow.push('');
          }
        }
      })
      newData.push(newRow);
    }
    // 数据类型处理：字符串、数字、对象、数组；
    try {
      await exportArrayToExcel([headerNames, ...newData], currModuleNode?.value.name || '导出数据');
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      exportDisabled.value = false
    }
  }
}

defineExpose({
});
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
