<template>
  <NFlex :size="0" ref="container" class="h-full w-full" :wrap="false">
    <FlowDesign :svgSize="svgSize" class="flex-1"></FlowDesign>
    <FlowConfig ref="design" class="min-h-full w-70"></FlowConfig>
  </NFlex>
</template>

<script setup lang="ts">
import { ref  } from 'vue';

const svgSize = ref({ w: 100, h: 100});


</script>
