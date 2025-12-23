import DragAwareMixin from './DragAwareMixin';
import { createDragImage } from '../core/createDragImage';
import { dnd } from '../core/DnD';
import scrollparent from '../helpers/scrollparent';
import { cancelScrollAction, performEdgeScroll } from '../helpers/edgescroller';

export default {
  mixins: [DragAwareMixin],
  props: {
    type: {
      type: String,
      default: null
    },
    data: {
      default: null
    },
    dragImageOpacity: {
      type: Number,
      default: 0.7
    },
    disabled: {
      type: Boolean,
      default: false
    },
    goBack: {
      type: Boolean,
      default: false
    },
    handle: {
      type: String,
      default: null
    },
    delta: {
      type: Number,
      default: 0
    },
    delay: {
      type: Number,
      default: 0
    },
    dragClass: {
      type: String,
      default: null
    },
    vibration: {
      type: Number,
      default: 0
    },
    scrollingEdgeSize: {
      type: Number,
      default: 100
    }
  },
  emits: ['dragstart', 'dragend', 'cut', 'copy'],
  data () {
    return {
      dragInitialised: false,
      dragStarted: false,
      ignoreNextClick: false,
      initialUserSelect: null,
      downEvent: null,
      startPosition: null,
      delayTimer: null,
      scrollContainer: null
    };
  },
  computed: {
    cssClasses () {
      const self = this as any;
      const clazz = {
        'dnd-drag': true
      };
      if (!self.disabled) {
        return {
          ...clazz,
          'drag-source': self.dragInProgress && self.dragSource === self,
          'drag-mode-copy': self.currentDropMode === 'copy',
          'drag-mode-cut': self.currentDropMode === 'cut',
          'drag-mode-reordering': self.currentDropMode === 'reordering',
          'drag-no-handle': !self.handle
        };
      }
      else {
        return clazz;
      }
    },
    currentDropMode () {
      const self = this as any;
      if (self.dragInProgress && self.dragSource === self) {
        if (self.dragTop && self.dragTop['dropAllowed']) {
          if (self.dragTop['reordering']) {
            return 'reordering';
          }
          else {
            return self.dragTop['mode'];
          }
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    }
  },
  methods: {
    onSelectStart (e: any) {
      const self = this as any;
      e.stopPropagation();
      e.preventDefault();
    },
    performVibration () {
      const self = this as any;
      // If browser can perform vibration and user has defined a vibration, perform it
      if (self.vibration > 0 && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(self.vibration);
      }
    },
    onMouseDown (e: any) {
      const self = this as any;
      let target = null;
      let goodButton = false;
      if (e.type === 'mousedown') {
        const mouse = e;
        target = e.target;
        goodButton = mouse.buttons === 1;
      }
      else {
        const touch = e;
        target = touch.touches[0].target;
        goodButton = true;
      }

      if (self.disabled || self.downEvent !== null || !goodButton) {
        return;
      }

      // Check that the target element is eligible for starting a drag
      // Includes checking against the handle selector
      //   or whether the element contains 'dnd-no-drag' class (which should disable dragging from that
      //   sub-element of a draggable parent)
      const goodTarget = !target.matches('.dnd-no-drag, .dnd-no-drag *') &&
              (
                !self.handle ||
                target.matches(self.handle + ', ' + self.handle + ' *')
              );

      if (!goodTarget) {
        return;
      }

      self.scrollContainer = scrollparent(target);
      self.initialUserSelect = document.body.style.userSelect;
      document.documentElement.style.userSelect = 'none'; // Permet au drag de se poursuivre normalement même
      // quand on quitte un élémént avec overflow: hidden.
      self.dragStarted = false;
      self.downEvent = e;
      if (self.downEvent.type === 'mousedown') {
        const mouse = e;
        self.startPosition = {
          x: mouse.clientX,    
          y: mouse.clientY
        };
        // 目前定位方式由用户选择起点位置体验还可以，再改进需要分情况处理，字段选择面板需要获取底层字段宽度而不是100%宽度；排序不修改即可；
        // qyk TODO: 目前拖拽元素在上层元素样式(.chip-drag-move>.v-chip)自定义100，目前兼容拖拽和排序两种情况没有通用的方法，效果也不完美，后续在完善；
        // console.log( self.$el.getBoundingClientRect().x + self.$el.getBoundingClientRect().width/2) // 居中鼠标位置
      }
      else {
        const touch = e;
        self.startPosition = {
          x: touch.touches[0].clientX,
          y: touch.touches[0].clientY
        };
      }

      if (self.delay) {
        self.dragInitialised = false;
        clearTimeout(self.delayTimer);
        self.delayTimer = setTimeout(() => {
          self.dragInitialised = true;
          self.performVibration();
        }, self.delay);
      }
      else {
        self.dragInitialised = true;
        self.performVibration();
      }

      document.addEventListener('click', self.onMouseClick, true);
      document.addEventListener('mouseup', self.onMouseUp);
      document.addEventListener('touchend', self.onMouseUp);
      document.addEventListener('selectstart', self.onSelectStart);
      document.addEventListener('keyup', self.onKeyUp);

      setTimeout(() => {
        document.addEventListener('mousemove', self.onMouseMove);
        document.addEventListener('touchmove', self.onMouseMove, { passive: false });
        document.addEventListener('easy-dnd-move', self.onEasyDnDMove);
      }, 0);

      // Prevents event from bubbling to ancestor drag components and initiate several drags at the same time
      e.stopPropagation();
    },
    // Prevent the user from accidentally causing a click event
    // if they have just attempted a drag event
    onMouseClick (e: any) {
      const self = this as any;
      if (self.ignoreNextClick) {
        e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        e.stopImmediatePropagation && e.stopImmediatePropagation();
        self.ignoreNextClick = false;
        return false;
      }
    },
    onMouseMove (e: any) {
      const self = this as any;
      // We ignore the mousemove event that follows touchend :
      if (self.downEvent === null) return;

      // On touch devices, we ignore fake mouse events and deal with touch events only.
      if (self.downEvent.type === 'touchstart' && e.type === 'mousemove') return;

      // Find out event target and pointer position :
      let target = null;
      let x = null;
      let y = null;
      if (e.type === 'touchmove') {
        const touch = e;
        x = touch.touches[0].clientX;
        y = touch.touches[0].clientY;
        target = document.elementFromPoint(x, y);
        if (!target) {
          // Mouse going off screen. Ignore event.
          return;
        }
      }
      else {
        const mouse = e;
        x = mouse.clientX;
        y = mouse.clientY;
        target = mouse.target;
      }

      // Distance between current event and start position :
      const dist = Math.sqrt(Math.pow(self.startPosition.x - x, 2) + Math.pow(self.startPosition.y - y, 2));

      // If the drag has not begun yet and distance from initial point is greater than delta, we start the drag :
      if (!self.dragStarted && dist > self.delta) {
        // If they have dragged greater than the delta before the delay period has ended,
        // It means that they attempted to perform another action (such as scrolling) on the page
        if (!self.dragInitialised) {
          clearTimeout(self.delayTimer);
        }
        else {
          self.ignoreNextClick = true;
          self.dragStarted = true;
          dnd.startDrag(self, self.downEvent, self.startPosition.x, self.startPosition.y, self.type, self.data);
          document.documentElement.classList.add('drag-in-progress');
        }
      }

      // Dispatch custom easy-dnd-move event :
      if (self.dragStarted) {
        // If cursor/touch is at edge of container, perform scroll if available
        // If this.dragTop is defined, it means they are dragging on top of another DropList/EasyDnd component
        // if dropTop is a DropList, use the scrollingEdgeSize of that container if it exists, otherwise use the scrollingEdgeSize of the Drag component
        const currEdgeSize = self.dragTop && self.dragTop.$props.scrollingEdgeSize !== undefined ?
        self.dragTop.$props.scrollingEdgeSize :
        self.scrollingEdgeSize;

        if (currEdgeSize) {
          const currScrollContainer = self.dragTop ? scrollparent(self.dragTop.$el) : self.scrollContainer;
          performEdgeScroll(e, currScrollContainer, x, y, currEdgeSize);
        }
        else {
          cancelScrollAction();
        }

        const custom = new CustomEvent('easy-dnd-move', {
          bubbles: true,
          cancelable: true,
          detail: {
            x,
            y,
            native: e
          }
        });
        target.dispatchEvent(custom);
      }

      // Prevent scroll on touch devices if they were performing a drag
      if (self.dragInitialised && e.cancelable) {
        e.preventDefault();
      }
    },
    onEasyDnDMove (e: any) {
      dnd.mouseMove(e, null);
    },
    onMouseUp (e: any) {
      const self = this as any;
      // On touch devices, we ignore fake mouse events and deal with touch events only.
      if (self.downEvent.type === 'touchstart' && e.type === 'mouseup') return;

      // This delay makes sure that when the click event that results from the mouseup is produced, the drag is
      // still in progress. So by checking the flag dnd.inProgress, one can tell apart true clicks from drag and
      // drop artefacts.
      setTimeout(() => {
        self.cancelDragActions();

        if (self.dragStarted) {
          dnd.stopDrag(e);
        }
        self.finishDrag();
      }, 0);
    },
    onKeyUp (e: any) {
      const self = this as any;
      // If ESC is pressed, cancel the drag
      if (e.key === 'Escape') {
        self.cancelDragActions();

        setTimeout(() => {
          dnd.cancelDrag(e);
          self.finishDrag();
        }, 0);
      }
    },
    cancelDragActions () {
      const self = this as any;
      self.dragInitialised = false;
      clearTimeout(self.delayTimer);
      cancelScrollAction();
    },
    finishDrag () {
      const self = this as any;
      self.downEvent = null;
      self.scrollContainer = null;

      if (self.dragStarted) {
        document.documentElement.classList.remove('drag-in-progress');
      }
      document.removeEventListener('click', self.onMouseClick, true);
      document.removeEventListener('mousemove', self.onMouseMove);
      document.removeEventListener('touchmove', self.onMouseMove);
      document.removeEventListener('easy-dnd-move', self.onEasyDnDMove);
      document.removeEventListener('mouseup', self.onMouseUp);
      document.removeEventListener('touchend', self.onMouseUp);
      document.removeEventListener('selectstart', self.onSelectStart);
      document.removeEventListener('keyup', self.onKeyUp);
      document.documentElement.style.userSelect = self.initialUserSelect;
    },
    dndDragStart (ev: any) {
      const self = this as any;
      if (ev.source === self) {
        self.$emit('dragstart', ev);
      }
    },
    dndDragEnd (ev: any) {
      const self = this as any;
      if (ev.source === self) {
        self.$emit('dragend', ev);
      }
    },
    createDragImage (selfTransform: any) {
      const self = this as any;
      let image;
      if (self.$slots['drag-image']) {
        const el = self.$refs['drag-image'] || document.createElement('div');
        if (el.childElementCount !== 1) {
          image = createDragImage(el);
        }
        else {
          image = createDragImage(el.children.item(0));
        }
      }
      else {
        image = createDragImage(self.$el);
        image.style.transform = selfTransform;
      }

      if (self.dragClass) {
        image.classList.add(self.dragClass);
      }
      image.classList.add('dnd-ghost');
      image['__opacity'] = self.dragImageOpacity;
      return image;
    }
  },
  created () {
    const self = this as any;
    dnd.on('dragstart', self.dndDragStart);
    dnd.on('dragend', self.dndDragEnd);
  },
  mounted () {
    const self = this as any;
    self.$el.addEventListener('mousedown', self.onMouseDown);
    self.$el.addEventListener('touchstart', self.onMouseDown);
  },
  beforeUnmount () {
    const self = this as any;
    dnd.off('dragstart', self.dndDragStart);
    dnd.off('dragend', self.dndDragEnd);

    self.$el.removeEventListener('mousedown', self.onMouseDown);
    self.$el.removeEventListener('touchstart', self.onMouseDown);
  }
};
