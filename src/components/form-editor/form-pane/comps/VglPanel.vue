<template>
  <!-- <SmoothScrollbar> -->
  <DarkModeContainer :class="cptContainerClass">
    <div v-if="flowEnabled" class="bg-tranparent absolute top-0 left-0 h-full w-full z-9 cursor-pointer"></div>
    <DropGridLayout ref="refVglForm" id="vglForm" :uid="0" :col-num="layoutConfig!.colNum"
      :dropType="Object.values(VglDragType)" :minHeight="`calc(100vh - ${layoutConfig!.vglHeightPadding}px)`">
      <template v-slot="{ data, updateHiddenitems }">
        <template v-if="ModuleType.Board == layoutConfig!.layoutType" v-for="item in data" :key="item.i">
          <GridItem v-if="BoardElType.Nest == item.type" :padding="layoutConfig!.itemPadding" :x="item.x" :y="item.y"
            :w="item.w" :h="item.h" :i="item.i" :min-h="1" :min-w="1" :isDraggable="isDraggable">
            <NestedGridItem :i="item.i" :uid="0" :h="item.h" :w="item.w" :updateHiddenitems="updateHiddenitems" />
          </GridItem>
          <GridItem v-else :padding="layoutConfig!.itemPadding" class="h-full gi-wrap" :x="item.x" :y="item.y"
            :w="item.w" :h="item.h" :i="item.i" :min-h="2" :min-w="1" :isDraggable="isDraggable">
            <WrapGridItem :type="ModuleType.Board" :i="item.i" :uid="0" :updateHiddenitems="updateHiddenitems">
              <BoardElem :i="item.i" :type="item.type" />
            </WrapGridItem>
          </GridItem>
        </template>
        <template v-if="ModuleType.Board != layoutConfig!.layoutType" v-for="item in data" :key="item.i">
          <GridItem v-if="FormElType.NestTabPane == item.type" :x="item.x" :y="item.y" :w="item.w" :h="item.h"
            :i="item.i" :min-h="1" :min-w="1" :isDraggable="isDraggable">
            <TabPaneGridItem :i="item.i" :uid="0" :h="item.h" :w="item.w" :readonly="readonly"
              :updateHiddenitems="updateHiddenitems" />
          </GridItem>
          <GridItem v-else-if="FormElType.NestEditTable == item.type && layoutConfig!.isEditable" :x="item.x"
            :y="item.y" :w="item.w" :h="item.h" :i="item.i" :min-h="1" :min-w="1" :isDraggable="isDraggable">
            <EditTableGridItem :i="item.i" :h="item.h" :uid="0" :readonly="readonly"
              :updateHiddenitems="updateHiddenitems" />
          </GridItem>
          <GridItem v-else-if="FormElType.Nest == item.type" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i"
            :min-h="1" :min-w="1" :isDraggable="isDraggable">
            <NestedGridItem :i="item.i" :uid="0" :h="item.h" :w="item.w" :readonly="readonly"
              :updateHiddenitems="updateHiddenitems" />
          </GridItem>
          <GridItem v-else :padding="layoutConfig!.itemPadding" class="h-full w-full gi-wrap" :x="item.x" :y="item.y"
            :w="item.w" :h="item.h" :i="item.i" :min-h="2" :min-w="1" :isDraggable="isDraggable">
            <WrapGridItem :i="item.i" :uid="0" :readonly="readonly" :updateHiddenitems="updateHiddenitems"
              :style="setOverflow(item.type)">
              <FormElem :i="item.i" :type="item.type" :readonly="readonly" />
            </WrapGridItem>
          </GridItem>
        </template>
      </template>
    </DropGridLayout>
    <PrintPageLayout v-show="showPrintPgae" :title="currModuleNode?.name" ref="refPrintPage" id="printPage"
      class="w-full">
      <div ref="printContent"></div>
    </PrintPageLayout>
  </DarkModeContainer>
  <!-- </SmoothScrollbar> -->
</template>

<script setup lang="ts">
import { computed, inject, Ref, ref, h, nextTick, watch } from 'vue';
import { FormElType, ModuleType, VglDragType, ProviderName, BoardElType } from '@/enum';
import { useModuleInject } from '../../useModuleInject';
import { PrintAreaOption, vPrint, VuePrintNext } from 'vue-print-next';
import PrintPageLayout from './PrintPageLayout.vue';

interface Props {
  readonly?: boolean,
  flowEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  flowEnabled: false
});

const { layoutConfig } = useModuleInject();
let currModuleNode = inject<Ref<Meta.ModuleNode> | undefined>(ProviderName.CurrModuleNodeProvide, undefined);

// 解决错误提示被容器遮挡问题，
// FeText、FeNumber允许溢出确保错误提示显示完全，
// FeTextArea通过设置足够底边距确保，其它组件不需要；
const setOverflow = (type: FormElType) => {
  if (layoutConfig?.value.isEditable) {
    return { overflow: 'hidden' }
  } else {
    if (type.includes(FormElType.Nest)) {
      return { overflow: 'hidden' };
    } else {
      return { overflow: 'visible' }
    }
  }
};

const cptContainerClass = computed(() => {
  let contClass = ''; // (layoutConfig.value.isEditable && layoutConfig.value.layoutType == ModuleType.Board) ? 'bg-gray-200/15 ' : '';
  contClass += layoutConfig!.value.isEditable ? 'ma-4 pa-2.5 box-with-shadows' : ''
  return contClass
})

const isDraggable = computed(() => {
  return layoutConfig?.value.draggable
})

const refVglForm = ref();  // 可能是vgl容器导致获取不到
const refPrintPage = ref();
const showPrintPgae = ref(false);
const printContent = ref()

const print = () => {
  // 获取表单HTML内容
  printContent.value.innerHTML = "";
  printContent.value.innerHTML = `
  <div style="
    max-width: 210mm;
    padding-left: 25mm;
  ">
    <div style="display: inline-block; width: 210mm;">
      ${refVglForm.value.$el.innerHTML}
    </div>
  </div>
  `;;
  showPrintPgae.value = true;
  // 确保DOM更新
  nextTick(() => {
    // 使用VuePrintNext打印
    new VuePrintNext({
      el: refPrintPage.value.$el,
      extraHead: `<div style='display: flex; justify-content: center; padding-bottom: 10mm; width: 100%; font-weight: bold; font-size: 20px;'>
      ${currModuleNode?.value.name}
      </div>`,
      preview: false,
      closeCallback: () => {
        // 打印完成后恢复原表单
        showPrintPgae.value = false;
        printContent.value.innerHTML = "";
      }
    })
  })

}

defineExpose({
  print
})
</script>

<style lang="scss" scoped>
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
