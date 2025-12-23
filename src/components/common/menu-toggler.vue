<script lang="ts" setup>
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'MenuToggler' });

interface Props {
  /** Show collapsed icon */
  collapsed?: boolean;
  /** Arrow style icon */
  arrowIcon?: boolean;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  arrowIcon: false,
  zIndex: 98
});

type NumberBool = 0 | 1;

const icon = computed(() => {
  const icons: Record<NumberBool, Record<NumberBool, string>> = {
    0: {
      0: 'line-md--menu-fold-left',
      1: 'line-md--menu-fold-right'
    },
    1: {
      0: 'ph--caret-double-left-bold',
      1: 'ph--caret-double-right-bold'
    }
  };

  const arrowIcon = Number(props.arrowIcon || false) as NumberBool;

  const collapsed = Number(props.collapsed || false) as NumberBool;

  return icons[arrowIcon][collapsed];
});

/**
 * 直接合并sider-icon会导致tooltip无法正常显示，
 * 因为父组件使用了tailwind的【hover样式】切换子组件显示，hover样式冲突，
 * 可能是否是多层slot嵌套隔离了子组件样式继承，需要了解样式的继承与否的处理方案；
 */
</script>

<template>
  <SiderIcon
    :key="String(collapsed)"
    :tooltip-content="collapsed ? $t('icon.expand') : $t('icon.collapse')"
    tooltip-placement="right-start"
    :z-index="zIndex"
  >
    <SvgIcon :localIcon="icon"/>
  </SiderIcon>
</template>

<style scoped></style>
