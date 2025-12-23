<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" size="small" segmented class="card-wrapper">
      <NFlex wrap justify="start" class="mb-4 pb-4 border-b-1">
        <ButtonIcon icon="mdi:plus" title="添加数据汇集" size="small" level="" type="info" />
      </NFlex>
      <SmoothScrollbar style="height: calc(100vh - 210px);">
        <NFlex></NFlex>
      </SmoothScrollbar>
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();

interface Props {
  id: string;
}

const props = defineProps<Props>();

</script>

<style scoped></style>
