<template>
  <NFlex ref="container" class="w-full h-full" align="center" justify="center" :size="0">
    <template v-if="options.dataset?.length == 1 && options.dataset[0]?.length == 2">
      <p ref="refText" class="truncate opacity-0 animate-[fadeIn_0.3s_forwards]" :style="{
        'font-size': `${bestFontSize}px`,
        color: ColorGroups.Default[0],
        'line-height': '0.9',  // 调整行高
        'transform': 'translateY(-5px)'  // 微调位置
      }">
        {{ options.dataset[0][1] }}
      </p>
    </template>
    <template v-else-if="options.dataset?.length == 1 && options.dataset[0]?.length > 2">
      <NFlex class="w-full h-full px-2 opacity-0 animate-[fadeIn_0.3s_forwards]" align="center" justify="center"
        :size="0">
        <span ref="refText" :style="{ 'font-size': `${bestFontSize}px` }" class="w-full flex-center gap-4 truncate">
          <template v-for="(d, index) in options.dataset[0].slice(1)" :key="d">
            <p class="flex">{{ config.metrics[index].label + ":" }}</p>
            <p :style="{ color: ColorGroups.Default[index as number] }">{{ d }}</p>
          </template>
        </span>
      </NFlex>
    </template>
    <template v-else-if="options.dataset?.length > 1">
      <SmoothScrollbar :style="{ height: listHeight + 'px' }">
        <NFlex :style="{ height: listHeight + 'px' }" class="w-full px-2" align="center" :size="0">
          <template v-for="(m, index) in options.dataset[0]">
            <NFlex vertical class="flex-1 h-full opacity-0 animate-[fadeIn_0.3s_forwards]" align="start"
              justify="space-between">
              <template v-for="d in options.dataset">
                <NFlex :key="d" v-if="index == 0" class="flex-1 min-h-[24px] ml-2" align="start" justify="space-between"
                  :size="0">
                  {{ d[0].split(options.axis.dimSplit).join("") }}
                </NFlex>
                <NFlex :key="d" v-if="index as number > 0" class="flex-1 min-h-[24px] ml-2" align="start" justify="space-between"
                  :size="0">
                  {{ getLabel(index as number - 1) }}
                  <NTag size="small" round
                    :color="{ textColor: ColorGroups.Default[index as number - 1], borderColor: ColorGroups.Default[index as number - 1] }">
                    {{ + d[index] }}
                  </NTag>
                </NFlex>
              </template>
            </NFlex>
          </template>
        </NFlex>
      </SmoothScrollbar>
    </template>
  </NFlex>
</template>

<script setup lang="ts">
import { watch, ref, nextTick, computed } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { debounce } from 'radashi';
import { ColorGroups } from '@/enum/biMeta';

interface Props {
  config?: any,
  options: any,
}

const props = withDefaults(defineProps<Props>(), {});

const container = ref();
const refText = ref();

// 配置参数
const minFontSize = 12;
const maxFontSize = 100;
const bestFontSize = ref(12);
const padding = 30;
const ratio = 0.5;
const listHeight = ref(100);

// 计算当前显示模式
const displayMode = computed(() => {
  const dataset = props.options.dataset;
  if (!dataset?.length) return 'empty';

  if (dataset.length === 1) {
    if (dataset[0].length === 2) return 'single-value';
    if (dataset[0].length > 2) return 'multi-value';
  }

  if (dataset.length > 1) return 'multi-row';

  return 'empty';
});

// 是否需要字体计算（只在特定模式下）
const needFontCalculation = computed(() => {
  return displayMode.value === 'single-value' || displayMode.value === 'multi-value';
});

const getLabel = (index: number) => {
  return props.config.metrics!?.length > 0
    ? props.config.metrics![index] && props.config.metrics![index].label + "："
    : '';
};

// 优化的字体计算函数
const calculateOptimalFontSize = (width: number, height: number) => {
  if (!refText.value || !needFontCalculation.value) return;

  // 处理一条记录多个指标间隔空间
  let newWidth = width;
  if (displayMode.value === 'multi-value') {
    newWidth = width - 34 * (props.config.metrics?.length - 1 || 0);
  }

  // 获取容器实际可用尺寸
  const containerWidth = newWidth - padding;
  const containerHeight = height - padding * 0.5;

  // 创建测量元素
  const measureSpan = document.createElement('span');
  measureSpan.style.visibility = 'hidden';
  measureSpan.style.whiteSpace = 'nowrap';
  measureSpan.style.position = 'absolute';
  measureSpan.style.fontFamily = getComputedStyle(refText.value).fontFamily || 'inherit';
  measureSpan.style.fontWeight = getComputedStyle(refText.value).fontWeight || 'normal';
  measureSpan.textContent = refText.value.textContent || '';

  document.body.appendChild(measureSpan);

  // 二分查找算法
  let low = minFontSize;
  let high = maxFontSize;
  let bestSize = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    measureSpan.style.fontSize = `${mid}px`;

    const textWidth = measureSpan.offsetWidth;
    const textHeight = measureSpan.offsetHeight;

    const widthFit = textWidth <= containerWidth;
    const heightFit = textHeight <= containerHeight;
    const hybridFit = (textWidth / containerWidth) * ratio + (textHeight / containerHeight) * (1 - ratio) <= 1;

    if (widthFit && heightFit && hybridFit) {
      bestSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  document.body.removeChild(measureSpan);

  // 应用字体大小
  if (bestSize !== bestFontSize.value) {
    bestFontSize.value = bestSize;
  }
};

// 防抖更新函数
const updateFontSize = debounce({ delay: 100 }, (width: number, height: number) => {
  if (!needFontCalculation.value) return;

  nextTick(() => {
    calculateOptimalFontSize(width, height);
  });
});

// 监听容器尺寸变化
useResizeObserver(container, (entries) => {
  const entry = entries[0].contentRect;
  listHeight.value = entry.height - 20;

  if (needFontCalculation.value) {
    updateFontSize(entry.width, entry.height);
  }
});

// 优化后的数据监听
watch(
  () => [props.options.dataHeader, displayMode.value],
  () => {
    if (!needFontCalculation.value) return;

    nextTick(() => {
      if (container.value) {
        const { width, height } = container.value.$el.getBoundingClientRect();
        updateFontSize(width, height);
      }
    });
  },
  { immediate: true, deep: true }
);

// 添加样式防止容器溢出
const containerStyle = computed(() => ({
  overflow: 'hidden',
  minHeight: '0px' // 防止flex布局溢出
}));
</script>

<style lang="scss" scoped>
// 确保容器不会溢出
.w-full.h-full {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

// 文本容器防止溢出
.truncate {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flex-center {
  min-width: 0;
  flex-shrink: 1;
}
</style>
