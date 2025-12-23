<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :rule="rule"
    :show-require-mark="compConfig.required" feedback-class="mt-0!">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <template v-if="compConfig.viewPerm">
      <NInput v-if="inst" v-model:value="inst[compConfig.fieldName]"  style="margin-top: 3px" type="textarea"
        :autosize="false" :maxlength="500" :readonly="!compConfig.editPerm"  :disabled="disabled" size="small" :style="`height: ${height}px`"
        :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable />
      <NInput v-else v-model:value="compConfig.fieldValue" style="margin-top: 3px;" type="textarea" :autosize="false"
        :style="`height: ${height}px`" :maxlength="500" :readonly="!compConfig.editPerm"  :disabled="disabled" size="small"
        :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable />
    </template>
    <NInput v-else style="margin-top: 3px" type="textarea" :autosize="false" :maxlength="500"
      :style="`height: ${height}px`" size="small" placeholder="" :disabled="true">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch, unref, nextTick, watchEffect } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { QbIcon } from '@/enum';
import { getShowLink } from './shared';
import { evalFormula, extractVariables } from '@/components/formula-editor/utils/formula';
import { isEmpty } from 'radashi';

interface Props {
  inst?: any,
  i: string,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutNodes, layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);
const defHeight = 80;
const height = ref(defHeight);
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

const rule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator() {
      if (compConfig.value.required && !layoutConfig?.value.isEditable) {
        if (isEmpty(compConfig.value.defValue) && isEmpty(compConfig.value.fieldValue)) {
          return new Error('必填项不能为空');
        }
      }
    }
  }
})

const init = (config: Meta.CompConfig) => {
  showLink.value = getShowLink(config);
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
      data[fName] = data[fName] = props.inst ? props.inst[comp?.fieldName] : comp.fieldValue;
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

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
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

const cptCompLayout = computed(() => {
  let h = layoutNodes?.find((node: any) => node.uid == compConfig.value.nodeUid)?.layout.find((item: any) => item.i == props.i)?.h;
  return h ? h : 3;
})

watch(
  () => cptCompLayout,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue) {
      height.value = newValue.value * layoutConfig!.value.rowHeight - 20;
    }
  },
  { immediate: true, deep: true }
);

</script>

<style lang="scss" scoped>
:deep(.n-input.n-input--textarea.n-input--resizable .n-input-wrapper) {
  resize: none;
}
</style>
