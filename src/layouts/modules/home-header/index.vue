<template>
  <DarkModeContainer class="h-full flex-y-center px-12px shadow-header">
    <GlobalLogo v-if="showLogo" class="h-full" :style="{ width: themeStore.sider.width + 'px' }" />
    <HorizontalMenu v-if="showMenu" mode="horizontal" :menus="headerMenus" class="px-12px" />
    <div v-else class="h-full flex-y-center flex-1-hidden">
      <MenuToggler v-if="showMenuToggler" :collapsed="appStore.siderCollapse" @click="appStore.toggleSiderCollapse" />
      <GlobalBreadcrumb v-if="!appStore.isMobile" class="ml-12px" />
    </div>
    <div class="h-full flex-y-center justify-end">
      <NButton text class="mr-1">
        <div class="flex-center gap-8px text-info">
          <slot>
            <SvgIcon icon="fa6-solid--desktop" />
            <span class="text-14px font-medium">{{ $t('common.workbench') }}</span>
          </slot>
        </div>
      </NButton>
      <BtnWbedit @click="openWbEditor"></BtnWbedit>
      <AddrbookButton />
      <Notification />
      <FullScreen v-if="!appStore.isMobile" :full="isFullscreen" @click="toggle" />
      <!-- <ThemeSchemaSwitch :theme-schema="themeStore.themeScheme" :is-dark="themeStore.darkMode"
        @switch="themeStore.toggleThemeScheme" /> -->
      <ButtonIcon localIcon="ai" iconClass="text-base"/>
      <UserAvatar />
    </div>
    <WbEditor ref="refWbEditor"></WbEditor>
  </DarkModeContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFullscreen } from '@vueuse/core';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { useRouteStore } from '@/store/modules/route';
import HorizontalMenu from '../global-menu/base-menu.vue';
import GlobalLogo from '../global-logo/index.vue';
import GlobalBreadcrumb from '../global-breadcrumb/index.vue';
import GlobalSearch from '../global-search/index.vue';
import { useMixMenuContext } from '../../context';
import UserAvatar from '../app-header/components/user-avatar.vue';
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'GlobalHeader'
});


interface Props {
  /** Whether to show the logo */
  showLogo?: App.Global.HeaderProps['showLogo'];
  /** Whether to show the menu toggler */
  showMenuToggler?: App.Global.HeaderProps['showMenuToggler'];
  /** Whether to show the menu */
  showMenu?: App.Global.HeaderProps['showMenu'];
}

defineProps<Props>();

const refWbEditor = ref();
const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();
const { isFullscreen, toggle } = useFullscreen();
const { menus } = useMixMenuContext();

const headerMenus = computed(() => {
  if (themeStore.layout.mode === 'horizontal') {
    return routeStore.menus;
  }

  if (themeStore.layout.mode === 'horizontal-mix') {
    return menus.value;
  }

  return [];
});

const openWbEditor = () => {
  refWbEditor.value.openEditor();
}

</script>



<style scoped></style>
