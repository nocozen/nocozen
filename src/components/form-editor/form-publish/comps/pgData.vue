<template>
  <NFlex vertical class="h-fit">
    <NFlex align="center">
      <span>筛选符合以下</span>
      <NDropdown trigger="click" :options="filterOptions" @select="filterSelect">
        <NButton size="small" class="text-gray">{{ currOption.label }}
          <SvgIcon icon="mdi:chevron-down" class="ml-1 text-base text-gray"/>
        </NButton>
      </NDropdown>
      <span>条件的数据</span>
    </NFlex>
    <NFlex vertical class="w-full">
      <ButtonIcon class="w-20 px-0" size="small" icon="mdi:plus" title="添加过滤" type="info"></ButtonIcon>
      <NFlex class="w-full">
        <NSelect class="w-35" size="small"></NSelect>
        <NDropdown trigger="click" :options="filterOptions" @select="filterSelect">
          <NButton size="small" class="text-gray w-22">{{ currOption.label }}
            <SvgIcon icon="mdi:chevron-down" class="ml-1 text-base text-gray"/>
          </NButton>
        </NDropdown>
        <NSelect class="w-35" size="small"></NSelect>
      </NFlex>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  permGroup: Meta.ModulePermGroup
}

const props = withDefaults(defineProps<Props>(), {
})

const currPg = ref<Meta.ModulePermGroup>({} as any);

const init = () => {
  currPg.value = props.permGroup;
}

init();

const currOption = ref({ label: '所有', value: 'and' });
const filterOptions = [
  { label: '所有', key: 'and' },
  { label: '任一', key: 'or' }
]

const filterSelect = (key: string | number, option: any) => {
  currOption.value = option
  console.log(option)
}

</script>
