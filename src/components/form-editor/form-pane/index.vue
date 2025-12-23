<template>
  <NFlex vertical class="w-60 h-full">
    <FormCompBox></FormCompBox>
  </NFlex>
  <NFlex class="flex-1 h-full outline outline-slate-200/50 outline-1">
    <SmoothScrollbar>
      <VglPanel :flowEnabled="flowEnabled"></VglPanel>
    </SmoothScrollbar>
  </NFlex>
  <NFlex vertical class="w-60 h-full">
    <ConfigPanel :flowEnabled="flowEnabled"></ConfigPanel>
  </NFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useModuleInject } from '../useModuleInject';

const { layoutConfig, flowDefs, currSelectCompId } = useModuleInject();

const flowEnabled = computed(() => {
  if (layoutConfig?.value.isEditable && flowDefs?.find((def: Meta.FlowDefinition) => def.enable)) {
    currSelectCompId && (currSelectCompId.value = '')
    return true;
  } else {
    return false;
  }
})
</script>