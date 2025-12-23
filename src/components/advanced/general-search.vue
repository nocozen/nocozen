<template>
  <NInputGroup  class="w-60 h-6">
    <NPopselect  v-model:value="selectValue" :options="options" @update:value="onSelect" trigger="click">
      <NButton size="small" round>{{ selectOption && selectOption.label }}</NButton>
    </NPopselect>
    <NFlex class="w-40">
      <NInput size="small" round></NInput>
    </NFlex>
  </NInputGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectValue = ref('0');
const selectOption = ref({ key: '0', label: '全文搜索' })
const options = ref([
  { key: '0', label: '全文搜索' },
  { key: '1', label: '请假流程' },
  { key: '2', label: '人事流程' },
]);


const onSelect = (value: string, option: any) => {
  selectOption.value = option;
}

</script>