<template>
  <DarkModeContainer class="size-full flex-col-stretch shadow-sider" :inverted="darkMenu">
    <CenterMenu :dark-theme="darkMenu"/>
  </DarkModeContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/modules/theme';
import { useRouteStore } from '@/store/modules/route';
import CenterMenu from '../global-menu/center-menu.vue';


defineOptions({
  name: 'CenterSider'
});

const themeStore = useThemeStore();

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix');
const darkMenu = computed(() => !themeStore.darkMode && !isHorizontalMix.value && themeStore.sider.inverted);

</script>

<style scoped></style>
