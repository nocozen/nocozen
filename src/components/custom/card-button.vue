<template>
  <NButton v-if="sizeType == 'sm'" quaternary class="pa-0 h-9 w-fit px-2 text-icon flex-start" :class="borderClass"
    v-bind="$attrs">
    <NTooltip :placement="tooltipPlacement" :delay="tooltipDelay" :z-index="zIndex" :disabled="disabledTooltip">
      <template #trigger>
        <div class="flex-center">
          <template v-if="bgScope == 'all'">
            <n-icon-wrapper class="bg-all text-base" :size="24" :border-radius="4">
              <SvgIcon :icon="icon" :localIcon="localIcon" :class="mergeIconClass" />
              <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ title }}</span>
            </n-icon-wrapper>
          </template>
          <template v-else-if="bgScope == 'icon'">
            <n-icon-wrapper class="bg-all text-base" :size="24" :border-radius="4">
              <SvgIcon :icon="icon" :localIcon="localIcon" :class="mergeIconClass" />
            </n-icon-wrapper>
            <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ title }}</span>
          </template>
          <template v-else>
            <SvgIcon :icon="icon" :localIcon="localIcon" :style="{ color: color }" class="text-2xl" />
            <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ title }}</span>
          </template>
        </div>
      </template>
      {{ title }}
    </NTooltip>
  </NButton>
  <NButton v-else-if="sizeType == 'md'" quaternary class="pa-0 text-icon justify-start" :class="borderClass"
    v-bind="$attrs">
    <NTooltip :placement="tooltipPlacement" :delay="tooltipDelay" :z-index="zIndex" :disabled="disabledTooltip">
      <template #trigger>
        <template v-if="bgScope == 'all'">
          <n-icon-wrapper class="bg-all text-base" :size="34" :border-radius="4">
            <SvgIcon :icon="icon" :localIcon="localIcon" :class="mergeIconClass" />
            <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ title }}</span>
          </n-icon-wrapper>
        </template>
        <template v-else-if="bgScope == 'icon'">
          <NFlex align="center">
            <n-icon-wrapper class="bg-all text-base" :size="34" :border-radius="4">
              <SvgIcon :icon="icon" :localIcon="localIcon" :class="mergeIconClass" />
            </n-icon-wrapper>
            <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ title }}</span>
          </NFlex>
        </template>
        <template v-else>
          <NFlex :size="0">
            <SvgIcon :icon="icon" :localIcon="localIcon" :style="{ color: color }" class="text-xl" />
            <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ title }}</span>
          </NFlex>
        </template>
      </template>
      {{ title }}
    </NTooltip>
  </NButton>
  <NFlex v-else-if="sizeType == 'lg'" vertical align="center" justify="center" :class="`bg-${bgScope}`" v-bind="$attrs"
    class="px-2 min-w-18 w-full h-28 rounded hover:shadow-md hover:outline hover:outline-gray-100 hover:outline-1 ">
    <div class="flex-col w-full h-full align-center justify-center">
      <!-- <SvgTest class="w-20 h-20"  color="red" gradientColor="gold" gradientAngle="8" /> -->
      <div class="flex-center">
        <NBadge :value="badge" :max="99" :dot="badge === 1">
          <SvgIcon :icon="icon" :localIcon="localIcon" :class="mergeLgIconClass" :style="{ color: iconColor }"/>
        </NBadge>
      </div>
      <NTooltip :placement="tooltipPlacement" :duration="tooltipDelay" :z-index="zIndex" :disabled="disabledTooltip">
        <template #trigger>
          <span v-if="titlePosition != 'none'" :class="mergeLgTextClass">{{ title }}</span>
        </template>
        {{ tooltipContent }}
      </NTooltip>
    </div>
  </NFlex>

</template>


<script setup lang="ts">
import { computed } from 'vue';
import { twMerge } from 'tailwind-merge';
import { colord } from "@sa/color";
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'CardButton',
  inheritAttrs: false
});

/**
 * 尺寸类型：小、中(应用顶级菜单)、大(卡片)   // 确定尺寸大小，图标、文字大小；
 * 文本位置：auto、右边、下边、没有
 * 背景类型：图标(默认)、整个、没有
 * 背景颜色：浅纯色/深色、深纯色/白色、线性渐变/白色、锥形渐变(默认)/白色
 * 图标背景形状：圆形、矩形(默认)
 * 默认颜色组： 橘黄：#ffb23f  亮粉：#f98c6a  亮紫：#b26ef7  亮青：#24cbe2  亮蓝：#5797ff  草绿：#258e43
 */
interface Props {
  badge?: number;
  title?: string;
  color?: string;
  sizeType?: string;  /** sm md lg */
  borderClass?: string;
  iconClass?: string;  /**  ... */
  iconColor?: string;
  textClass?: string;
  titlePosition?: string;   /** auto right bottom none */
  bgScope?: string;  /** auto icon all none */
  bgType?: string;    /** rect round */
  /** Iconify icon name */
  icon?: string;
  localIcon?: string;
  tooltipDelay?: number;
  disabledTooltip?: boolean;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: any;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  badge: 0,
  title: '标题',
  color: '#29f4de',
  sizeType: 'sm',   //
  borderClass: '',
  iconClass: '',
  textClass: '',
  titlePosition: 'auto',
  bgScope: 'auto',
  bgType: 'rect',
  icon: 'fa6-solid:user',
  tooltipDelay: 1000,
  disabledTooltip: true,
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 998
});

const themeStore = useThemeStore();

const buttonColors = computed(() => {
  let mainColor = themeStore.darkMode ? colord(props.color).darken(0.25).toHex() : props.color;
  return {
    bgBeginColor: mainColor,
    bgEndColor: colord(mainColor).darken(0.2).toHex(),
    iconColor: '#29f4de',
    textColor: 'black'
  }
})

const BASE_TEXT_CLASS = 'text-nowrap truncate';
const mergeIconClass = computed(() => {
  let baseClass = 'w-4 h-4';
  if (props.sizeType == 'md') {
    baseClass = 'w-6 h-6'
  }
  baseClass = baseClass + props.iconClass;
  let smIconClass = twMerge('text-primary', baseClass);
  if (props.bgScope == 'all' || props.bgScope == 'icon') {
    if (themeStore.darkMode) {
      smIconClass = twMerge('text-white opacity-70', baseClass)
    } else {
      smIconClass = twMerge('text-white opacity-90', baseClass)
    }
  }
  return smIconClass;
})
const mergeTextClass = computed(() => {
  let smTextClass = twMerge(props.iconClass, 'opacity-96 ml-1 text-sm select-none', BASE_TEXT_CLASS);
  props.bgScope == 'all' && !themeStore.darkMode && (smTextClass = twMerge('text-white', smTextClass))
  return smTextClass;
})


const mergeLgIconClass = computed(() => {
  let lgIconClass = twMerge('text-primary w-10 h-10', props.iconClass);
  if (props.bgScope == 'all') {
    if (themeStore.darkMode) {
      lgIconClass = twMerge('text-white opacity-70 w-10 h-10', props.iconClass)
    } else {
      lgIconClass = twMerge('text-white opacity-90 w-10 h-10', props.iconClass)
    }
  }
  return lgIconClass;
})
const mergeLgTextClass = computed(() => {
  let lgTextClass = twMerge(props.iconClass, 'opacity-96 text-center w-full text-base select-none', BASE_TEXT_CLASS);
  props.bgScope == 'all' && !themeStore.darkMode && (lgTextClass = twMerge('text-white', lgTextClass));
  return lgTextClass;
})

</script>

<style scoped lang="scss">
.bg-all {
  /* 设置背景为线性渐变 */
  /*  background: linear-gradient(to bottom, #5797ff, #5797ff); */
  /* background-image: conic-gradient(from -45deg, #86c2fe, #3578dd); */
  background-image: conic-gradient(from -45deg, v-bind("buttonColors.bgBeginColor"), v-bind("buttonColors.bgEndColor"));
  /* 你可以添加其他的样式属性，如高度、宽度、内边距等 */
  /* 如果你想让渐变填充整个元素，确保没有背景图片或背景颜色覆盖它 */
  background-size: cover;
  background-repeat: no-repeat;

  &:hover {
    opacity: 0.8;
  }

}

.bg-icon {
  color: transparent;
  background-image: linear-gradient(45deg, blue, red);
  background-clip: text;
  -webkit-background-clip: text
}
</style>
