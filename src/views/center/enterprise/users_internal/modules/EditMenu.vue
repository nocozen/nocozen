<template>
  <NDropdown trigger="click" :options="options" @select="handleSelect">
    <div @click.stop="onClick">
      <Icon :icon='icon' class='border-red text-base hover:text-blue-500'></Icon>
    </div>
  </NDropdown>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  popFunc: Function;
  options: Array<any>;
  node?: any;
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'mdi:dots-vertical',
});

const onClick = (e: any) => {
  e.stopPropagation()
}

const handleSelect = (key: string) => {
  props.popFunc(key, props.node);
}


</script>
