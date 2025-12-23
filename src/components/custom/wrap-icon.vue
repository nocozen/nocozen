
<template>
  <template v-if="!wrap">
      <SvgIcon v-if="icon" :icon="icon" :class="cptIconClass" />
  </template>
  <template v-else>
    <NIconWrapper v-if="'default' == wrapType" :size="size" :border-radius="radius" :color="color"  v-bind="bindAttrs">
      <SvgIcon v-if="icon" :icon="icon" :class="cptIconClass"/>
    </NIconWrapper>
    <NIconWrapper v-else :size="size" :border-radius="radius" class="bg-all"  v-bind="bindAttrs">
      <SvgIcon v-if="icon" :icon="icon" :class="cptIconClass"/>
    </NIconWrapper>
  </template>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { colord } from "@sa/color";
import { useThemeStore } from '@/store/modules/theme';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'WrapIcon', inheritAttrs: false });

/**
 * Props
 *
 * - Support iconify and local svg icon
 * - If icon and localIcon are passed at the same time, localIcon will be rendered first
 */
interface Props {
  color?: string,
  /** Iconify icon name */
  icon?: string,
  /** Local svg icon name */
  wrap?: boolean,
  wrapType?: 'conic' | 'default'
  size?: number,
  iconClass?: string,
  radius?: number,
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  radius: 12,
  wrap: true,
  icon: 'mdi:document',
  color: '#29f4de',
  wrapType: 'default'
})

const attrs = useAttrs();
const themeStore = useThemeStore();
const bindAttrs = computed<{ class: string; style: string }>(() => ({
  class: (attrs.class as string) || '',
  style: (attrs.style as string) || ''
}));

const cptIconClass = computed(() => {
  let defClass = props.wrap ? "text-base" : 'text-2xl text-primary';
  return props.iconClass ? props.iconClass : defClass
})
const buttonColors = computed(() => {
  let mainColor = themeStore.darkMode ? colord(props.color).darken(0.25).toHex() : props.color;
  return {
    bgBeginColor: mainColor,
    bgEndColor: colord(mainColor).darken(0.2).toHex(),
    iconColor: '#29f4de',
    textColor: 'black'
  }
})
</script>



<style lang="scss" scoped>
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
