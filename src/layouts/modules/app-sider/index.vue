<template>
  <DarkModeContainer class="select-none group size-full flex-col shadow-sider" :inverted="darkMenu">
    <MenuToggler class="hidden group-hover:flex absolute top-3 -right-3 z-10 " arrowIcon
      :collapsed="appStore.siderCollapse" @click="appStore.toggleSiderCollapse" />
    <NFlex justify="center" class="my-1" :class="{ 'pr-1': !appStore.siderCollapse }">
      <AppButton @appBtnClick="appBtnClick" size='md' :disabledTooltip="false" bgScope="all"
        :titlePosition="showAppTitle" tooltipPlacement="bottom" :appList="appList"></AppButton>
    </NFlex>
    <AppMenu ref="appMenu" :appHomeId="appHomeId" :menuOption="appMenuData" :openEditor="openEditor"
      :editModule="editModule" :popFunc="openEditor" :dark-theme="darkMenu" :appId="appId"
      :canEdit="cptEditModulePerm" />
    <NFlex class="border-t-1" v-if="cptEditModulePerm">
      <ButtonIcon @click="routeTo" icon="mdi:cog-outline" :title="appStore.siderCollapse ? '' : '应用管理'" type="default" class="rounded-none w-full"></ButtonIcon>
    </NFlex>
    <FormEditor ref="formEditor"></FormEditor>
    <AddApp ref="refAddApp" @refreshMenu="refreshMenu"></AddApp>
  </DarkModeContainer>
</template>

<script setup lang="ts">
import { computed, h, watch, provide, inject, ref, onMounted } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import AppMenu from '../global-menu/app-menu.vue';
import { RouteMap, useRoute } from 'vue-router';
import AppButton from './components/app-button.vue';
import { useRouterPush } from '@/hooks/common/router';
import { filterModuleId, reOrderListBySufId } from '@/utils/dataHelper';
import { ProviderName, MenuEventType, ModuleType, AppRouteType, AdminGroupType } from '@/enum';
import { fetchGetAppList, fetchGetAppModules, fetchMarkModuleDelete, fetchUpdateModuleOrder, getMyMenuTree, getUserAppPerm } from '@/service/api';
import { arrToMenu } from '@/utils/arrayToTree';
import { reOrderTreeBySufId } from '@/utils/dataHelper';
import { useAuthStore } from '@/store/modules/auth';
import { isEmpty } from 'radashi';
import { decryptPack } from '@/utils/crypto-msgpack';

defineOptions({
  name: 'AppSider'
});
const route = useRoute();
const { routerPush, routerPushByKey } = useRouterPush();

const appStore = useAppStore();
const themeStore = useThemeStore();

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix');
const darkMenu = computed(() => !themeStore.darkMode && !isHorizontalMix.value && themeStore.sider.inverted);
const showAppTitle = computed(() => {
  return appStore.siderCollapse ? 'none' : 'auto'
});
const appId = ref('');
const appList = ref();
const formEditor = ref();
const refAddApp = ref();
const appMenuData = ref([] as any);
const appMenu = ref();
const firstMenu = ref();    // 首页存在绑定的值为'home'(绑定值要传给home菜单)，未绑定的值第一个菜单项；
const appHomeId = ref();

const updateModuleOrder = async (moduleOption: Array<Meta.Node>) => {
  const result = await fetchUpdateModuleOrder(moduleOption);
  await refreshMenu();
}

provide('updateModuleOrder', updateModuleOrder);

const openModuleAdd = inject<any>(ProviderName.OpenModuleAddProvide);
const openModuleEdit = inject<any>(ProviderName.OpenModuleEditProvide);

const userAuth = useAuthStore();
const currAuth = ref();

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
  appList.value = await getUserAppPerm(currAuth.value);
}

const cptEditModulePerm = computed(() => {
  let result = false;
  if (appId.value == 'flowCenter') return false;
  if ([AdminGroupType.Creator, AdminGroupType.Super].includes(currAuth.value?.groupRole)) {
    result = true;
  } else {
    result = currAuth.value?.agAppPerm.includes(appId.value)
  }
  return result;
})


const refreshMenu = async () => {
  getAppMenus();
  setSelectedKey();
}

const routeTo = () => {
  const appName = appList.value.find((app: Meta.AppNode) => app._id == appId.value).name;
  let from = route.query['from'];
  let curr = route.path.split('/', 3).join('/');
  if (from == curr) {
    routerPush({ path: `/backend/app/form-import/${appId.value}`, query: { name: appName, from: route.path } })
  } else {
    routerPush({ path: `/backend/app/form-import/${appId.value}`, query: { name: appName, from: route.path } })
  }
}

// 查询应用下的模块提供菜单数据；
const getAppMenus = async () => {
  if (!appId.value) return;
  // const menuResult = await getMyMenuTree({app_id: appId.value });
  const result = await fetchGetAppModules({ app_id: appId.value });
  if ('ok' == result.msg) {
    let menus = result.data.map((m: Meta.ModuleNode) => {
      return {
        key: 'group' == m.type ? m._id : m.moduleConfig_id,
        _id: m._id,
        parentId: m.parent_id,
        suf_id: m.suf_id,
        parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
        moduleType: m.type,   // type: group 是naive使用的属性和值，不要重复；
        // icon: m.icon,   //renderIcon(`mdi:${m.icon}`, m.iconColor),
        // label: m.name,  //renderMenuLabel(m),
        routeKey: 'app_module',
        // routePath: getRoutePath(m.type, m._id)
        node: m,
      }
    })

    menus = [{ key: appId.value, _id: appId.value, parentId: '' } as any, ...menus]
    let tree = arrToMenu(menus);
    let reOrderTree = reOrderTreeBySufId(tree[0].children);
    const app = appList.value?.find((app: any) => app._id == appId.value);
    appHomeId.value = app?.home_id;
    if (app) {
      if (['creator', 'super', 'system', 'app'].includes(app.groupRole)) {
        appMenuData.value = reOrderTree;
      } else {
        // const mf_ids = app?.app_perm?.map((m: any) => m.module_id);
        // app?.module_ids 允许访问的模块id集合
        let filterData = reOrderTree
          .map((node: any) => filterModuleId(node, app?.module_ids))
          .filter((node: any) => {
            if (!isEmpty(node)) { return node }
          });
        appMenuData.value = filterData;
        if (appMenuData.value.length > 0 && ModuleType.Group != appMenuData.value[0].type && !firstMenu.value) {
          firstMenu.value = appMenuData.value[0].node;
        }
      }
    }

  }
}

// 进入首页的逻辑：无模块管理员可进入，普通用户不能进入；有模块绑定首页进入后打开首页，无绑定打开第一个模块；
// 针对普通用户：禁用首页可以把app.home_id置空；启用首页需要给首页绑定模块；
const appBtnClick = (app: any) => {
  let from = route.query['from'];
  let curr = route.path.split('/', 3).join('/');
  let path = '/app/';
  if (app.home_id) {
    path += `init/${app.home_id}`;
  } else {
    path += 'init/first';   // todo:
  }

  if (from == curr) {
    routerPush({ path: path, query: { from: from, app_id: app._id } })
  } else {
    routerPush({ path: path, query: { from: curr, app_id: app._id } })
  }
}

// init/home_id, init/first
const setSelectedKey = async () => {
  if (!appMenu.value) return;
  let routeType = route.path.split('/')[2];
  let key = route.path.split('/')[3];

  if (!routeType.startsWith('flow')) {
    // 如果存在至少一个功能模块，则首页打开的是第一个功能模块，不存在显示初始信息；
    if ('first' == key) {   // 注意menu key 用的是模块的配置ID: moduleConfig_id
      if (firstMenu.value) {
        const routeKey = AppRouteType.AppModule;
        routerPushByKey(routeKey, { params: { id: firstMenu.value.moduleConfig_id }, query: { app_id: appId.value } });
        appMenu.value.setSelectedKey('module', 'first', firstMenu.value.moduleConfig_id);
      } else {  // 第一个模块未赋值则定位【首页】
        appMenu.value.setSelectedKey('init', null, null);
      }
    } else {
      appMenu.value.setSelectedKey(routeType, route.params['id'], null);
    }
    if (route.query.open) {
      appMenu.value.showOption(route.params['id']);
    }
  } else {
    appMenu.value.setSelectedKey(routeType, 'app_' + routeType, null);
  }
}

const getApp = async (id: any) => {
  appId && (appId.value = id);
  await init();
  await getAppMenus();
  await setSelectedKey();
}

watch(
  () => route,
  async (newValue, oldValue) => {
    if (newValue.query.app_id) {
      await getApp(newValue.query.app_id);
    }
  },
  { immediate: true, deep: true }
);

// 标记模块【删除】
const markMoudleDelete = async (node: any) => {
  // 修改前置节点的suf_id为后置节点；同时标记删除(suf_id='delete')，
  // 处理第一个和最后一个节点删除的特殊情况
  let options: Array<Meta.Order> = [{ _id: node._id, suf_id: node.suf_id }];
  const result = await fetchMarkModuleDelete(options);
  if (result.msg == 'ok') {
    await refreshMenu();
    appBtnClick(appList.value.find((app: any) => app._id == appId.value));
    // window.$message?.success(`删除【${node.name}】成功！`);
  } else {
    window.$message?.error(`删除【${node.name}】出错了！`);
  }
}

// 添加表单打开编辑面板，可操作添加的节点是app、group；可操作修改、删除的是module;
const openEditor = async (eventType: string, node: any) => {  // 当前节点作为父节点
  if ([MenuEventType.AddFlowModule, MenuEventType.AddFormModule, MenuEventType.AddBoardModule].includes(eventType as any)) {   // 添加流程表单
    await openModuleAdd(eventType, appId.value, node);
  } else if (eventType == MenuEventType.ModuleAddGroup) {  // 添加分组
    await refAddApp.value.openAdd(eventType, appId.value, node);
  } else if (eventType == MenuEventType.ModuleAddSubGroup) {  // 添加子分组
    await refAddApp.value.openAdd(eventType, appId.value, node);
  }
  await refreshMenu();
}

const editModule = async (eventType: string, node: any) => {  // 当前节点
  if (eventType == MenuEventType.ModuleEditLabel) {
    await refAddApp.value.openEdit(eventType, node);
  } else if (eventType == MenuEventType.ModuleGroupEditLabel) {
    await refAddApp.value.openEdit(eventType, node);
  } else if (eventType == MenuEventType.ModuleDelete) {
    await markMoudleDelete(node)
  } else if (MenuEventType.EditModule == eventType) {   // 编辑表单、流程表单、报表
    await openModuleEdit(eventType, appId.value, node);
  }
}

defineExpose({
  refreshMenu
})
</script>


<style scoped lang="scss"></style>
