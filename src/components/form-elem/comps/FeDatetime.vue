<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :show-require-mark="compConfig.required">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>

    <template v-if="compConfig.viewPerm">
      <NDatePicker class="w-full" v-model:value="currDateValue" @update:value="dateUpdate" :type="compConfig.formatType"
        size="small" :disabled="disabled"/>
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
import { FieldBindType, FormatType } from '@/enum';
import { QbIcon } from '@/enum';
import { getShowLink } from './shared';
import dayjs from 'dayjs';
import { evalFormula, extractVariables } from '@/components/formula-editor/utils/formula';

interface Props {
  inst?: any,
  i: string,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);

const currDateValue = ref();   // 日期绑定值
const isCalculating = ref(false); // 防止循环计算

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

// 日期值更新
const dateUpdate = (value: any, formattedValue?: any) => {
  if (props.inst) {
    props.inst[compConfig.value.fieldName] = value;
  } else {
    compConfig.value.fieldValue = value;
  }
}

const init = (config: Meta.CompConfig) => {
  showLink.value = getShowLink(config);
  // 日期值初始化
  let dataValue = props.inst ? props.inst[compConfig.value.fieldName] : config.fieldValue;

  if (!dataValue) {
    if (config.defValueType == FieldBindType.CurrentValue) {
      dataValue = Date.now();
    } else if (config.defValueType == FieldBindType.Custom) {
      config.defValue && (dataValue = config.defValue);
    }
  }

  if (typeof dataValue == 'string') {
    dataValue = dayjs(dataValue).valueOf();   // 日期字符串转时间戳
  }
  currDateValue.value = dataValue;
  dateUpdate(dataValue)
}

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
      data[fName] = props.inst ? props.inst[comp?.fieldName] : comp.fieldValue;;
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
      dependencies.push(() => comp.fieldValue || null);
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
          if (compConfig.value.fieldValue !== dayjs(result).valueOf()) {
            compConfig.value.fieldValue = dayjs(result).valueOf();
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
        try {
          init(compConfig.value);
          // 设置公式监听器
          setupFormulaWatcher();
          // 如果当前组件有公式，立即计算一次
          if (comp.formula) {
            nextTick(() => {
              const result = calculateFormula();
              if (result !== null) {
                // compConfig.value.defValue = String(result);
                if (props.inst) {
                  props.inst[compConfig.value.fieldName] = dayjs(result).valueOf();
                } else {
                  compConfig.value.fieldValue = dayjs(result).valueOf();
                }
              } else {
                compConfig.value.fieldValue = null;
              }
            });
          }
        } catch (e: any) {
          console.log('公式计算出错：' + e.message)
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
