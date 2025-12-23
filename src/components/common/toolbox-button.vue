<template>
  <NTooltip :placement="tooltipPlacement" :z-index="zIndex" :disabled="!tooltipContent">
    <template #trigger>
      <Drag :disabled="disabled" @dragstart="dragstart" @dragend="dragend" :type="dragType" :data="data" class="w-25">
      <NButton :disabled="disabled" :class="buttonClass" :focusable="false" v-bind="$attrs" class="rounded-md w-full  px-2 justify-start">
        <div class="flex-center gap-4px">
          <slot>
            <SvgIcon :icon="icon" class="text-base" />
            <span v-if="title" :class="titleClass">{{ title }}</span>
          </slot>
        </div>
      </NButton>
      </Drag>
    </template>
    {{ tooltipContent }}
  </NTooltip>
</template>

<script setup lang="ts">
import type { PopoverPlacement } from 'naive-ui';
import { computed, ref } from 'vue';
import { VglDragType } from '@/enum';

defineOptions({
  name: 'ToolboxButton',
  inheritAttrs: false
});

interface Props {
  disabled?: boolean,
  data?: any;
  dragType?: VglDragType;
  type?: string;
  title?: string;
  /** Button class */
  class?: string;
  titleClass?: string;
  /** Iconify icon name */
  icon?: string;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: PopoverPlacement;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dragType: VglDragType.Default,
  type: 'quaternary',
  title: '',
  titleClass: 'text-xs',
  class: '',
  icon: '',
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 98
});

interface Emits {
  (e: 'draging', state: boolean): void;
}

const emit = defineEmits<Emits>();

const DEFAULT_CLASS = '';
const TOOL_BUTTON = "w-8 h-8 pa-0";
const draging = ref(false);
const buttonClass = computed(() => {
  let btnClass = props.title ? [props.class, DEFAULT_CLASS] : [props.class, DEFAULT_CLASS, TOOL_BUTTON];
  props.disabled || btnClass.push('toolbtn')
  return btnClass
})

const dragstart = () => {
  draging.value = true;
  emit('draging', true)
}

const dragend = () => {
  draging.value = false;
  emit('draging', false)
}

</script>

<style lang="scss" scoped>
.toolbtn {
  &:hover {
    :deep(.n-button__border) {
      border: dashed 1px !important;
    }
    :deep(.n-button__state-border) {
      border: dashed 1px !important;
    }
  }
}
</style>
