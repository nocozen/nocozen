<template>
  <component :is="compMap[type]" :comp="comp" :isEditable="isEditable"></component>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import WbFlowCenter from './WbFlowCenter.vue';
import WbMyApps from './WbMyApps.vue';
import WbRich from './WbRich.vue';
import WbCarousel from './WbCarousel.vue';
import WbRecentUsed from './WbRecentUsed.vue';
import WbShortcut from './WbShortcut.vue';
import WbChart from './WbChart.vue';

interface Props {
  comp: Meta.LayoutComp,
  type: string,
  isEditable?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
});

const compMap = {
  WbFlowCenter: WbFlowCenter,
  WbMyApps: WbMyApps,
  WbRich: WbRich,
  WbCarousel: WbCarousel,
  WbRecentUsed: WbRecentUsed,
  WbShortcut: WbShortcut,
  WbChart: WbChart
} as any


</script>
