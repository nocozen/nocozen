<template>
  <NButton v-if="bgScope == 'all'" quaternary :focusable="false" class="bg-all h-10 text-icon"
    @click="showDrawer = true" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <NTooltip :placement="tooltipPlacement" :delay="tooltipDelay" :z-index="zIndex" :disabled="disabledTooltip">
      <template #trigger>
        <div class="flex-center " :class="titlePosition == 'none' ? '' : 'w-[210px]'">
          <SvgIcon :icon="`mdi:${currApp.icon}`" class="w-5 h-5" :class="mergeIconClass" />
          <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ currApp.name }}</span>
        </div>
      </template>
      {{ currApp.name }}
    </NTooltip>
  </NButton>
  <NButton v-else quaternary :focusable="false" class="h-10 text-icon" @click="showDrawer = true"
    @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <NTooltip :placement="tooltipPlacement" :delay="tooltipDelay" :z-index="zIndex" :disabled="disabledTooltip">
      <template #trigger>
        <div class="flex-center" :class="titlePosition == 'none' ? '' : 'w-[210px]'">
          <n-icon-wrapper class="bg-all text-base min-w-6" :size="24" :border-radius="4">
            <SvgIcon :icon="`mdi:${currApp.icon}`" :class="mergeIconClass" />
          </n-icon-wrapper>
          <span v-if="titlePosition != 'none'" :class="mergeTextClass">{{ currApp.name }}</span>
        </div>
      </template>
      {{ currApp.name }}
    </NTooltip>
  </NButton>
  <n-drawer v-model:show="showDrawer" :width="300" placement="left">
    <n-drawer-content title="我的应用" closable>
      <NFlex vertical justify="start">
        <template v-for="app in appList" :key="app._id">
          <CardButton @click="appBtnClick(app)" bgScope="icon" :title="app.name" :icon="`mdi:${app.icon}`"
            :color="app.iconColor" sizeType="md"></CardButton>
        </template>
      </NFlex>
    </n-drawer-content>
  </n-drawer>
</template>


<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PopoverPlacement } from 'naive-ui';
import { twMerge } from 'tailwind-merge';
import { colord } from "@sa/color";
import { useThemeStore } from '@/store/modules/theme';
import { useRouterPush } from '@/hooks/common/router';
import { useRoute } from 'vue-router';

defineOptions({
  name: 'AppButton',
  inheritAttrs: false
});

interface Emits {
  (e: 'appBtnClick', app: any): void;
}

const emit = defineEmits<Emits>();

/**
 * 尺寸类型：小、中(应用顶级菜单)、大(卡片)   // 确定尺寸大小，图标、文字大小；
 * 文本位置：auto、右边、下边、没有
 * 背景类型：图标(默认)、整个、没有
 * 背景颜色：浅纯色/深色、深纯色/白色、线性渐变/白色、锥形渐变(默认)/白色
 * 图标背景形状：圆形、矩形(默认) 
 * 默认颜色组： 橘黄：#ffb23f  亮粉：#f98c6a  亮紫：#b26ef7  亮青：#24cbe2  亮蓝：#5797ff  草绿：#258e43
 */
interface Props {
  appList: Array<any>,
  badge?: string;
  title?: string;
  color?: string;
  size?: string;  /** sm md lg */
  iconClass?: string;  /**  ... */
  textClass?: string;
  titlePosition?: string;   /** auto all right bottom none */
  bgScope?: string;  /** auto icon all none */
  bgType?: string;    /** rect round */
  /** Button class */
  class?: string;
  /** Iconify icon name */
  icon?: string;
  tooltipDelay?: number;
  disabledTooltip?: boolean;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: PopoverPlacement;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  appList: () => [],
  badge: '0',
  title: '标题',
  color: '#29f4de',
  size: 'sm',   // 
  iconClass: '',
  textClass: '',
  titlePosition: 'auto',
  bgScope: 'auto',
  bgType: 'rect',
  class: '',
  icon: 'fa6-solid:user',
  tooltipDelay: 1000,
  disabledTooltip: true,
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 998
});

const currApp = ref({} as any);
const isHover = ref(false);
const showDrawer = ref(false);
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
const BASE_TEXT_CLASS = 'ml-2 font-medium text-base text-nowrap truncate'
const mergeIconClass = computed(() => {
  let iconClass = 'text-white opacity-96';
  themeStore.darkMode && (iconClass = '')
  return iconClass;
})

const mergeTextClass = computed(() => {
  let iconClass = twMerge(props.textClass, 'text-white opacity-96 mt-0.5', BASE_TEXT_CLASS)
  return themeStore.darkMode ? BASE_TEXT_CLASS : iconClass;
})

const onMouseEnter = () => {
  isHover.value = true;
}
const onMouseLeave = () => {
  isHover.value = false;
}

const currIcon = computed(() => {
  return (showDrawer.value || isHover.value) ? 'line-md:menu-fold-right' : props.icon
})


const route = useRoute();
const { routerPush } = useRouterPush();

const appBtnClick = (app: any) => {
  emit('appBtnClick', app)

  showDrawer.value = false;
}

const getApp = async () => {
  let id = route.query.app_id
  if (id == 'flowCenter') {
    currApp.value['name'] = '流程中心';
    currApp.value['icon'] = 'sitemap-outline';
  } else {
    let app = props.appList?.find((app: any) => app._id == id);
    app && (currApp.value = app)
  }
}
watch(
  () => props.appList,
  () => {
    getApp();
  },
  { immediate: true }
);
watch(
  () => route.query.app_id,
  () => {
    getApp();
  },
  { immediate: true }
);
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
