<template>
  <NDropdown trigger="click" :options="options" @select="handleSelect">
    <slot></slot>
  </NDropdown>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { useEventListener } from '@vueuse/core';

defineOptions({
  name: 'ModuleAddMenu',
  inheritAttrs: false
});

interface Props {
  popFunc: Function;
  options: Array<any>;
  node?: Meta.ModuleNode;
}

const props = withDefaults(defineProps<Props>(), {
});

const showAddButton = ref(false);
const addButton = ref()

useEventListener('click', (event) => {
  if (event.target !== addButton.value) {
    showAddButton.value = false;
  }
});

const handleSelect = (key: string) => {
  props.popFunc(key, props.node)
}

</script>

<style scoped lang="scss"></style>
