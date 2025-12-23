<template>
  <ModalDialog @onCompleteClick="onCompleteClick" ref="refModal" title="数据格式" modal-class="w-100" :footer="true"
    :buttons="['complete']">
    <NFlex vertical class="p-8 w-full h-60">
      <NRadioGroup class="flex-1" v-model:value="selectedValues">
        <NRadio :key="NumFormatType.Number" :value="NumFormatType.Number" class="w-25" label="数值"/>
        <NRadio :key="NumFormatType.Percent" :value="NumFormatType.Percent" label="百分比"/>
      </NRadioGroup>
      <NCheckbox v-model:checked="separatorChecked" class="flex-1">千分符</NCheckbox>
      <NFlex class="flex-1">
        <span class="w-20">小数位</span>
        <NInputNumber v-model:value="decimalValue" :min="0" :max="10" size="small" class="flex-1"/>
      </NFlex>
      <NFlex class="flex-1">
        <span class="w-20">数量单位</span>
        <NSelect v-model:value="unitNameValue" :options="unitNameOptions" size="small" class="h-fit flex-1"/>
      </NFlex>
      <NFlex class="flex-1">
        <span class="w-20">单位后缀</span>
        <NInput v-model:value="unitSuffixValue" size="small" class="h-fit flex-1" :maxlength="100"/>
      </NFlex>
      <NFlex class="flex-1">
        <span class="w-20">示例：</span><span>{{ cptDemoString }}</span>
      </NFlex>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NumFormatType } from '@/enum/biMeta';

interface Emits {
  (e: 'update'): void,
}

const emit = defineEmits<Emits>()

const refModal = ref();
const selectedValues = ref(NumFormatType.Number);
const separatorChecked = ref(true);
const decimalValue = ref(0);
const unitSuffixValue = ref(null);  // 单位后缀：纯文本展示，数字无关；
const unitNameValue = ref();        // 数量单位：需要数字10进制换算；
const unitNameOptions = ref([
  { label: '无', value: '无'},
  { label: '千', value: '千'},
  { label: '万', value: '万'},
  { label: '百万', value: '百万'},
  { label: '亿', value: '亿'},
])

const cptDemoString = computed(() => {
  let result = '';
  let num = 9999999;
  let decimal = '.6666666666';    // dot.slice(0, 3);
  decimalValue.value > 0 && (result = decimal.slice(0, decimalValue.value + 1));
  selectedValues.value == NumFormatType.Percent && (result = '%' + result);
  if (separatorChecked.value) {
    result = num.toLocaleString('en-US') + result
  } else { 
    result = num + result;
  }
  unitSuffixValue.value && (result = result + unitSuffixValue.value);
  return result;
})
const onCompleteClick = () => {
  refModal.value.show(false);
}

const show = (meta: Meta.DropItem) => {
  console.log(meta)
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>