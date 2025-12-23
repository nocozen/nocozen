<template>
  <div v-if="!checkable">
    <template v-if="canEdit">
      <n-tree v-if="data && data?.length > 0" v-model:selected-keys="selectedKeys" @drop="onDrop"
        :renderPrefix="renderPrefix" :renderSuffix="renderSuffix" block-line :data="data" :node-props="nodeProps"
        v-model:expanded-keys="expandedKeys" :render-switcher-icon="renderSwitcherIcon" :cancelable="false"
        :draggable="'role' != type" @update:selected-keys="updateSelectedKeys"></n-tree>
    </template>
    <template v-else>
      <n-tree v-if="data && data?.length > 0" v-model:selected-keys="selectedKeys" :renderPrefix="renderPrefix"
        block-line :data="data" :node-props="nodeProps" v-model:expanded-keys="expandedKeys"
        :render-switcher-icon="renderSwitcherIcon" :cancelable="false"
        @update:selected-keys="updateSelectedKeys"></n-tree>
    </template>
  </div>
  <div v-else>
    <n-tree v-if="data && data?.length > 0" v-model:selected-keys="selectedKeys" v-model:checked-keys="checkedKeys"
      :renderPrefix="renderPrefix" block-line :data="data" :node-props="nodeProps" v-model:expanded-keys="expandedKeys"
      :render-switcher-icon="renderSwitcherIcon" :cancelable="false" @update:checked-keys="updateCheckedKeys"
      :check-on-click="true" :checkable="checkable" :checkbox-placement="checkboxPlace"></n-tree>
  </div>
  <NodeEditor ref="refEditDialog" @updateData="initData"></NodeEditor>
</template>

<script lang="ts" setup>
import type { TreeOption } from 'naive-ui'
import { watch, ref, h, onMounted } from 'vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { Icon } from '@iconify/vue';
import { MenuType } from './shares';
import EditMenu from './EditMenu.vue';
import {
  fetchGetDept,
  fetchUpdateDeptOrder,
  fetchDeleteDept,
  fetchGetRole,
  fetchUpdateRoleOrder,
  fetchDeleteRole,
} from '@/service/api';
import { arrToMenu } from '@/utils/arrayToTree';
import { reOrderTreeBySufId } from '@/utils/dataHelper';
import NodeEditor from './NodeEditor.vue';

// todo: 鼠标hover事件显示进入节点的suffix图标，在鼠标事件中判断当前进入的节点；

interface Props {
  canEdit?: boolean;
  checkable?: boolean;
  type: 'dept' | 'role';
  overrideClick?: boolean;
  checkboxPlace?: 'right' | 'left',
  deptCascade?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  deptCascade: false,
  canEdit: false,
  checkable: false,
  checkboxPlace: 'left'
})

interface Emits {
  (e: 'onNodeClick', option: TreeOption): void,
  (e: 'onChecked', meta: { node: TreeOption | null, action: 'check' | 'uncheck' }, groupCheck?: boolean): void
}

const emit = defineEmits<Emits>()

const refEditDialog = ref();
const expandedKeys = ref([] as any);

const data = ref();
const checkedKeys = ref([] as any);
const selectedKeys = ref([] as any);
const selectedNode = ref([] as any);
const treeLevel = ref(0);

const renderIcon = (icon: string) => {
  return () => h(SvgIcon, { icon, class: '' })
}

const deptBaseMenu = [
  {
    icon: renderIcon('line-md--edit'),
    label: '修改名称',
    key: MenuType.DeptEditName
  },
  {
    icon: renderIcon('hugeicons--node-add'),
    label: '新增子部门',
    key: MenuType.DeptAddChild
  }
];

const deptMenu = [...deptBaseMenu,
{
  icon: renderIcon('mdi:account-tag-outline'),
  label: '设置部门主管',
  key: MenuType.DeptSetDeptHead
},
{
  icon: renderIcon('mdi:trash-can-outline'),
  label: '删除',
  key: MenuType.DeptDelete
}
]

const roleGroupMenu = [
  {
    icon: renderIcon('line-md--edit'),
    label: '修改名称',
    key: MenuType.RoleEditName
  },
  {
    icon: renderIcon('mdi:account-check-outline'),
    label: '新增角色',
    key: MenuType.RoleAddRole
  },
  {
    icon: renderIcon('mdi:trash-can-outline'),
    label: '删除',
    key: MenuType.RoleDelete
  }
];

const roleMenu = [
  {
    icon: renderIcon('line-md--edit'),
    label: '修改名称',
    key: MenuType.RoleEditName
  },
  {
    icon: renderIcon('mdi:trash-can-outline'),
    label: '删除',
    key: MenuType.RoleDelete
  }
]

const renderSuffix = (info: { option: TreeOption, checked: boolean, selected: boolean }) => {
  if (info.selected || info.checked) {
    let options = null;
    if ('role' == props.type) {
      options = 'group' == info.option.type ? roleGroupMenu : roleMenu;
    } else {
      options = info.option.parent_id ? deptMenu : deptBaseMenu;
    }
    return h(EditMenu, { popFunc: menuEvent, options: options, node: info.option });
  } else {
    return undefined;
  }
}

const nodeProps = ({ option }: { option: TreeOption }) => {
  return {
    onClick() {
      emit('onNodeClick', option);
      if (!option.children && !option.disabled) {
      }
    }
  }
}

const renderPrefix = (info: { option: TreeOption, checked: boolean, selected: boolean }) => {
  if ('dept' == props.type) {
    return h(Icon, { icon: 'mdi:account-multiple', class: 'text-green-500' });
  } else {
    if (info.option.type == 'group') {
      if (expandedKeys.value.includes(info.option.key)) {
        return h(Icon, { icon: 'mdi:folder-open', class: 'text-base text-blue-500' });
      } else {
        if (info.option.children) {
          return h(Icon, { icon: 'mingcute--folder-2-fill', class: 'text-base text-blue-500' });
        } else {
          return h(Icon, { icon: 'mingcute--folder-2-fill', class: 'text-base text-blue-500/60' });
        }
      }
    } else {
      return h(Icon, { icon: 'mdi:account-multiple-check', class: 'text-base text-blue-500' });
    }
  }
}

const renderSwitcherIcon = ({ expanded }: { expanded: boolean }) => {
  const icon = expanded ? 'fluent--organization-horizontal-24-regular' : 'fluent--organization-horizontal-24-filled'
  return h(Icon, { icon: icon, class: 'text-gray-500' });
}

// 获取树的最大层级
function getMaxDepth(nodes: Array<any>): number {
  if (!nodes || nodes?.length === 0) {
    return 0;
  }

  let maxChildDepth = 0;
  for (const node of nodes) {
    const childDepth = node.children ? getMaxDepth(node.children) + 1 : 0;
    if (childDepth > maxChildDepth) {
      maxChildDepth = childDepth;
    }
  }
  return maxChildDepth;

}

const getDeptData = async () => {
  const result = await fetchGetDept();
  if ('ok' == result.msg && result.data?.length > 0) {
    let menus = result.data.map((d: any) => {
      // todo: TreeOption之外的属性放到node属性中；
      return {
        key: d._id,
        value: d._id,
        _id: d._id,               // reOrderTreeBySufId 需要
        label: d.name,
        name: d.name,
        parentId: d.parent_id,    // 转树形结构需要
        parent_id: d.parent_id,   // 冗余容错避免错误
        manager: d.manager,
        suf_id: d.suf_id,
        parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
        tagType: 'dept'
      }
    })

    let tree = arrToMenu(menus);
    treeLevel.value = getMaxDepth(tree);
    let reOrderTree = reOrderTreeBySufId(tree as any)
    data.value = reOrderTree;
    expandedKeys.value = [data.value[0].key];
  }
}

const getRoleData = async () => {
  const result = await fetchGetRole();
  if ('ok' == result.msg && result.data?.length > 0) {
    let menus = result.data.map((d: any) => {
      // todo: TreeOption之外的属性放到node属性中；
      return {
        key: d._id,
        value: d._id,
        _id: d._id,               // reOrderTreeBySufId 需要
        label: d.name,
        name: d.name,
        parentId: d.parent_id,    // 转树形结构需要
        parent_id: d.parent_id,   // 冗余容错避免错误
        type: d.type,   // group role
        suf_id: d.suf_id,
        parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
        tagType: 'role'
      }
    })
    menus = [{ key: result.data[0].en_id, _id: result.data[0].en_id, parentId: '' } as any, ...menus]
    let tree = arrToMenu(menus);
    let reOrderTree = reOrderTreeBySufId(tree[0].children)
    data.value = reOrderTree;
    data.value?.length > 0 && (expandedKeys.value = data.value.map((d: any) => d.key))
  }
}

const initData = async () => {
  checkedKeys.value = [];
  selectedKeys.value = [];
  selectedNode.value = [];
  if ('dept' == props.type) {
    await getDeptData();
  } else {
    await getRoleData();
  }

  // initCheckedKeys 会在await过程中执行，所以await之后才可以同时访问最新的checkedKeys.value 和 data.value
  // 在initCheckedKeys时无法访问最新的data.value
  if ('dept' == props.type) {
    // 选中节点的子节点禁用
    checkedKeys.value?.forEach((k: any) => {
      let node = data.value.find((d: any) => d._id == k);
      if (node && node.children && node.children?.length > 0 && props.deptCascade) {
        disabledChildren(node.children, true);
      }
    })
  }
}

onMounted(async () => {
  await initData();
})

const menuEvent = async (key: MenuType, node?: any) => {
  switch (key) {
    case MenuType.DeptAddChild:
      let dept: Meta.Dept = {
        _id: node.key,
        parent_id: node.parentId,
        name: node.label,
        manager: node.manager,
        en_id: '',
        suf_id: node.suf_id,
      }
      refEditDialog.value.show(key, dept);
      break;
    case MenuType.DeptEditName:
      refEditDialog.value.show(key, node);
      break;
    case MenuType.DeptDelete:
      node && await fetchDeleteDept([node as Meta.Order]);
      await getDeptData();
      break;
    // 角色
    case MenuType.DeptSetDeptHead:
      //
      break;
    case MenuType.RoleAddGroup:
      //
      refEditDialog.value.show(key);
      break;
    case MenuType.RoleAddRole:
      //
      let role: Meta.Role = {
        _id: node._id,
        parent_id: node.parentId,
        type: 'role',
        name: node.name,
        en_id: '',
        suf_id: null
      }
      refEditDialog.value.show(key, role);
      break;
    case MenuType.RoleEditName:
      refEditDialog.value.show(key, node);
      break;
    case MenuType.RoleDelete:
      node && await fetchDeleteRole([node as Meta.Order]);
      await getRoleData();
      break;
  }

}

const onDrop = async (data: { node: TreeOption, dragNode: TreeOption, dropPosition: 'before' | 'inside' | 'after', event: DragEvent }) => {
  // 当前节点
  let currNode = {
    _id: data.dragNode._id,
    suf_id: data.dragNode.suf_id,
    parent_id: data.dragNode.parent_id
  } as any;
  // 新插入位置的节点，区分插入位置；'before' | 'inside' | 'after'
  let newSufNode = {
    _id: data.node._id,
    suf_id: data.node.suf_id,
    parent_id: data.node.parent_id,
    dropPosition: data.dropPosition
  } as any;

  if ((data.dragNode.suf_id == data.node._id && 'before' == data.dropPosition) ||
    (data.dragNode._id == data.node.suf_id && 'after' == data.dropPosition)) {
    return;
  }
  if ('dept' == props.type) {
    await fetchUpdateDeptOrder([currNode, newSufNode]);
    await getDeptData();
  } else {
    await fetchUpdateRoleOrder([currNode, newSufNode]);
    await getRoleData();
  }

}

const showEditor = async (key: MenuType) => {
  refEditDialog.value.show(key);
}

const cancelSelect = () => {
  selectedKeys.value.length = 0;
  selectedNode.value = [];
}
const getSelectedKeys = () => {
  return selectedKeys.value;
}

const updateSelectedKeys = (
  keys: Array<string | number>,
  option: Array<TreeOption | null>,
  meta: { node: TreeOption | null, action: 'select' | 'unselect' }) => {
  selectedNode.value = meta.node;
  // emit('onSelected', meta.node)
}

const disabledChildren = (children: Array<any>, disabled: boolean, unCheckChildren?: Array<any>) => {
  children?.forEach((c: any) => {
    c.checkboxDisabled = disabled;
    if (checkedKeys.value.includes(c.key)) {
      removeCheckedKey(c.key);
      unCheckChildren && unCheckChildren.push(c);
    }
    if (c.children) {
      disabledChildren(c.children, disabled, unCheckChildren)
    }
  });
}

const updateCheckedKeys = (
  keys: Array<string | number>,
  option: Array<TreeOption | null>,
  meta: { node: TreeOption | null, action: 'check' | 'uncheck', unCheckChildren?: Array<any> }) => {
  if ('dept' == props.type) {
    if (props.deptCascade) {
      let unCheckChildren = [] as any;
      meta.node?.children && disabledChildren(meta.node?.children, 'check' == meta.action, unCheckChildren);
      meta.unCheckChildren = unCheckChildren;
    }
    emit('onChecked', meta);
  } else if ('role' == props.type) {
    if ('role' == meta.node?.type) {    // role | group
      emit('onChecked', meta);
    } else {
      if (props.deptCascade) {
        let unCheckChildren = [] as any;
        meta.node?.children && disabledChildren(meta.node?.children, 'check' == meta.action, unCheckChildren);
        meta.unCheckChildren = unCheckChildren;
      }
      emit('onChecked', meta, true);
    }
  }

}

const getSelectedNode = () => {
  return selectedNode.value
}

const removeCheckedKey = (key: string) => {
  checkedKeys.value = checkedKeys.value.filter((k: string) => k != key)
}

const removeCheckedKeys = (keys: Array<string>) => {
  checkedKeys.value = checkedKeys.value.filter((k: string) => !keys.includes(k));
}

const initCheckedKeys = async (keys: Array<string>) => {
  checkedKeys.value = keys;
}

const getTreeChildren = (key: string) => {
  let node = data.value.find((d: any) => d.key == key);
  if (node.children) {
    return node.children.map((n: any) => n.key);
  } else {
    return [];
  }
}

const getTreeLevel = () => {
  return treeLevel.value;
}


defineExpose({
  getTreeLevel,
  cancelSelect,
  getSelectedKeys,
  getSelectedNode,
  showEditor,
  removeCheckedKey,
  removeCheckedKeys,
  initCheckedKeys,
  getTreeChildren
})
</script>

<style lang="scss" scoped>
// :deep(.n-tree-node) {
//   align-items: center;
//   height: 32px; /* 设置为你需要的高度 */
//   line-height: 32px; /* 通常需要设置行高以垂直居中 */
// }
</style>
