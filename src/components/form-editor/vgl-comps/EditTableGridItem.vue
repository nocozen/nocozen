<template>
  <NCard content-style="padding: 0; " class="w-full h-full" v-if="compConfig" @click="compClick">
    <NFlex vertical :size="0" class="rounded-none px-3 w-full h-full ngi" :class="cptNestGridItemClass">
      <!-- <div class="absolute top-0 left-0 right-0 h-1.5 z-99 "></div> -->
      <GridItemMenu @onMenuClick="onMenuClick" :types="['delete']" v-if="props.i == currSelectCompId"
        class="absolute px-1 h-6 shadow-md  z-99"
        :style="`top: ${layoutConfig!.itemPadding[0]}px; right: ${layoutConfig!.itemPadding[0]}px`">
      </GridItemMenu>
      <NFlex v-if="compConfig.showTitle" class="font-semibold h-8 w-full" align="center">
        <span>{{ compConfig.title }}</span>
      </NFlex>
      <NScrollbar x-scrollable :onWheel="handleWheel">
      <NFlex :size="0" style="flex-flow:nowrap" class="border-1">
        <NFlex vertical  style="margin: 1px 0px 0px 1px;" class="w-12 min-w-12 h-19 border-1 " align="center" >
          <NFlex align="center" justify="center" :size="0" class="w-full h-8.5 bg-gray-200/50">
            <span>序号</span>
          </NFlex>
          <NFlex class="bg-white/30 w-full" align="center" justify="center" :size="0">
            <span>1</span>
          </NFlex>
        </NFlex>
        <NFlex class="w-full" style="padding: 1px 1px 1px 0px;">
          <DropList :acceptsType="VglDragType.Default" @insert="onInsert" @reorder="onReorder"
            class="no-trans flex h-19 w-full" :items="columns" placeholder="拖拽添加组件">
            <template #item="{ item, index, reorder }">
              <Drag @click="onDragClick($event, item)" @mousedown="setParentDragging(false)"
                @mouseenter="setParentDragging(false)" @mouseup="setParentDragging(true)"
                @mouseleave="setParentDragging(true)" :key="index" :data="item" :style="{ opacity: reorder ? 0.3 : 1 }"
                class="drag-item">
                <VirtualFormEl :type="item.type" :i="item.i" :nodeUid="nodeUid"></VirtualFormEl>
              </Drag>
            </template>
            <template #feedback="{ data }">
              <VirtualFormEl :type="data.type" :key="data.title" i="0" :nodeUid="0" class="w-24 opacity-30">
                {{ data.title }}
              </VirtualFormEl>
            </template>
          </DropList>
        </NFlex>
      </NFlex>
      </NScrollbar>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, inject, Ref, watch } from 'vue';
import { useModuleInject } from '../useModuleInject';
import { useThemeStore } from '@/store/modules/theme';
import Uid from '@/utils/uid';
import { VglDragType } from '@/enum';

interface Props {
  i: string,
  uid: number,
  updateHiddenitems?: Function,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutNodes, updateLayout, updateCompConfig, compConfigs, layoutConfig, currSelectCompId, deleteComp } = useModuleInject();

const nestGridItemClass = 'h-full overflow-hidden outline-dashed outline-1 outline-slate-200 hover:bg-gray-100 duration-300 ';
const nestGridItemClassActive = 'h-full overflow-hidden bg-blue-100 duration-300';

const compConfig = ref();
const columns = ref([] as any);
const nodeUid = ref()
// 嵌套组件拖出后处理：不允许二次添加(drag type)，表格未解冻处理！！gridItemDraggable
// 目前支持鼠标滚轮滚动，todo: 鼠标拖拽滚动后续可在补充；
const handleWheel = (e: any) => {
  // 阻止默认的垂直滚动行为
  e.preventDefault();
  // 获取滚动容器
  const scrollContainer = e.currentTarget;
  // 根据滚轮滚动的 deltaY 值，调整水平滚动位置
  scrollContainer.scrollLeft += e.deltaY;
};

const cptCompConfig = computed(() => {
  return compConfigs?.find((item: any) => item.i == props.i);
})

watch(
  () => cptCompConfig,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue.value) {
      compConfig.value = newValue.value;
      if (layoutNodes) {
        const layout = layoutNodes.find((item: any) => item.uid == compConfig.value.nestUid[0])?.layout;
        if (layout) {
          columns.value = layout;
          nodeUid.value = compConfig.value.nestUid[0];
        }
      }
    }
  },
  { immediate: true, deep: true }
);

const cptNestGridItemClass = computed(() => {
  if (layoutConfig!.value.isEditable) {
    if (props.i == currSelectCompId?.value) {
      return nestGridItemClassActive
    } else {
      return nestGridItemClass;
    }
  } else {
    return ''
    // return 'h-full overflow-hidden border-dashed border-b-1 border-slate-200'
  }
})

const setParentDragging = (e: boolean) => {
  layoutConfig!.value.draggable = e;
}

const compClick = (e: any) => {
  if (layoutConfig!.value.isEditable) {
    currSelectCompId && (currSelectCompId.value = props.i);
    e.stopPropagation();
  }
}

const onDragClick = (e: any, item: Meta.LayoutItem) => {
  currSelectCompId && (currSelectCompId.value = item.i);
  e.stopPropagation();
}

const onInsert = (e: any) => {
  if (e.type == VglDragType.Default) {
    let newComp = {
      i: Uid.NextNumber().toString(),
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      type: e.data.type,
    }

    let layout = [...columns.value];
    columns.value.splice(e.index, 0, newComp);
    // 解构避免'add'状态未清理或提交响应式对象导致的冲突；
    layout.splice(e.index, 0, { ...newComp, dragData: e.data, event: 'add' });
    // 保存布局，配置；
    const layouts: Meta.LayoutNode = {
      uid: compConfig.value.nestUid[0],
      layout: layout,
      hiddenItems: []
    }
    updateLayout && updateLayout(layouts);
  }
}

const onReorder = (e: any) => {
  e.apply(columns.value);
  updateLayout && updateLayout({
    uid: compConfig.value.nestUid[0],
    layout: columns.value,
    hiddenItems: []
  });
}

const onMenuClick = (type: string) => {
  if ('delete' == type) {
    deleteComp && deleteComp(props.uid, props.i)
  } else if ('hidden' == type) {
    props.updateHiddenitems && props.updateHiddenitems(props.i)
  }
}

const updateConfig = (config: Meta.CompConfig) => {
  // 添加组件时需要默认值的属性都要初始化，此处不再处理；
  updateCompConfig && updateCompConfig(config);
}

</script>

<style lang="scss" scoped>
:deep(.n-scrollbar) {
  --n-scrollbar-color-hover: rgba(0, 0, 0, 0.05) !important
}
.ngi:hover {
  .gi-menu {
    visibility: visible;
  }
}

.gi-wrap:hover {
  .gi-menu {
    visibility: visible;
  }
}


.no-trans {
  &:deep(> *) {
    transition: none;
  }
}

.active-trans {
  &:deep(> *) {
    transition: transform .2s;
  }
}

.drag-item {
  transition: transform .2s;
}
</style>
