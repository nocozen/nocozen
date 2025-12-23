<template>
  <NFlex>
    <span class="text-16px font-medium">测试菜单测试菜单</span>
    <NDropdown placement="bottom" trigger="click" :options="options" @select="handleDropdown">
      <SvgIcon icon="ph:user-circle" class="text-icon-large" />
    </NDropdown>
  </NFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';

defineOptions({
  name: 'MenuItemWraper'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'center_mycenter' | 'center_enterprise_base_entinfo' | 'logout';

type DropdownOption =
  | {
    key: DropdownKey;
    label: string;
    icon?: () => VNode;
  }
  | {
    type: 'divider';
    key: string;
  };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('route.center_mycenter'),
      key: 'center_mycenter',
      icon: SvgIconVNode({ icon: 'ph:user-circle', fontSize: 18 })
    },
    {
      label: '企业管理',
      key: 'center_enterprise_base_entinfo',
      icon: SvgIconVNode({ icon: 'heroicons-outline:office-building', fontSize: 18 })
    },
    {
      type: 'divider',
      key: 'divider'
    },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});


function handleDropdown(key: DropdownKey) {

}
</script>



<style scoped></style>
