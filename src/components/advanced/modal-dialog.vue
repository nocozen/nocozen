<template>
  <NModalProvider>
    <NModal v-model:show="showModal" :bordered="false" :mask-closable=false class="p-0" :class="modalClass">
      <NCard content-style="padding: 0;" :bordered="false" size="small">
        <NFlex class="h-12 w-full px-4 border-b-1" align="center" justify="space-between">
          <span class="font-semibold">{{ title }}</span>
          <NFlex :size="0">
            <ButtonIcon v-if="toolButtons?.includes('flow')" iconClass="text-xl opacity-60" icon="ci--bar-right"
              level="text" :focusable="false" @click="onSwitchFlowInfo"/>
            <ButtonIcon v-if="toolButtons?.includes('flow')" iconClass="text-base opacity-60" icon="charm--organisation" level="text"
              :focusable="false" @click="onShowFlowChart"/>
            <ButtonIcon icon="mdi:close" @click="onClose" iconClass="text-2xl opacity-80" level="text"
              :focusable="false" />
          </NFlex>
        </NFlex>
        <slot></slot>
        <NFlex v-if="footer" class="bg-gray-100/50 border-t-1 h-12 w-full px-4" align="center" justify="end">
          <NButton v-if="buttons.includes('cancel')" size="small" @click="onCancelClick">取消</NButton>
          <NButton v-if="buttons.includes('ok')" size="small" type="info" @click="onOkClick">确认</NButton>
          <NButton v-if="buttons.includes('complete')" size="small" type="info" @click="onCompleteClick">完成</NButton>
        </NFlex>
      </NCard>
    </NModal>
  </NModalProvider>
</template>

<script setup lang="ts">
import { NFlex } from 'naive-ui';
import { ref } from 'vue';

interface Props {
  title: string,
  footer?: boolean,
  modalClass?: string,
  toolButtons?: Array<'flow' | 'sider' | 'fullScreen'>,
  buttons?: Array<'cancel' | 'ok' | 'complete'>,
}

const props = withDefaults(defineProps<Props>(), {
  title: '标题',
  footer: false,
  modalClass: 'w-180',
  buttons: () => ['cancel', 'ok']
});

interface Emits {
  (e: 'onClose'): void,
  (e: 'onOkClick'): void,
  (e: 'onCancelClick'): void,
  (e: 'onCompleteClick'): void,
  (e: 'onShowFlowChart'): void,
  (e: 'onSwitchFlowInfo'): void
}
const emit = defineEmits<Emits>();


const showModal = ref(false);

const onClose = () => {
  showModal.value = false;
  emit('onClose');
}
const onOkClick = () => {
  emit('onOkClick');
}

const onCancelClick = () => {
  showModal.value = false;
  emit('onCancelClick');
}

const onCompleteClick = () => {
  emit('onCompleteClick');
}


const onSwitchFlowInfo = () => {
  emit('onSwitchFlowInfo');
}

const onShowFlowChart = () => {
  emit('onShowFlowChart');
}
const show = (show: boolean) => {
  showModal.value = show;
}

defineExpose({
  show
})
</script>