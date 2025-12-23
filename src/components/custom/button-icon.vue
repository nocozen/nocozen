<template>
  <NTooltip :placement="tooltipPlacement" :z-index="zIndex" :disabled="!tooltipContent">
    <template #trigger>
      <NButton ref="refButton" :disabled="disabled" :focusable="false" :quaternary="level == 'quaternary'"
        :secondary="level == 'secondary'" :text="level == 'text'" :class="buttonClass" :type="type" v-bind="$attrs"
        :size="size">
        <div class="flex-center gap-4px">
          <slot>
            <SvgIcon :icon="icon" :localIcon="localIcon" :class="iconClass" />
            <span v-if="title">{{ title }}</span>
          </slot>
        </div>
      </NButton>
    </template>
    {{ tooltipContent }}
  </NTooltip>
</template>

<script setup lang="ts">
import type { PopoverPlacement } from 'naive-ui';
import { twMerge } from 'tailwind-merge';
import { computed, ref } from 'vue';

defineOptions({
  name: 'ButtonIcon',
  // inheritAttrs: false
});

interface Props {
  level?: string;
  title?: string;
  /** Button class */
  class?: string;
  /** Iconify icon name */
  icon?: string;
  localIcon?: string;
  iconClass?: string;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: PopoverPlacement;
  zIndex?: number;
  size?: 'tiny' | 'small' | 'medium' | 'large',
  type?: 'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  level: 'quaternary',
  title: '',
  iconClass: 'text-lg',
  class: '',
  icon: '',
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 98,
  size: 'medium',
  type: 'default',
  disabled: false
});

const DEFAULT_CLASS = 'font-medium';
const TOOL_BUTTON = "w-8 h-8 pa-0";
const buttonClass = computed(() => {
  return props.title ? [props.class, DEFAULT_CLASS] : [props.class, DEFAULT_CLASS, TOOL_BUTTON]
})
const refButton = ref();
const setFoucs = () => {
  refButton.value && refButton.value.$el.focus();
}

defineExpose({
  setFoucs
})
</script>

<style scoped></style>
