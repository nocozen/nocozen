<template>
  <ButtonIcon :key="String(isWorkbench)" :tooltip-content="$t('common.workbench')">
    <icon-fa6-solid-desktop class="text-14px" />
    <span v-if="showText" class="text-14px font-medium">{{ $t('common.workbench') }}</span>
  </ButtonIcon>
</template>

<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'Workbench'
});

interface Props {
  isWorkbench?: boolean;
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
});

</script>

<style scoped></style>
