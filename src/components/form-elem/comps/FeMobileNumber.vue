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
      <NInput v-if="inst" v-model:value="inst[compConfig.fieldName]" :maxlength="500" size="small"
        :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable>
        <template #prefix>
          <SvgIcon icon="mdi:mobile-phone-text" class="text-gray" />
        </template>
      </NInput>
      <NInput v-else v-model:value="compConfig.fieldValue" :maxlength="500" size="small"
        :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" clearable>
        <template #prefix>
          <SvgIcon icon="mdi:mobile-phone-text" class="text-gray" />
        </template>
      </NInput>
    </template>
    <NInput v-else size="small" placeholder="" :disabled="true">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { QbIcon, FormatType } from '@/enum';
import { getShowLink } from './shared';
import { REG_PHONE } from '@/constants/reg';

interface Props {
  inst?: any,
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);

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

const cptRule = computed(() => {
  return {
    required: true,
    validator: (rule: any, value: any) => {
      if (compConfig.value.required && !compConfig.value.fieldValue) {
        return new Error('必填项不能为空')
      }
      if (compConfig.value.fieldValue && !REG_PHONE.test(compConfig.value.fieldValue)) {
        return new Error('输入格式不正确');
      }
      return true;
    },
    trigger: ['blur', 'input', 'change'],
  };
})

const init = (config: Meta.CompConfig) => {
  showLink.value = getShowLink(config);
}


// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        showLink.value = getShowLink(comp as Meta.FormComp); // 同步更新关联数据
        init(compConfig.value);
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);


</script>

<style lang="scss" scoped></style>
