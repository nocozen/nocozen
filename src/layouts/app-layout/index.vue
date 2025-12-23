<template>
  <AdminLayout
    v-model:sider-collapse="appStore.siderCollapse"
    :mode="layoutMode"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab"
    :header-height="themeStore.header.height"
    :tab-visible="themeStore.tab.visible"
    :tab-height="themeStore.tab.height"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''"
    :sider-visible="siderVisible"
    :sider-width="siderWidth"
    :sider-collapsed-width="siderCollapsedWidth"
    :footer-visible="themeStore.footer.visible"
    :footer-height="themeStore.footer.height"
    :fixed-footer="themeStore.footer.fixed"
    :right-footer="themeStore.footer.right"
  >
    <template #sider>
      <AppSider ref="refAppSider"/>
    </template>
    <AppContent />
    <ThemeDrawer />
    <FormEditor ref="formEditor"></FormEditor>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed,ref,provide,Ref } from 'vue';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import type { LayoutMode } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import AppSider from '../modules/app-sider/index.vue';
import AppContent from '../modules/app-content/index.vue';
import ThemeDrawer from '../modules/theme-drawer/index.vue';
import { setupMixMenuContext } from '../context';
import { ProviderName,MenuEventType } from '@/enum';
// import { useRoute } from 'vue-router';

defineOptions({
  name: 'AppLayout'
});

const refAppSider = ref();
const formEditor = ref();
const appStore = useAppStore();
const themeStore = useThemeStore();
const { menus } = setupMixMenuContext();
// const appId = ref('');
// const route = useRoute();
const currModuleNode = ref();
provide<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide, currModuleNode);


const layoutMode = computed(() => {
  const vertical: LayoutMode = 'vertical';
  const horizontal: LayoutMode = 'horizontal';
  return themeStore.layout.mode.includes(vertical) ? vertical : horizontal;
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

const siderVisible = computed(() => themeStore.layout.mode !== 'horizontal');

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

// 添加表单打开编辑面板，可操作添加的节点是app、group；可操作修改、删除的是module;
const openModuleAdd = async (eventType: string, appId: string, node: any) => {  // 当前节点作为父节点
  if (eventType == MenuEventType.AddFlowModule) {   // 添加流程表单
    await formEditor.value.openEditor(eventType, appId, node);
  } else if (eventType == MenuEventType.AddFormModule) {  // 添加表单
    await formEditor.value.openEditor(eventType, appId, node);
  } else if (eventType == MenuEventType.AddBoardModule) {  // 添加报表
    await formEditor.value.openEditor(eventType, appId, node);
  }
}

const openModuleEdit = async (eventType: string, appId: string, node: any) => {  // 当前节点
  if (MenuEventType.EditModule == eventType) {   // 编辑表单、流程表单、报表
    await formEditor.value.openEditor(eventType, appId, node);
  }
}

const refreshMenu = () => {
  refAppSider.value && refAppSider.value.refreshMenu();
}

provide(ProviderName.RefreshMenuProvide, refreshMenu);
provide(ProviderName.OpenModuleAddProvide, openModuleAdd);
provide(ProviderName.OpenModuleEditProvide, openModuleEdit);
</script>




<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
