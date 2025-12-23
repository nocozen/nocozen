<template>
  <ButtonIcon  class="text-tbox_text" :key="String(full)" :tooltip-content="full ? $t('icon.fullscreenExit') : $t('icon.fullscreen')">
    <icon-gridicons-fullscreen-exit v-if="full" class="text-base" />
    <icon-gridicons-fullscreen v-else class="text-base"/>
  </ButtonIcon>
</template>

<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'FullScreen'
});

interface Props {
  full?: boolean;
}

defineProps<Props>();
</script>

<style scoped></style>
