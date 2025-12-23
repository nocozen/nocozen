<template>
  <NDropdown trigger="click" :render-label="renderLabel" :options="options" @select="onFieldSelect">
    <NButton size="small"  v-bind="$attrs">
      <SvgIcon v-if="selectedOption.iconName" :icon="selectedOption.iconName" :class="selectedOption.iconClass"/>
      <span class="ml-1">{{ selectedOption.label }}</span>
      <SvgIcon v-if="showIcon" :icon="'mdi:chevron-down'" class="text-xl" />
    </NButton>
  </NDropdown>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import textIcon from './text-icon.vue';

interface Props {
  options: Array<any>,
  showIcon?: boolean
}

interface Emits {
  (e: 'select', option: any): void
}

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  options: [] as any,
  showIcon: true
});

const selectedOption = ref({} as any);
props.options && (selectedOption.value = props.options[0])

const onFieldSelect = (value: string, option: any) => {
  selectedOption.value = option;
  emit('select', option)
}

const renderLabel = (option: any) => {
  if (option.key == selectedOption.value.key) {
    return h(textIcon, { text: option.label, icon: 'mdi:check', class: 'text-primary' })
  } else {
    return option.label;
  }
};

</script>