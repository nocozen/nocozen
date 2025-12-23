<template>
  <span class="font-semibold">格式</span>
  <NSelect v-model:value="selectedValue" @update:value="onUpdateValue" size="small" placeholder=""
    :options="cptFormatTypes"></NSelect>
  <NFlex class="w-full" align="center"
    v-if="[FormatType.Number, FormatType.ThsNumber, FormatType.PerNumber].includes(selectedValue as FormatType)">
    <NInputNumber v-model:value="currDecimalPlaces" @update-value="updateDecimalPlaces" class="flex-1" :min="0" :max="10" size="small" />
    <span class="w-20">(保留小数位)</span>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { FormatType, FormElType } from '@/enum';

interface Props {
  optionType: string,
  value: string | undefined,
  decimalPlaces: number | null
}

const props = withDefaults(defineProps<Props>(), {
  optionType: FormElType.FeText,
  decimalPlaces: null
});

interface Emits {
  (e: 'update:value', value: string): void;
  (e: 'update:decimalPlaces', value: number | null): void;
}

const emit = defineEmits<Emits>();

const formatTypes = ref([] as any);
const selectedValue = ref();

const textFormat = [
  {
    label: '无',
    value: FormatType.None
  },
  {
    label: '手机号码',
    value: FormatType.MobilePhone
  },
  {
    label: '电话号码',
    value: FormatType.WiredPhone
  },
  {
    label: '邮编',
    value: FormatType.ZipCode
  },
  {
    label: '身份证号',
    value: FormatType.IdCard
  },
  {
    label: '邮箱',
    value: FormatType.Email
  },
];
const numberFormat = [
  {
    label: '数值',
    value: FormatType.Number
  },
  {
    label: '数值(千分符)',
    value: FormatType.ThsNumber
  },
  {
    label: '百分比',
    value: FormatType.PerNumber
  },
]
const dataFormat = [
  {
    label: '年-月',
    value: FormatType.Month
  },
  {
    label: '年-月-日',
    value: FormatType.Date
  },
  {
    label: '年-月-日-时:分:秒',
    value: FormatType.Datetime
  },
]

const cptFormatTypes = computed(() => {
  if (props.value) {
    selectedValue.value = props.value;
  }
  if (FormElType.FeText == props.optionType) {
    formatTypes.value = textFormat;
    if (!props.value) {
      selectedValue.value = FormatType.None;
    }
  } else if (FormElType.FeNumber == props.optionType) {
    formatTypes.value = numberFormat;
    if (!props.value) {
      selectedValue.value = FormatType.Number;
    }
  } else if (FormElType.FeDatetime == props.optionType) {
    formatTypes.value = dataFormat;
    if (!props.value) {
      selectedValue.value = FormatType.Date;
    }
  }
  return formatTypes.value
})

const currDecimalPlaces = computed({
  get() {
    return props.decimalPlaces;
  },
  set(value) {
    emit('update:decimalPlaces', value);
  }
});

const updateDecimalPlaces = (value: any) => {
  emit('update:decimalPlaces', value)
}

const onUpdateValue = (value: string, option: any) => {
  emit('update:value', value)
}
</script>