<template>
  <NTooltip :placement="tooltipPlacement" :z-index="zIndex" :disabled="!tooltipContent">
    <template #trigger>
      <NButton :text="btnType == 'text'" :secondary="btnType == 'secondary'" :tertiary="btnType == 'tertiary'"
        :class="[props.class, DEFAULT_CLASS, TOOL_BUTTON]" v-bind="$attrs">
        <div class="flex-center gap-4px" >
          <slot>
            <SvgIcon :icon="icon" :localIcon="localIcon" class="text-base" />
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
import { computed } from 'vue';

defineOptions({
  name: 'ButtonIcon',
  inheritAttrs: false
});

interface Props {
  btnType?: string;
  title?: string;
  /** Button class */
  class?: string;
  /** Iconify icon name */
  icon?: string;
  localIcon?: string;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: PopoverPlacement;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  btnType: 'default',
  title: '',
  class: '',
  icon: '',
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 98
});

const DEFAULT_CLASS = 'font-medium';
const TOOL_BUTTON = "pa-0";
const buttonClass = computed(() => {
  return props.title ? [props.class, DEFAULT_CLASS, TOOL_BUTTON] : [props.class, DEFAULT_CLASS, TOOL_BUTTON]
})

</script>

<style scoped></style>
