<script lang="ts">
import { TransitionGroup, h } from 'vue';
import DropMixin, { dropAllowed, doDrop, candidate } from '../mixins/DropMixin';
import DragFeedback from './DragFeedback.vue';
import Grid from '../core/Grid';
import { InsertEvent, ReorderEvent } from '../core/events';
import { createDragImage } from '../core/createDragImage';
import { dnd } from '../core/DnD';

export default {
  name: 'DropList',
  mixins: [DropMixin],
  props: {
    placeholder: {
      type: String,
      default: ""
    },
    tag: {
      type: [String, Object, Function],
      default: 'div'
    },
    items: {
      type: Array,
      required: true
    },
    row: {
      type: Boolean,
      default: false
    },
    column: {
      type: Boolean,
      default: false
    },
    noAnimations: {
      type: Boolean,
      default: false
    },
    scrollingEdgeSize: {
      type: Number,
      default: undefined
    }
  },
  emits: ['reorder', 'insert'],
  data() {
    return {
      grid: null,
      forbiddenKeys: [],
      feedbackKey: null,
      fromIndex: null
    };
  },
  computed: {
    rootTag() {
      if (this.noAnimations) {
        return this.tag;
      }
      return TransitionGroup;
    },
    rootProps() {
      if (this.noAnimations) {
        return {};
      }

      return {
        tag: this.tag,
        css: false
      };
    },
    direction() {
      // todo - rewrite this logic
      if (this.row) return 'row';
      if (this.column) return 'column';
      return 'auto';
    },
    reordering() {
      if (dnd.inProgress) {
        return dnd.source.$el.parentElement === this.$el;
      }
      return null;
    },
    closestIndex() {
      const self = this as any;
      if (this.grid) {
        return self.grid.closestIndex(dnd.position);
      }
      return null;
    },
    dropAllowed() {
      const self = this as any;
      if (self.dragInProgress) {
        if (self.reordering) {
          return self.items.length > 1;
        }
        else {
          // todo - eventually refactor so that this isn't necessary
          if (!dropAllowed(self)) {
            return false;
          }

          if (self.forbiddenKeys !== null && self.feedbackKey !== null) {
            return !self.forbiddenKeys.includes(self.feedbackKey);
          }

          return true;
        }
      }

      return null;
    },
    itemsBeforeFeedback() {
      const self = this as any;
      if (self.closestIndex === 0) {
        return [];
      }
      return self.items.slice(0, self.closestIndex);
    },
    itemsAfterFeedback() {
      const self = this as any;
      if (self.closestIndex === self.items.length) {
        return [];
      }
      return self.items.slice(self.closestIndex);
    },
    itemsBeforeReorderingFeedback() {
      const self = this as any;
      if (this.closestIndex <= self.fromIndex) {
        return self.items.slice(0, self.closestIndex);
      }
      return self.items.slice(0, self.closestIndex + 1);
    },
    itemsAfterReorderingFeedback() {
      const self = this as any;
      if (self.closestIndex <= self.fromIndex) {
        return self.items.slice(self.closestIndex);
      }
      return self.items.slice(self.closestIndex + 1);
    },
    reorderedItems() {
      const self = this as any;
      const toIndex = self.closestIndex;
      const reordered = [...self.items];
      const temp = reordered[self.fromIndex];

      reordered.splice(self.fromIndex, 1);
      reordered.splice(toIndex, 0, temp);
      return reordered;
    },
    clazz() {
      const self = this as any;
      return {
        'drop-list': true,
        'reordering': self.reordering === true,
        'inserting': self.reordering === false,
        ...(self.reordering === false ? self.cssClasses : { 'dnd-drop': true })
      };
    },
    showDragFeedback() {
      const self = this as any;
      // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
      let result = self.dragInProgress && !self.reordering && self.effectiveAcceptsType(self.dragType);
      if (self.dragInProgress) {
        if (self.dropAllowed !== null && !self.dropAllowed) {
          result = false;
        }
      }
      return result;
      // return self.dragInProgress && self.typeAllowed && !self.reordering;
    },
    showInsertingDragImage() {
      const self = this as any;
      return self.dragInProgress && self.typeAllowed && !self.reordering && !!self.$slots['drag-image'];
    },
    showReorderingDragImage() {
      const self = this as any;
      return self.dragInProgress && self.reordering && !!self.$slots['reordering-drag-image'];
    },
    hasReorderingFeedback() {
      const self = this as any;
      return !!self.$slots['reordering-feedback'];
    },
    hasEmptySlot() {
      const self = this as any;
      return !!self.$slots['empty'];
    }
  },
  created() {
    const self = this as any;
    dnd.on('dragstart', self.onDragStart);
    dnd.on('dragend', self.onDragEnd);
  },
  beforeUnmount() {
    const self = this as any;
    dnd.off('dragstart', self.onDragStart);
    dnd.off('dragend', self.onDragEnd);
  },
  methods: {
    // Presence of feedback node in the DOM and of keys in the virtual DOM required => delayed until what
    // depends on drag data has been processed.
    refresh() {
      const self = this as any;
      self.$nextTick(() => {
        self.grid = self.computeInsertingGrid();
        self.feedbackKey = self.computeFeedbackKey();
        self.forbiddenKeys = self.computeForbiddenKeys();
      });
    },
    onDragStart(event: any) {
      const self = this as any;
      if (self.candidate(dnd.type)) {
        if (self.reordering) {
          self.fromIndex = Array.prototype.indexOf.call(event.source.$el.parentElement.children, event.source.$el);
          self.grid = self.computeReorderingGrid();
        }
        else {
          self.refresh();
        }
      }
    },
    onDragEnd() {
      const self = this as any;
      self.fromIndex = null;
      self.feedbackKey = null;
      self.forbiddenKeys = null;
      self.grid = null;
    },
    doDrop(event: any) {
      const self = this as any;
      if (self.reordering) {
        if (self.fromIndex !== self.closestIndex) {
          self.$emit('reorder', new ReorderEvent(
            self.fromIndex,
            self.closestIndex
          ));
        }
      }
      else {
        // todo - eventually remove the need for this
        doDrop(self, event);
        self.$emit('insert', new InsertEvent(
          event.type,
          event.data,
          self.closestIndex
        ));
      }
    },
    candidate(type: any) {
      const self = this as any;
      return candidate(self, type) || self.reordering;
    },
    computeForbiddenKeys() {
      const self = this as any;
      return (self.noAnimations ? [] : self.$refs.component.$slots['default']())
        .map((vn: any) => vn.key)
        .filter((k: string) => !!k && k !== 'drag-image' && k !== 'drag-feedback');
    },
    computeFeedbackKey() {
      const self = this as any;
      // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
      if (self.$refs.feedback) {
        return self.$refs['feedback']['$slots']['default']()[0]['key'];
      }
      // return self.$refs['feedback']['$slots']['default']()[0]['key'];
    },
    computeInsertingGrid() {
      const self = this as any;
      // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
      if ( !self.$refs.feedback || self.$refs.feedback.$el.children.length < 1) {
        return null;
      }
      const feedback = self.$refs.feedback.$el.children[0];
      const clone = feedback.cloneNode(true);
      const tg = self.$el;
      if (tg.children.length > self.items.length) {
        tg.insertBefore(clone, tg.children[self.items.length]);
      }
      else {
        tg.appendChild(clone);
      }
      const grid = new Grid(tg.children, self.items.length, self.direction, null);
      tg.removeChild(clone);
      return grid;
    },
    computeReorderingGrid() {
      const self = this as any;
      return new Grid(self.$el.children, self.items.length - 1, self.direction, self.fromIndex);
    },
    createDragImage() {
      const self = this as any;
      let image;
      if (self.$refs['drag-image']) {
        const el = self.$refs['drag-image'];
        let model;
        if (el.childElementCount !== 1) {
          model = el;
        }
        else {
          model = el.children.item(0);
        }
        const clone = model.cloneNode(true);
        const tg = this.$el;
        tg.appendChild(clone);
        image = createDragImage(clone);
        tg.removeChild(clone);
        image['__opacity'] = this.dragImageOpacity;
        image.classList.add('dnd-ghost');
      }
      else {
        image = 'source';
      }
      return image;
    }
  },
  render() {
    const self = this as any;
    if (!self.$slots['item']) {
      throw 'The "Item" slot must be defined to use DropList';
    }

    if (!self.$slots['feedback']) {
      throw 'The "Feedback" slot must be defined to use DropList';
    }

    // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
    let accept = self.effectiveAcceptsType(self.dragType);
    if (self.dropAllowed !== null && !self.dropAllowed) {
      accept = false;
    }

    let defaultArr: any[] = [];

    if (!self.dropIn && self.items.length == 0) {
      defaultArr.push(h('div', { key: "placeholder", class: "drop-list-placeholder" }, self.placeholder));
    }

    // if (self.dropIn && self.dropAllowed) {
    if (self.dropIn && accept) {
      if (self.reordering) {
        if (self.hasReorderingFeedback) {
          const itemsReorderingBefore = self.itemsBeforeReorderingFeedback.map((item: any, index: any) => {
            return self.$slots['item']({
              item: item,
              index: index,
              reorder: false
            })[0];
          });
          if (itemsReorderingBefore.length > 0) {
            defaultArr = defaultArr.concat(itemsReorderingBefore);
          }

          defaultArr.push(self.$slots['reordering-feedback']({
            key: 'reordering-feedback',
            item: self.items[self.fromIndex]
          })[0]);

          const itemsReorderingAfter = self.itemsAfterReorderingFeedback.map((item: any, index: any) => {
            return self.$slots['item']({
              item: item,
              index: self.itemsBeforeReorderingFeedback.length + index,
              reorder: false
            })[0];
          });
          if (itemsReorderingAfter.length > 0) {
            defaultArr = defaultArr.concat(itemsReorderingAfter);
          }
        }
        else {
          const reorderedItems = self.reorderedItems.map((item: any, index: number) => {
            return self.$slots['item']({
              item: item,
              index: index,
              reorder: index === self.closestIndex
            })[0];
          });
          if (reorderedItems.length > 0) {
            defaultArr = defaultArr.concat(reorderedItems);
          }
        }
      }
      else {
        const itemsBefore = self.itemsBeforeFeedback.map((item: any, index: any) => {
          return self.$slots['item']({
            item: item,
            index: index,
            reorder: false
          })[0];
        });
        if (itemsBefore.length > 0) {
          defaultArr = defaultArr.concat(itemsBefore);
        }

        defaultArr.push(self.$slots['feedback']({
          key: 'drag-feedback',
          data: self.dragData,
          type: self.dragType
        })[0]);

        const itemsAfter = self.itemsAfterFeedback.map((item: any, index: any) => {
          return self.$slots['item']({
            item: item,
            index: self.itemsBeforeFeedback.length + index,
            reorder: false
          })[0];
        });
        if (itemsAfter.length > 0) {
          defaultArr = defaultArr.concat(itemsAfter);
        }
      }
    }
    else {
      const defaultItems = self.items.map((item: any, index: number) => {
        return self.$slots['item']({
          item: item,
          index: index,
          reorder: false
        })[0];
      });

      if (defaultItems.length > 0) {
        defaultArr = defaultArr.concat(defaultItems);
      }
      else if (self.hasEmptySlot) {
        defaultArr.push(self.$slots['empty']()[0]);
      }
    }

    if (self.showDragFeedback) {
      defaultArr.push(h(
        DragFeedback,
        {
          class: '__feedback',
          ref: 'feedback',
          key: 'drag-feedback'
        },
        {
          default: () => self.$slots['feedback']({
            type: self.dragType,
            data: self.dragData
          })[0]
        }
      ));
    }

    if (self.showReorderingDragImage) {
      defaultArr.push(h(
        'div',
        {
          class: '__drag-image',
          ref: 'drag-image',
          key: 'reordering-drag-image'
        },
        {
          default: () => self.$slots['reordering-drag-image']({
            item: self.items[self.fromIndex]
          })[0]
        }
      ));
    }

    if (self.showInsertingDragImage) {
      defaultArr.push(h(
        'div',
        {
          class: '__drag-image',
          ref: 'drag-image',
          key: 'inserting-drag-image'
        },
        {
          default: () => self.$slots['drag-image']({
            type: self.dragType,
            data: self.dragData
          })[0]
        }
      ));
    }

    return h(
      self.rootTag,
      {
        ref: 'component',
        class: self.clazz,
        ...self.rootProps
      },
      {
        default: () => defaultArr
      }
    );
  }
};
</script>

<style lang="scss" scoped >
.drop-list-placeholder {
  padding: 0 8px;
  display: flex;
  align-items: center;
  opacity: 0.5;
  height: 100%;

    /* 文本溢出省略 */
  // white-space: nowrap;
  // overflow: hidden;
  // text-overflow: ellipsis;
  
  /* 在 flex 布局中确保文本可以收缩 */
  // min-width: 0;
  // flex-shrink: 1;
  // width: 100%; /* 或者设置固定宽度 */
}

.drop-list {
  &:deep(> *) {
    transition: transform .2s;
  }
}

.__feedback {
  display: none;
}

/* Places a drag image out of sight while keeping its computed styles accessibles. */
.__drag-image {
  position: fixed;
  top: -10000px;
  left: -10000px;
  will-change: left, top;
}
</style>

<style lang="scss">
.type-allowed.drop-in {
  cursor: inherit !important;
}

.type-forbidden.drop-in {
  &,
  * {
    cursor: no-drop !important;
  }
}

.drop-allowed.drop-in {
  cursor: inherit !important;
  outline: blue dashed 1px  !important;
}

.drop-forbidden.drop-in {
  outline: #E0E0E0 dashed 1px  !important;
  &,
  * {
    cursor: no-drop !important;
  }
}
</style>
