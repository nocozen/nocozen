<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :show-require-mark="compConfig.required"
    :rule="cptRule">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <template v-if="compConfig.viewPerm">
      <NInputNumber v-model:value="cptFieldValue" :format="formatThousands" :parser="parseThousands"
        :readonly="!compConfig.editPerm" :show-button="showButton" size="small"
        :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable class="w-full"
        :disabled="disabled">
        <template v-if="FormatType.PerNumber == compConfig.formatType" #suffix>%</template>
      </NInputNumber>
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
import { QbIcon } from '@/enum';
import { getShowLink } from './shared';
import { FormatType } from '@/enum';
import { evalFormula, extractVariables } from '@/components/formula-editor/utils/formula';
import { isEmpty } from 'radashi';

interface Props {
  inst?: any,
  i: string,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showButton = ref(false);    // todo: 启用需要增加配置；
const showLink = ref(false);
const isCalculating = ref(false); // 防止循环计算

const cptRule = computed(() => {
  let rule =
    {
      trigger: ['blur', 'input', 'change'],
      validator() {
        if (compConfig.value.required && !layoutConfig?.value.isEditable) {
          if (isEmpty(compConfig.value.defValue) && isEmpty(compConfig.value.fieldValue)) {
            return new Error('必填项不能为空');
          }
        }
        return true;
      }
    } as any
  return rule;
})

// 格式化：数字 → 千分符字符串（如 1234567 → "1,234,567"）
const formatThousands = (value: any) => {
  if (value === null || value === undefined) return '';
  // return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const { decimalPlaces = 0, formatType } = compConfig.value;
  let formatResult = Number(value).toFixed(decimalPlaces);
  if (formatType == FormatType.ThsNumber) {
    const parts = formatResult.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatResult = parts.join('.');
  }
  return formatResult;
};

// 解析：千分符字符串 → 数字（如 "1,234,567" → 1234567）
const parseThousands = (value: any) => {
  if (!value || value.trim() === '') return null;
  // 去除所有非数字和小数点字符（保留最后一个点）
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

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

// 值 绑定
const cptFieldValue = computed({
  get() {
    // 依据pops.inst是否传值来确定数据初始化来源时props.inst 还是直接compConfig.value.fieldValue获取；
    const value = props.inst ? props.inst[compConfig.value.fieldName] : compConfig.value.fieldValue;
    // 如果是字符串数字，转换为 number；否则返回默认值null
    return typeof value === 'string' ? parseFloat(value) || null : value;
  },
  set(newValue) {
    if (props.inst) {
      props.inst[compConfig.value.fieldName] = newValue;
    } else {
      compConfig.value.fieldValue = newValue;
    }
  },
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
      data[fName] = 0;
    } else {
      // 确保读取响应式值
      data[fName] = data[fName] = props.inst ? props.inst[comp?.fieldName] : comp.fieldValue;;
    }
  }
  return data;
};

// 计算公式结果
const calculateFormula = () => {
  if (isCalculating.value || !compConfig.value?.formula) return null;
  isCalculating.value = true;
  try {
    const data = getDependencyValues();
    if (!data) return null;
    const result = evalFormula(
      compConfig.value.formula,
      (text: any) => `['${text}']`,
      data
    );
    return result || null;
  } catch (error) {
    console.error('公式计算失败:', error);
    return null;
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
      dependencies.push(() => comp.fieldValue);
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
          if (compConfig.value.fieldValue !== Number(result)) {
            compConfig.value.fieldValue = Number(result);
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
                props.inst[compConfig.value.fieldName] = Number(result);
              } else {
                compConfig.value.fieldValue = Number(result);
              }
            } else {
              compConfig.value.fieldValue = null;
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

<style lang="scss" scoped>
:deep(.n-input__input-el[style]) {
  text-decoration: none !important;
}
</style>
