<template>
  <div class="pt-0" v-if="layoutConfig">
    <Drop :acceptsType="dropType" @dragenter="dropDragenter" @dragover="dropDragover" @dragleave="dropDragleave"
      @dragend="dropDragend">
      <GridLayout ref="refLayout" :isDraggable="layoutConfig.isEditable" :isResizable="layoutConfig.isEditable"
        @layout-updated="onUpdateLayout" :style="`min-height: ${minHeight}`" v-model:layout="layoutData"
        :col-num="colNum" :row-height="layoutConfig.rowHeight" :vertical-compact="true" :use-css-transforms="true">
        <GridItem ref="dropItem" class="h-full invisible" :x="0" :y="0" :w="layoutConfig.defCompWidth"
          :h="layoutConfig.defCompHeight" :i=tempIFlag :min-h="1" :min-w="1">
          <div class="w-full h-full bg-orange">
            <div class="bg-orange">
              隐藏GridItem用于添加时生成占位
            </div>
          </div>
        </GridItem>
        <slot :data="gridItemData" :updateHiddenitems="updateHiddenitems"></slot>
      </GridLayout>
    </Drop>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject, watch, nextTick } from "vue"
import Uid from '@/utils/uid';
import { useModuleInject } from "../useModuleInject";
import { FormElType, VglDragType, ModuleType, BoardElType } from "@/enum";

interface Props {
  uid: number,
  colNum: number,
  minHeight: string,
  // layoutNode: Meta.LayoutNode,
  /** 增加允许拖放类型 */
  dropType?: Array<string>,
}
const props = withDefaults(defineProps<Props>(), {
  dropType: () => [VglDragType.Default]
})

const { layoutConfig, layoutNodes, updateLayout } = useModuleInject();

const refLayout = ref();
const dropItem = ref();
const layoutData = ref([] as any);
const hiddenitems = ref([] as any)
const tempIFlag = 'drop'
let mouseXY = { "x": 0, "y": 0 };
const mouseXYOffset = 60;
let DragPos = { "x": 0, "y": 0, "w": layoutConfig!.value.defCompWidth, "h": layoutConfig!.value.defCompHeight, "i": tempIFlag };

const getDefCompSize = (type: string) => {
  if (ModuleType.Form == layoutConfig?.value.layoutType) {
    let width = 6;
    let height = 2;
    switch (type) {
      case FormElType.FeTextArea:
        height = 4;
        break;
      case FormElType.NestEditTable:
        height = 10;
        break;
      case FormElType.NestTabPane:
        height = 5;
        break;
      case FormElType.NestViewTable:
        height = 10;
        break;
      case FormElType.FeImage:
      case FormElType.FeSignature:
        height = 4;
        break;
    }
    DragPos.w = width;
    DragPos.h = height;
    return { height, width };
  } else {
    let width = 20;
    let height = 7;
    DragPos.w = width;
    DragPos.h = height;
    return { height, width };
  }
}

// 保存隐藏组件
const updateHiddenitems = (i: string) => {
  const item = layoutData.value.find((item: any) => item.i == i);
  item && hiddenitems.value.push(item);
  layoutData.value = layoutData.value.filter((l: any) => l.i != i);
  // updateLayout && updateLayout({ uid: props.uid, layout: layoutData.value, hiddenItems: hiddenitems.value });
}

const onUpdateLayout = (layout: any) => {
  if (!layoutConfig!.value.isEditable) return null;
  let dropIndex = layout.findIndex((item: any) => item.i == tempIFlag);
  if (dropIndex === -1 && layout?.length > 0) {   // 避免添加组件操作时的错误更新提交
    updateLayout && updateLayout({ uid: props.uid, layout: layout, hiddenItems: hiddenitems.value });
  }
}

const layoutInitFlag = computed(() => {
  let flag = null;
  if (layoutNodes && layoutNodes?.length > 0) {
    flag = layoutNodes.find((n: Meta.LayoutNode) => n.uid == props.uid)?.initFlag
  }
  return flag;
})

watch(
  () => layoutInitFlag,
  (newValue, oldValue) => {
    let node = layoutNodes?.find((node: Meta.LayoutNode) => node.uid == props.uid);
    if (node && node.layout && node.layout?.length > 0) {
      layoutData.value = node.layout;
      hiddenitems.value = node.hiddenItems ? node.hiddenItems : [];
    } else {
      layoutData.value = [];
    }
  },
  { immediate: true, deep: true }
);

const gridItemData = computed(() => {
  let newLayout = layoutData.value.filter((item: any) => item.i != tempIFlag);
  return newLayout
})

const canDrop = (type: string) => {
  return props.dropType.includes(type);
}

// drop组件拖拽进入事件
const dropDragenter = (event: any) => {
  if (!canDrop(event.type)) return;

  const { height, width } = getDefCompSize(event.data.type);

  let dropIndex = layoutData.value.findIndex((item: any) => item.i == tempIFlag);
  if ((dropIndex) === -1) {
    layoutData.value.push(
      {
        x: 0,
        y: 0,
        w: width,
        h: height,
        i: tempIFlag,
        type: event.data.type,
        dragData: event.data
      })
  }
  refLayout.value.dragEvent('dragstart', tempIFlag, 0, 0, height, width);
}

// drop组件拖拽经过事件
const dropDragover = (event: any) => {
  if (!canDrop(event.type)) return;

  let parentRect = refLayout.value!.$el.getBoundingClientRect();
  mouseXY.x = event.position.x - mouseXYOffset;
  mouseXY.y = event.position.y - mouseXYOffset;
  if (dropItem.value) {
    let new_pos = dropItem.value.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);
    refLayout.value.dragEvent('dragmove', tempIFlag, new_pos.x, new_pos.y, DragPos.h, DragPos.w);
    // todo: 占位符闪现处理：外部触发的拖拽不显示占位符，不显示右下角标记；
  }
}

// drop组件拖拽离开事件
const dropDragleave = (event: any) => {
  if (!canDrop(event.type)) return;

  refLayout.value.dragEvent('dragleave', DragPos.i, DragPos.x, DragPos.y, DragPos.h, DragPos.w);
  let newLayout = layoutData.value.filter((item: any) => item.i != tempIFlag);
  layoutData.value = newLayout;
}

// drop组件拖拽释放事件
const dropDragend = (event: any) => {
  if (!canDrop(event.type)) return;

  let drop = layoutData.value.at(-1);   // dragstart 中 push，所以这里直接.at(-1)
  if (!drop) {
    return;
  }
  if (event.data.uid) {
    drop.i = event.data.uid;      // 添加组件实例或切换隐藏显示用
  } else {
    drop.i = Uid.NextNumber().toString();
  }
  drop.event = 'add'
  refLayout.value.dragEvent('dragend', drop.i, drop.x, drop.y, DragPos.h, DragPos.w);
  // 布局更新模板中绑定：GridLayout @layout-updated="updateLayout"
}


</script>

<style lang="scss" scoped></style>
