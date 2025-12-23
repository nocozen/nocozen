<template>
  <DefineMixMenu>
    <NFlex class="py-0.5" :size="8">
      <WrapIcon v-if="!canEdit" :icon="icon.includes('--') ? icon : `mdi:${icon}`" :color="corlor" :wrap="wrap">
      </WrapIcon>
      <div class="label">
        {{ label }}
      </div>
    </NFlex>
  </DefineMixMenu>
  <Drop v-if="canEdit" ref="refDrop" class="w-full h-full flex flex-row align-middle" :class="dragMenuHoverClass"
    :acceptsType="['menu']" @dragover="onDragOver" @drop="onDrop" @dragenter="onDragEnter" @dragleave="onDragLeave">
    <Drag @dragstart="onDragStart" :data="node" type="menu" class="w-full h-full align-middle justify-between">
      <NFlex class="w-full h-full" align="center" justify="space-between" style="flex-flow: nowrap; gap: 0;">
        <MixMenu></MixMenu>
        <NFlex v-if="!dragActive">
          <template v-for="menu in popMenu">
            <ModuleAddMenu :popFunc="menu.handle" :options="menu.options" :node="node">
              <PopIcon class="pop-icon" :icon="menu.icon"></PopIcon>
            </ModuleAddMenu>
          </template>
        </NFlex>
      </NFlex>
    </Drag>
  </Drop>
  <NFlex v-else class="w-full h-full flex flex-row align-middle">
    <NFlex class="w-full h-full" align="center" justify="space-between" style="flex-flow: nowrap; gap: 0;">
      <MixMenu></MixMenu>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import type { PopoverPlacement } from 'naive-ui';
import { computed, inject, ref, Ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import { createReusableTemplate } from '@vueuse/core';
import { useAppStore } from '@/store/modules/app';

defineOptions({
  name: 'MenuIcon',
  inheritAttrs: false
});

const [DefineMixMenu, MixMenu] = createReusableTemplate();
interface Props {
  editable?: boolean,  // 是否可编辑 
  parentIds: Array<string>,
  corlor?: string,
  wrap?: boolean,
  popMenu: Array<{
    icon: string,
    options: Array<any>,
    handle: Function
  }>
  appId: string;
  node: Meta.ModuleNode;
  label: string;
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
  editable: true,
  parentIds: [] as any,
  wrap: true,
  appId: '',
  label: '',
  class: '',
  icon: '',
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 98
});

const refDrop = ref();
const showAddButton = ref(false);
const dropdown = ref();
const addButton = ref();
const dropLineActive = ref(false);    // 是否显示插入标识线
const showDropLine = ref(0);
const dragActive = inject<Ref<boolean>>('dragActive', ref(false));
const updateModuleOrder = inject<any>('updateModuleOrder')!;
const appStore = useAppStore();

useEventListener('click', (event) => {
  if (event.target !== addButton.value) {
    showAddButton.value = false;
  }
});

const pToBottom = ref();    // 鼠标坐标距离菜单项底边的相对距离
const lastZoneHeight = 13;   // 末尾节点可插入时判断距离底边的距离边界值；
const isSufPostion = ref(false);

const canEdit = computed(() => {
  if (props.editable) {
    return true;
  } else {
    return appStore.siderCollapse
  }
})

const onDragStart = (e: any) => {
  dragActive.value = true;
}


const onDragOver = (e: any) => {
  if (e.data.suf_id == props.node._id) {  // 后置节点区域移动
    isSufPostion.value = true;
  } else if (!props.node.suf_id) {        // 当前是末尾节点
    let rect = refDrop.value.$el.getBoundingClientRect();
    pToBottom.value = rect.height - (e.position.y - rect.y);
    if (pToBottom.value < lastZoneHeight) {
      isSufPostion.value = true;
    } else {
      isSufPostion.value = false;
    }
  } else {
    isSufPostion.value = false;
  }
}

const checkCanDrop = (e: any) => {
  // 判断是否是自身区域移动、是否自己的父节点，不允许释放
  if (e.data._id == props.node._id || props.parentIds.includes(e.data._id)) {
    return false;
  } else {
    return true;
  }
}
const onDragEnter = (e: any) => {
  // 判断是否是自身区域移动、是否自己的父节点，不允许释放
  dropLineActive.value = checkCanDrop(e);
  showDropLine.value = 1;
}
const onDragLeave = (e: any) => {
  showDropLine.value = 0;
  dropLineActive.value = false;
}

// todo: 目前只能选中一个节点的前置位置插入，后续可以增加后置位置的支持；
const onDrop = (e: any) => {
  // showDropLine.value = 0;
  dropLineActive.value = false;
  dragActive.value = false;
  // console.log(event.data, props.node)
  // 未移动成功不要执行移动操作；
  // 自身节点区域不处理
  if (!checkCanDrop(e)) return
  // 当前节点
  let currNode = {
    _id: e.data._id,
    suf_id: e.data.suf_id,
    parent_id: e.data.parent_id
  } as any;
  // 新插入位置的后置节点
  let newSufNode = {
    _id: props.node._id,
    parent_id: props.node.parent_id
  } as any;

  // 当前是后置节点执行后插入
  if (isSufPostion.value) {
    if (!props.node.suf_id) {
      // 新插入位置的虚拟后置节点
      newSufNode = {
        _id: null,
        parent_id: props.node.parent_id
      };
    } else {  // 后置节点区域执行后插入
      // 新插入位置的后置+1节点，
      newSufNode = {
        _id: props.node.suf_id,
        parent_id: props.node.parent_id
      };
    }
  }
  updateModuleOrder([currNode, newSufNode])
}

const dragMenuHoverClass = computed(() => {
  if (dropLineActive.value) {
    return isSufPostion.value ? 'hover-border-bottom' : 'hover-border-top'
  } else {
    return null;
  }
})

</script>



<style scoped lang="scss">
.n-menu-item-content:hover {
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pop-icon {
    visibility: visible;
  }
}

.container {
  position: relative;
  /* 确保有一个定位上下文 */
  top: 0;
  /* 顶部对齐 */
  left: 0;
  /* 左侧对齐 */
}

.hover-border-top {
  position: relative;
  transition: all 0.2s ease;
}

.hover-border-bottom {
  position: relative;
  transition: all 0.2s ease;
}

.hover-border-top::before,
.hover-border-bottom::before {
  content: '';
  position: absolute;
  left: 0px;
  right: 0px;
  height: 1px;
  // width: 100%;
  background-color: theme('colors.blue.500');
  opacity: v-bind(showDropLine);
  transition: opacity 0.2s ease;
}

.hover-border-top::before {
  top: 0px;
}

.hover-border-bottom::before {
  bottom: 0px;
}
</style>
