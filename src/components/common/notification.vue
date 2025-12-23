<template>
  <ButtonIcon @click="routeTo" class="text-tbox_text pb-0.5" :tooltip-content="$t('common.notification')">
    <n-badge dot :offset="offset" class="w-4 h-4" :show="false">
      <icon-tdesign-notification-filled class="text-lg" />
    </n-badge>
    <!-- <span class="text-14px font-medium">{{ $t('common.notification') }}</span> -->
  </ButtonIcon>
</template>

<script setup lang="ts">
import { $t } from '@/locales';
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({
  name: 'Notification',
});

interface Props {
  isWorkbench?: boolean;
  badge?: number;
}

const props = withDefaults(defineProps<Props>(), {
  badge: 0
})
const offset = [-4, 6] as const
const route = useRoute();
const { routerPush } = useRouterPush();

const routeTo = () => {
  let from = route.query['from'];
  let curr = route.path.split('/', 3).join('/');
  if (from == curr) {
    routerPush({ path: '/center/messages', query: { from: from } })
  } else {
    routerPush({ path: '/center/messages', query: { from: curr } })
  }
}
</script>

<style scoped lang="scss">
:deep(.n-badge-sup) {
  width: 6px !important;
  min-width: 6px !important;
  height: 6px !important;
  border-radius: 6px;
}
</style>
