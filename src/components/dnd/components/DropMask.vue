<template>
  <component :is="tag">
    <template v-for="(args, slot) of $slots" #[slot]>
      <slot :name="slot" v-bind="args" />
    </template>
  </component>
</template>

<script lang="ts">
import DragAwareMixin from '../mixins/DragAwareMixin';
import { dnd } from '../core/DnD';

export default {
  name: 'DropMask',
  mixins: [DragAwareMixin],
  props: {
    tag: {
      type: [String, Object],
      default: 'div'
    }
  },
  data () {
    return {
      isDropMask: true
    };
  },
  mounted () {
    this.$el.addEventListener('easy-dnd-move', this.onDndMove);
  },
  beforeUnmount () {
    this.$el.removeEventListener('easy-dnd-move', this.onDndMove);
  },
  methods: {
    createDragImage () {
      return 'source';
    },
    onDndMove (e: any) {
      const self = this as any;
      dnd.mouseMove(e, self);
    }
  }
};
</script>
