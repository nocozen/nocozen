<template>
  <DarkModeContainer class="size-full flex-col-stretch shadow-sider" :inverted="darkMenu">
    <BackendMenu :dark-theme="darkMenu"/>
  </DarkModeContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/modules/theme';
import { useRouteStore } from '@/store/modules/route';
import BackendMenu from '../global-menu/backend-menu.vue';


defineOptions({
  name: 'BackendSider'
});

const themeStore = useThemeStore();

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix');
const darkMenu = computed(() => !themeStore.darkMode && !isHorizontalMix.value && themeStore.sider.inverted);


</script>



<style lang="scss" scoped>

</style>
