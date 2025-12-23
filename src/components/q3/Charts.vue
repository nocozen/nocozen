<template>
  <NFlex v-if="compConfig && compConfig.metrics && compConfig.metrics.length > 0" vertical :size=0
    class="h-full w-full pa-1 relative " justify="center">
    <NInput v-if="isEditable" @blur="onTitleBlur" :class="{'font-bold': compConfig.nodeUid == 0}"
      class="items-center w-full flex min-h-8 max-h-8 h-8 flex-start title-box [&_.n-input-wrapper]:pl-1"
      style="max-width: 100%;" v-model:value="chartTitle"></NInput>
    <span v-else-if="compConfig.showTitle != false"  :class="{'font-bold': compConfig.nodeUid == 0}"
      class="items-center flex min-h-8 max-h-8 h-8 flex-start mx-2 text-base-text">{{ chartTitle }}</span>
    <MetricCard v-if="compConfig.chartType == ChartType.MetricCard" :config="compConfig" :options="chartOptions" />
    <SmoothScrollbar v-else-if="ChartType.ProgressRing == compConfig.chartType && chartOptions.dataset.length > 1">
      <NFlex class="h-fit truncate" align="center" justify="space-between">
        <template v-for="data in chartOptions.dataset">
          <DonutCharts :data="data" :config="compConfig" class="flex-1 flex-center" />
        </template>
      </NFlex>
    </SmoothScrollbar>
    <div v-else ref="chartContainer" class="w-full" style="height: calc(100% - 32px)"></div>
    <NFlex v-if="chartOptions.dataset.length == 0" class="child-center  fade-in" vertical align="center"
      justify="center">
      <NFlex class="w-16 h-8 rounded-lg " align="center" justify="center">
        <SvgIcon :icon="ChartTypeIcon[compConfig?.chartType || ChartType.Bar]" class="text-5xl text-blue-300/30" />
      </NFlex>
      <span class="text-gray flex h-8 flex-center mx-2">查询到0条数据</span>
    </NFlex>
  </NFlex>
  <NFlex v-else vertical class=" h-full w-full pa-1">
    <span class="items-center flex min-h-8 flex-start mx-2 font-bold">{{ chartTitle }}</span>
    <NFlex class="h-full w-full fade-in" vertical align="center" justify="center">
      <NFlex class="w-16 h-8 rounded-lg " align="center" justify="center">
        <SvgIcon :icon="ChartTypeIcon[compConfig?.chartType || ChartType.Bar]" class="text-5xl text-blue-300/30" />
      </NFlex>
      <span class="text-gray flex h-8 flex-center mx-2">请添加图表配置</span>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, toRaw, watch, computed } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { createRectCoord } from './rectCoord'
import { ChartType } from '@/enum';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchAggGroup } from '@/service/api/busi';
import { BiType, ChartTypeIcon } from '@/enum';
import { createPieChart } from './pieChart';
import { createRadarChart } from './radarChart';
import { createBubbleChart } from './bubbleChart';
import { createFunnelChart } from './funnelChart';
import { createProgressRingChart } from './donutChart';
import * as _ from 'lodash-es';
import { DateFmType, DateType } from '@/enum/biMeta';
import { createEditorFilter } from '@/utils/filterHelper';

interface Props {
  i?: number | string,
  isEditable?: boolean,
  chartConfig?: Meta.ChartComp
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: false
});

interface Emits {
  (e: 'updateTitle', title: string): void;
}

const emit = defineEmits<Emits>();

const chartContainer = ref()
const { compConfigs } = useModuleInject();
const compConfig = ref();
const chartTitle = ref('')
const rectChartTypes = [ChartType.Bar, ChartType.StackBar, ChartType.GroupBar, ChartType.Line, ChartType.Area, ChartType.Scatter];

const chartOptions = ref({
  nest: false,
  svg: {
    width: 640,
    height: 300,
    margin: {
      top: 20,
      right: 20,
      bottom: 10,
      left: 20
    },
    fontSize: '12px',
    lineColor: 'rgb(156 163 175)'
  },
  dataHeader: [] as any,
  dataset: [] as any,
  chart: {
    shape: ChartType.Bar,   // todo: 多层图Y坐标不准确    // todo: 扩展混合图；多层图与混合图可以支持每个坐标系指定一种子图；
    dimLevel: 'auto',
    duration: 300
  },
  axis: {
    invertAxis: false,
    measTickInterval: 40,
    dimPadding: 0.1,
    dimLevel: '',
    dimSplit: '|',    // 公共配置
    defMultiAxisSpace: 26,
    xAxis: {
      type: '',
    },
    yAxis: {
      type: '',
    },
  },
  colors: [],
  tooltip: {},
  label: { show: false },
  legend: {
    show: false,
    /**
     * none 上下水平排列，左右垂直排列
     * top-left top-center top-right bottom-left bottom-center bottom-right
     * left-top left-center left-bottom right-top right-center right-bottom
     **/
    position: 'bottom-center',
  }
})

const onTitleBlur = (e: any) => {
  emit('updateTitle', chartTitle.value)
}


const updateData = async () => {
  chartOptions.value.dataHeader = [];
  chartOptions.value.dataset = [];

  if (!compConfig.value ||
    !compConfig.value.dataBind
    // || !compConfig.value.dims || !compConfig.value.metrics
  ) return;

  let collName = compConfig.value.dataBind?.collName;   // '_mc_641384541544517'

  if (!collName) return;

  let dims = []
  let metrics = []
  let preMatch = {} as any;
  let sufMatch = {} as any;

  if (compConfig.value.dims?.length > 0) {
    dims = compConfig.value.dims.map((dim: any) => ({
      key: dim.key,
      biType: dim.type,     // 类型名称映射：type => biType ；todo: 后续重构时要注意
      sortFieldType: 'group',
      sortField: dim.sortField,
      sortType: dim.sortType,
      dateType: BiType.Date ? dim.dateType : undefined,
      dateFmType: BiType.Date ? dim.dateFmType : undefined,
      fieldType: dim.fieldType,
    }))
  }

  if (compConfig.value.metrics?.length > 0) {
    metrics = compConfig.value.metrics.map((metric: any) => ({
      key: metric.key,
      biType: metric.type,    // 类型名称映射：type => biType ；todo: 后续重构时要注意
      aggType: metric.aggType,
      numFormat: 'default'
    }))
    sufMatch = createEditorFilter(compConfig.value.metrics)
  }

  if (compConfig.value.filter?.length > 0) {
    preMatch = createEditorFilter(compConfig.value.filter)
  }
  const result = await fetchAggGroup(collName, dims, metrics, preMatch, sufMatch, 'array');
  if ('ok' == result.msg && result.data?.length > 0) {
    const header = [...result.data[0]];
    const dataset = result.data.slice(1);
    chartOptions.value.dataHeader = header;
    chartOptions.value.dataset = dataset;
  }
}

const createChart = () => {
  if (rectChartTypes.includes(chartOptions.value.chart.shape)) {
    createRectCoord(chartContainer.value, toRaw(chartOptions.value), toRaw(compConfig.value), props.isEditable);
  } else if (chartOptions.value.chart.shape == ChartType.Pie) {
    createPieChart(chartContainer.value, toRaw(chartOptions.value), toRaw(compConfig.value))
  } else if (chartOptions.value.chart.shape == ChartType.Radar) {
    createRadarChart(chartContainer.value, toRaw(chartOptions.value), toRaw(compConfig.value))
  } else if (chartOptions.value.chart.shape == ChartType.Bubble) {
    createBubbleChart(chartContainer.value, toRaw(chartOptions.value), toRaw(compConfig.value), props.isEditable);
  } else if (chartOptions.value.chart.shape == ChartType.Funnel) {
    createFunnelChart(chartContainer.value, toRaw(chartOptions.value));
  } else if (chartOptions.value.chart.shape == ChartType.ProgressRing) {
    createProgressRingChart(chartContainer.value, toRaw(chartOptions.value));
  }
}

const debouncedCreateChart = _.debounce(createChart, 250);

const initOptions = async () => {
  await updateData();
  if (!compConfig.value?.metrics || compConfig.value?.metrics?.length == 0) {
    return;
  };

  if (compConfig.value?.chartType !== undefined) {
    if (compConfig.value.chartType.startsWith(ChartType.Invert)) {
      chartOptions.value.axis.invertAxis = true;
      chartOptions.value.chart.shape = compConfig.value.chartType.slice(ChartType.Invert.length);
    } else {
      chartOptions.value.axis.invertAxis = false;
      chartOptions.value.chart.shape = compConfig.value.chartType;
    }
  }

  if (props.isEditable) {
    createChart();
  } else {
    debouncedCreateChart();
  }
}

const init = async (config: Meta.CompConfig) => {
  const legendShow = true;
  if (legendShow) {
    chartOptions.value.svg.margin.bottom = 40;
    chartOptions.value.legend.show = true;
  }
  chartTitle.value = config?.title || '未命名';
  await initOptions();
}

useResizeObserver(chartContainer, entries => {
  const entry = entries[0].contentRect;
  chartOptions.value.svg.width = entry.width;
  chartOptions.value.svg.height = entry.height;
  initOptions();
})


const cptCompConfig = computed(() => {
  if (props.chartConfig) {
    return props.chartConfig
  } else {
    return compConfigs?.find((item: any) => item.i == props.i);
  }
})

watch(
  () => cptCompConfig,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue) {
      compConfig.value = newValue.value;
      init(newValue.value as Meta.CompConfig);
    }
  },
  { immediate: true, deep: true }
);


</script>

<style lang="scss" scoped>
.child-center {
  position: absolute;
  top: 50%;
  /* 从顶部开始50%位置 */
  left: 50%;
  /* 从左侧开始50%位置 */
  transform: translate(-50%, -50%);
  /* 反向移动自身宽高的50% */
}

.title-box {
  :deep(.n-input__border) {
    border: none;
  }
}
</style>
