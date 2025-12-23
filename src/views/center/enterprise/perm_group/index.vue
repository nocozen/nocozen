<template>
  <NFlex vertical :size="0" class="p-0">
    <NCard :bordered="false" size="small" content-style="padding: 0;" class="h-full">
      <NSplit direction="horizontal" :resize-trigger-size="2" :default-size="0.26" :max="0.6" min="230px">
        <template #1>
          <NTabs @update-value="resetFilter" class="p-4" size="small" type="segment" animated>
            <NTabPane name="oasis" tab="成员" style="height: calc(100vh - 150px);">
              <SmoothScrollbar class="acclist pl-1">
                <NTree :render-label="memberRenderLabel" block-line :data="memberData" :cancelable="false"
                  v-model:selected-keys="memTreeSelected" :node-props="memberNodeProps"></NTree>
              </SmoothScrollbar>
            </NTabPane>
            <NTabPane name="the beatles" tab="部门" style="height: calc(100vh - 150px);">
              <SmoothScrollbar>
                <ModuleTree ref="refDeptTree" @onNodeClick="onDeptNodeClick" type="dept" />
              </SmoothScrollbar>
            </NTabPane>
            <NTabPane name="jay chou" tab="角色" style="height: calc(100vh - 150px);">
              <ModuleTree ref="refRoleTree" overrideClick @onNodeClick="onRoleNodeClick" type="role" />
            </NTabPane>
          </NTabs>
        </template>
        <template #2>
          <NFlex vertical class="p-4" style="height: calc(100vh - 80px);">
            <NFlex align="center" class="mt-1">
              <ButtonIcon v-if="showSelected" @click="resetFilter" class="h-8" level="secondary" type="tertiary"
                size="small" icon="mdi:close" :title="`已选:${selectedNode.label}`"></ButtonIcon>
              <span v-else class="h-8">全部</span>
            </NFlex>
            <NFlex class="bg-gray-200/50 px-2 min-h-9 w-full" align="center">
              <span class="flex-1">模块名称</span>
              <span class="w-26 ">操作</span>
            </NFlex>
            <NTree :renderPrefix="renderPrefix" :renderSuffix="renderSuffix" v-model:expanded-keys="expandedKeys"
              class="h-full" size="small" :data="data" block-line />
          </NFlex>
        </template>
      </NSplit>
    </NCard>
    <OrgMemberChecker ref="refOrg" @onCheckedOk="onOrgMemCheckedOk"></OrgMemberChecker>
    <AddCustomPg ref="refEditCustomPg"></AddCustomPg>
  </NFlex>

</template>

<script setup lang="ts">
import { ref, h, provide } from 'vue';
import { NButton, type TreeOption } from 'naive-ui';
import ModuleTree from '../users_internal/modules/ModuleTree.vue';
import AccInfo from '@/components/advanced/acc-info.vue';
import { fetchGetPermGroups, fetchGetAppModules, fetchGetAppList, fetchUpdateModulePg, getPermMenuTree } from '@/service/api';
import { Icon } from '@iconify/vue';
import WrapIcon from '@/components/custom/wrap-icon.vue';
import { MemberCheckerType } from '@/enum';

const showSelected = ref(false);
const expandedKeys = ref([] as any);
const selectedNode = ref();
const refDeptTree = ref();
const memTreeSelected = ref([] as any);
const refRoleTree = ref();
const memberData = ref([] as any);
const currPg = ref<Meta.ModulePermGroup>({} as any);
const refOrg = ref();
const refEditCustomPg = ref();

const data = ref([] as any)

const renderPrefix = (info: { option: any, checked: boolean, selected: boolean }) => {
  if ('app' == info.option.type) {
    return h(WrapIcon, { wrapType: 'conic', radius: 4, icon: `mdi:${info.option.icon}`, color: info.option.iconColor });
  } else if (info.option.type == 'group') {
    if (expandedKeys.value.includes(info.option.key)) {
      return h(Icon, { icon: 'mdi:folder-open', class: 'text-2xl text-blue-500' });
    } else {
      if (info.option.children) {
        return h(Icon, { icon: 'mingcute:folder-2-fill', class: 'text-2xl text-blue-500' });
      } else {
        return h(Icon, { icon: 'mingcute:folder-2-fill', class: 'text-2xl text-blue-500/60' });
      }
    }
  } else if (['form', 'flow', 'board'].includes(info.option.type)) {
    return h(WrapIcon, { icon: `mdi:${info.option.icon}`, color: info.option.iconColor });
  } else {
    return undefined;
  }
}

const openEditor = (type: 'member' | 'perm', option: Meta.ModulePermGroup) => {
  currPg.value = option;
  if ('member' == type) {
    refOrg.value.show(['dept', 'role', 'member'], option);
  } else {
    refEditCustomPg.value.show(option);
  }
}

// todo: 调整权限暂未完成
const renderSuffix = (info: { option: any, checked: boolean, selected: boolean }) => {
  if (['app', 'form', 'flow', 'board', 'group'].includes(info.option.type)) {
    return undefined;
  } else {
    return [
      h(NButton, { size: 'tiny', type: 'info', text: true, class: 'mr-2', onClick: () => openEditor('member', info.option.option) }, () => '调整成员'),
      h(NButton, { size: 'tiny', type: 'info', text: true, disabled: true, onClick: () => openEditor('perm', info.option.option) }, () => '调整权限')
    ];
  }
}


const init = async () => {
  let memberSet = new Map();
  // 查询所有权限组的成员
  let filter = null as any;
  if (selectedNode.value) {
    if ('member' == selectedNode.value.tagType) {
      filter = { 'accountAuth': [selectedNode.value.key] };
    } else if ('dept' == selectedNode.value.tagType) {
      // 部门要包含所有子部门，filter中要包含prentids
      filter = { 'deptAuth': [selectedNode.value.key, ...selectedNode.value.parentIds] };
    } else if ('role' == selectedNode.value.tagType) {
      if ('group' == selectedNode.value.type) {
        let keys = refRoleTree.value.getTreeChildren(selectedNode.value.key);
        filter = { 'roleAuth': keys };
      } else {
        filter = { 'roleAuth': [selectedNode.value.key] };
      }
    }
  }

  const pgResult = await fetchGetPermGroups({});
  const moduleResult = await fetchGetAppModules({});
  const appResult = await fetchGetAppList();
  if ('ok' == pgResult.msg) {
    pgResult.data?.forEach((d: Meta.ModulePermGroup) => {
      d.accountAuth?.forEach((a: Meta.AccBase) => {
        memberSet.set(a._id, { label: a.name, key: a._id, avatar: a.avatar })
      });
    })
    // 应用树：模块集合、权限组集合合并；
    if ('ok' == moduleResult.msg && 'ok' == appResult.msg) {
      data.value = getPermMenuTree(filter, appResult.data, moduleResult.data, pgResult.data);
    }
  }
  memberData.value = [...memberSet.values()];
}

init();

provide('refresh', init);

const resetFilter = () => {
  selectedNode.value = null;
  showSelected.value = false;
  memTreeSelected.value = [];
  refRoleTree.value && refRoleTree.value.cancelSelect();
  refDeptTree.value && refDeptTree.value.cancelSelect();
  init();
}

const memberRenderLabel = (info: { option: any, checked: boolean, selected: boolean }) => {
  let name = info.option.label ? info.option.label : '';
  let avatar = info.option.avatar ? info.option.avatar : ''
  return h(AccInfo, { account: { name: name, avatar: avatar }, textWidth: '30' })
}

const memberNodeProps = ({ option }: { option: TreeOption }) => {
  return {
    onClick() {
      selectedNode.value = { ...option, tagType: 'member' };
      showSelected.value = true;
      init();
    }
  }
}

// 部门树事件
const onDeptNodeClick = (option: TreeOption) => {
  selectedNode.value = option;
  memTreeSelected.value = [];
  refRoleTree.value && refRoleTree.value.cancelSelect();
  showSelected.value = true;
  init();
}

// 角色树事件
const onRoleNodeClick = (option: TreeOption) => {
  selectedNode.value = option;
  memTreeSelected.value = [];
  refDeptTree.value && refDeptTree.value.cancelSelect();
  showSelected.value = true;
  init();
}

// 成员添加确认提交
const onOrgMemCheckedOk = async (orgType: MemberCheckerType, values: Array<Meta.Tag>) => {
  currPg.value.deptAuth = [];
  currPg.value.roleAuth = [];
  currPg.value.accountAuth = [];
  values.forEach((v: Meta.Tag) => {
    if ('dept' == v.type) {
      currPg.value.deptAuth.push({ _id: v.value, name: v.label })
    } else if ('role' == v.type) {
      currPg.value.roleAuth.push({ _id: v.value, name: v.label })
    } else if ('member' == v.type) {
      currPg.value.accountAuth.push({ _id: v.value, name: v.label, avatar: v.avatar })
    }
  })
  if (currPg.value._id) {
    const result = await fetchUpdateModulePg(currPg.value._id,
      { deptAuth: currPg.value.deptAuth, roleAuth: currPg.value.roleAuth, accountAuth: currPg.value.accountAuth });
    if ('ok' == result.msg) {
      init();
    }
  }
}

</script>

<style lang="scss" scoped>
.acclist {
  :deep(.n-tree .n-tree-node-switcher.n-tree-node-switcher--hide) {
    display: none;
  }
}
</style>
