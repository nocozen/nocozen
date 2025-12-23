<template>
  <div :class="cptContainerClass">
    <DropGridLayout :uid="0" :col-num="layoutConfig.colNum" :dropType="[VglDragType.Default]"
      :minHeight="`calc(100vh - ${layoutConfig.vglHeightPadding}px)`">
      <template v-slot="{ data }">
        <template v-for="item in data" :key="item.i">
          <GridItem :padding="layoutConfig.itemPadding" class="group h-full gi-wrap flex-center cursor-pointer"
            :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :min-h="2" :min-w="1">
            <ButtonIcon v-if="isEditable && canEditComps.includes(item.type)" @click="onConfig(item)"
              :icon="QbIcon.Config" level="text" type="info"
              class="z-4 absolute top-0 left-0 invisible group-hover:visible" iconClass="opacity-80" />
            <ButtonIcon v-if="isEditable && !notDelComps.includes(item.type)" @click="onCompDelete(item.i)"
              :icon="QbIcon.Delete" type="info" level="text"
              class="z-4 absolute top-0 right-0 invisible group-hover:visible" iconClass="opacity-80" />
            <div v-if="isEditable"
              class="group z-2 bg-tranparent absolute top-0 left-0 h-full w-full cursor-pointer pointer-events-auto" />
            <WbElem :comp="item" :type="item.type" :isEditable="isEditable"
              :class="{ 'z-3': WbElType.WbRich == item.type }" class="w-full h-full rounded-md shadow-sm" />
          </GridItem>
        </template>
      </template>
    </DropGridLayout>
    <CarouselDialog ref="refCarouselDialog" />
    <ModuleElemDialog ref="refModlueDialog" />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, Ref } from 'vue';
import { ModuleType, VglDragType, ProviderName, WbElType, QbIcon } from '@/enum';
import { fetchUpdateEn, fetchGetEnInfo } from '@/service/api';
import Uid from '@/utils/uid';

interface Props {
  isEditable?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  isEditable: false
});

interface Emits {
  /** Update siderCollapse */
  (e: 'update', disabledComps: Array<WbElType>): void;
}

const emit = defineEmits<Emits>();

const refModlueDialog = ref();
const refCarouselDialog = ref();
const layoutConfig: Ref<Meta.FormLayoutConfig> = ref({
  layoutType: ModuleType.Board as any,
  isEditable: props.isEditable,
  layoutPadding: [10, 10],
  colNum: 60,
  defCompWidth: 20,
  defCompHeight: 10,
  rowHeight: 24,
  itemPadding: [5, 5],
  vglHeightPadding: 100
} as any);

const multiComps = ref([
  WbElType.WbShortcut,
  WbElType.WbChart
])

const canEditComps = ref([
  WbElType.WbCarousel,
  WbElType.WbChart,
  WbElType.WbShortcut
])

const notDelComps = ref([
  WbElType.WbMyApps,
  WbElType.WbFlowCenter
])

// provider: layoutConfig, layoutNodes, updateLayout
const layoutComps = ref([
  {
    uid: 0,
    layout: [],
    hiddenitems: [],
    initFlag: Uid.NextNumber()
  }
] as any)

const cptContainerClass = computed(() => {
  let contClass = '';
  contClass += props.isEditable ? 'ma-4 pa-2.5 box-with-shadows select-none' : ''
  return contClass
})

const onConfig = (comp: Meta.LayoutComp) => {
  if (WbElType.WbCarousel == comp.type) {
    refCarouselDialog.value.show(comp);
  } else if ([WbElType.WbChart, WbElType.WbMyCharts, WbElType.WbShortcut].includes(comp.type as any)) {
    refModlueDialog.value.show(comp)
  }
}

const onCompDelete = async (i: string) => {
  layoutComps.value[0].layout = layoutComps.value[0].layout.filter((l: Meta.LayoutComp) => l.i != i);
  layoutComps.value[0].initFlag = Uid.NextNumber();
  await updateLayoutBy(layoutComps.value[0].layout);
}

const initLayout = async () => {
  if (layoutComps.value[0].layout?.length == 0) {
    const result = await fetchGetEnInfo();
    if ('ok' == result.msg) {
      if ('wbComps' in result.data[0] && result.data[0].wbComps?.length > 0) {
        layoutComps.value[0].layout = result.data[0].wbComps;
        let disabledComps = layoutComps.value[0].layout.map((l: Meta.LayoutComp) => {
          if (!multiComps.value.includes(l.type as WbElType)) {
            return l.type;
          }
        });
        emit('update', disabledComps);
      } else {
        layoutComps.value[0].layout = [
          { i: Uid.NextNumber().toString(), x: 0, y: 11, w: 60, h: 7, type: WbElType.WbFlowCenter },
          { i: Uid.NextNumber().toString(), x: 0, y: 18, w: 60, h: 10, type: WbElType.WbMyApps }
        ]
      }
      layoutComps.value[0].initFlag = Uid.NextNumber();
    }
  }
}


const init = async () => {
  initLayout();
}

init();

const updateLayoutComps = async () => {
  if (layoutComps.value[0].layout?.length > 0) {
    await updateLayoutBy(layoutComps.value[0].layout);
  }
}

const updateLayoutBy = async (layout: Array<Meta.LayoutComp>) => {
  if (layout?.length > 0) {
    let disabledComps = [] as any;
    let newLayout = [] as any;
    newLayout = layout.map((l: Meta.LayoutComp) => {
      if (!multiComps.value.includes(l.type as WbElType)) {
        disabledComps.push(l.type);
      }
      const { i, x, y, w, h, type, config, value } = l;
      return { i, x, y, w, h, type, config, value };
    });
    const result = await fetchUpdateEn({ wbComps: newLayout });
    emit('update', disabledComps);
  }
}


provide(ProviderName.LayoutConfigProvide, layoutConfig);
provide(ProviderName.LayoutsProvide, layoutComps.value);
provide(ProviderName.UpdateLayoutsProvider, updateLayoutComps);

</script>

<style lang="scss" scoped>
.hovering {
  background-color: blue;
}

.gi-wrap:hover {
  .gi-menu {
    visibility: visible;
  }
}

.box-with-shadows {
  /* 添加四边阴影 */
  box-shadow:
    0 10px 20px -5px rgba(0, 0, 0, 0.2),
    /* 底部阴影 */
    0 -10px 20px -5px rgba(0, 0, 0, 0.2),
    /* 顶部阴影 */
    10px 0 20px -5px rgba(0, 0, 0, 0.2),
    /* 右侧阴影 */
    -10px 0 20px -5px rgba(0, 0, 0, 0.2);
  /* 左侧阴影 */
}
</style>