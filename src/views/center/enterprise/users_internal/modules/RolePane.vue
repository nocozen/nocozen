<template>
  <NFlex vertical>
    <NFlex align="center" justify="space-between">
      <span class="text-gray-400">角色</span>
      <EditMenu :options="roleBaseMenu" :popFunc="menuEvent" node="root" icon="mdi:plus" iconColor="text-blue-500"></EditMenu>
    </NFlex>
    <ModuleTree ref="refTree" type="role"></ModuleTree>
  </NFlex>
</template>

<script setup lang="ts">
import { h,ref } from 'vue';
import { Icon } from '@iconify/vue';
import { MenuType } from './shares';
import EditMenu from './EditMenu.vue';
import ModuleTree from './ModuleTree.vue';

const refTree = ref();

const renderIcon = (icon: string, iconClass: string) => {
  return () => h(Icon, { icon, class: iconClass })
}
const roleBaseMenu = [
  {
    icon: renderIcon('mingcute:folder-2-line', 'text-base'),
    label: '新增角色组',
    key: MenuType.RoleAddGroup
  }
];
const menuEvent = (key: MenuType) => {
  refTree.value.showEditor(key);  
}
</script>