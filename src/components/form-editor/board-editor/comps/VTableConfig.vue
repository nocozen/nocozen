<template>
  <SmoothScrollbar class="h-full p-4">
    <NTabs type="segment" justify-content="center" tab-class="h-7 w-full flex-center text-base bg-gray-200/50" animated>
      <NTabPane name="功能配置">
        <span class="text-sm flex-center text-gray">该版本无此配置</span>
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

const onChartClick = (chartType: ChartType) => {
  if (props.compConfig) {
    props.compConfig.chartType = chartType;
    emit('updateChartConfig')
  };
}

const init = () => {

}

init();

</script>