<template>
  <NFlex class="px-3 pt-3 bg-gray-100" :size="0">
    <NCard class="box-with-shadows" size="small" style="height: calc(100vh - 52px);">
      <NFlex class="mb-2" align="center">
        <NFlex class="w-70" align="center">
          <NInputGroup>
            <NSelect class="w-fit" default-value="all" :options="fieldOptions" size="small"
              @update:value="updateFilterField"></NSelect>
            <NInput size="small" @update:value="updateFilterValue" clearable></NInput>
          </NInputGroup>
        </NFlex>
        <ButtonIcon v-if="viewType.split('-').includes('add')" @click="onAddClick" type="info" title="添加" icon="mdi:add"
          level="" size="small" />
        <ButtonIcon @click="onImportClick" :disabled="exportDisabled" size="small" level="" icon="mdi:import" title="导入"
          type="default" />
        <ButtonIcon @click="onExportClick" :disabled="exportDisabled" size="small" level="" icon="mdi:export" title="导出"
          type="default" />
      </NFlex>
      <NDataTable v-model:checked-row-keys="checkRowKeys" :row-key="rowKey" :single-line="false"
        style="height: calc(100% - 80px);" flex-height size="small" :columns="columns" :data="data" :pagination="false"
        :scroll-x="scrollX" :row-props="onRowClick">
      </NDataTable>
      <NFlex class="h-12 mt-1" align="center" justify="space-between">
        <span>{{ `总共 ${dataCount} 条` }}</span>
        <NPagination v-if="!isTreeData" v-model:page="currentPage" :display-order="['pages', 'size-picker']"
          show-quick-jumper :page-count="totalPages" :page-size="pageSize" :page-slot="6" show-size-picker
          :page-sizes="pageSizes" @update:page="onPageChange" @update:page-size="onPageSizeChange" />
      </NFlex>
    </NCard>
    <FormDialog ref="refFormDialog" @refresh="loadData" :module-node="currModuleNode"></FormDialog>
    <ModalDialog ref="refDataViewDialog" title="浏览数据" modal-class="w-200 h-fit">
      <FormTable :config="currNestComp" :rowData="currRowData" :optPerm="['filter']" :height="450" class="px-4"
        :click-event-type="'colView'" />
    </ModalDialog>
    <DataImport ref="dataImport" @refresh="loadData(1)" />
  </NFlex>
</template>

<script lang="ts" setup>
import { ref, h, watch, inject, Ref } from 'vue';
import { NDataTable, NTag, NFlex, NButton } from 'naive-ui';
import { fetchBusiData, fetchFindAllBusiData, fetchFindBusiData } from '@/service/api/busi';
// import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { FormElType, PermGroupType, ProviderName } from '@/enum';
import { fetchGetModuleConfig } from '@/service/api';
import { merge } from 'radashi';
import { renderModuleTableComp } from '../shared';
import { useAuthStore } from '@/store/modules/auth';
import { exportArrayToExcel } from '@/utils/excelHelper';
import dayjs from 'dayjs';
import { mapQuery } from '@/utils/filterHelper';
import { arrayToTree } from '@/utils/arrayToTree';

interface Props {
  viewType: PermGroupType
}

const props = withDefaults(defineProps<Props>(), {
});
// 高度适应容器：100vh
const emit = defineEmits(['openEditForm'])
// max-height <= 实际高度 < 100%容器高度 表格高度超出【实际高度】时设置max-height flex-height;否则不设置；

const dataImport = ref();
const dataExpoort = ref();
const exportDisabled = ref(false);
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
const currNestComp = ref();
const currRowData = ref();
const refDataViewDialog = ref();
const rowKey = (row: any) => row._id;

let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);
const compConfigs = ref<Array<Meta.CompConfig>>([]);
const formConfig = ref<Meta.FormConfig>({} as any);
const layoutNodes = ref([] as any);
const userAuth = useAuthStore();
const checkRowKeys = ref();
const isTreeData = ref(false);

/** 查询初始化数据 */
const initModuleData = async () => {
  // 查询模块配置并初始化；
  if (currModuleNode?.value.moduleConfig_id) {
    const result = await fetchGetModuleConfig(currModuleNode?.value.moduleConfig_id);
    if ('ok' == result.msg && result.data?.length > 0) {
      // 在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
      compConfigs.value.length = 0;   // init
      // flowDefs.value.length = 0;      // init
      formConfig.value = {} as any;   // init
      // moduleNode.value = {} as any;

      // moduleType.value = result.data[0].moduleType;
      formConfig.value = result.data[0].formConfig;
      compConfigs.value.push(...result.data[0].compConfigs);
      layoutNodes.value.push(...result.data[0].layouts)
      // moduleNode.value = result.data[0].moduleNode;   // 关联查询moduleNode
    }
  }

}

const onRowClick = (rowData: object, rowIndex: number) => {
  return {
    style: 'cursor: pointer',
    onClick: (e: any) => {
      if (!refFormDialog.value) return;

      const className = e.target.className.toString();
      const target = e.target;

      // 检查是否点击了以下元素，如果是则阻止弹窗
      const isIgnoredElement =
        className.includes('n-checkbox') ||
        className.includes('n-data-table-expand-trigger') ||
        target.closest('.n-data-table-td--expand') ||
        target.closest('.n-data-table-expand-trigger');

      if (!isIgnoredElement) {
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
  checkRowKeys.value = rowKeys;
}

const onPageSizeChange = async (size: number) => {
  pageSize.value = size;
  await loadData(1);
}

const onFieldSelect = (option: any) => {
  selectedOption.value = option;
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
  // radashi merge(顺序覆盖，属性覆盖)，lodash merge(属性覆盖, 顺序覆盖)；
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
  // 嵌套Tab提升了一级， 嵌套查询单独打开；
  // 嵌套表格；
  nestFileds?.forEach((f: any) => {
    if (FormElType.NestEditTable == f.type) {
      result = renderNestTable(f, row)
    } else {

    }
  })
  return result;
}

const newColumm = (config: any, isTreeExpand?: boolean) => {
  let column = {
    tree: isTreeExpand,
    title: config?.title,
    key: config?.fieldName,
    minWidth: 50,
    width: 150,
    maxWidth: 300,
    // fixed: index == 0 ? 'left' : 'false',
    titleAlign: 'start',
    align: 'start',
    ellipsis: {
      tooltip: true
    },
    resizable: true,
    render(row: any) {
      return renderModuleTableComp(row, config, nestViewTableColClick); // 渲染单元格，主要特殊处理表格类型显示Tag
    }
  } as any;
  if (FormElType.NestTabPane == config?.type) {
    column.titleAlign = 'center';
    column.children = [] as any;
  }
  return column;
}

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
      { key: 'all', value: 'all', type: 'all', label: '全部字段' },
      ...fieldOptions.value
    ];

    // 判断是否树形结构：当前表单中是否存在FeDataSelect组件，FeDataSelect是否绑定自己；
    const dataSelect = compConfigs.value.find((comp: Meta.FormComp) => comp.type == FormElType.FeDataSelect);
    isTreeData.value = currModuleNode?.value.moduleConfig_id == dataSelect?.relation?.moduleConfig_id;
    const treeField = dataSelect?.relation?.fieldName;
    const treeExpandField = compConfigs.value.find((comp: Meta.FormComp) => comp.fieldName == treeField);

    // 嵌套表格字段集合
    const nestFileds: Array<any> = compConfigs.value.filter((c: Meta.CompConfig) => c.type == FormElType.NestEditTable);
    compConfigs.value.filter((c: Meta.CompConfig) => c.nodeUid == 0 &&
      ![FormElType.FeDivider, FormElType.FeButton].includes(c.type as FormElType)
    )?.forEach((config: Meta.CompConfig) => {
      if (FormElType.NestTabPane == config.type) {
        config.nestUid?.forEach((uid: number) => {
          // 排除空面板,避免导致列错位；
          if (compConfigs.value.find((c: Meta.CompConfig) => c.nodeUid == uid)) {
            let nestConfig = { key: uid, title: config.tabs?.find((t: Meta.Tab) => t.uid == uid)?.name, type: FormElType.NestTabPane };
            let nestCol = newColumm(nestConfig) as any;
            compConfigs.value.filter((c: Meta.CompConfig) => c.nodeUid == uid &&
              ![FormElType.FeDivider, FormElType.FeButton].includes(c.type as FormElType)
            )?.forEach((config: Meta.CompConfig) => {
              nestCol.children.push(newColumm(config))
            })
            cols.push(nestCol);
          }
        })
      } else if (config.fieldName != treeField && config.fieldName != dataSelect?.fieldName) {
        cols.push(newColumm(config));
      }
    })
    // 获取嵌套字段名称，支持多个；
    let resultCols = [] as any;
    const tableCol = [
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
    }]
    if (isTreeData.value) {
      resultCols.push(newColumm(treeExpandField, true))
    } else {
      resultCols = tableCol;
    }
    columns.value = [
      ...resultCols,
      ...cols];
    scrollX.value = defColWidth * compConfigs.value.filter((c: Meta.CompConfig) => c.type != FormElType.NestEditTable)?.length + 40;
    selectedOption.value = fieldOptions.value[0]
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

const getMapQuery = () => {
  let newFilter = {} as any;
  if (filterValue.value) {
    newFilter[selectedFilterField.value] = filterValue.value
  }
  // console.log(props.viewType)
  // 个人权限过滤
  if (props.viewType.split('-').includes('self')) {
    newFilter['createBy._id'] = userAuth.userInfo._id;
  }
  const createBy = {
    key: 'createBy._id',
    type: FormElType.FeText
  }
  // console.log(newFilter)
  const query = mapQuery(newFilter, [...fieldOptions.value, createBy]);
  return query;
}

const loadData = async (pageNumber: number = 1) => {
  if (!formConfig) return;
  const filter = getMapQuery();
  let findResult = {} as any;
  if (isTreeData.value) {
    findResult = await fetchBusiData(formConfig.value.collName, filter);
  } else {
    findResult = await fetchFindBusiData(formConfig.value.collName, filter, pageNumber, pageSize.value);
  }

  data.value = [] as any;
  if (findResult.msg == 'ok') {
    if (isTreeData.value) {
      data.value = arrayToTree(findResult.data, { id: '_id', parentId: 'parent_id', dataField: null });
      dataCount.value = findResult.data.length;
    } else {
      data.value = findResult.data;
      if (findResult.count && findResult.count >= 0) {
        dataCount.value = findResult.count;
        totalPages.value = Math.ceil(findResult.count / pageSize.value);
      }
    }
  }
}

init();

const onImportClick = () => {
  const meta = compConfigs.value.map((comp: Meta.FormComp) => ({
    fieldName: comp.fieldName,
    title: comp.title,
    type: comp.type
  }))
  dataImport.value.show(formConfig?.value.collName, meta)
}

const onExportClick = async () => {
  exportDisabled.value = true;
  let filter = {} as any;
  if (checkRowKeys.value && checkRowKeys.value?.length > 0) {
    filter = { _id: [...checkRowKeys.value] }
  } else {
    filter = getMapQuery();
  }
  const dataResult = await fetchFindAllBusiData(formConfig.value.collName, filter);
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

watch(
  () => props.viewType,
  async (newProps, oldProps) => {
    loadData(1)
  },
  { immediate: true, deep: true },
)

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
