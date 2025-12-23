<template>
  <NFlex class="px-4 h-fit">
    <NCheckbox class="w-full">全部</NCheckbox>
    <NDivider class="m-t-0"></NDivider>
    <NCheckbox v-for="btn in btnOptions" :key="btn.key" class="w-28">{{ btn.label }}</NCheckbox>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  permGroup: Meta.ModulePermGroup
}

const props = withDefaults(defineProps<Props>(), {
})

const currPg = ref<Meta.ModulePermGroup>({} as any);

const init = () => {
  currPg.value = props.permGroup;
}

init();

const btnOptions = computed(() => {
  if ('form' == props.permGroup.moduleType) {
    return formOptions;
  } else {
    return flowOptions;
  }
})

const formOptions = [
  { label: '查看', key: 'view' },
  { label: '添加', key: 'add' },
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete' },
  { label: '复制', key: 'copy' },
  { label: '批量修改', key: 'batchEdit' },
  { label: '批量打印', key: 'batchPrint' },
  { label: '导入', key: 'import' },
  { label: '导出', key: 'export' },
];
const flowOptions = [
  { label: '查看', key: 'view' },
  { label: '添加', key: 'add' },
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete' },
  { label: '复制', key: 'copy' },
  { label: '批量修改', key: 'batchEdit' },
  { label: '批量打印', key: 'batchPrint' },
  { label: '导入', key: 'import' },
  { label: '导出', key: 'export' },
  { label: '调整流程负责人', key: 'flowEditCharge' },
  { label: '结束流程', key: 'flowFinish' },
  { label: '激活流程', key: 'flowActive' },
]
</script>

<style lang="scss" scoped>
:deep(.n-divider:not(.n-divider--vertical)) {
  margin-top: 4px;
  margin-bottom: 4px;
}
</style>