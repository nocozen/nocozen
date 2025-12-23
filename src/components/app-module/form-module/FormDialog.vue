<template>
  <ModalDialog ref="formDialog" :title="title">
    <FormContent v-if="moduleNode && moduleNode.moduleConfig_id" :data-list="dataList" :row-index="currIndex"
      :moduleConfig_id="moduleNode.moduleConfig_id" :hOffset="'view' == formType ? 0 : 19"
      @onFormEvent="onFormEvent" :readonly="'view' == formType" :buttons="['cancel', 'submit']" />
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FormOpt } from '@/enum';

interface Props {
  moduleNode: Meta.ModuleNode | undefined,
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'refresh'): void;
}
const emit = defineEmits<Emits>();

const formDialog = ref();
const dataList = ref();
const currIndex = ref();
const formType = ref('view');
const openType = ref<'add' | 'view' | 'edit'>('view');
const title = ref('');

const onFormEvent = (opt: FormOpt, id?: string) => {
  if ('add' == openType.value) {   // 确保'add'打开的窗口会关闭，浏览编辑不关闭；
    formDialog.value.show(false);
  } else if (FormOpt.Delete == opt) {
    dataList.value = dataList.value.filter((d: any) => d._id != id);
    formDialog.value.show(false);
  }
  emit('refresh');
}

const show = async (type: 'add' | 'view' | 'edit', data?: Array<any>, rowIndex?: number) => {
  openType.value = type;
  formType.value = type;
  currIndex.value = null;
  dataList.value = [];
  if ('add' != type && data && rowIndex != null) {
    currIndex.value = rowIndex + 1;
    dataList.value = data;
  }
  title.value = props.moduleNode!.name;
  formDialog.value.show(true);
}

defineExpose({
  show
})

</script>
