<template>
  <div @click.stop="compClick()" v-if="layoutConfig!.isEditable" :class="cptGridItemClass">
    <GridItemMenu @onMenuClick="onMenuClick" :types="menuTypes"
      v-if="props.i == currSelectCompId && !compConfig.hiddenMenu"
      class="absolute px-1.5 h-6 shadow-md z-99 bg-white opacity-60"
      :style="`top: ${layoutConfig!.itemPadding[0]}px; right: ${layoutConfig!.itemPadding[0]}px`">
    </GridItemMenu>
    <div v-if="compConfig.type != BoardElType.BiRich"
      class="bg-tranparent absolute top-0 left-0 h-full w-full z-9 cursor-pointer"></div>
    <slot></slot>
  </div>
  <div v-else :class="cptGridItemClass">
    <div v-if="showMask" @click="onMaskClick"
      class="bg-tranparent absolute top-0 left-0 h-full w-full z-9 cursor-pointer"></div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useModuleInject } from '../useModuleInject';
import { BoardElType, FormElType, ModuleType } from '@/enum';

interface Props {
  i: string,
  // type?: ModuleType,
  uid: number,
  updateHiddenitems?: Function,
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const { compConfigs, layoutConfig, currModuleNode, currSelectCompId, openChartEditor, deleteComp } = useModuleInject();
const compConfig = ref({} as any);

const menuTypes = ref(['delete']);
let formItemClass = 'pa-2 w-full h-full';
let formItemEditClass = 'pa-2 w-full h-full hover:bg-gray-100 duration-300';
let formItemClassEditActive = 'pa-2 w-full h-full bg-blue-100 duration-300';
let boardItemClass = 'w-full h-full hover:shadow-lg ';
let boardItemEditClassActive = 'w-full h-full shadow-md outline outline-2 outline-blue-400'
let boardItemEditClass = 'w-full h-full shadow-md outline outline-1 outline-slate-200/50 hover:outline-2 hover:outline-blue-200'
const showMask = ref(false);

const onMaskClick = (e: any) => {
  if (compConfig.value.editPerm) {
    document.body.focus();
  }
}

const cptGridItemClass = computed(() => {
  let cs = '';
  if (layoutConfig!.value.layoutType == 'form') {
    menuTypes.value = ['delete']
    if (layoutConfig!.value.isEditable) {
      cs = (props.i == currSelectCompId?.value ? formItemClassEditActive : formItemEditClass);
    } else {
      cs = formItemClass;
    }
  } else if (layoutConfig!.value.layoutType == 'board') {

    menuTypes.value = ['hidden', 'edit', 'delete'];
    if (layoutConfig!.value.isEditable) {
      cs = (props.i == currSelectCompId?.value ? boardItemEditClassActive : boardItemEditClass);
    } else {
      if (compConfig.value.nodeUid !== 0) {
        cs = boardItemClass
      } else {
        cs = boardItemClass + ' shadow-md outline outline-1 outline-slate-200/50';
      }
    }
  }
  return cs;
})

const compClick = () => {
  currSelectCompId && (currSelectCompId.value = props.i);
}

const onMenuClick = (type: string) => {
  if ('delete' == type) {
    deleteComp && deleteComp(props.uid, props.i)
  } else if ('edit' == type) {
    // 打开编辑窗口
    openChartEditor(props.i);
  } else if ('hidden' == type) {
    props.updateHiddenitems && props.updateHiddenitems(props.i)
  }
}

watch(
  () => [currModuleNode?.value?.type, props.readonly, compConfig.value.editPerm],
  ([newType, newReadonly, newEditPerm]) => {
    showMask.value = false;
    if (newType != ModuleType.Board) {
      if (newType == ModuleType.Flow) {   // 流程表单
        if (newReadonly) {
          showMask.value = true;
          document.body.focus();
          return;
        }
      } else if (newType == ModuleType.Form) {  // form表单
        if (newReadonly || !newEditPerm) {
          if (![FormElType.FeAttachment, FormElType.FeImage].includes(newType)) {
            showMask.value = true;
            document.body.focus();
            return;
          }
        }
      }
    }
  },
  { immediate: true, deep: true }
);

// 主要监听函数 - 监听配置变化
watch(
  () => [props.i, compConfigs],
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: any) => item.i === newI);
      if (comp) {
        compConfig.value = comp;
      }
    }
  },
  { immediate: true, deep: true }
);
</script>

<style lang="scss" scoped>
.gi-wrap:hover {
  .gi-menu {
    visibility: visible;
  }
}
</style>
