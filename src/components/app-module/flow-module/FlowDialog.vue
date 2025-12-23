<template>
  <ModalDialog ref="flowDialog" :title="title">
    <NFlex v-if="'view' == formType" :size="0" class="w-full px-4 border-b-1 h-10" align="center">
      <NFlex class="flex-1">
        <ButtonIcon @click="onPrintClick" size="small" icon="mdi:printer-outline" title="打印" />
      </NFlex>
      <NPagination @update:page="onPageChange" v-model:page="currIndex" :page-count="flowList?.length" simple />
    </NFlex>
    <FlowContent ref="vglPanel" :openType="openType as any" v-if="currModuleNode && currModuleNode.moduleConfig_id"
      :flow="currFlow" :row-index="currIndex" :moduleConfig_id="currModuleNode.moduleConfig_id"
      :hOffset="'view' == formType ? 0 : 19" @onFormEvent="onFormEvent" :readonly="'view' == formType"
      :buttons="['cancel', 'submit']" />
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FormOpt } from '@/enum';

interface Props {
  openType: 'table' | 'form',
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'refresh'): void;
}
const emit = defineEmits<Emits>();

const flowDialog = ref();
const flowList = ref();
const currIndex = ref();
const currFlow = ref();
const formType = ref('view');
const viewType = ref('view');
const title = ref('');
const currModuleNode = ref();
const vglPanel = ref();

const onPrintClick = () => {
  vglPanel.value.print();
}

const onPageChange = async (index: number) => {
  currIndex.value = index;
  currFlow.value = flowList.value[index - 1];
}

const onFormEvent = (opt: FormOpt) => {
  if ('add' == viewType.value || FormOpt.Delete == opt) {
    flowDialog.value.show(false);
  }
  emit('refresh');
}

const show = async (type: 'add' | 'view' | 'edit', module: Meta.ModuleNode, data?: Array<any>, rowIndex?: number) => {
  currModuleNode.value = module;
  viewType.value = type;
  formType.value = type;
  currIndex.value = null;
  flowList.value = [];
  if ('add' != type && data && rowIndex != null) {
    currIndex.value = rowIndex + 1;
    flowList.value = data;
    currFlow.value = data[rowIndex];
  }
  title.value = currModuleNode?.value?.name || '流程标题'; // currFlow.value.moduleName;
  flowDialog.value.show(true);
}

defineExpose({
  show
})

</script>
