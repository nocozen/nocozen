<template>
  <NFlex vertical class="text-xs w-full mb-2  pt-2">
    <NFlex class="px-1" align="center" :size="0" justify="space-between">
      <NFlex :size="0" align="center">
        <SvgIcon icon="ic--round-keyboard-double-arrow-up" class="text-sm mr-1" />
        <span class="text-xs font-semibold">{{ info.nodeName }}</span>
      </NFlex>
      <span v-if="!info.nodeComplete" class="text-xs text-blue">进行中</span>
      <span v-if="info.nodeComplete" class="text-xs">{{ dayjs(info.nodeCompleteAt).format('YYYY-MM-DD HH:mm:ss')
      }}</span>
    </NFlex>
    <NFlex vertical class="bg-white rounded-md p-2">
      <NFlex class="border-b-1 border-gray-100 py-1" justify="space-between">
        <span class="text-xs">{{ info.executor.name }}</span><span class="text-xs">{{ TaskOptNames[info.status]
        }}</span>
      </NFlex>
      <span class="text-xs">{{ info.opinion }}</span>
      <!-- <NFlex>
        <span class="text-xs">任务开始:</span><span class="text-xs">{{ dayjs(info.createAt).format('YYYY-MM-DD HH:mm:ss')
          }}</span>
      </NFlex> -->
      <NFlex>
        <span class="text-xs">操作时间：{{ dayjs(info.updateAt).format('YYYY-MM-DD HH:mm:ss')}}</span>
      </NFlex>
      <NFlex v-if="info.nodeExecStatus == 'warning'">
        <span class="text-xs" :style="{color: themeVars.warningColor}">警告：{{ info.nodeExecMsg }}</span>
      </NFlex>
      <NFlex v-if="info.nodeExecStatus == 'error'">
        <span class="text-xs" :style="{color: themeVars.errorColor}">错误：{{ info.nodeExecMsg }}</span>
      </NFlex>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { TaskOptNames } from '@/enum';
import dayjs from 'dayjs';
import { useThemeVars } from 'naive-ui';

const themeVars = useThemeVars();

interface Props {
  info: any;
}

const props = defineProps<Props>();

</script>