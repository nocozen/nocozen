<template>
  <div ref="addButton" @click.stop="onClick" class="flex-center w-8 h-8 text-lg hover:text-green"
    :class="showAddButton ? 'visible' : 'invisible'">
      <SvgIcon :icon="icon" :localIcon="localIcon"/>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SvgIcon from '@/components/custom/svg-icon.vue'
import { useEventListener } from '@vueuse/core';

defineOptions({
  name: 'PopIcon',
  // inheritAttrs: false
});

interface Props {
  icon?: string;
  localIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'mdi:add'
});


const showAddButton = ref(false);
const addButton = ref()

useEventListener('click', (event) => {
  if (event.target !== addButton.value) {
    showAddButton.value = false;
  }
});

const onClick = (e: any) => {
  showAddButton.value = true
  e.stopPropagation()
}
</script>

<style scoped lang="scss"></style>
