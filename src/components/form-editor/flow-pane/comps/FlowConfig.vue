<template>
  <NFlex vertical class="border-l-1">
    <NFlex class="border-b-1">
      <NTabs @update-value="changeEditor" :default-value="tabValue" justify-content="center"
        tab-class="h-11 flex-center text-base w-30" animated>
        <NTab :name="TabType.Node">
          <span class="text-base">{{ currSelectFlowEl && currSelectFlowEl.elType == 'link' ? '连线' : '节点' }}属性</span>
        </NTab>
        <NTab :name="TabType.Flow">
          <span class="text-base">流程属性</span>
        </NTab>
      </NTabs>
    </NFlex>
    <NScrollbar>
      <NodePram v-if="tabValue == TabType.Node" key="node"></NodePram>
      <!-- <FlowParam v-else key="flow"></FlowParam> -->
    </NScrollbar>
  </NFlex>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useModuleInject } from '../../useModuleInject';

const { currSelectFlowEl } = useModuleInject();

enum TabType {
  Node = 'node',
  Flow = 'flow'
}

const tabValue = ref(TabType.Node)


const changeEditor = (tab: TabType) => {
  tabValue.value = tab
}
</script>
