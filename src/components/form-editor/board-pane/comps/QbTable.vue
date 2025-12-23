<template>
  <NFlex v-if="compConfig" vertical class="w-full h-full px-3 group" :size="0" justify="start">
    <NFlex v-if="compConfig?.showTitle != false" class="font-semibold min-h-8 max-h-8 w-full " align="center"
      justify="start">
      <NInput v-if="layoutConfig?.isEditable" @blur="onTitleBlur"
        class="w-full flex min-h-8 max-h-8 h-8 flex-center font-bold title-box [&_.n-input-wrapper]:pl-1"
        style="max-width: 100%;" v-model:value="chartTitle"></NInput>
      <NFlex v-else-if="compConfig.showTitle != false" :size="0" class="w-full" justify="space-between" align="center">
        <span class="flex min-h-8 max-h-8 h-8 flex-center font-bold text-base-text">{{ chartTitle }}</span>
        <NFlex :size="0">
          <NPopselect v-if="type == 'pivot'" v-model:value="currAggType" :options="aggOptions" trigger="click"
            size="small" @update-value="updateAggType">
            <NButton size="tiny" text
              class="text-gray-500 invisible group-hover:visible hover:text-blue-500 vtable-btn-icon">
              <template #icon>
                <SvgIcon :icon="QbIcon.Sigma" />
              </template>
              {{ AggNameMap.get(currAggType.toLowerCase() as AggType) }}
            </NButton>
          </NPopselect>
          <ButtonIcon @click="onExportClick" level="" text icon="mdi:export"
            class="text-gray-500 invisible group-hover:visible hover:text-blue-500" />
        </NFlex>
      </NFlex>
    </NFlex>
    <NFlex v-show="isEmpty(compConfig.fieldDims) && (isEmpty(compConfig.rowDims))" class="h-full w-full fade-in" vertical
      align="center" justify="center">
      <NFlex class="w-16 h-8 rounded-lg" align="center" justify="center">
        <SvgIcon :icon="BiElTypeIcon[compConfig?.type]" class="text-5xl text-blue-300/30" />
      </NFlex>
      <span class="text-gray flex h-8 flex-center mx-2">请添加组件配置</span>
    </NFlex>
    <!-- 不再使用vue-vtable，直接使用vtable，手动管理实例，todo: 使用hook简化组件挂载和卸载 -->
    <div v-show="compConfig.fieldDims?.length > 0 || (compConfig.rowDims?.length > 0)" ref="refVTable"
      style="height: calc(100% - 44px);width: 100%"></div>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useModuleInject } from '../../useModuleInject';
import vtableTheme from '@/theme/vtableTheme';
import { fetchAggDetail, fetchBusiData } from '@/service/api/busi';
import { TableCarouselAnimationPlugin } from '@visactor/vtable-plugins';
import * as VTablePlugins from '@visactor/vtable-plugins';
import * as VTable from '@visactor/vtable';
import dayjs from 'dayjs';
import { BiElTypeIcon, BiType, FormatType, FormElType, QbIcon } from '@/enum';
import { isEmpty, mapEntries } from 'radashi';
import { AggNameMap, AggType } from '@/enum/biMeta';
import { fetchGetModuleConfig } from '@/service/api';
import { mapVTableData } from '@/utils/dataHelper';
import { createEditorFilter } from '@/utils/filterHelper';


// 组件Props
interface Props {
  i: string,
  type: 'detail' | 'pivot'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'pivot'
})

// 事件定义
interface Emits {
  (e: 'updateTitle', title: string): void;
}
const emit = defineEmits<Emits>();
// 响应式数据
const refVTable = ref();
const compConfig = ref();
const chartTitle = ref('');
const { layoutConfig, compConfigs } = useModuleInject();
const vTableInstance = ref<any>(null);
const currAggType = ref(AggType.Sum.toUpperCase());
const aggOptions = ref([
  { value: AggType.Sum.toUpperCase(), label: AggNameMap.get(AggType.Sum) },
  { value: AggType.Avg.toUpperCase(), label: AggNameMap.get(AggType.Avg) },
  { value: AggType.Count.toUpperCase(), label: AggNameMap.get(AggType.Count) },
  { value: AggType.Min.toUpperCase(), label: AggNameMap.get(AggType.Min) },
  { value: AggType.Max.toUpperCase(), label: AggNameMap.get(AggType.Max) }
]
)
// 初始化导出插件
const excelExportPlugin = new VTablePlugins.TableExportPlugin({
  exportExcelOptions: {
    downloadFile: true,
    fileName: chartTitle.value + "-" + dayjs().format('YYYY-MM-DD'),
    ignoreIcon: true,
    exportAllData: true
  }
});

const onTitleBlur = (e: any) => {
  emit('updateTitle', chartTitle.value)
}

const data = [] as any;

// 滚动动画
// const animationPlugin = new TableCarouselAnimationPlugin({
//   rowCount: 2,
//   autoPlay: true,
//   autoPlayDelay: 1000
// });

function getBackgroundColor(args: any): string {
  const { row, table } = args;
  // if (row < table.frozenRowCount) {
  //   return "#FFF";
  // }
  const index = row - table.frozenRowCount;
  if (!(index & 1)) {
    return '#c9d8f8ff';
  }
  return '#FDFDFD';
}

const detailOptions = ref({
  plugins: [excelExportPlugin],
  columns: [] as any,
  records: [] as any,
  widthMode: 'adaptive',    // standard autoWidth adaptive
  defaultHeaderColWidth: 120,
  defaultRowHeight: 40,
  rowResizeType: 'row', // 仅调整当前行高
  rowResizeMode: 'all', // 允许在所有区域调整
  rowHierarchyType: 'grid-tree',
  rowHierarchyIndent: 20,
  rowHierarchyTextStartAlignment: true,
  rowSeriesNumber: {
    title: '序号',  // 列标题
    width: 'auto',      // 列宽度
    dragOrder: true,
    style: {
      textAlign: 'left'
    }
  },
  // showPin: true,
  // allowFrozenColCount: 2,
  dragOrder: {
    dragHeaderMode: 'column'
  },
  // frozenColCount: 1,    // 冻结列数
  // animationAppear: {
  //   duration: 200,
  //   delay: 50,
  //   type: 'one-by-one', // all
  //   direction: 'row' // colunm
  // },   // 首次加载动画
  // plugins: [animationPlugin],    // 滚动动画
  theme: vtableTheme,
} as any)

const pivotOptions = ref();

let ptOpt = ref({
  plugins: [excelExportPlugin],
  records: [] as any,
  rows: [],
  columns: [{}],
  // rows: [] as any,
  // columns: [] as any, // titleOnDimension: 'column' 时可以看到
  indicatorTitle: '指标',   // titleOnDimension: 'column' 时可以看到
  indicatorsAsCol: true,
  enableDataAnalysis: true,
  columnHierarchyType: 'grid-tree',
  indicators: [],
  corner: {
    titleOnDimension: 'all',   // row : 角头显示行维度名；column : 角头显示列维度名; all 显示所有维度
  },
  dataConfig: {
    aggregationRules: [] as any,
    totals: {
      row: {
        showGrandTotals: true,
        showSubTotals: true,
        // subTotalsDimensions: ['订单年份', '区域', '客户细分'],  // ['订单年份', '区域', '客户细分'],
        subTotalsDimensions: [], // 哪些行维度小计
        grandTotalLabel: AggNameMap.get(currAggType.value.toLowerCase() as AggType),
        subTotalLabel: AggNameMap.get(currAggType.value.toLowerCase() as AggType)
      },
      column: {
        showGrandTotals: true,
        showSubTotals: true,
        // subTotalsDimensions: ['类别'],
        // 哪些列维度小计，subTotalsDimensions指定['类别']时小计为"子类别"层级，subTotalsDimensions指定['子类别']无法小计；
        subTotalsDimensions: [],
        grandTotalLabel: AggNameMap.get(currAggType.value.toLowerCase() as AggType),
        subTotalLabel: AggNameMap.get(currAggType.value.toLowerCase() as AggType)
      }
    }
  },
  widthMode: 'adaptive',
  // containerFit: {
  //   width: true,   // boolean
  //   height: true   // boolean
  // },
  defaultHeaderColWidth: 120,
  rowHierarchyType: 'grid-tree',
  rowHierarchyIndent: 20,
  rowHierarchyTextStartAlignment: true,
  theme: vtableTheme
})

const init = async () => {
  if (!compConfig.value.dataBind) return;

  const collName = compConfig.value.dataBind?.collName;
  let dataConfigs = null;
  let filter = {};
  // 过滤
  if (compConfig.value.filter?.length > 0) {
    filter = createEditorFilter(compConfig.value.filter);
  }
  // 查询元数据
  const findConfig = await fetchGetModuleConfig(compConfig.value.dataBind.moduleConfig_id);
  if ('ok' == findConfig.msg && findConfig.data?.length > 0) {
    dataConfigs = findConfig.data[0].compConfigs;
  }

  if (props.type === 'detail') {
    const findReslut = await fetchAggDetail(collName, filter, compConfig.value.fieldDims);
    // console.log(findReslut)
    if (dataConfigs && 'ok' === findReslut.msg && findReslut.data?.length > 0) {
      // 实际配置后:
      // 明细取维度配置: comConfig.value.dims comConfig.value.bindData
      detailOptions.value.columns = compConfig.value.fieldDims?.map((d: any) => ({
        textOverflow: 'ellipsis',
        title: d.label,
        field: d.key,
        sort: true,
      }))
      const newData = mapVTableData(findReslut.data, dataConfigs as any);
      detailOptions.value.records = newData;
      if (refVTable.value && detailOptions.value.columns?.length > 0) {
        if (vTableInstance.value) {
          vTableInstance.value.updateOption(detailOptions.value);
        } else {
          vTableInstance.value = new VTable.ListTable(refVTable.value, detailOptions.value);
        }
      } else {
        if (vTableInstance.value) {
          vTableInstance.value.release?.(); // 安全调用
          vTableInstance.value = null;
        }
      }
    }
  } else {
    const findReslut = await fetchAggDetail(collName, filter, compConfig.value.rowDims);
    if (dataConfigs && 'ok' === findReslut.msg && findReslut.data?.length > 0) {
      // 透视表
      ptOpt.value.rows = compConfig.value.rowDims?.map((d: any) => ({
        title: d.label,
        dimensionKey: d.key,
      }));
      ptOpt.value.columns = compConfig.value.colDims?.map((d: any) => ({
        title: d.label,
        dimensionKey: d.key,
      }))
      ptOpt.value.indicatorsAsCol = ptOpt.value.columns?.length > 0;
      ptOpt.value.indicators = [];
      ptOpt.value.indicators = compConfig.value.metrics?.map((d: any) => {
        ptOpt.value.dataConfig.aggregationRules.push(
          {
            indicatorKey: currAggType.value + d.key,
            aggregationType: currAggType.value,
            field: [d.key]
          }
        )
        return {
          indicatorKey: currAggType.value + d.key,
          title: d.label + `(${AggNameMap.get(currAggType.value.toLowerCase() as AggType)})`,
          width: 'auto',
          showSort: false,
          headerStyle: { fontWeight: 'normal' },
          format: (value: any) => {
            if (value == null || value === '') return '';
            return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          },
          style: {
            padding: [16, 28, 16, 28],
            textAlign: 'right',
            color: (args: any) => args.dataValue >= 0 ? 'black' : 'red'
          }
        }
      })
      const newData = mapVTableData(findReslut.data, dataConfigs as any);
      ptOpt.value.records = newData;
      pivotOptions.value = ptOpt.value;
      if (refVTable.value && ptOpt.value.rows?.length > 0 && ptOpt.value.indicators?.length > 0) {
        if (vTableInstance.value) {
          vTableInstance.value.updateOption(ptOpt.value);
        } else {
          vTableInstance.value = new VTable.PivotTable(refVTable.value, ptOpt.value as any);
        }
      } else {
        if (vTableInstance.value) {
          vTableInstance.value.release?.(); // 安全调用
          vTableInstance.value = null;
        }
      }
    }
  }
}

const updateAggType = () => {
  init();
}
const onExportClick = async () => {
  if (!refVTable.value) {
    console.error('表格未初始化');
    return;
  }
  try {
    vTableInstance.value?.exportToExcel();
  } catch (error) {
    console.error('导出异常:', error);
  }
}

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        chartTitle.value = comp.title || '未命名';
        // 注意: 限制编辑状态使用，否则会导致滚动性能极差，编辑状态滚动粘滞暂时不解决；
        if (layoutConfig?.value.isEditable) init();
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

// 组件挂载
onMounted(() => {
  if (!refVTable.value) return;
  init();
})

// onBeforeUnmount：组件卸载前，DOM 和实例还存在，可以安全清理
// onUnmounted：组件已卸载，但某些异步操作可能仍持有引用，清理不及时
onBeforeUnmount(() => {
  if (vTableInstance.value) {
    vTableInstance.value.release?.(); // 安全调用
    vTableInstance.value = null;
  }
});

defineExpose({
  init
})
</script>

<style lang="scss" scoped>
.vtable-btn-icon :deep(.n-button__icon) {
  margin: 0;
}

.title-box {
  :deep(.n-input__border) {
    border: none;
  }
}

.vtable-wrapper {
  width: 100%;
  height: 100%;
}

.mode-selector {
  margin-bottom: 16px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  gap: 8px;
}

.mode-selector button {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.mode-selector button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.mode-selector button.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}
</style>
