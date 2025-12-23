<template>
  <svg :class="svgClass" inert v-bind="bindAttrs">
    <defs>
      <linearGradient  :id="`gradient-${randomNum}`" v-bind="direction">
        <stop offset="0%" :stop-color="props.color"/>
        <stop offset="100%" :stop-color="props.gradientColor" />
      </linearGradient>
      <radialGradient id="raidal-grad">
        <stop offset="0%" :stop-color="props.color" />
        <stop offset="100%" :stop-color="props.gradientColor" />
      </radialGradient>
    </defs>
    <use :xlink:href="iconName"  :fill="svgFill" />
    <!-- <use :xlink:href="iconName" fill="url('#line-grad')" stroke="url('#line-grad')" /> -->
  </svg>
</template>
<script setup lang="ts">
import { computed, useAttrs } from 'vue'
let randomNum = Math.random();

interface Props {
  /** Iconify icon name */
  name?: string;
  /** Local svg icon name */
  color?: string;
  gradientColor?: string;
  gradientAngle?: string;
}
const props = withDefaults(defineProps<Props>(), {
  // 图标名称
  name: 'test',
  // 单一颜色
  color: '',
  // 渐变色
  gradientColor: '',
  // 渐变色角度
  gradientAngle: '',
})
// svg的外层div的class
const svgClass = computed(() => {
  if (props.name) {
    return `svg-icon icon-${props.name}`
  } else {
    return 'svg-icon'
  }
})

const attrs = useAttrs();
const bindAttrs = computed<{ class: string; style: string }>(() => ({
  class: (attrs.class as string) || '',
  style: (attrs.style as string) || ''
}));
// svg图标的名称
const iconName = computed(() => {
  const { VITE_ICON_LOCAL_PREFIX: prefix } = import.meta.env;
  return `#${prefix}-${props.name}`
})
// svg填充颜色，如果gradientColor值存在，就是渐变色，否则是单一颜色
const svgFill = computed(() => {
  if (props.gradientColor) {
    return `url(#gradient-${randomNum})`
  }
  return props.color
})
// 渐变色方向
const direction = computed(() => {
  switch (props.gradientAngle) {
    case '1':
      return { x1: '0%', x2: '100%', y1: '0%', y2: '0%' }
    case '2':
      return { x1: '0%', x2: '100%', y1: '100%', y2: '0%' }
    case '3':
      return { x1: '0%', x2: '0%', y1: '100%', y2: '0%' }
    case '4':
      return { x1: '100%', x2: '0%', y1: '100%', y2: '0%' }
    case '5':
      return { x1: '100%', x2: '0%', y1: '0%', y2: '0%' }
    case '6':
      return { x1: '0%', x2: '100%', y1: '0%', y2: '100%' }
    case '7':
      return { x1: '0%', x2: '0%', y1: '0%', y2: '100%' }
    case '8':
      return { x1: '100%', x2: '0%', y1: '0%', y2: '100%' }
    default:
      return { x1: '0%', x2: '100%', y1: '0%', y2: '0%' }
  }
})
</script>

<style scoped>
.svg-icon {
  /** width: 1em;
  height: 1em;
  fill: currentColor;*/
  vertical-align: middle;
}
</style>