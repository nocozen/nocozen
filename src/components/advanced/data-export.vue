<template>
  <ModalDialog @onOkClick="onOkClick" ref="refModal" :title="currTitle" modal-class="w-150" :footer="false">
    <NFlex class="w-full h-100 " align="top" justify="center" :size="0">
      <NFlex class="w-full h-16 pt-4 pl-10">
        <NSteps :current="currStep" :status="currentStatus">
          <NStep title="选择字段" />
          <NStep title="过滤数据" />
          <NStep title="导出数据" />
        </NSteps>
      </NFlex>
      <NFlex vertical v-if="currStep == 1 || currStep == 2" class="w-full h-80 px-8">
        <NButton v-if="currStep == 1" @click="importFile" class="h-70">选择Excel文件</NButton>
        <NFlex class="w-full" :class="imported ? 'h-80' : ''">
          <ListTable :options="tableOptions" ref="refListTable" />
        </NFlex>
      </NFlex>
      <NFlex v-if="currStep > 1 && currStep != 3" class="w-full h-12 px-8 bg-gray-50" justify="end" align="center">
        <NButton size="small" @click="currStep--">上一步</NButton>
        <NButton size="small" @click="currStep++">下一步</NButton>
      </NFlex>
      <template v-if="currStep == 3">
        <NFlex class="w-full h-80 px-8" align="center">
          <n-progress type="line" :percentage="percentage" indicator-placement="inside" />
        </NFlex>
        <NFlex class="w-full h-12 px-8 bg-gray-50" justify="end" align="center">
          <NButton size="small" type="info">完成</NButton>
        </NFlex>
      </template>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import ModalDialog from '@/components/advanced/modal-dialog.vue';
import type { StepsProps, UploadFileInfo } from 'naive-ui'
import { ListTable, VTable } from '@visactor/vue-vtable';
import vtableTheme from '@/theme/vtableTheme';
import { ExcelImportPlugin } from '@visactor/vtable-plugins';

interface Emits {
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>();

const refModal = ref();
const currTitle = ref();
const currStep = ref(1);
const currentStatus = ref<StepsProps['status']>('process');
//初始化插件
const excelImportPlugin = new ExcelImportPlugin({
  exportData: false,
  autoColumns: false,
});

const tableOptions = ref({
  header: [] as any,
  records: [] as any,
  widthMode: 'autoWidth',
  theme: vtableTheme,
  plugins: [excelImportPlugin]
})
const percentage = ref(10);
const refListTable = ref();
const imported = ref(false);

const importFile = async () => {
  if (!excelImportPlugin) {
    console.error('导入插件未初始化');
    return;
  }

  try {
    const result: any = await excelImportPlugin.import('file');
    tableOptions.value = {
      header: result.columns,
      records: result.records,
      widthMode: 'autoWidth',
      theme: vtableTheme,
      plugins: [excelImportPlugin]
    }
    imported.value = true;
    currStep.value ++ ;
  } catch (error) {
    console.error('导入失败:', error);
  }
}

const onOkClick = async () => {
  emit('refresh');
  refModal.value.show(false);
}

const init = () => {
  currTitle.value = "导入数据";
  currStep.value = 1;
  imported.value = false;
  tableOptions.value = {
    header: [] as any,
    records: [] as any,
    widthMode: 'autoWidth',
    theme: vtableTheme,
    plugins: [excelImportPlugin]
  }
}

const show = () => {
  init();
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>
