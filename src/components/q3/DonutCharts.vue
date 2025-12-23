<template>
  <div ref="chartContainer" ></div>
</template>

<script setup lang="ts">
import { watch, ref, nextTick } from 'vue';
import { createProgressRingChart } from './donutChart';

// 容器大小自己处理；需要一个值；
interface Props {
  data: Array<any>,
  config: Meta.ChartComp
}

const props = withDefaults(defineProps<Props>(), {
});

const chartContainer = ref();
const option = {
  nest: true,
  dataset: [props.data],
  svg: {
    width: 120,
    height: 120
  },
  axis: {
    dimSplit: '|',
  }
}

const init = () => {
  props.data && createProgressRingChart(chartContainer.value, option)
}


watch(
  () => props.config,
  (newValue, oldValue) => {
    nextTick(() => {
      chartContainer.value && init();
    })
  },
  { immediate: true, deep: true }
);
</script>
