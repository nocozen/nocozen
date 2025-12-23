<template>
  <SmoothScrollbar :class="{ 'pr-1': !siderCollapse }" class="z-999">
    <NMenu ref="flowMenu" :class="appId == 'flowCenter' ? 'h-[212px]' : 'h-[154px]'" v-model:value="selectedFlowKey"
      :mode="mode" :collapsed="siderCollapse" :collapsed-width="themeStore.sider.collapsedWidth"
      :collapsed-icon-size="24" :options="flowMenuOption" :inverted="darkTheme" :indent="18" responsive
      @update:value="handleClickFlowMenu" />
    <DarkModeContainer v-if="appId != 'flowCenter'" class="flex-center px-4 sticky top-0 z-1" :inverted="darkTheme">
      <n-input-group class="my-4">
        <NInput v-if="!siderCollapse" size="tiny" round>
          <template #prefix>
            <SvgIcon icon="mingcute--search-line"></SvgIcon>
          </template>
        </NInput>
        <ModuleAddMenu :popFunc="popFunc" :options="popAppAddModel" :nodeId="appId">
          <NButton size="tiny" round>
            <template #icon>
              <SvgIcon icon="mingcute--add-line"></SvgIcon>
            </template>
          </NButton>
        </ModuleAddMenu>
      </n-input-group>
    </DarkModeContainer>
    <NMenu ref="homeMenu" v-if="showHomeMenu" v-model:value="selectedHomeKey" :mode="mode" :collapsed="siderCollapse"
      :collapsed-width="themeStore.sider.collapsedWidth" :collapsed-icon-size="24" :options="homeMenuOption"
      :inverted="darkTheme" :indent="18" responsive @update:value="handleClickHome" />
    <NMenu ref="moduleMenu" v-if="appId != 'flowCenter'" v-model:value="selectedKey"
      v-model:expanded-keys="expandedKeys" :mode="mode" :collapsed="siderCollapse"
      :collapsed-width="themeStore.sider.collapsedWidth" :collapsed-icon-size="24" :options="menuOption"
      :inverted="darkTheme" :indent="18" responsive @update:value="handleClickMenu" :render-label="renderLabel"
      :render-icon="cptCanEdit ? renderMenuIcon : undefined" :expand-icon="expandIcon" class="menu"
      :class="dragActive ? 'menu-nohover' : 'menu-hover'" />
  </SmoothScrollbar>
</template>

<script setup lang="ts">
import { computed, ref, Ref, provide, inject, h, toRaw } from 'vue';
import type { MenuProps } from 'naive-ui';
import SmoothScrollbar from '@/components/common/scrollbar/SmoothScrollbar.vue';
import type { RouteKey } from '@elegant-router/types';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { useRouterPush } from '@/hooks/common/router';
import SvgIcon from '@/components/custom/svg-icon.vue';
import WrapIcon from '@/components/custom/wrap-icon.vue';
import MenuIcon from '../app-sider/components/menu-icon.vue';
import { colord } from "@sa/color";
import { $t } from '@/locales';
import { ModuleType, MenuEventType, ProviderName } from '@/enum';
import { findTreeNode } from '@/utils/dataHelper';

defineOptions({
  name: 'AppMenu'
});

interface Props {
  menuOption: Array<any>;
  editModule: Function;
  openEditor: Function;
  popFunc: Function;
  darkTheme?: boolean;
  mode?: MenuProps['mode'];
  appId: string;      // appId == 'flowCenter' 作为流程中心标识
  canEdit: boolean;
  appHomeId: string | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vertical',
  canEdit: false,
});

const flowMenu = ref();
const homeMenu = ref();
const moduleMenu = ref();
// const route = useRoute();
const appStore = useAppStore();
const themeStore = useThemeStore();

const { routerPushByKey, routerPush } = useRouterPush();
const expandedKeys = ref<string[]>([]);
const selectedHomeKey = ref();
const selectedFlowKey = ref();
const selectedKey = ref();
const dragActive = ref(false);

provide<Ref<boolean>>('dragActive', dragActive);
let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);

const siderCollapse = computed(() => {
  return appStore.siderCollapse
});
const headerHeight = computed(() => `${themeStore.header.height}px`);

const cptCanEdit = computed(() => {
  if (props.canEdit) {
    return true;
  } else {
    return appStore.siderCollapse
  }
})

const renderMenuIcon = (option: any) => {
  if (ModuleType.Group == option.moduleType) {
    const isExpanded = expandedKeys.value.includes(option.key.toString());
    return h(SvgIcon, {
      localIcon: isExpanded ? 'ion--folder-open' : 'ion--folder',
      style: 'color: rgb(var(--primary-color)',
      class: 'text-xl'
    });
  } else {
    return option.icon ? option.icon() : h(WrapIcon, {
      icon: `mdi:${option.node.icon}`,
      color: option.node.iconColor
    });
  }
}

const renderIcon = (icon: string, typeOrColor: string, dark?: boolean) => {
  if (typeOrColor == 'pop') {
    return () => h(SvgIcon, { icon, class: 'text-lg' })
  } else if (typeOrColor == 'default') {
    return () => h(SvgIcon, { icon, class: 'text-gray-600' })
  } else if (typeOrColor == 'group') {
    return () => h(SvgIcon, { icon, class: 'text-primary' })
  } else {
    let color = themeStore.darkMode ? colord(typeOrColor).darken(0.25).toHex() : typeOrColor;
    return () => h(WrapIcon, { icon, color })
  }
}

const renderLabel = (option: any) => {
  if (ModuleType.Group == option.moduleType) {
    const popMenu = [
      { icon: 'mdi:dots-vertical', options: popEditModelGroup, handle: props.editModule },
      { icon: 'mdi:plus', options: popGroupAddModel, handle: props.openEditor },
    ]
    if (expandedKeys.value.includes(option.key.toString())) {
      return h(MenuIcon, { editable: props.canEdit, parentIds: option.parentIds, label: option.node.name, localIcon: 'ion--folder-open', wrap: false, appId: props.appId, node: option.node, popMenu })
    } else {
      return h(MenuIcon, { editable: props.canEdit, parentIds: option.parentIds, label: option.node.name, localIcon: 'ion--folder', wrap: false, appId: props.appId, node: option.node, popMenu })
    }
  } else {
    const popMenu = [
      { icon: 'mdi:dots-horizontal', options: popEditModel, handle: props.editModule },
    ]
    return h(MenuIcon, { editable: props.canEdit, parentIds: option.parentIds, label: option.node.name, icon: option.node.icon, corlor: option.node.iconColor, appId: props.appId, node: option.node, popMenu: popMenu })
  }
}

const showHomeMenu = computed(() => {
  // 管理员始终可见，非管理员appHomeId有值时可见
  if ((props.appId != 'flowCenter') && (props.canEdit || props.appHomeId)) {
    return true;
  }
  return false;

})

const homeMenuOption = [
  {
    key: 'home',
    name: 'app_init',
    path: '/app/init/' + props.appHomeId,
    label: '首页',
    icon: renderIcon('mdi:home', 'ss'),
  }
]

const flowMenuOption = [
  {
    key: 'app_flow-todo',
    name: 'app_flow-todo',
    path: '/app/flow-todo/:id',
    label: '我的待办',
    i18nKey: 'route.flow_todo',
    icon: renderIcon('mdi:clipboard-text-clock', 'default'),
  },
  {
    key: 'app_flow-started',
    name: 'app_flow-started',
    path: '/app/flow-started/:id',
    label: '我发起的',
    i18nKey: 'route.flow_started',
    icon: renderIcon('fluent--play-circle-24-filled', 'default'),
  },
  {
    key: 'app_flow-handle',
    name: 'app_flow-handle',
    path: '/app/flow-handle/:id',
    label: '我处理的',
    i18nKey: 'route.flow_handle',
    icon: renderIcon('fluent--task-list-square-rtl-24-filled', 'default'),
  },
  {
    key: 'app_flow-received',
    name: 'app_flow-received',
    path: '/app/flow-received/:id',
    label: '抄送我的',
    i18nKey: 'route.flow_received',
    icon: renderIcon('fluent--send-24-filled', 'default'),
  },
  {
    key: 'divider-1',
    type: 'divider',
    props: {
      style: {
        marginLeft: '20px'
      }
    }
  },
  {
    key: 'app_flow-start',
    name: 'app_flow-start',
    path: '/app/flow-start/:id',
    label: '发起流程',
    i18nKey: 'route.flow_start',
    icon: renderIcon('lets-icons--sign-in-squre-fill', 'default'),
  }
]

const popAddModel = [
  {
    icon: renderIcon('fluent--document-flowchart-24-regular', 'pop'),
    label: '新建流程表单',
    key: MenuEventType.AddFlowModule
  },
  {
    icon: renderIcon('mdi:file-document-box-outline', 'pop'),
    label: '新建表单',
    key: MenuEventType.AddFormModule
  },
  {
    icon: renderIcon('material-symbols--space-dashboard-outline', 'pop'),
    label: '新建仪表板',
    key: MenuEventType.AddBoardModule
  },

]

const popAppAddModel = [
  ...popAddModel,
  {
    icon: renderIcon('ci--folder-add', 'pop'),
    label: '新建分组',
    key: MenuEventType.ModuleAddGroup
  },
]

const popGroupAddModel = [
  ...popAddModel,
  {
    icon: renderIcon('ci--folder-add', 'pop'),
    label: '新建子分组',
    key: MenuEventType.ModuleAddSubGroup
  },
]

const popEdit = [
  {
    icon: renderIcon('mynaui--move', 'pop'),
    label: '移动',
    key: MenuEventType.ModuleMove
  },
  {
    icon: renderIcon('mdi:trash-can-outline', 'pop'),
    label: '删除',
    key: MenuEventType.ModuleDelete
  },
]

const popEditModel = [
  {
    // icon: 'fluent:document-flowchart-24-regular',
    icon: renderIcon('line-md--edit', 'pop'),
    label: '编辑',
    key: MenuEventType.EditModule
  },
  {
    // icon: 'mdi:file-document-box-outline',
    icon: renderIcon('carbon--tag-edit', 'pop'),
    label: '修改名称和图标',
    key: MenuEventType.ModuleEditLabel
  },
  ...popEdit
]

const popEditModelGroup = [
  {
    // icon: 'mdi:file-document-box-outline',
    icon: renderIcon('carbon--tag-edit', 'pop'),
    label: '修改名称和图标',
    key: MenuEventType.ModuleGroupEditLabel
  },
  ...popEdit
]

const handleClickMenu = (key: string, menuItem: any) => {
  currModuleNode && menuItem.node && (currModuleNode.value = toRaw(menuItem.node));
  selectedHomeKey.value = '';
  selectedFlowKey.value = ''    // 清除流程路由
  routerPushByKey(menuItem.routeKey, { params: { id: key }, query: { app_id: props.appId } });
}

const handleClickFlowMenu = (key: RouteKey, menuItem: any) => {
  selectedFlowKey.value = key;
  selectedKey.value = '';
  selectedHomeKey.value = '';
  routerPushByKey(menuItem.name, { params: { id: props.appId }, query: { app_id: props.appId } });
}

const handleClickHome = (key: RouteKey, menuItem: any) => {
  selectedFlowKey.value = ''
  selectedKey.value = '';
  selectedHomeKey.value = key;
  routerPushByKey(menuItem.name, { params: { id: props.appHomeId ? props.appHomeId : key }, query: { app_id: props.appId } });
}

const expandIcon = () => {
  return undefined;
}


// key firstId 用的都是模块的配置id：moduleConfig_id
const setSelectedKey = (menuType: string, key: string, firstId: string) => {
  // 'init'路由定位到【首页】，未绑定的首页加载第一个菜单，没有菜单显示初始内容
  if ('init' == menuType) {
    selectedFlowKey.value = '';
    selectedHomeKey.value = 'home';
    selectedKey.value = '';
  } else if (menuType.startsWith('flow')) {
    selectedFlowKey.value = key;
    selectedHomeKey.value = '';
    selectedKey.value = '';
  } else {
    selectedFlowKey.value = '';
    selectedHomeKey.value = '';
    selectedKey.value = 'first' == key ? firstId : key;
    let menu: any = findTreeNode(props.menuOption, selectedKey.value);
    currModuleNode && menu && (currModuleNode.value = toRaw(menu.node));
  }
}

const showOption = (key: string) => {
  moduleMenu.value.showOption(key);
}

defineExpose({
  setSelectedKey,
  showOption
})
</script>



<style scoped lang="scss">
.menu {
  :deep(.n-menu-item-content-header) {
    height: 100%;
  }

  :deep(.n-menu--horizontal) {
    --n-item-height: v-bind(headerHeight) !important;
  }
}

.menu-nohover {
  :deep(.n-menu-item-content:hover) {
    &.n-menu-item-content::before {
      background-color: transparent;
    }
  }

}

.menu-hover {
  :deep(.n-menu-item-content:hover) {
    &.n-menu-item-content::before {
      background-color: var(--n-item-color-hover);
    }
  }
}
</style>
