<template>
  <AdminLayout v-model:sider-collapse="appStore.siderCollapse" mode="horizontal" :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode" :is-mobile="appStore.isMobile" :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab" :header-height="themeStore.header.height"
    :tab-visible="themeStore.tab.visible" :tab-height="themeStore.tab.height"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''" :sider-visible="siderVisible"
    :sider-width="siderWidth" :sider-collapsed-width="siderCollapsedWidth" :footer-visible="themeStore.footer.visible"
    :footer-height="themeStore.footer.height" :fixed-footer="themeStore.footer.fixed"
    :right-footer="themeStore.footer.right">
    <template #header>
      <CenterHeader v-bind="headerProps" :title="$t(centerTitle)" />
    </template>
    <template #sider>
      <CenterSider />
    </template>
    <GlobalContent />
    <ThemeDrawer />
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed,ref } from 'vue';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import CenterHeader from '../modules/center-header/index.vue';
import CenterSider from '../modules/center-sider/index.vue';
import GlobalContent from '../modules/global-content/index.vue';
import ThemeDrawer from '../modules/theme-drawer/index.vue';
import { setupMixMenuContext } from '../context';
import { useRoute } from 'vue-router';



defineOptions({
  name: 'CenterLayout'
});

const route = useRoute();
const appStore = useAppStore();
const themeStore = useThemeStore();
const { menus } = setupMixMenuContext();
const centerNames = {
  messages: 'center_messages',
  myCenter: 'center_mycenter',
  workbench: 'center_workbench',
  enterprise: 'center_enterprise'
}

const centerTitle = computed(() => {
  let nameSplit = route.name?.toString().split("_") || [];
  if (nameSplit?.length < 2) return "中心"
  switch (nameSplit[1]) {
    case 'messages':
      return 'route.center_messages'
    case 'mycenter':
      return 'route.center_mycenter'
    case 'workbench':
      return 'route.center_workbench'
    case 'enterprise':
      return 'route.center_enterprise'
    default:
      return '中心'
  }
});

const headerPropsConfig: Record<UnionKey.ThemeLayoutMode, App.Global.HeaderProps> = {
  vertical: {
    showLogo: false,
    showMenu: false,
    showMenuToggler: true
  },
  'vertical-mix': {
    showLogo: false,
    showMenu: false,
    showMenuToggler: false
  },
  horizontal: {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  },
  'horizontal-mix': {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  }
};
const headerProps = computed(() => headerPropsConfig[themeStore.layout.mode]);

const siderVisible = computed(() => !([centerNames.myCenter, centerNames.messages, centerNames.workbench].includes(route.name?.toString() || '')));

const isVerticalMix = computed(() => themeStore.layout.mode === 'vertical-mix');

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix');

const siderWidth = computed(() => getSiderWidth());

const siderCollapsedWidth = computed(() => getSiderCollapsedWidth());

function getSiderWidth() {
  const { width, mixWidth, mixChildMenuWidth } = themeStore.sider;

  let w = isVerticalMix.value || isHorizontalMix.value ? mixWidth : width;

  if (isVerticalMix.value && appStore.mixSiderFixed && menus.value.length) {
    w += mixChildMenuWidth;
  }

  return w;
}

function getSiderCollapsedWidth() {
  const { collapsedWidth, mixCollapsedWidth, mixChildMenuWidth } = themeStore.sider;

  let w = isVerticalMix.value || isHorizontalMix.value ? mixCollapsedWidth : collapsedWidth;

  if (isVerticalMix.value && appStore.mixSiderFixed && menus.value.length) {
    w += mixChildMenuWidth;
  }

  return w;
}



</script>



<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
