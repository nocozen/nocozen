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
      <BackendHeader v-bind="headerProps" :title="centerTitle" />
    </template>
    <template #sider>
      <BackendSider />
    </template>
    <BackendContent />
    <ThemeDrawer />
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import BackendHeader from '../modules/backend-header/index.vue';
import BackendSider from '../modules/backend-sider/index.vue';
import BackendContent from '../modules/backend-content/index.vue';
import ThemeDrawer from '../modules/theme-drawer/index.vue';
import { setupMixMenuContext } from '../context';
import { useRoute } from 'vue-router';


defineOptions({
  name: 'BackendLayout'
});

const route = useRoute();
const appStore = useAppStore();
const themeStore = useThemeStore();
const { menus } = setupMixMenuContext();


const centerTitle = computed(() => {
  return route.query.name + "应用管理";
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

const siderVisible = true; //  computed(() => !([centerNames.dataEtl, centerNames.dataView, centerNames.formImport].includes(route.name?.toString() || '')));

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
