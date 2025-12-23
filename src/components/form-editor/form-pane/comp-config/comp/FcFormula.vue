<template>
  <NButton v-if="compConfig && cptConfigButton.edit" class="flex w-full" size="small" @click="onOpenEditor">
    <NFlex class="w-50 flex-1 justify-start">
      <span class="">{{ cptConfigButton.title }}</span>
    </NFlex>
    <SvgIcon :icon="cptConfigButton.icon" />
  </NButton>
  <ButtonIcon v-else size="small" @click="onOpenEditor" level="" :icon="cptConfigButton.icon"
    :title="cptConfigButton.title" />
  <ModalDialog @onOkClick="onOkClick" ref="refModal" title="编辑公式" modal-class="w-200" :footer="true"
    :buttons="['cancel', 'ok']">
    <NFlex class="p-4">
      <FormulaEditor ref="refFmEditor" :formula="compConfig.formula" :title="compConfig.title" :variables="variables" />
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import FormulaEditor from '@/components/formula-editor';
import { InputType, InputTypeCn, FormElType } from '@/enum';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { validateFormula } from '@/components/formula-editor/utils/formula';
import { useNotification } from 'naive-ui';

interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'updateConfig'): void;
}

const emit = defineEmits<Emits>();
const notification = useNotification()
const { updateCompConfig, compConfigs } = useModuleInject();
const refModal = ref();
const variables = ref([] as any)
const compConfig = ref();
const refFmEditor = ref();

const getInputTypeBy = (type: string) => {
  switch (type) {
    case FormElType.FeText:
    case FormElType.FeTextArea:
    case FormElType.FeMobileNumber:
    case FormElType.FeSequenceId:
    case FormElType.FeSelect:
    case FormElType.FeRadioGroup:
    case FormElType.FeDeptSelect:
    case FormElType.FeUserSelect:
    case FormElType.FeMulSelect:
    case FormElType.FeCheckboxGroup:
    case FormElType.FeMulDeptSelect:
    case FormElType.FeMulUserSelect:
      return InputType.Text;
    case FormElType.FeNumber:
      return InputType.Number;
    case FormElType.FeDatetime:
      return InputType.Timestamp;
    default:
      return null;
  }
}

const init = () => {
  variables.value = compConfigs?.map((cp: Meta.CompBase) => ({
    label: cp.title,
    value: cp.fieldName,
    type: getInputTypeBy(cp.type)
  })).filter((v: any) => v.type != null && v.value != compConfig.value.fieldName)
}

const cptCompConfig = computed(() => {
  return compConfigs?.find((item: any) => item.i == props.i);
})

watch(
  () => cptCompConfig,        // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue.value) {
      compConfig.value = newValue.value;
      init();
    }
  },
  { immediate: true, deep: true }
);

const cptConfigButton = computed(() => {
  if (compConfig.value.formula) {
    return {
      edit: true,
      title: '修改公式',
      icon: 'lucide--edit'
    }
  } else {
    return {
      edit: false,
      title: '编辑公式',
      icon: 'fluent--math-formula-24-filled'
    }
  }
})

const onOpenEditor = () => {
  refModal.value.show(true);
}
const onOkClick = () => {
  if (refFmEditor.value) {
    const formula = refFmEditor.value.getFormulaValue();
    // 校验是否合法
    const check = validateFormula(formula, (text: any) => {
      return `['${text}']`
    });
    if (check.valid) {
      compConfig.value.formula = formula;
      formula && emit('updateConfig');
      refModal.value.show(false);
    } else {
      notification['error']({
        // title: '出错了',
        content: check.error,
        duration: 3000,
        keepAliveOnHover: true
      })
    }

  }
}
</script>