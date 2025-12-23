<template>
  <NFlex vertical>
    <NFlex vertical class="p-4 border-1 rounded-md" :size="0">
      <NFlex class="w-full border-b-1 pb-2" align="center" justify="space-between">
        <span>操作意见</span>
        <NSwitch size="small" v-model:value="opinionValue"  @update-value="update($event,'opinion')"></NSwitch>
      </NFlex>
      <NFlex class="w-full pt-2" align="center" justify="space-between">
        <span>手写签名</span>
        <NSwitch size="small"  @update-value="update"></NSwitch>
      </NFlex>
    </NFlex>
    <NFlex vertical class="p-4 border-1 rounded-md" :size="0">
      <NFlex class="w-full border-b-1 pb-2" align="center" justify="space-between">
        <span>提交</span>
        <NSwitch size="small" :value="true"></NSwitch>
      </NFlex>
      <NFlex class="w-full border-b-1 py-2" align="center" justify="space-between">
        <span>回退</span>
        <NSwitch size="small" v-model:value="nodeOpt.sendBack" @update-value="update"></NSwitch>
      </NFlex>
      <NFlex class="w-full border-b-1 py-2" align="center" justify="space-between">
        <span>否决</span>
        <NSwitch size="small" v-model:value="nodeOpt.reject"  @update-value="update"></NSwitch>
      </NFlex>
      <!-- <NFlex class="w-full border-b-1 py-2" align="center" justify="space-between">
      <span>暂存</span><NSwitch size="small"></NSwitch>
    </NFlex> -->
      <NFlex class="w-full border-b-1 py-2" align="center" justify="space-between">
        <span>加签</span>
        <NSwitch size="small" v-model:value="nodeOpt.addSign"  @update-value="update"></NSwitch>
      </NFlex>
      <NFlex class="w-full border-b-1 py-2" align="center" justify="space-between">
        <span>转交</span>
        <NSwitch size="small" v-model:value="nodeOpt.transfer"  @update-value="update"></NSwitch>
      </NFlex>
      <NFlex class="w-full pt-2" align="center" justify="space-between">
        <span>结束流程</span>
        <NSwitch size="small" v-model:value="nodeOpt.cancel"  @update-value="update"></NSwitch>
      </NFlex>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NSwitch } from 'naive-ui';
import { useModuleInject } from '../../useModuleInject';

interface Props {
  opinion: any,
  nodeOpt: {
    sendBack: boolean,
    addSign: boolean,
    transfer: boolean,
    cancel: boolean,
    reject: boolean,
  },
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'update'): void,
  (e: 'update:opinion', opinion: any): void
}
const emit = defineEmits<Emits>()

const opinionValue = ref(false);

const init = () => {
  opinionValue.value = props.opinion;
}
init();

watch(
  () => props.opinion,
  (newValue, oldValue) => {
      init();
  },
  { immediate: true, deep: true }
);

const update = (e: any, type?: string) => {
  if ('opinion' == type) {
    opinionValue.value = e;
    emit('update:opinion', e);
  }
  emit('update')
}


</script>
