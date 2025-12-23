import DragAwareMixin from './DragAwareMixin';
import { createDragImage } from '../core/createDragImage';
import { dnd } from '../core/DnD';

export function dropAllowed (inst: any) {
  if (inst.dragInProgress && inst.typeAllowed) {
    return inst.compatibleMode && inst.effectiveAcceptsData(inst.dragData, inst.dragType);
  }
  return null;
}

export function doDrop (inst: any, event: any) {
  inst.$emit('drop', event);
  event.source.$emit(inst.mode, event);
}

export function candidate (inst: any, type: any) {
  // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
  return true;
  // return inst.effectiveAcceptsType(type);
}

export default {
  mixins: [DragAwareMixin],
  props: {
    acceptsType: {
      type: [String, Array, Function],
      default: null
    },
    acceptsData: {
      type: Function,
      default: () => {
        return true;
      }
    },
    mode: {
      type: String,
      default: 'copy'
    },
    dragImageOpacity: {
      type: Number,
      default: 0.7
    }
  },
  emits: ['dragover', 'dragenter', 'dragleave', 'dragend', 'drop'],
  data () {
    return {
      isDrop: true
    };
  },
  computed: {
    compatibleMode () {
      const self = this as any;
      return self.dragInProgress ? true : null;
    },
    dropIn () {
      const self = this as any;
      if (self.dragInProgress) {
        return self.dragTop === this;
      }
      return null;
    },
    typeAllowed () {
      const self = this as any;
      if (self.dragInProgress) {
        // return self.effectiveAcceptsType(self.dragType); 
        // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
        return true;
      }
      return null;
    },
    dropAllowed () {
      const self = this as any;
      return dropAllowed(self);
    },
    cssClasses () {
      const self = this as any;
      const clazz: any = {
        'dnd-drop': true
      };
      if (self.dropIn !== null) {
        clazz['drop-in'] = self.dropIn;
        clazz['drop-out'] = !self.dropIn;
      }
      // if (self.typeAllowed !== null) {
      //   clazz['type-allowed'] = self.typeAllowed;
      //   clazz['type-forbidden'] = !self.typeAllowed;
      // }
      // if (self.dropAllowed !== null) {
      //   clazz['drop-allowed'] = self.dropAllowed;
      //   clazz['drop-forbidden'] = !self.dropAllowed;
      // }
      // qyk 实现类型禁止但是drop可以响应禁止鼠标，原理类型禁止不影响交互不友好
      let accept = self.effectiveAcceptsType(self.dragType);    
      if (self.dropAllowed !== null && !self.dropAllowed) {
        accept = false;
      }  
      clazz['drop-allowed'] = accept;
      clazz['drop-forbidden'] = !accept;


      return clazz;
    }
  },
  methods: {    
    effectiveAcceptsType (type: any) {
      const self = this as any;
      if (self.acceptsType === null) {
        return true;
      }
      else if (typeof (self.acceptsType) === 'string' || typeof(self.acceptsType) === 'number') {
        return self.acceptsType === type;
      }
      else if (typeof (self.acceptsType) === 'object' && Array.isArray(self.acceptsType)) {
        return self.acceptsType.includes(type);
      }
      else {
        return self.acceptsType(type);
      }
    },
    effectiveAcceptsData (data: any, type: any) {
      const self = this as any;
      return self.acceptsData(data, type);
    },
    onDragPositionChanged (event: any) {
      const self = this as any;
      // console.log(event.top);
      if (self === event.top) {   // ???????????????????
        self.$emit('dragover', event);
      }
    },
    onDragTopChanged (event: any) {
      const self = this as any;
      if (self === event.top) {
        self.$emit('dragenter', event);
      }
      if (self === event.previousTop) {
        self.$emit('dragleave', event);
      }
    },
    onDragEnd (event: any) {
      const self = this as any;
      if (self === event.top) {
        self.$emit('dragend', event);
      }
    },
    onDrop (event: any) {
      const self = this as any;
      if (self.dropIn && self.compatibleMode && self.dropAllowed) {
        self.doDrop(event);
      }
    },
    doDrop (event: any) {
      const self = this as any;
      doDrop(self, event);
    },
    /**
         * Returns true if the current drop area participates in the current drag operation.
         */
    candidate (type: any) {
      const self = this as any;
      return candidate(self, type);
    },
    createDragImage () {
      const self = this as any;
      let image: any = 'source';
      if (self.$refs['drag-image']) {
        const el = self.$refs['drag-image'];
        if (el.childElementCount !== 1) {
          image = createDragImage(el);
        }
        else {
          image = createDragImage(el.children.item(0));
        }
        image['__opacity'] = self.dragImageOpacity;
        image.classList.add('dnd-ghost');
      }
      return image;
    },
    onDnDMove (e: any) {
      const self = this as any;
      dnd.mouseMove(e, self);
      // console.log(e.detail.x + "-" + self.acceptsType)
    }
  },
  created () {
    const self = this as any;
    dnd.on('dragpositionchanged', self.onDragPositionChanged);
    dnd.on('dragtopchanged', self.onDragTopChanged);
    dnd.on('drop', self.onDrop);
    dnd.on('dragend', self.onDragEnd);
  },
  mounted () {
    const self = this as any;
    self.$el.addEventListener('easy-dnd-move', self.onDnDMove);
  },
  beforeUnmount () {
    const self = this as any;
    self.$el.removeEventListener('easy-dnd-move', self.onDnDMove);

    dnd.off('dragpositionchanged', self.onDragPositionChanged);
    dnd.off('dragtopchanged', self.onDragTopChanged);
    dnd.off('drop', self.onDrop);
    dnd.off('dragend', self.onDragEnd);
  }
};
