<template>
  <NFlex vertical class="h-full">
    <BoardCompBox></BoardCompBox>
  </NFlex>
  <NFlex class="flex-1 h-full outline outline-slate-300/50 outline-1">
    <SmoothScrollbar>
      <VglPanel></VglPanel>
    </SmoothScrollbar>
  </NFlex>
  <NFlex vertical class="w-60 h-full">
    <BoardConfig></BoardConfig>
  </NFlex>
</template>

<script setup lang="ts">

</script>