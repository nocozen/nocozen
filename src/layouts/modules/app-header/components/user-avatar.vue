<script setup lang="ts">
import { computed, h, ref } from 'vue';
import type { VNode } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import { useRoute } from 'vue-router';
import AccInfo from '@/components/advanced/acc-info.vue';
import { AdminGroupType } from '@/enum';
import { decryptPack } from '@/utils/crypto-msgpack';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPush, routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();
const route = useRoute();
type DropdownKey = 'center_mycenter' | 'center_enterprise_base_entinfo' | 'logout';
const currAuth = ref();
const userAuth = useAuthStore();

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
}

// 创建阶段初始化
init();


type DropdownOption =
  | {
    key: DropdownKey;
    label: string;
    icon?: () => VNode;
  }
  | {
    type: 'divider';
    key: string;
  }
  | {
    type: 'render';
    key: string;
    render: Function;
  }

const renderCustomHeader = () => {
  return h(
    'div',
    {
      style: 'display: flex; align-items: center; padding: 8px 12px;'
    },
    [
      h('div', [
        h('p', `${authStore.userInfo.name}`),
        h('p', { class: 'text-gray text-[12px]' }, authStore.userInfo.en_name)
      ])
    ]
  )
}
const options = computed(() => {
  let opts: DropdownOption[] = [
    {
      key: 'header',
      type: 'render',
      render: renderCustomHeader
    },
    {
      key: 'divider',
      type: 'divider'
    },
    {
      label: $t('route.center_mycenter'),
      key: 'center_mycenter',
      icon: SvgIconVNode({ icon: 'ph--user-circle', fontSize: 18 })
    },
    {
      label: $t('route.center_enterprise'),
      key: 'center_enterprise_base_entinfo',
      icon: SvgIconVNode({ icon: 'heroicons-outline--office-building', fontSize: 18 })
    },
    {
      type: 'divider',
      key: 'divider'
    },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph--sign-out', fontSize: 18 })
    }
  ];
  if (![AdminGroupType.Creator, AdminGroupType.Super ].includes(currAuth.value?.groupRole)) {
    opts = opts.filter((opt: any) => opt.key != 'center_enterprise_base_entinfo');
  }
  return opts;
});

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      authStore.resetStore();
    }
  });
}

function loginOrRegister() {
  toLogin();
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else {
    // routerPushByKey(key);
    let from = route.query['from'];
    let curr = route.path.split('/', 3).join('/');
    if (from == curr) {
      routerPush({ name: key, query: { from: from } })
    } else {
      routerPush({ name: key, query: { from: curr } })
    }
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom-end" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon class="text-tbox_text">
        <AccInfo :account="{ name: `${authStore.userInfo.name}`, avatar: `${authStore.userInfo.avatar}` }"
          textWidth='none' />
        <!-- <span class="text-16px font-medium">{{ authStore.userInfo.name }}</span> -->
      </ButtonIcon>
    </div>
  </NDropdown>
</template>

<style scoped></style>
