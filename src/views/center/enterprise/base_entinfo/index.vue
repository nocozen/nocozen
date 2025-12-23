<script setup lang="ts">
import { computed, ref } from 'vue';
import { fetchGetEnInfo } from '@/service/api';

const enInfo = ref();

const init = async () => {
  const result = await fetchGetEnInfo();
  result.msg == 'ok' && (enInfo.value = result.data[0])
}

init();

const authType = computed(() => {
  let typeText = '⚠️开源免费版';
  return typeText
})

</script>

<template>
  <NFlex vertical>
    <NCard title="企业信息" :bordered="false" size="small" segmented class="card-wrapper p-2">
      <NFlex vertical class="mt-6">
        <NFormItem label="企业简称" label-placement="left" label-align="left" label-width="150">
          <span class="w-fit">{{ enInfo?.name }}</span>
        </NFormItem>
        <NFormItem label="企业全称" label-placement="left" label-align="left" label-width="150">
          <span class="w-fit">{{ enInfo?.fullName }}</span>
        </NFormItem>
        <NFormItem label="企业认证标识" label-placement="left" label-align="left" label-width="150">
          <span class="w-fit">{{ enInfo?.uuid }}</span>
        </NFormItem>
        <NFormItem label="认证类别" label-placement="left" label-align="left" label-width="150">
          <span class="w-fit">{{ authType }}</span>
        </NFormItem>
      </NFlex>
    </NCard>
  </NFlex>
</template>

<style scoped></style>
