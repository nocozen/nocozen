<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NFlex wrap justify="start" class="mb-4 pb-4 border-b-1">
        <ButtonIcon icon="mdi:plus" title="添加数据视图" size="small" level="" type="info" />
      </NFlex>
      <SmoothScrollbar style="height: calc(100vh - 210px);">
        <DropList placeholder="暂无应用可访问" @reorder="onReorder" class="w-full flex gap-2 flex-wrap" :items="aggViewList">
          <template #item="{ item, index, reorder }">
          </template>
          <template #feedback>
          </template>
        </DropList>
      </SmoothScrollbar>
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';

// ===最佳实践：数据同步到一个简单表中，然后基于该表创建视图，实现高性能支持=================
// ===对于并发修改的处理方案：例如：库存：先添加锁定记录，成功后添加出库记录；修改->变换为->添加记录+实时统计判断；===========


interface Props {
  id: string;
}

const props = defineProps<Props>();

const aggViewList = ref([
  { _id: 1, name: '测试1' },
  { _id: 2, name: '测试2' },
  { _id: 3, name: '测试3' },
  { _id: 4, name: '测试4' }
] as any);

// 用于判断是否显示占位样式
const onReorder = async (e: any) => {
  await e.apply(aggViewList.value);
}


</script>



<style scoped></style>
