<template>
  <component
    :is="tag"
    :class="cssClasses"
  >
    <slot v-bind="$slots['default'] || {}" />

    <template v-for="[slot, args] of dynamicSlots" #[slot]>
      <slot :name="slot" v-bind="args" />
    </template>

    <div
      v-if="dragInitialised"
      ref="drag-image"
      class="__drag-image"
    >
      <slot name="drag-image" />
    </div>
  </component>
</template>

<script lang="ts">
import DragMixin from '../mixins/DragMixin';
import { DragImagesManager } from '.././core/DragImagesManager';

export default {
  name: 'Drag',
  mixins: [DragMixin],
  props: {
    /**
     * Tag to be used as root of this component. Defaults to div.
     */
    tag: {
      type: [String, Object],
      default: 'div'
    }
  },
  setup() {
    // 2024.11.7 qyk 用于触发鼠标跟随拖拽组件图层对象的构造方法，并解决模态窗口中拖拽时不显示的问题；
    const img = DragImagesManager;    
  },
  computed: {
    dynamicSlots () {
      return Object.entries(this.$slots).filter(([key]) => key !== 'drag-image' && key !== 'default');
    }
  }
};
</script>

<style lang="scss">
html.drag-in-progress * {
  cursor: grabbing !important;    // 修改需要重启浏览器
}

.drop-allowed.drop-in * {
  cursor: inherit !important;
}

.drop-forbidden.drop-in {
  &, * {
    cursor: no-drop !important;
  }
}

.drag-no-handle {
  &:hover {
    cursor: pointer;
  }
}
</style>

<style lang="scss" scoped>
/* Places a drag image out of sight while keeping its computed styles accessibles. */
.__drag-image {
  position: fixed;
  top: -10000px;
  left: -10000px;
  will-change: left, top;
}
</style>
