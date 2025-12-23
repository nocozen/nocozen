<template>
  <NFlex>
    <NTabs @update-value="changeEditor" :default-value="tabValue" justify-content="center"
      tab-class="h-12 flex-center text-base w-30 border-b-1" animated>
      <NTab name="comp">
        <span class="text-base">组件属性</span>
      </NTab>
      <NTab name="form">
        <span class="text-base">表单属性</span>
      </NTab>
    </NTabs>
  </NFlex>
  <NScrollbar class="p-4">
    <NFlex v-if="flowEnabled" class="text-gray w-full" justify="center">流程启动中不可修改配置</NFlex>
    <template v-else>
      <CompConfig v-if="tabValue == 'comp'"></CompConfig>
      <FormConfig v-else></FormConfig>
    </template>
  </NScrollbar>
</template>

<script setup lang="ts">
import { ref } from 'vue';


interface Props {
  flowEnabled: boolean
}

const props = withDefaults(defineProps<Props>(), {
  flowEnabled: false
});


const tabValue = ref('comp')


const changeEditor = (tab: string) => {
  tabValue.value = tab
}
</script>
