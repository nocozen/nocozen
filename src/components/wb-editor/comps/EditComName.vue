<template>
  <ModalDialog @onOkClick="onOkClick" ref="refModal" :title="currTitle" modal-class="w-100" :footer="true">
    <NFlex class="w-full h-14 " align="center" justify="center" :size="0">
      <div class="w-full mx-4">
        <NInput v-model:value="currValue" placeholder="请输入"></NInput>
      </div>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalDialog from '@/components/advanced/modal-dialog.vue';


interface Emits {
  (e: 'update', type: string, value: string): void
}

const emit = defineEmits<Emits>();

const refModal = ref();
const currTitle = ref();
const currValue = ref();
const currType = ref();

const onOkClick = async () => {
  emit('update', currType.value, currValue.value);
  refModal.value.show(false);
}

const show = (title: string, name: string, type?: string) => {
  currTitle.value = title;
  name && (currValue.value = name);
  currType.value = type;
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>