<template>
  <AdminLayout
    v-model:sider-collapse="siderCollapse"
    :mode="layoutMode"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="true"
    :header-height="headerHeight"
    :tab-visible="false"
    :tab-height="0"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''"
    :sider-visible="false"
    :sider-width="0"
    :sider-collapsed-width="0"
    :footer-visible="false"
    :footer-height="0"
    :fixed-footer="true"
    :right-footer="false"
  >
    <template #header>
      <HomeHeader v-bind="headerProps" />
    </template>
    <GlobalContent />
  </AdminLayout>
</template>

<script setup lang="ts">
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import HomeHeader from '../modules/home-header/index.vue';
import GlobalContent from '../modules/global-content/index.vue';
import { setupMixMenuContext } from '../context';

defineOptions({
  name: 'HomeLayout'
});

const appStore = useAppStore();
const themeStore = useThemeStore();
const { menus } = setupMixMenuContext();

const layoutMode = 'horizontal';

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
const headerProps = headerPropsConfig['horizontal'];

// 不再需要store获取的配置
const siderCollapse = false;
const headerHeight = 56
</script>



<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
