<template>
  <BiChartEditor v-if="compConfig?.type == BoardElType.BiChart" ref="refChartEditor" />
  <BiDetailTableEditor v-else-if="compConfig?.type == BoardElType.BiDetailTable" ref="refDetailTableEditor" />
  <BiPivotTableEditor v-else-if="compConfig?.type == BoardElType.BiPivotTable" ref="refPivotTableEditor" />
  <BiGanttEditor v-else-if="compConfig?.type == BoardElType.BiGantt" ref="refGanttEditor" />
  <BiCalendarEditor v-else-if="compConfig?.type == BoardElType.BiCalendar" ref="refCalendarEditor" />
  <BiCarouselDialog v-else-if="compConfig?.type == BoardElType.BiImage" ref="refCarouselDialog"/>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useModuleInject } from "../useModuleInject";
import { BoardElType } from '@/enum';


const chartId = ref();
const compConfig = ref<Meta.ChartComp>();
const refChartEditor = ref();
const refDetailTableEditor = ref();
const refPivotTableEditor = ref();
const refGanttEditor = ref();
const refCalendarEditor = ref();
const refCarouselDialog = ref();

const { compConfigs, updateCompConfig } = useModuleInject();


const openEditor = (i: string) => {
  chartId.value = i;
  compConfig.value = compConfigs?.find((item: any) => item.i == i);
  nextTick(() => {
    switch (compConfig.value?.type) {
      case BoardElType.BiChart:
        refChartEditor.value && (refChartEditor.value.openEditor(i));
        return;
      case BoardElType.BiDetailTable:
        refDetailTableEditor.value && (refDetailTableEditor.value.openEditor(i));
        return;
      case BoardElType.BiPivotTable:
        refPivotTableEditor.value && (refPivotTableEditor.value.openEditor(i));
        return;
      case BoardElType.BiGantt:
        refGanttEditor.value && (refGanttEditor.value.openEditor(i));
        return;
      case BoardElType.BiCalendar:
        refCalendarEditor.value && (refCalendarEditor.value.openEditor(i));
        return;
      case BoardElType.BiImage:
        refCarouselDialog.value && (refCarouselDialog.value.open(i));
    }
  })

}

defineExpose({
  openEditor
})
</script>