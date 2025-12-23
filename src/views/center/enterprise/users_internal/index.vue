<template>
  <NSpace vertical :size="0" class="p-0">
    <NCard :bordered="false" size="small" content-style="padding: 0;">
      <NFlex style="height: calc(100vh - 80px);" :size="0" class="flex flex-nowrap">
        <NSplit direction="horizontal" :resize-trigger-size="2" default-size="210px" :max="0.4" min="210px">
          <template #1>
            <NFlex class="border-b-1 px-4 py-3 text-gray-400 py-2" style="min-width: 210px">用户群体</NFlex>
            <SmoothScrollbar style="height: calc(100vh - 126px);">
              <NFlex class="w-full p-4">
                <NFlex vertical :size="0" class="w-full">
                  <span class="text-gray-400 py-2">成员</span>
                  <NTree block-line :data="memberData" :cancelable="false" v-model:selected-keys="memTreeSelected"
                    :node-props="nodeProps"></NTree>
                  <span class="text-gray-400 py-2">部门</span>
                  <ModuleTree :canEdit="cptAdminPerm" ref="refDeptTree" @onNodeClick="onDeptNodeClick" type="dept">
                  </ModuleTree>
                </NFlex>
                <NFlex vertical class="w-full">
                  <NFlex align="center" justify="space-between">
                    <span class="text-gray-400">角色</span>
                    <EditMenu v-if="cptAdminPerm" :options="roleBaseMenu" :popFunc="menuEvent" node="root"
                      icon="mdi:plus" iconColor="text-blue-500"></EditMenu>
                  </NFlex>
                  <ModuleTree :canEdit="cptAdminPerm" ref="refRoleTree" overrideClick @onNodeClick="onRoleNodeClick"
                    type="role">
                  </ModuleTree>
                </NFlex>
              </NFlex>
            </SmoothScrollbar>
          </template>
          <template #2>
            <NFlex vertical style="height: calc(100vh - 90px);" class="flex-1" :size="0">
              <NFlex class="border-b-1 px-4 py-3"><span>{{ selectedNode.label }}</span></NFlex>
              <NFlex v-if="!cptAdminPerm || !showRowEditBar" class="px-4 my-2 h-11" align="center" :size="0">
                <NFlex class="flex-1">
                  <NButton v-if="cptAdminPerm" size="small" class="w-15" type="info" @click="onAddClick">添加</NButton>
                  <!-- <NButton size="small" class="w-15">导出</NButton> -->
                </NFlex>
                <NPopselect @update:value="onAccActiveFilter" trigger="click" v-model:value="accActiveFilter"
                  :options="filterOptions">
                  <NButton size="small" iconPlacement="right">
                    <template #icon>
                      <SvgIcon icon="mdi:chevron-down"></SvgIcon>
                    </template>
                    {{ filterOptions[accActiveFilter].label }}
                  </NButton>
                </NPopselect>
                <NFlex class="w-40 ml-1">
                  <NInput v-model:value="inputFilterValue" @keyup.enter="onInputFilter('keyup')"
                    @clear="onInputFilter('clear')" clearable size="small"></NInput>
                </NFlex>
              </NFlex>
              <NFlex v-else class="w-min-200 mx-4 my-2 px-1 h-11 bg-gray-200/50" :size="0" align="center">
                <ButtonIcon @click="cancelChecked" size="small" icon="mdi:close"
                  :title="`已选${checkedRowKeys?.length}`" />
                <NDivider vertical style="background-color: gray; opacity: 0.5;" />
                <!-- <ButtonIcon size="small" icon="ic:outline-switch-account" title="调整部门" /> -->
                <!-- <ButtonIcon size="small" icon="mdi:account-check-outline" title="设置角色" /> -->
                <!-- <NDivider vertical style="background-color: gray; opacity: 0.5;" /> -->
                <!-- <ButtonIcon @click="updateAccount({ onJob: false })" size="small" icon="mdi:account-remove-outline"
                  title="转离职" /> -->
                <ButtonIcon @click="updateAccount({ active: true })" size="small" icon="mdi:play-circle-outline"
                  title="启用" />
                <ButtonIcon @click="updateAccount({ active: false })" size="small" icon="mdi:pause-circle-outline"
                  title="停用" />
                <!-- <NDivider vertical style="background-color: gray; opacity: 0.5;" /> -->
                <!-- <ButtonIcon size="small" icon="mdi:export-variant" title="导出" /> -->
                <!-- <NDivider v-if="cptDeptSelected" vertical style="background-color: gray; opacity: 0.5;" /> -->
                <ButtonIcon @click="updateDeptManager" size="small" icon="mdi:account-tag-outline" title="设置部门主管" />
                <ButtonIcon @click="resetPassword()" size="small" icon="mdi:lock-reset" title="重置密码" />
              </NFlex>
              <NDataTable class="h-full px-4" v-model:checked-row-keys="checkedRowKeys" :row-props="onRowClick"
                @update:checked-row-keys="onTableChecked" :row-key="rowKey" :single-line="false" flex-height
                size="small" :columns="columns" :data="data" :pagination="pagination" />
            </NFlex>
          </template>
        </NSplit>
      </NFlex>
    </NCard>
    <EditorDrawer ref="refEditor" @reLoadData="loadData"></EditorDrawer>
  </NSpace>

</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { $t } from '@/locales';
// import { useAppStore } from '@/store/modules/app';
import { NButton, NDataTable, NTag, PaginationProps, TreeOption } from 'naive-ui';
import { fetchSetDeptManager, fetchUpdateAccount, fetchGetAccounts } from '@/service/api';
import ButtonIcon from '@/components/custom/button-icon.vue';
import EditorDrawer from './modules/EditorDrawer.vue';
import ModuleTree from './modules/ModuleTree.vue';
import { Icon } from '@iconify/vue';
import AccInfo from '../../../../components/advanced/acc-info.vue';
import { MenuType } from './modules/shares';
import EditMenu from './modules/EditMenu.vue';
import { useAuthStore } from '@/store/modules/auth';
import { decryptPack } from '@/utils/crypto-msgpack';
import { AdminGroupType } from '@/enum';

// const appStore = useAppStore();
const inputFilterValue = ref();
const selectedNode = ref({ label: '全部成员', key: 'all' } as any);
const showRowEditBar = ref(false);
const checkedRowKeys = ref();   // 绑定account._id
const checkedRows = ref([] as any);
const refDeptTree = ref();
const refEditor = ref();
const columns = ref([] as any);
const data = ref([] as any);
const pageSize = 20;
const memTreeSelected = ref([] as any);
const refRoleTree = ref();

const userAuth = useAuthStore();
const canEdit = ref(false);
const currAuth = ref();

const pagination: PaginationProps = {
  displayOrder: ['pages', 'size-picker', 'quick-jumper'],
  pageSize: pageSize,
  pageCount: 100,
  showQuickJumper: true,
  showSizePicker: true,
}
const accActiveFilter = ref(0);
const memberData = ref();
const filterOptions = [
  { label: '全部', value: 0 },
  { label: '已启动', value: 1 },
  { label: '已停用', value: 2 },
];

const rowKey = (row: any) => row.acc_id;    // 绑定account._id
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


const cptAdminPerm = computed(() => {
  return [AdminGroupType.Creator, AdminGroupType.Super].includes(currAuth.value?.groupRole);
})


const menuEvent = (key: MenuType) => {
  refRoleTree.value.showEditor(key);
}

const cancelChecked = () => {
  checkedRowKeys.value.length = 0;
  checkedRows.value.length = 0;
  showRowEditBar.value = false;
}

const initMemberData = () => {
  memberData.value = [
    {
      label: '全部成员',
      key: 'all',
      prefix: () => h(Icon, { icon: 'mdi:account-tie', class: 'text-green-500 text-lg mb-0.5' })
    },
    {
      label: '离职成员',
      key: 'resign',
      prefix: () => h(Icon, { icon: 'mdi:account-tie', class: 'text-gray-500 text-lg mb-0.5' })
    },
  ]
}

const onTableChecked = (
  keys: Array<string | number>,
  rows: object[],
  meta: { row: object | undefined, action: 'check' | 'uncheck' | 'checkAll' | 'uncheckAll' }) => {
  showRowEditBar.value = (checkedRowKeys.value?.length != 0);
  checkedRows.value = rows;
}

// 批量更新账户状态相关
const updateAccount = async (update: any) => {
  const result = await fetchUpdateAccount(checkedRowKeys.value, update);
  if ('ok' == result.msg) {
    window.$message?.success('操作成功！');
    loadData();
  } else {
    window.$message?.error('操作失败！')
  }
}

const resetPassword = async () => {
  const update = {
    password: 'reset'
  } as any;
  const result = await fetchUpdateAccount(checkedRowKeys.value, update);
  if ('ok' == result.msg) {
    window.$message?.success('密码已重置为手机号后6位！');
  } else {
    window.$message?.error('密码重置失败！')
  }
}

const onAddClick = () => {
  let selectedType = 'other';
  const deptIds = refDeptTree.value.getSelectedKeys();
  const roleIds = refRoleTree.value.getSelectedKeys();
  if (deptIds && deptIds?.length > 0) {
    selectedType = 'dept'
  } else if (roleIds && roleIds?.length > 0) {
    selectedType = 'role'
  }
  refEditor.value && refEditor.value.showAdd(selectedType, selectedNode.value);
}

const rowClassName = (rowData: any) => {
  return rowData.active ? '' : 'active-false'
}

// 
const onRowClick = (rowData: any, rowIndex: number) => {
  return {
    style: 'cursor:pointer',
    onClick: (e: any) => {
      if (![AdminGroupType.Creator, AdminGroupType.Super].includes(currAuth.value?.groupRole)) return;
      // console.log(rowData);
      let className = e.target.className.toString();
      refEditor && (!className.includes('n-checkbox')) && refEditor.value.showEdit(rowData);
    }
  }
}

const nodeProps = ({ option }: { option: TreeOption }) => {
  return {
    onClick() {
      onSelectedMemebers();
      selectedNode.value = option;
    }
  }
}

const onInputFilter = (e: any) => {
  if ('clear' == e) {
    resetFilter();
  } else {
    let accFilter = {} as any;
    if (inputFilterValue.value) {
      accFilter.name = inputFilterValue.value;
      accFilter.loginName = inputFilterValue.value;
      accFilter.nickName = inputFilterValue.value;
      accFilter.code = inputFilterValue.value;
      accFilter.phone = inputFilterValue.value;
      accFilter.email = inputFilterValue.value;
    }
    resetFilter(accFilter)
  }

}

// 账户激活状态过滤
const onAccActiveFilter = (value: any, option: any) => {
  let accFilter = {} as any;
  value > 0 && (accFilter['active'] = value == 1);
  resetFilter(accFilter)
}

const resetFilter = (accFilter?: Meta.Account) => {
  accActiveFilter.value = 0;
  showRowEditBar.value = false;
  checkedRowKeys.value = [];
  loadData(accFilter);
}

// 成员树事件
const onSelectedMemebers = () => {
  refDeptTree.value && refDeptTree.value.cancelSelect();
  refRoleTree.value && refRoleTree.value.cancelSelect();
  let accFilter = {} as any;
  accFilter['onJob'] = 'all' == memTreeSelected.value;
  resetFilter(accFilter);
}

// 部门树事件
const onDeptNodeClick = (option: TreeOption) => {
  selectedNode.value = option;
  memTreeSelected.value = [];
  // initMemberData();   // 解决tab切换背景色不刷新的问题
  refRoleTree.value && refRoleTree.value.cancelSelect();
  resetFilter();
}

// 角色树事件
const onRoleNodeClick = (option: TreeOption) => {
  selectedNode.value = option;
  memTreeSelected.value = [];
  // initMemberData();   // 解决tab切换背景色不刷新的问题
  refDeptTree.value && refDeptTree.value.cancelSelect();
  resetFilter();
}

const loadData = async (filter?: Meta.Account) => {
  data.value = [] as any;
  // 查询；todo: 字段、排序从metas中获取
  // todo: 排序；字段显示；
  let accFilter = {} as any;
  if (filter) {
    accFilter = filter;
    'onJob' in accFilter || (accFilter['onJob'] == false);
  } else {
    accFilter = { onJob: true };
  }

  const deptIds = refDeptTree.value.getSelectedKeys();
  const roleIds = refRoleTree.value.getSelectedKeys();
  let accExtFilter = {} as any;
  deptIds && deptIds?.length == 1 && (accExtFilter = { 'dept._id': deptIds[0] });
  if (roleIds && roleIds?.length == 1) {
    if ('group' == selectedNode.value.type) {
      let keys = refRoleTree.value.getTreeChildren(roleIds[0]);
      accExtFilter = { 'role._id': { $in: keys } };
    } else {
      accExtFilter = { 'role._id': roleIds[0] };
    }
  }
  const findResult = await fetchGetAccounts({ accFilter, accExtFilter });
  if (findResult.msg == 'ok') {
    data.value = findResult.data  //.concat({phone: '1111111', name: 'wwwwwww', email: 'ffsdfsd', en_ids: []});
  }
}

const renderManagerTag = (row: any, index: number) => {
  const dept = refDeptTree.value?.getSelectedNode();
  let tags = [] as any;
  if (dept && dept.manager && dept.manager.findIndex((m: any) => m._id == row.acc_id) != -1) {
    tags = ['主管'];
  } else {
    tags = row.active ? [] : ['停用'];
  }
  let account = { avatar: row.avatar, name: row.name, tags }
  // todo: 企业创建者 admin_group中；
  return h(AccInfo, { account }, {});
}

const renderTags = (data: Array<any>, index: number) => {
  return h('div', { style: 'display: flex; flex-wrap: wrap; gap: 4px;' },
    data.map((dept: Meta.Base) =>
      h(NTag, { type: 'info', size: 'small' }, () => dept.name)
    )
  );
}

const createColumns = () => {
  columns.value = [
    { type: 'selection', fixed: 'left', width: 30 },
    {
      title: '姓名',
      key: 'name',
      // width: 50,
      // fixed: index == 0 ? 'left' : 'false',
      titleAlign: 'start',
      align: 'start',
      ellipsis: {
        tooltip: true
      },
      render: (row: any, index: number) => renderManagerTag(row, index)
    },
    // {
    //   title: '账户名',
    //   key: 'loginName',
    //   // width: 50,
    //   // fixed: index == 0 ? 'left' : 'false',
    //   titleAlign: 'start',
    //   align: 'start',
    //   ellipsis: {
    //     tooltip: true
    //   },
    // },
    {
      title: '所属部门',
      key: 'dept',
      // width: 50,
      // fixed: index == 0 ? 'left' : 'false',
      titleAlign: 'start',
      align: 'start',
      ellipsis: {
        tooltip: true
      },
      render: (row: any, index: number) => renderTags(row.dept, index)
    },
    {
      title: '角色',
      key: 'role',
      // width: 50,
      // fixed: index == 0 ? 'left' : 'false',
      titleAlign: 'start',
      align: 'start',
      ellipsis: {
        tooltip: true
      },
      render: (row: any, index: number) => renderTags(row.role, index)
    },
    {
      title: '手机',
      key: 'phone',
      // width: 50,
      // fixed: index == 0 ? 'left' : 'false',
      titleAlign: 'start',
      align: 'start',
      ellipsis: {
        tooltip: true
      },
    },
    {
      title: '邮箱',
      key: 'email',
      // width: 50,
      // fixed: index == 0 ? 'left' : 'false',
      titleAlign: 'start',
      align: 'start',
      ellipsis: {
        tooltip: true
      },
    },

  ];
}

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);

  }
  // memTreeSelected.value?.length = 0;
  memTreeSelected.value = ['all'];
  initMemberData();
  createColumns();
  // console.log(columns.value)
  await loadData();
}

onMounted(async () => {
  await init();
})

// 更新 部门主管；
const updateDeptManager = async () => {
  const deptId = refDeptTree.value.getSelectedKeys();
  if (deptId) {
    try {
      let managers = [] as any;
      for (let row of checkedRows.value) {
        managers.push({ _id: row.acc_id, name: row.name });
      };
      await fetchSetDeptManager(deptId, managers);
      const dept = refDeptTree.value?.getSelectedNode();
      dept.manager = managers;
      window.$message?.success('设置部门主管成功!')
    } catch (e: any) {
      window.$message?.error('设置部门主管出错！');
      console.log('设置部门主管出错：' + e);
    }
  }
  await loadData();
}

const cptDeptSelected = computed(() => {
  const deptIds = refDeptTree.value.getSelectedKeys();
  if (deptIds && deptIds?.length > 0) {
    return true;
  } else {
    return false;
  }
})
// const latestBuildTime = BUILD_TIME;
</script>



<style lang="scss" scoped>
:deep(.active-false td) {
  background-color: rgb(252, 252, 252) !important;
}

:deep(.n-data-table-td--last-row) {
  border-bottom: solid 1px var(--n-merged-border-color) !important
}

:deep(.n-tree-node) {
  background: none;
  align-items: center;
  height: 32px;
  /* 设置为你需要的高度 */
  line-height: 32px;
  /* 通常需要设置行高以垂直居中 */
}
</style>
