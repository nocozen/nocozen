<template>
  <SmoothScrollbar class="h-full p-4">
    <NCollapse class="mb-4" :default-expanded-names="['chartType']">
      <NCollapseItem title="图表类型" name="chartType">
        <NFlex>
          <ButtonIcon v-for="chart in chartTypeList" @click="onChartClick(chart.type)"
            :level="getSelectedType(chart.type)" type="info" :bordered="false" :focusable="false" :icon="chart.icon"
            :iconClass="chart.type.startsWith(ChartType.Invert) ? 'text-xl transform rotate-90' : 'text-xl'" class="m-1" />
        </NFlex>
      </NCollapseItem>
    </NCollapse>
    <NTabs type="segment" justify-content="center" tab-class="h-7 w-full flex-center text-base bg-gray-200/50" animated>
      <NTabPane name="功能配置">
        <NCollapse :default-expanded-names="[]">
          <NCollapseItem title="子类型" name="0">
            <NFlex :wrap="false" align="center">

            </NFlex>
          </NCollapseItem>
          <NCollapseItem title="X坐标轴" name="1">
            <!-- <NFlex class="flex-nowrap">
              <span class="w-10">标题</span>
              <NInput class="flex-1" size="small" placeholder=""></NInput>
            </NFlex> -->
          </NCollapseItem>
          <NCollapseItem title="Y坐标轴" name="2">
            <!-- <NFlex class="flex-nowrap">
              <span class="w-10">标题</span>
              <NInput class="flex-1" size="small" placeholder=""></NInput>
            </NFlex> -->
          </NCollapseItem>
          <NCollapseItem title="图例" name="3">
            <!-- <NFlex class="flex-nowrap">
              <span class="w-10">标题</span>
              <NInput class="flex-1" size="small" placeholder=""></NInput>
            </NFlex> -->
          </NCollapseItem>
          <NCollapseItem title="标签" name="4">
            <!-- <NFlex class="flex-nowrap">
              <span class="w-10">标题</span>
              <NInput class="flex-1" size="small" placeholder=""></NInput>
            </NFlex> -->
          </NCollapseItem>
          <NCollapseItem title="辅助线" name="5">
            <!-- <NFlex class="flex-nowrap">
              <span class="w-10">标题</span>
              <NInput class="flex-1" size="small" placeholder=""></NInput>
            </NFlex> -->
          </NCollapseItem>
          <NCollapseItem title="数据联动" name="6">
            <!-- <NFlex class="flex-nowrap">
              <span class="w-10">标题</span>
              <NInput class="flex-1" size="small" placeholder=""></NInput>
            </NFlex> -->
          </NCollapseItem>
        </NCollapse>
      </NTabPane>
      <NTabPane name="图表样式">
        <span class="text-sm flex-center text-gray">该版本无此配置</span>
      </NTabPane>
    </NTabs>
  </SmoothScrollbar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ChartType, ChartTypeIcon } from '@/enum';

interface Props {
  compConfig: Meta.ChartComp | undefined,
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'updateChartConfig'): void;
}

const emit = defineEmits<Emits>();

const chartTypeList = ref([
  // { id: 3, type: ChartType.StatisTable, icon: ChartTypeIcon[ChartType.StatisTable], selected: false },
  { id: 4, type: ChartType.Bar, icon: ChartTypeIcon[ChartType.Bar], selected: true },
  { id: 5, type: ChartType.GroupBar, icon: ChartTypeIcon[ChartType.GroupBar], selected: false },
  { id: 6, type: ChartType.StackBar, icon: ChartTypeIcon[ChartType.StackBar], selected: false },
  { id: 14, type: ChartType.InvertBar, icon: ChartTypeIcon[ChartType.InvertBar],  selected: true },
  { id: 15, type: ChartType.InvertGroupBar, icon: ChartTypeIcon[ChartType.InvertGroupBar], selected: false },
  { id: 16, type: ChartType.InvertStackBar, icon: ChartTypeIcon[ChartType.InvertStackBar], selected: false },
  // { id: 4, type: ChartType.Bar, icon: ChartTypeIcon[ChartType.Bar], invert: true,  selected: true },
  // { id: 5, type: ChartType.GroupBar, icon: ChartTypeIcon[ChartType.GroupBar], invert: true, selected: false },
  // { id: 6, type: ChartType.StackBar, icon: ChartTypeIcon[ChartType.StackBar], invert: true, rotate: true, selected: false },
  { id: 9, type: ChartType.Line, icon: ChartTypeIcon[ChartType.Line], selected: false },
  { id: 10, type: ChartType.Area, icon: ChartTypeIcon[ChartType.Area], selected: false },
  { id: 11, type: ChartType.Scatter, icon: ChartTypeIcon[ChartType.Scatter], selected: false },
  // { id: 8, type: ChartType.MultiShape, icon: ChartTypeIcon[ChartType.MultiShape], selected: false },  // todo：扩展混合图
  // { id: 7, type: ChartType.MultiLayer, icon: ChartTypeIcon[ChartType.MultiLayer], selected: false },
  { id: 12, type: ChartType.Pie, icon: ChartTypeIcon[ChartType.Pie], selected: false },
  // { id: 12, type: ChartType.Ring, icon: ChartTypeIcon[ChartType.Ring], selected: false },
  { id: 13, type: ChartType.Radar, icon: ChartTypeIcon[ChartType.Radar], selected: false },
  { id: 14, type: ChartType.Funnel, icon: ChartTypeIcon[ChartType.Funnel], selected: false },
  { id: 10, type: ChartType.Bubble, icon: ChartTypeIcon[ChartType.Bubble], selected: false },
  { id: 1, type: ChartType.MetricCard, icon: ChartTypeIcon[ChartType.MetricCard], selected: false },
  { id: 2, type: ChartType.ProgressRing, icon: ChartTypeIcon[ChartType.ProgressRing], selected: false },
] as any)

const selectedChart = ref(ChartType.Bar);

const getSelectedType = (chartType: ChartType) => {
  return selectedChart.value == chartType ? '' : 'quaternary'
}

const getBtnSelectClass = (chartType: ChartType) => {
  return selectedChart.value == chartType ? 'outline-2 outline-solid outline-blue' : ''
}

const onChartClick = (chartType: ChartType) => {
  if (props.compConfig) {
    props.compConfig.chartType = chartType;
    emit('updateChartConfig')
  };
  selectedChart.value = chartType;
}

const init = () => {
  if (props.compConfig?.chartType) {
    selectedChart.value = props.compConfig?.chartType as ChartType
  } else {
    props.compConfig!.chartType = selectedChart.value;
  }
}

init();

</script>