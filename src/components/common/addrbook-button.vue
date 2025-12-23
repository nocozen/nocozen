<template>
  <RouterLink to="/center/enterprise/users/internal">
    <ButtonIcon :key="String(isWorkbench)" class="text-tbox_text" localIcon="ri--contacts-book-2-fill" iconClass="text-lg"
      :tooltip-content="$t('route.center_enterprise_users')">
    </ButtonIcon>
  </RouterLink>
</template>

<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'AddrbookButton'
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
