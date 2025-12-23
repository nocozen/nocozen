<template>
  <DarkModeContainer class="h-full flex-y-center px-3 shadow-header">
    <GobackButton :backPath="routeFrom" class="mt-1"/>
    <div class="h-full flex-center flex-1-hidden text-lg">
      <span class="ml-12px text-tbox_text" >{{ currTitle }}</span>
    </div>
    <div class="h-full flex-y-center justify-end">
      <RouterLink to="/">
        <BtnWb :showText="false" quaternary class="text-tbox_text"/>
      </RouterLink>
      <Notification v-if="route.name != 'center_messages'"/>
      <FullScreen  v-if="!appStore.isMobile" :full="isFullscreen" @click="toggle" />
      <UserAvatar />
    </div>
  </DarkModeContainer>
</template>

<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
import { useAppStore } from '@/store/modules/app';
import UserAvatar from '../app-header/components/user-avatar.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

defineOptions({
  name: 'BackendHeader'
});


interface Props {
  title: string;
  /** Whether to show the logo */
  showLogo?: App.Global.HeaderProps['showLogo'];
  /** Whether to show the menu toggler */
  showMenuToggler?: App.Global.HeaderProps['showMenuToggler'];
  /** Whether to show the menu */
  showMenu?: App.Global.HeaderProps['showMenu'];
}

const props = defineProps<Props>();
const route = useRoute();
const appStore = useAppStore();
const { isFullscreen, toggle } = useFullscreen();
const currTitle = computed(() => {
  return props.title;
})
const routeFrom = computed(() => {
  let from = '/home';
  // let qFrom = route.query['from'];
  return from as any;
})

</script>



<style scoped></style>
