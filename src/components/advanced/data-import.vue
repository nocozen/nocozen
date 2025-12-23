<template>
  <ModalDialog ref="refModal" :title="currTitle" modal-class="w-150" :footer="false">
    <NFlex class="w-full h-100" align="top" justify="center" :size="0">
      <NFlex class="w-full h-16 pt-4 pl-10">
        <NSteps :current="currStep" :status="currentStatus">
          <NStep title="选择Excel" />
          <NStep title="预览数据" />
          <NStep title="导入数据" />
        </NSteps>
      </NFlex>
      <NFlex vertical v-if="currStep == 1 || currStep == 2" class="w-full px-8">
        <NButton v-if="currStep == 1" @click="importFile" class="h-70 mb-10">选择Excel文件</NButton>
        <NFlex class="w-full h-70" v-show="imported">
          <ListTable :options="tableOptions" ref="refListTable" />
        </NFlex>
      </NFlex>
      <NFlex v-if="currStep > 1 && currStep != 3" class="w-full h-12 px-8 bg-gray-50" justify="space-between"
        align="center">
        <span>{{ `${colNumber}行/${rowNumber}列` }}</span>
        <NFlex>
          <NButton size="small" @click="preStepClick">上一步</NButton>
          <NButton size="small" @click="nextStepClick">下一步</NButton>
        </NFlex>
      </NFlex>
      <template v-if="currStep == 3">
        <NFlex class="w-full h-70 px-8" align="center" justify="center">
          <n-progress type="line" :percentage="percentage" indicator-placement="inside" />
          <span>{{ `共${rowNumber}条，已成功导入${insertedCount}条` }}</span>
        </NFlex>
        <NFlex class="w-full h-12 px-8 bg-gray-50" justify="end" align="center">
          <NButton size="small" type="info" :disabled="percentage != 100" @click="completeClick">完成</NButton>
        </NFlex>
      </template>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalDialog from '@/components/advanced/modal-dialog.vue';
import type { StepsProps } from 'naive-ui'
import { ListTable } from '@visactor/vue-vtable';
import vtableTheme from '@/theme/vtableTheme';
import { ExcelImportPlugin } from '@visactor/vtable-plugins';
import { fetchBulkWrite } from '@/service/api/busi';

interface Emits {
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>();

const meta = ref([] as any);   // 表单元数据
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
const percentage = ref(0);
const refListTable = ref();
const imported = ref(false);
const colNumber = ref(0);
const rowNumber = ref(0);
const collName = ref();
const insertedCount = ref(0);
// todo: 提供配置文件参数配置
const batchSize = 1000; // 每批最多 1000 条

const importFile = async () => {
  if (!excelImportPlugin) {
    console.error('导入插件未初始化');
    return;
  }

  try {
    const result: any = await excelImportPlugin.import('file');
    colNumber.value = result.columns.length;
    rowNumber.value = result.records.length;
    if (result.columns.length == 0 || result.records.length == 0) {
      throw new Error('文件读取异常，请检查文件格式！')
    }
    result.columns?.forEach((col: any) => {
      if (!meta.value.find((m: any) => m.title == col.title)) {
        col['headerStyle'] = { bgColor: 'yellow' }
      }
    })
    // 标记元数据没有的列，并且不导入；
    tableOptions.value = {
      header: result.columns,
      records: result.records,
      widthMode: 'autoWidth',
      theme: vtableTheme,
      plugins: [excelImportPlugin]
    }

    // vtable不允许字段名重复
    meta.value = meta.value.map((m: any) => {
      const col = result.columns.find((col: any) => col.title == m.title && !col.mapped);
      if (col) {
        m['field'] = col.field;
      }
      return m;
    })
    imported.value = true;
    currStep.value++;
  } catch (error: any) {
    console.log(error)
    window.$message?.error('导入失败:', error)
  }
}

const preStepClick = () => {
  imported.value = false;
  tableOptions.value = {
    header: [] as any,
    records: [] as any,
    widthMode: 'autoWidth',
    theme: vtableTheme,
    plugins: [excelImportPlugin]
  }
  currStep.value--;

}
// 下一步
const nextStepClick = async () => {
  currStep.value++;
  percentage.value = 0;
  if (currStep.value == 3) {
    // 提交数据；循环操作，每次10分之一；最大1千条；同时更新进度条；
    // 元数据没有的列不导入；假设用户已经删除多余字段，不再处理；
    const totalRecords = tableOptions.value.records.length;
    let uploadedCount = 0;
    insertedCount.value = 0;
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = tableOptions.value.records.slice(i, i + batchSize);
      try {
        const result = await fetchBulkWrite(collName.value, batch, meta.value);
        if ('ok' == result.msg) {
          insertedCount.value += result.data.insertedCount;
          uploadedCount += batch.length;
          percentage.value = Math.round((uploadedCount / totalRecords) * 100);
        } else {
          window.$message?.error("导入出错了：" + result.msg);
          console.error("导入出错了：" + result.msg);
        }
      } catch (error: any) {
        window.$message?.error(error)
        console.error("Upload failed:", error);
        break; // 中断上传
      }
    }
  }
}

const completeClick = async () => {
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

const show = (collection: string, metaData: Array<{ fieldName: string, title: string, type: string }>) => {
  init();
  collName.value = collection;
  meta.value = metaData;
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>
