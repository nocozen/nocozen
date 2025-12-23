<template>
  <div @click="layoutConfig!.isEditable ? compClick() : null" :class="cptNestGridItemClass"
    class="overflow-hidden w-full h-full ngi shadow-md outline outline-1 outline-slate-200/50 hover:shadow-lg outline outline-1 outline-slate-200/50">
    <div class="absolute top-0 left-0 right-0 h-1.5 z-99 "></div>
    <GridItemMenu @onMenuClick="onMenuClick" :types="menuTypes"
      v-if="layoutConfig!.isEditable && props.i == currSelectCompId" class="absolute px-1 h-6 shadow-md  z-99"
      :style="`top: ${layoutConfig!.itemPadding[0]}px; right: ${layoutConfig!.itemPadding[0]}px`">
    </GridItemMenu>
    <NInput v-if="layoutConfig?.isEditable && compConfig?.showTitle && compConfig?.showTitle == true" @blur="onTitleBlur"
      :class="{ 'font-bold': compConfig?.nodeUid == 0 }"
      class="pl-[9px] items-center w-full flex min-h-8 max-h-8 h-8 flex-start title-box [&_.n-input-wrapper]:pl-1"
      style="max-width: 100%;" v-model:value="chartTitle"></NInput>
    <span v-else-if="compConfig?.showTitle && compConfig?.showTitle == true" :class="{ 'font-bold': compConfig.nodeUid == 0 }"
      class="pl-[9px] items-center flex min-h-8 max-h-8 h-8 flex-start mx-2 text-base-text">{{ chartTitle }}</span>
      <DropGridLayout :dropType="[BoardElType.BiChart, VglDragType.Default]" :col-num="w" :minHeight="minHeight"
        v-if="compConfig && compConfig.nestUid" :uid="compConfig?.nestUid[0]">
        <template v-slot="{ data }">
          <GridItem :padding="[6, 6]" v-for="nestedItem in data" :key="nestedItem.i" class="h-full gi-wrap"
            :x="nestedItem.x" :y="nestedItem.y" :w="nestedItem.w" :h="nestedItem.h" :i="nestedItem.i" :min-h="1"
            :min-w="1">
            <WrapGridItem :i="nestedItem.i" :uid="compConfig?.nestUid[0]">
              <BoardElem :i="nestedItem.i" :type="nestedItem.type" />
            </WrapGridItem>
          </GridItem>
        </template>
      </DropGridLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useModuleInject } from '../useModuleInject';
import { BoardElType, VglDragType } from '@/enum';

interface Props {
  i: string,
  w: number,
  uid: number,
  h: number,
  updateHiddenitems?: Function
}

const props = withDefaults(defineProps<Props>(), {
});

// 事件定义
interface Emits {
  (e: 'updateTitle', title: string): void;
}
const emit = defineEmits<Emits>();

const { compConfigs, layoutConfig, currSelectCompId, deleteComp, updateCompConfig } = useModuleInject();
const nestGridItemClass = 'h-full overflow-hidden outline-dashed outline-1 outline-slate-200 hover:bg-gray-100 duration-300 ';
const nestGridItemClassActive = 'h-full overflow-hidden bg-blue-100 duration-300';
const compConfig = ref();
const chartTitle = ref();

const minHeight = computed(() => {
  return `${props.h * layoutConfig!.value.rowHeight}px`;
})

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        chartTitle.value = comp.title || '未命名';
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

const onTitleBlur = (e: any) => {
  compConfig.value.title = chartTitle.value;
  updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig);
}

const menuTypes = computed(() => {
  let countChild = 0;
  const uid = compConfig.value?.nestUid?.length == 1 ? compConfig!.value!.nestUid[0] : null;
  if (uid) {
    countChild = compConfigs?.filter((item: any) => item.nodeUid == uid)?.length || 0;
  }
  return (countChild == 0) ? ['show-title', 'delete'] : ['show-title', 'disable-delete']
})

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

const compClick = () => {
  currSelectCompId && (currSelectCompId.value = props.i);
}

const onMenuClick = (type: string) => {
  if ('delete' == type) {
    deleteComp && deleteComp(props.uid, props.i)
  } else if ('show-title' == type) {
    if (compConfig.value?.showTitle) {
      compConfig.value.showTitle = false;
    } else {
      compConfig.value.showTitle = true;
    }
    updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig);
  } else if ('hidden' == type) {
    props.updateHiddenitems && props.updateHiddenitems(props.i);
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
