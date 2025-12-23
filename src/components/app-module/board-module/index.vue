<template>
  <NFlex vertical :size="0">
    <NFlex class="h-10 w-full">
      <AppHeader class="w-full">
        <template #header>
          <NButton class="font-bold" size="small">{{ currModuleNode?.name }}</NButton>
          <ButtonIcon @click="openModuleEdit" icon="line-md--edit" title="编辑" size="small" class="ml-2"></ButtonIcon>
          <!-- <ButtonIcon @click="onPrintClick" size="small" icon="mdi:printer-outline" title="打印" /> -->
        </template>
      </AppHeader>
    </NFlex>
    <DashBoard ref="refBoard"></DashBoard>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, Ref, inject } from 'vue';
import AppHeader from '@/layouts/modules/app-header/index.vue';
import { MenuEventType, ProviderName } from '@/enum';
import { NButton } from 'naive-ui';

let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);
let openModuleEditProvide = inject<any>(ProviderName.OpenModuleEditProvide);

/**
 * 设计说明：
 * 报表数据的准备由【表单模块】支持，可以区分：明细表单、统计表单、同步表单等等；
 * 【报表模块】只负责展示，创建报表模块的前提是数据已经通过表单模块准备好了；
 */
const refBoard = ref();
const onPrintClick = () => {
  refBoard.value.print();
}

const openModuleEdit = () => {
  currModuleNode && openModuleEditProvide(MenuEventType.EditModule, currModuleNode?.value.app_id, currModuleNode.value)
}
</script>
