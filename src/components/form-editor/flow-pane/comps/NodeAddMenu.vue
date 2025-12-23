<template>
  <NFlex ref="flowPopMenu" class="absolute z-9999 bg-white w-40 h-28 pa-4 shadow-md rounded">
    <template v-for="node in nodeAddTypes">
      <NButton :focusable="false" class="rounded-md w-full px-2 justify-start" @click="onPopClick(node.type)">
        <div class="flex-center gap-4px">
          <slot>
            <SvgIcon :icon="node.icon" class="text-base" :style="{ color: node.iconColor }" />
            <span class="text-xs ml-1">{{ node.title }}</span>
          </slot>
        </div>
      </NButton>
    </template>
  </NFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NodeTypeList } from '../shared'


const nodeAddTypes = computed(() => NodeTypeList.filter((node: any) => node.canAdd ))

interface Emits {
  (e: 'addNode', node: any): void;
}
const emit = defineEmits<Emits>();



const onPopClick = (nodeType: string) => {
  emit("addNode", nodeType)
}
</script>
