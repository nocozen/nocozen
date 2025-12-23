<template>
  <NFlex class="bg-gray-100/10 w-full" justify="center">
    <NCard class="w-230 my-2" content-style="padding: 0;" size="small">
      <NFlex :size="0">
        <NTabs v-model:value="tabValue" placement="left" class="mt-6 w-40">
          <NTab name="inner" class="w-40">
            <SvgIcon icon="fluent--send-person-24-regular" class="ml-4 mr-2 text-base"/>
            组织内发布
          </NTab>
          <NTab name="public" class="w-40">
            <SvgIcon icon="fluent--send-24-regular" class="ml-4 mr-2 text-base"/>
            公开发布
          </NTab>
          <NTab name="view" class="w-40">
            <SvgIcon icon="fluent--content-view-24-regular" class="ml-4 mr-2 text-base"/>
            视图管理
          </NTab>
        </NTabs>
        <PublishPg v-if="'inner' == tabValue" :type="type"></PublishPg>
        <UnreleasedModule v-else class="border-l-1 flex-1 pt-50" style="height: calc(100vh - 66px);"></UnreleasedModule>
      </NFlex>
    </NCard>
  </NFlex>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  type: 'form' | 'flow'
}

const props = withDefaults(defineProps<Props>(), {
})


const tabValue = ref('inner');


</script>

<style lang="scss" scoped>
:deep(.n-tabs-tab--active) {
  background-color: rgb(239 246 255 / var(--tw-bg-opacity, 1));
}
</style>
