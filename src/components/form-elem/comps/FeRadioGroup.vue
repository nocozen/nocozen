<template>
  <NFormItem :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign" :show-feedback="false"
    :readonly="true" :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" class="h-full">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <NFlex :vertical="compConfig.listVertical" v-if="multiple" class="absolute inset-0">
      <SmoothScrollbar class="h-full mt-1">
        <NCheckboxGroup v-if="compConfig.viewPerm" v-model:value="selectedValues" @update-value="onUpdateCheckbox"
          :key="insUid" :disabled="disabled">
          <NCheckbox v-for="(item, index) in compConfig.listItems" :key="insUid + item.value" :value="item.value"
            size="small" :disabled="disabled">{{ item.label }}</NCheckbox>
        </NCheckboxGroup>
        <NInput v-else size="small" placeholder="" :disabled="true">
          <template #prefix>
            <SvgIcon icon="mingcute--lock-line" />
          </template>
        </NInput>
      </SmoothScrollbar>
    </NFlex>
    <NFlex :vertical="compConfig.listVertical" v-else class="absolute inset-0">
      <SmoothScrollbar class="h-full mt-1">
        <NRadioGroup v-if="compConfig.viewPerm" v-model:value="selectedValues" @update-value="onUpdateRadio"
          :key="insUid" :disabled="disabled">
          <NRadio v-for="item in compConfig.listItems" :key="insUid + item.value" :value="item.value" size="small"
            :disabled="disabled">
            {{ item.label }}</NRadio>
        </NRadioGroup>
        <NInput v-else size="small" placeholder="" :disabled="true">
          <template #prefix>
            <SvgIcon icon="mingcute--lock-line" />
          </template>
        </NInput>
      </SmoothScrollbar>
    </NFlex>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch, toRaw, nextTick } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { QbIcon } from '@/enum';
import { getShowLink } from './shared';
import Uid from '@/utils/uid';

interface Props {
  i: string,
  multiple?: boolean,
  inst?: any
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false
});

interface Emits {
  (e: 'update:items', items: Array<Meta.ListItem>): void;
}

const emit = defineEmits<Emits>();
const insUid = ref(Uid.NextNumber());

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any)

const selectedValues = ref();
const showLink = ref(false);

const onUpdateRadio = (value: string | number | boolean) => {
  if (props.inst) {
    props.inst[compConfig.value.fieldName] = {
      uid: value,
      name: compConfig.value.listItems.find((v: any) => v.value == value).label
    };
  } else {
    compConfig.value.fieldValue = {
      uid: value,
      name: compConfig.value.listItems.find((v: any) => v.value == value).label
    }
  }
}

const onUpdateCheckbox = (values: Array<string | number>, meta: { actionType: 'check' | 'uncheck', value: string | number }) => {
  if (props.inst) {
    props.inst[compConfig.value.fieldName] = compConfig.value.listItems.filter((l: any) => values.includes(l.value))
      .map((v: any) => ({ uid: v.value, name: v.label }));
  } else {
    compConfig.value.fieldValue = compConfig.value.listItems.filter((l: any) => values.includes(l.value))
      .map((v: any) => ({ uid: v.value, name: v.label }));
  }

}

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

const initOption = () => {
  if (props.inst) {
    compConfig.value.fieldValue = toRaw(props.inst[compConfig.value.fieldName]);
  } else {
    compConfig.value.fieldValue = toRaw(compConfig.value.fieldValue);
  }
  if (compConfig.value.fieldValue === null || (Array.isArray(compConfig.value.fieldValue) && compConfig.value.fieldValue?.length === 0)) { // 无值，且配置有默认值，赋默认值
    const selectItems = compConfig.value.listItems.filter((v: Meta.ListItem) => v.selected).map((v: Meta.ListItem) => ({ uid: v.value, name: v.label }));
    const selectValues = compConfig.value.listItems.filter((v: Meta.ListItem) => v.selected).map((v: Meta.ListItem) => v.value);
    if (props.multiple) { // 多选时checkbox
      // 多选，设置默认值
      if (selectItems?.length > 0) {
        selectedValues.value = selectValues;  // 字符串数组
        compConfig.value.fieldValue = selectItems;    // 值：对象数组
      }
    } else {    // 单选时radiobox
      // 单选，设置默认值
      if (selectItems?.length > 0) {
        selectedValues.value = selectValues[0];  // 字符串数组
        compConfig.value.fieldValue = selectItems[0];   // 值对象；selectItems为数组
      }
    }
  } else { // 有值初始化值
    if (props.multiple) {
      selectedValues.value = compConfig.value.fieldValue.map((f: any) => f.uid);  //  值：对象数组
    } else {
      selectedValues.value = compConfig.value.fieldValue?.uid;    // 值：对象
    }
  }
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
        nextTick(() => {
          initOption();
          // console.log(compConfigs)
        })
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);




</script>

<style lang="scss" scoped></style>
