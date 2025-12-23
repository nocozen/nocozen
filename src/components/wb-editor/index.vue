<template>
  <NDrawer v-model:show="showModel" class="rounded-none select-none" height="100%" placement="bottom" :auto-focus="false" >
    <div class="absolute h-full w-full opacity-100" :class="{ 'z-1': disabled }" ></div>
    <NFlex vertical :size="0" class="h-full">
      <NFlex :size="0" class="h-12 shadow-md" align="center">
        <NFlex class="flex-1 pl-2">
          <ButtonIcon type="info" class="text-base" iconClass="text-lg" icon="material-symbols--display-settings-outline"
            title="工作台定制" level="text"></ButtonIcon>
        </NFlex>
        <NFlex class="flex-none mr-2" justify="end">
          <ButtonIcon @click="closeEditor" level='' type="info" icon="tabler--check" title="完成"></ButtonIcon>
        </NFlex>
      </NFlex>
      <NFlex class="flex-1 overflow-auto" :size="0">
        <NFlex vertical class="w-36 h-full">
          <span class="mt-4 mx-4 text-sm">组件</span>
          <NList :show-divider="false" class="pl-3 pr-2">
            <template v-for="n of 9">
              <NListItem style="padding: 0">
                <NFlex :size="8">
                  <ToolboxButton :drag-type="VglDragType.Default" class="ma-1" title-class="text-sm"
                    :disabled="comps[n - 1].disabled" :icon="comps[n - 1].icon" :title='comps[n - 1].title'
                    :data="comps[n - 1]" :key="n">
                  </ToolboxButton>
                </NFlex>
              </NListItem>
            </template>
          </NList>
        </NFlex>
        <NFlex class="flex-1 h-full outline outline-slate-200/50 outline-1 w-full">
          <SmoothScrollbar>
            <WbVglPanel ref="refWBVglPanel" @update="update" :is-editable="true"></WbVglPanel>
          </SmoothScrollbar>
        </NFlex>
      </NFlex>
    </NFlex>
  </NDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { WbElType, VglDragType } from '@/enum';
import Uid from '@/utils/uid';

const showModel = ref(false);

const comps = ref([
  { id: '1', title: '流程中心', icon: 'charm--organisation', type: WbElType.WbFlowCenter, disabled: true },
  { id: '2', title: '我的应用', icon: 'octicon--apps-24', type: WbElType.WbMyApps, disabled: true },
  { id: '3', title: '分析图表', icon: 'mdi:chart-box-outline', type: WbElType.WbChart },
  { id: '4', title: '轮播图', icon: 'mdi:image-outline', type: WbElType.WbCarousel },
  { id: '5', title: '富文本', icon: 'fluent--text-field-24-regular', type: WbElType.WbRich },
  { id: '6', title: '最近使用', icon: 'mingcute--time-line', type: WbElType.WbRecentUsed, disabled: true },
  { id: '7', title: '我的图表', icon: 'ri--bar-chart-box-ai-line', type: WbElType.WbMyCharts, disabled: true },
  { id: '8', title: '我的收藏', icon: 'mi--favorite', type: WbElType.WbMyFavorites, disabled: true },
  { id: '9', title: '快捷入口', icon: 'ion--trail-sign-outline', type: WbElType.WbShortcut },
] as any)

const disabled = ref(false);
const refWBVglPanel = ref();

const defDisComps = [ WbElType.WbFlowCenter, WbElType.WbMyApps, WbElType.WbMyCharts, WbElType.WbMyFavorites, WbElType.WbRecentUsed ];

const closeEditor = () => {
  showModel.value = false;
}

const openEditor = () => {
  showModel.value = true;
}


const update = (disabledComps: Array<WbElType>) => {
  comps.value?.forEach((c: any) => {
    if (disabledComps.includes(c.type)) {
      c.disabled = true
    } else {
      defDisComps.includes(c.type) || (c.disabled = false);
    }
  })
}

defineExpose({
  openEditor
})
</script>