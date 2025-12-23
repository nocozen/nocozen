<template>
  <ModalDialog @onOkClick="onOkClick" ref="refModal" title="添加自定义权限组" modal-class="w-140" :footer="true" :buttons="['complete']">
    <NCard content-style="padding: 0;" :bordered="false" size="small">
      <NFlex :size="0" class="w-full">
        <NFlex :size="0" class="py-3">
          <NTabs placement="left" class="w-32" v-model:value="tabValue">
            <NTab name="title" class="w-32">
              <SvgIcon icon="fluent--send-24-regular" class="ml-2 mr-2 text-base"/>
              名称信息
            </NTab>
            <NTab name="button" class="w-32">
              <SvgIcon icon="fluent--send-24-regular" class="ml-2 mr-2 text-base"/>
              操作权限
            </NTab>
            <NTab name="field" class="w-32">
              <SvgIcon icon="fluent--content-view-24-regular" class="ml-2 mr-2 text-base"/>
              字段权限
            </NTab>
            <NTab name="data" class="w-32">
              <SvgIcon icon="fluent--content-view-24-regular" class="ml-2 mr-2 text-base"/>
              数据权限
            </NTab>
          </NTabs>
        </NFlex>
        <NFlex class="p-4 border-l-1 h-80 w-107">
          <PgTitle v-if="'title' == tabValue" :permGroup="currPg" ></PgTitle>
          <PgButton v-else-if="'button' == tabValue" :permGroup="currPg"  :type="currPg.moduleType"></PgButton>
          <PgField v-else-if="'field' == tabValue" :permGroup="currPg"></PgField>
          <PgData v-else-if="'data' == tabValue" :permGroup="currPg"></PgData>
        </NFlex>
      </NFlex>
    </NCard>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';


const refModal = ref();
const tabValue = ref('title');   // 'title' | 'button' | 'field' | 'data'
const currPg = ref();

const onOkClick = () => {
  refModal.value.show(false);
}

const show = (pg: Meta.ModulePermGroup) => {
  currPg.value = pg;
  refModal.value.show(true)
}

defineExpose({
  show
})
</script>

<style lang="scss" scoped>
:deep(.n-tabs-tab--active) {
  background-color: rgb(239 246 255 / var(--tw-bg-opacity, 1));
}
</style>