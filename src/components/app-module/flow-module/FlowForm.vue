<template>
  <NFlex class="px-3 pt-3" :size="0">
    <NFlex v-if="!isSubmit" class="h-full w-full box-with-shadows" :size="0">
      <FlowContent @onFormEvent="onFormEvent" ref="formContent" v-if="currModuleNode && currModuleNode.moduleConfig_id"
        :moduleConfig_id="currModuleNode.moduleConfig_id" openType="form" />
    </NFlex>
    <NFlex v-else vertical class="w-full h-118" align="center" justify="center">
      <SvgIcon icon="ph--seal-check-fill" class="text-green-500 font-bold w-38 h-38"></SvgIcon>
      <span class="text-green-500 text-2xl">提交成功</span>
      <NButton @click="onContinueClick" type="info" class="mt-4 min-w-36">继续添加</NButton>
    </NFlex>
  </NFlex>
</template>

<script lang="ts" setup>
import { inject, ref, Ref } from 'vue';
import { ProviderName, FormOpt, PermGroupType } from '@/enum';

interface Props {
  viewType: PermGroupType
}

const props = withDefaults(defineProps<Props>(), {
});

const formContent = ref();
const isSubmit = ref(false);
let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);

const onFormEvent = (opt: FormOpt) => {
  isSubmit.value = true;
}

const onContinueClick = () => {
  isSubmit.value = false;
}

</script>

<style lang="scss" scoped>
.box-with-shadows {
  /* 添加四边阴影 */
  box-shadow:
    0 10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 底部阴影 */
    0 -10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 顶部阴影 */
    10px 0 10px -5px rgba(0, 0, 0, 0.2),
    /* 右侧阴影 */
    -10px 0 10px -5px rgba(0, 0, 0, 0.2);
  /* 左侧阴影 */
}
</style>
