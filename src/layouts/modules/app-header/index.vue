<template>
  <DarkModeContainer class="h-full flex-y-center px-3 shadow-header">
    <div class="h-full flex-y-center flex-1-hidden ml-2">
      <!-- <ModuleHeader v-if="!appStore.isMobile" class="ml-12px" /> -->
       <slot name="header"></slot>
    </div>
    <div class="h-full flex-y-center justify-end">
      <RouterLink to="/">
        <BtnWb :showText="false" quaternary class="text-tbox_text"/>
      </RouterLink>
      <AddrbookButton />
      <FullScreen v-if="!appStore.isMobile" :full="isFullscreen" @click="toggle" />
      <!-- <LangSwitch :lang="appStore.locale" :lang-options="appStore.localeOptions" @change-lang="appStore.changeLocale" /> -->
      <!-- <ThemeSchemaSwitch :theme-schema="themeStore.themeScheme" :is-dark="themeStore.darkMode"
        @switch="switchScheme" /> -->
      <!-- <ThemeButton /> -->
      <UserAvatar/>
    </div>
  </DarkModeContainer>
</template>


<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
// import ThemeButton from './components/theme-button.vue';
import UserAvatar from './components/user-avatar.vue';

defineOptions({
  name: 'AppHeader'
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

const appStore = useAppStore();
const themeStore = useThemeStore();
const { isFullscreen, toggle } = useFullscreen();

const switchScheme = () => {
  themeStore.toggleThemeScheme();
  themeStore.sider.inverted =  themeStore.themeScheme == 'auto' ? true : false;
}

</script>



<style scoped></style>
