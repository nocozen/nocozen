<template>
  <component :is="compMap[type]" :i="i" :type="tableType"></component>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import Charts from '@/components/q3/Charts.vue';
import QbTable from '../comps/QbTable.vue';
import QbGantt from '../comps/QbGantt.vue';
import { BoardElType } from '@/enum';
import QbCalendar from '../comps/QbCalendar.vue';
import QbClock from '../comps/QbClock.vue';
import QbCarousel from '../comps/QbCarousel.vue';
import QbRich from '../comps/QbRich.vue';

interface Props {
  i: number | string,
  type: string,
  readonly?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  // type: FormElType.FeText,
});

const tableType = ref('detail');

const compMap = {
  BiChart: Charts,
  BiDetailTable: QbTable,
  BiPivotTable: QbTable,
  BiGantt: QbGantt,
  BiCalendar: QbCalendar,
  BiClock: QbClock,
  BiImage: QbCarousel,
  BiRich: QbRich,
} as any

watch(
  () => props.type,
  (newValue, oldValue) => {
    if (newValue === BoardElType.BiDetailTable) {
      tableType.value = 'detail';
    } else if (newValue === BoardElType.BiPivotTable) {
      tableType.value = 'pivot';
    }
  },
  { immediate: true }
);




</script>
