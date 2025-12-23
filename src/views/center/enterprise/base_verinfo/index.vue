<script setup lang="ts">
import { ref, computed } from 'vue';
// import { $t } from '@/locales';
import { fetchGetEnInfo } from '@/service/api';

const enInfo = ref();

const init = async () => {
  const result = await fetchGetEnInfo();
  result.msg == 'ok' && (enInfo.value = result.data[0])
}

init();

const versionNotification = computed(() => {
  let typeText = '开源免费版';
  return typeText
})

</script>

<template>
  <NFlex vertical>
    <NCard :title="versionNotification" :bordered="false" size="small" segmented class="card-wrapper p-2">
      <NFlex vertical class="mt-6">
        <NFormItem label="版本号" label-placement="left" label-align="left" label-width="100">
          <span class="w-fit">{{ enInfo?.auth?.sysVersion }}</span>
        </NFormItem>
        <NFlex>
          <a href="http://qinbone.com" target="_blank" class="flex items-center nowrap-hidden link">
            <span class="w-fit">请关注官网版本发布信息，升级更新版本获取更多功能</span>
          </a>
        </NFlex>
      </NFlex>
    </NCard>
  </NFlex>
</template>

<style scoped lang="scss">
.link {
  color: #3b82f6; /* 蓝色链接 */
  text-decoration: underline; /* 下划线 */
}

.link:hover {
  color: #2563eb; /* 悬停时更深蓝色 */
  text-decoration: none; /* 可选：悬停时去掉下划线 */
}
</style>
