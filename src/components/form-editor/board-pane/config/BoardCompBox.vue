<template>
  <SmoothScrollbar>
    <div class="absolute h-full w-full opacity-100" :class="{ 'z-1': disabled }"></div>
    <NFlex vertical class="py-2 px-1 w-36">
      <span class="mt-4 mx-4 text-sm font-semibold">图表</span>
      <NList :show-divider="false" class="pl-3 pr-2">
        <template v-for="comp of dataComps">
          <NListItem style="padding: 0">
            <NFlex :size="8">
              <ToolboxButton @draging="draging" class="ma-1" :disabled="comp.disabled" :icon="comp.icon"
                :title='comp.title' :data="comp" :drag-type="comp.type === BoardElType.BiChart ? VglDragType.BiChart : VglDragType.Default">
              </ToolboxButton>
            </NFlex>
          </NListItem>
        </template>
      </NList>
      <span class="mt-4 mx-4 text-sm font-semibold">组件</span>
      <NList :show-divider="false" class="pl-3 pr-2">
        <template v-for="comp of webComps">
          <NListItem style="padding: 0">
            <NFlex :size="8">
              <ToolboxButton @draging="draging" class="ma-1" :disabled="comp.disabled" :icon="comp.icon"
                :title='comp.title' :data="comp" :drag-type="comp.type === BoardElType.Nest ? VglDragType.Nest : VglDragType.Default">
              </ToolboxButton>
            </NFlex>
          </NListItem>
        </template>
      </NList>
      <span class="mt-4 mx-4 text-sm font-semibold">筛选</span>
      <NList :show-divider="false" class="pl-3 pr-2">
        <template v-for="comp of filterComps">
          <NListItem style="padding: 0">
            <NFlex :size="8">
              <ToolboxButton @draging="draging" class="ma-1" :disabled="comp.disabled"
                :icon="comp.icon" :title='comp.title' :data="comp">
              </ToolboxButton>
            </NFlex>
          </NListItem>
        </template>
      </NList>
    </NFlex>
  </SmoothScrollbar>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { BoardElType, VglDragType } from '@/enum';

const dataComps = ref([
  { id: '1', title: '统计图', icon: 'uil--chart', type: BoardElType.BiChart, disabled: false },
  { id: '2', title: '明细表', icon: 'material-symbols--table-outline', type: BoardElType.BiDetailTable, disabled: false },
  { id: '3', title: '透视表', icon: 'gg--list', type: BoardElType.BiPivotTable, disabled: false },   
  // { id: '3', title: '数据管理表', icon: 'material-symbols--table-edit-outline', type: BoardElType.BiEditTable, disabled: true },
  // { id: '4', title: '数据列表', icon: 'gg--list', type: BoardElType.BiDataList, disabled: true },   // 暂时看没有用
  { id: '5', title: '日历', icon: 'material-symbols--date-range-outline', type: BoardElType.BiCalendar, disabled: false },
  { id: '6', title: '甘特图', icon: 'lucide--square-chart-gantt', type: BoardElType.BiGantt, disabled: false },
])
const webComps = ref([
  { id: '7', title: '图片组件', icon: 'mdi:image-outline', type: BoardElType.BiImage, disabled: false },
  { id: '8', title: '文本组件', icon: 'fluent--text-field-24-regular', type: BoardElType.BiRich, disabled: false },
  { id: '9', title: '实时时间', icon: 'mingcute--time-line', type: BoardElType.BiClock, disabled: false },
  { id: '10', title: '快捷入口', icon: 'ion--trail-sign-outline', type: BoardElType.BiShortcut, disabled: true },
  { id: '11', title: '嵌入页面', icon: 'fluent--document-one-page-link-24-regular', type: BoardElType.BiNestPage, disabled: true },
  { id: '12', title: '布局容器', icon: 'lineicons--layout-9', type: BoardElType.Nest, disabled: false },
])
const filterComps = ref([
  { id: '13', title: '筛选组件', icon: 'iconoir--filter', type: BoardElType.BiFilter, disabled: true },
  { id: '14', title: '筛选按钮', icon: 'teenyicons--button-outline', type: BoardElType.BiButton, disabled: true },
])

const disabled = ref(false);

const draging = (state: boolean) => {
  disabled.value = state;
}


</script>

<style lang="scss" scoped></style>