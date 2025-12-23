<template>
  <SmoothScrollbar>
    <NMenu :expanded-keys="expandedKeys" :default-expand-all="true" :mode="mode" :value="selectedKey"
      :collapsed="siderCollapse" :collapsed-width="themeStore.sider.collapsedWidth" :collapsed-icon-size="22"
      :options="naiveMenus" :inverted="darkTheme" :indent="18" responsive @update:value="handleClickMenu" />
  </SmoothScrollbar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { MentionOption, MenuProps } from 'naive-ui';
import { SimpleScrollbar } from '@sa/materials';
import type { RouteKey } from '@elegant-router/types';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { useRouteStore } from '@/store/modules/route';
import { useRouterPush } from '@/hooks/common/router';
import { useAuthStore } from '@/store/modules/auth';
import { isEmpty } from 'radashi';
import { decryptPack } from '@/utils/crypto-msgpack';
import { AdminGroupType } from '@/enum';

defineOptions({
  name: 'CenterMenu'
});

interface Props {
  darkTheme?: boolean;
  mode?: MenuProps['mode'];
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vertical'
});



const route = useRoute();
const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();
const { routerPushByKey } = useRouterPush();
const userAuth = useAuthStore();
const currAuth = ref();

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
}

init();

const naiveMenus = computed(() => {
  // 区分管理员和普通用户；普通用户目前只有通讯录，隐藏菜单区域即可；
  if ([AdminGroupType.Creator, AdminGroupType.Super].includes(currAuth.value?.groupRole)) {
    return routeStore.menus.find(menu => menu.key == 'center')?.children?.find(menu => menu.key == 'center_enterprise')?.children || []
  } else {
    let menu = routeStore.menus.find(menu => menu.key == 'center')?.children?.
      find(menu => menu.key == 'center_enterprise')?.children?.
      find(menu => menu.key == 'center_enterprise_users');
    const result = Object.assign({}, menu, {
      children: menu!.children!.length > 0 ? [menu!.children![0]] : []
    });
    return [result] as any;
  }

})

const isHorizontal = computed(() => props.mode === 'horizontal');

const siderCollapse = computed(() => themeStore.layout.mode === 'vertical' && appStore.siderCollapse);

const headerHeight = computed(() => `${themeStore.header.height}px`);

const selectedKey = computed(() => {
  const { hideInMenu, activeMenu } = route.meta;
  const name = route.name as string;

  const routeName = (hideInMenu ? activeMenu : name) || name;

  return routeName;
});

const expandedKeys = ref<string[]>([
  'center_enterprise_base',
  'center_enterprise_perm',
  'center_enterprise_users',
  'center_enterprise_system'
]);

function updateExpandedKeys() {
  if (isHorizontal.value || siderCollapse.value || !selectedKey.value) {
    expandedKeys.value = [];
    return;
  }
  expandedKeys.value = routeStore.getSelectedMenuKeyPath(selectedKey.value);
}


function handleClickMenu(key: RouteKey) {
  routerPushByKey(key);
}

</script>



<style scoped>
:deep(.n-menu--horizontal) {
  --n-item-height: v-bind(headerHeight) !important;
}
:deep(.n-menu .n-menu-item-content .n-menu-item-content__icon .iconify ) {
  font-size: 18px !important;
}
</style>
