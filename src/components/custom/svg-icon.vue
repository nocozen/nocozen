<template>
  <template v-if="renderLocalIcon">
    <svg v-if="symbolId" inert width="1em" height="1em" v-bind="bindAttrs" @click="$emit('click', $event)">
      <use :xlink:href="symbolId" fill="currentColor"/>
    </svg>
  </template>
  <template v-else>
    <Icon v-if="icon" :icon="icon" v-bind="bindAttrs" />
  </template>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { Icon } from '@iconify/vue';

defineOptions({ name: 'SvgIcon', inheritAttrs: false });

/**
 * 说明：vite-plugin-svg-icons 会将svg图片内容嵌入到页面文件中打包发布，因此浏览器不会再次联网请求图片资源
 * Props
 *
 * - Support iconify and local svg icon
 * - If icon and localIcon are passed at the same time, localIcon will be rendered first
 */
interface Props {
  /** Iconify icon name */
  icon?: string;
  /** Local svg icon name */
  localIcon?: string;
}

const props = defineProps<Props>();

const attrs: any = useAttrs();
const bindAttrs = computed<{ class: string; style: string }>(() => ({
  class: (attrs.class as string) || '',
  style: (attrs.style as string) || ''
}));

const symbolId = computed(() => {
  const { VITE_ICON_LOCAL_PREFIX: prefix } = import.meta.env;

  const defaultLocalIcon = 'no-icon';

  let icon = props.localIcon;
  if (props.icon && !props.icon?.includes(":")) {
    icon = props.icon;
  }
  if (!icon || props.icon == 'mdi:undefined') {
    icon = defaultLocalIcon
  }

  return `#${prefix}-${icon}`;
});

/** If localIcon is passed, render localIcon first */
const renderLocalIcon = computed(() => {
  if (props.localIcon) return true;
  if (props.icon) {
    if (props.icon?.includes(":")) {
      if (props.icon == 'mdi:undefined') {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
});
</script>

<style scoped></style>
