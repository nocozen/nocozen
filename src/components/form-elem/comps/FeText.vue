<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :rule="cptRule"
    :show-require-mark="compConfig.required">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <template v-if="compConfig.viewPerm">
      <NInput ref="refInput1" v-if="inst" v-model:value="inst[compConfig.fieldName]" :readonly="!compConfig.editPerm" :disabled="disabled"
        :maxlength="500" size="small" :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable />
      <NInput ref="refInput2" v-else v-model:value="compConfig.fieldValue" :readonly="!compConfig.editPerm" :disabled="disabled"
        :maxlength="500" size="small" :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable />
    </template>
    <NInput v-else size="small" placeholder="" :disabled="true">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, nextTick } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { QbIcon, FormatType, FormElType } from '@/enum';
import { getShowLink } from './shared';
import { REG_EMAIL, REG_PHONE, ZIP_CODE_CN, IDCARD, WIRED_PHONE } from '@/constants/reg';
import { $t } from '@/locales';
import { evalFormula, extractVariables } from '@/components/formula-editor/utils/formula';
import { isEmpty } from 'radashi';
import { FormItemRule } from 'naive-ui';

interface Props {
  inst?: any,
  i: string,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
});

const refInput1 = ref();
const refInput2 = ref();
const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);
const isCalculating = ref(false); // 防止循环计算

const PatternRules = {
  [FormatType.MobilePhone]: REG_PHONE,
  [FormatType.WiredPhone]: WIRED_PHONE,
  [FormatType.Email]: REG_EMAIL,
  [FormatType.IdCard]: IDCARD,
  [FormatType.ZipCode]: ZIP_CODE_CN
} as any;

const cptLabelWidth = computed(() => {
  if (layoutConfig?.value.labelWidthType == 'auto') {
    return 'auto';
  } else {
    return layoutConfig?.value.labelWidth;
  }
})

const cptLabelAlign = computed(() => {
  if (layoutConfig?.value.labelPlace == 'top') {
    return 'start';
  } else {
    if (layoutConfig?.value.labelAlign == 'left') {
      return 'start';
    } else {
      return 'end'
    }
  }
})

const cptRule = computed<FormItemRule>(() => {
  const { required, defValue, fieldValue, formatType } = compConfig.value;

  const validator = () => {
    if (layoutConfig?.value.isEditable) {
      return Promise.resolve();
    }
    if (required && isEmpty(defValue) && isEmpty(fieldValue)) {
      return Promise.reject('必填项不能为空');
    }
    if (fieldValue && formatType && formatType !== FormatType.None) {
      const pattern = PatternRules[formatType];
      if (pattern && !pattern.test(fieldValue)) {
        return Promise.reject('输入格式不正确');
      }
    }
    return Promise.resolve();
  };

  return {
    validator,
    trigger: ['blur', 'input', 'change'],
  };
});

// 获取依赖字段的值
const getDependencyValues = () => {
  if (!compConfig.value?.formula) return null;
  const fieldNames = extractVariables(compConfig.value.formula);
  const data: Record<string, any> = {};
  for (const fName of fieldNames) {
    const fi = fName.split('_')[2];
    const comp = compConfigs?.find((item: any) => item.i === fi);
    if (!comp) {
      data[fName] = '';
    } else {
      // 确保读取响应式值
      data[fName] = props.inst ? props.inst[comp?.fieldName] : comp.fieldValue;
    }
  }
  return data;
};

// 计算公式结果
const calculateFormula = () => {
  if (isCalculating.value || !compConfig.value?.formula) return '';
  isCalculating.value = true;
  try {
    const data = getDependencyValues();
    if (!data) return '';
    const result = evalFormula(
      compConfig.value.formula,
      (text: any) => `['${text}']`,
      data
    );
    return result || '';
  } catch (error) {
    console.error('公式计算失败:', error);
    return '';
  } finally {
    // 使用 nextTick 确保在下一次事件循环中重置标志
    nextTick(() => {
      isCalculating.value = false;
    });
  }
};

// 监听依赖字段的变化
const setupFormulaWatcher = () => {
  if (!compConfig.value?.formula) return;
  const fieldNames = extractVariables(compConfig.value.formula);
  const dependencies: Array<() => any> = [];
  // 为每个依赖字段创建监听函数
  for (const fName of fieldNames) {
    const fi = fName.split('_')[2];
    const comp = compConfigs?.find((item: any) => item.i === fi);
    if (comp) {
      dependencies.push(() => comp.fieldValue || '');
    }
  }
  // 监听所有依赖字段的变化
  if (dependencies?.length > 0) {
    watch(
      dependencies,
      () => {
        if (isCalculating.value) return;
        const result = calculateFormula();
        if (result !== null && compConfig.value) {
          // 避免循环更新：只有当值真正改变时才更新
          if (compConfig.value.fieldValue !== String(result)) {
            compConfig.value.fieldValue = String(result);
            // compConfig.value.fieldValue = String(result);
          }
        }
      },
      { deep: true }
    );
  }
};

// 主要监听函数 - 监听配置变化
watch(
  () => [props.i, compConfigs],
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: any) => item.i === newI);
      if (comp) {
        compConfig.value = comp;
        showLink.value = getShowLink(comp as Meta.FormComp);
        // 设置公式监听器
        setupFormulaWatcher();
        // 如果当前组件有公式，立即计算一次
        if (comp.formula) {
          nextTick(() => {
            const result = calculateFormula();
            if (result !== null) {
              // compConfig.value.defValue = String(result);
              if (props.inst) {
                props.inst[compConfig.value.fieldName] = String(result);
              } else {
                compConfig.value.fieldValue = String(result);
              }
            }
          });
        }
      }
    }
  },
  { immediate: true, deep: true }
);

// 移除可能导致循环的监听器，只保留必要的初始化逻辑
watchEffect(() => {
  // 只在初始化时设置默认值，避免循环
  compConfig.value.fieldValue = compConfig.value.defValue;
});

</script>

<style lang="scss" scoped></style>