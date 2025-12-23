<template>
  <span class="font-semibold">默认值</span>
  <NSelect v-model:value="selectedType" @update:value="onUpdateType" size="small" placeholder="" :options="options"/>
  <NInput v-if="'custom' == type" :value="value" @update:value="onUpdateValue" size="small"></NInput>
</template>


<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { FieldBindType, FormElType } from '@/enum';

interface Props {
  optionType: string,
  type: string | undefined,
  value: any,
}

const props = withDefaults(defineProps<Props>(), {
  type: 'custom'
});


interface Emits {
  (e: 'update:type', type: string): void;
  (e: 'update:value', value: any): void;
}

const emit = defineEmits<Emits>();

const selectedType = ref(props.type);
// const defValue = ref(props.value)
// todo: 日期 自定义：绑定日期组件
const dateOptions = [
  {
    label: '填写时',
    value: FieldBindType.CurrentValue
  },
  // {
  //   label: '自定义',
  //   value: FieldBindType.Custom
  // },
  {
    label: '数据联动',
    value: FieldBindType.Cascade
  },
  {
    label: '公式编辑',
    value: FieldBindType.Formula
  },
] as any;
const defOptions = [
  {
    label: '自定义',
    value: FieldBindType.Custom
  },
  {
    label: '数据联动',
    value: FieldBindType.Cascade
  },
  {
    label: '公式编辑',
    value: FieldBindType.Formula
  },
] as any;
let options = ref(defOptions);

watchEffect(() => {
  // 只在初始化时设置默认值，避免循环
  if (props.optionType === FormElType.FeDatetime) {
    options.value = dateOptions;
  } else {
    options.value = defOptions
  }
  selectedType.value = props.type;
});

const onUpdateType = (type: string, option: any) => {
  emit('update:type', type)
}

const onUpdateValue = (value: any, option: any) => {
  emit('update:value', value)
}


</script>