<template>
  <div @click="layoutConfig!.isEditable ? compClick() : null" :class="cptNestGridItemClass"
    class="ngi w-full h-full  text-base_text transition-300">
    <GridItemMenu @onMenuClick="onMenuClick" :types="['delete']" v-if="layoutConfig!.isEditable && props.i == currSelectCompId"
      class="absolute px-1 h-6 shadow-md  z-99"
      :style="`top: ${layoutConfig!.itemPadding[0]}px; right: ${layoutConfig!.itemPadding[0]}px`">
    </GridItemMenu>
    <NTabs v-if="compConfig" :type="tabType" v-model:value="activeTab" justify-content="start" size="small"
      tab-class="h-8 text-base" animated>
      <NTabPane v-for="(item, index) in compConfig.tabs" :name="`${item.uid}`" :tab="`${item.name}`">
        <SmoothScrollbar :style="`height: ${minHeight}`">
          <DropGridLayout v-if="compConfig.nestUid" :dropType="[VglDragType.Default]"
            :col-num="w" :uid="item.uid" :minHeight="minHeight">
            <template v-slot="{ data }">
              <template v-for="nestedItem in data" :key="nestedItem.i">
                <GridItem v-if="FormElType.NestEditTable == nestedItem.type && layoutConfig!.isEditable" :x="nestedItem.x" :y="nestedItem.y"
                  :w="nestedItem.w" :h="nestedItem.h" :i="nestedItem.i" :min-h="1" :min-w="1" :isDraggable="isDraggable" >
                  <EditTableGridItem :i="nestedItem.i" :h="nestedItem.h" :uid="item.uid"
                    :updateHiddenitems="updateHiddenitems" :readonly="readonly"/>
                </GridItem>
                <GridItem v-else :padding="layoutConfig!.itemPadding" class="h-full gi-wrap" :x="nestedItem.x"
                  :y="nestedItem.y" :w="nestedItem.w" :h="nestedItem.h" :i="nestedItem.i" :min-h="1" :min-w="1">
                  <WrapGridItem :i="nestedItem.i" :uid="item.uid" :readonly="readonly">
                    <FormElem :i="nestedItem.i" :type="nestedItem.type" ></FormElem>
                  </WrapGridItem>
                </GridItem>
              </template>
            </template>
          </DropGridLayout>
        </SmoothScrollbar>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, Ref, watch } from 'vue';
import { useModuleInject } from '../useModuleInject';
import { FormElType, VglDragType } from '@/enum';
import { TabsType } from 'naive-ui/es/tabs/src/interface';


// 配置信息中获取nestUid数据，和nestUid属性保持同步；
interface Props {
  i: string,    // 组件标识LayoutItem.i，基于此获取compConfig，并从配置中获取所需的布局；
  w: number,
  uid: number,
  h: number,
  updateHiddenitems?: Function,
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  // padding: () => [0, 0]
});
const compConfig = ref();
const activeTab = ref('');    // 注意：NTabs v-model:value 不能用数字类型，必须字符串；
const tabType = ref<TabsType>('card');
const { compConfigs, layoutConfig, currSelectCompId, deleteComp } = useModuleInject();

const nestGridItemClass = 'h-full overflow-hidden outline-dashed outline-1 outline-slate-200 hover:bg-gray-100 duration-300 ';
const nestGridItemClassActive = 'h-full overflow-hidden bg-blue-100 duration-300';

const minHeight = computed(() => {
  return `${props.h * layoutConfig!.value.rowHeight - 40}px`
})

// 计算属性，仅用于派生状态
const cptCompConfig = computed(() => {
  return compConfigs?.find((item: any) => item.i === props.i);
});

const isDraggable = computed(() => {
  return layoutConfig?.value.draggable
})
// 监听 cptCompConfig 的变化
watch(
  cptCompConfig,
  (newConfig) => {
    if (newConfig) {
      compConfig.value = newConfig; // 更新 compConfig.value
      // 注意：NTabs v-model:value 不能用数字类型，必须字符串；
      if (compConfig.value.tabs.findIndex((t: Meta.Tab) => t.uid.toString() == activeTab.value) == -1) {
        activeTab.value = compConfig.value.tabs[0].uid.toString();
      }
      if (compConfig.value.style && compConfig.value.style.type) {
        tabType.value = compConfig.value.style.type;
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
  }
})

const updateValue = (v: any) => {
  console.log(v)
}

const compClick = () => {
  // selectedCompId(props.i);
  currSelectCompId && (currSelectCompId.value = props.i);
}

const onMenuClick = (type: string) => {
  if ('delete' == type) {
    deleteComp && deleteComp(props.uid, props.i)
  } else if ('edit' == type) {
    // 打开编辑窗口
    console.log('open edit...')
  } else if ('hidden' == type) {
    props.updateHiddenitems && props.updateHiddenitems(props.i)
  }
}

</script>

<style lang="scss" scoped>
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
</style>
