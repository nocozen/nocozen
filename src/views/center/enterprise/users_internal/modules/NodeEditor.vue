<template>
  <ModalDialog @onOkClick="onOkClick" ref="refModal" :title="currTitle[currType]" modal-class="w-100" :footer="true">
    <NFlex class="w-full h-14" align="center" justify="center" :size="0">
      <div class="w-full mx-4">
        <NInput v-model:value="nodeName" placeholder="请输入"></NInput>
      </div>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalDialog from '@/components/advanced/modal-dialog.vue';
import { fetchInsertDept, fetchInsertRole, fetchUpdateDeptName, fetchUpdateRoleName } from '@/service/api';
import { MenuType } from './shares';


interface Emits {
  (e: 'updateData'): void
}

const emit = defineEmits<Emits>();

const refModal = ref();
const nodeName = ref();
const currNode = ref();
const currType = ref();
const currTitle: { [key: string]: string } = {
  [MenuType.DeptEditName]: '修改名称',
  [MenuType.DeptAddChild]: '添加子部门',
  [MenuType.RoleAddGroup]: '添加角色组',
  [MenuType.RoleAddRole]: '添加角色',
  [MenuType.RoleEditName]: '修改名称'
}

const onOkClick = async () => {
  switch (currType.value) {
    case MenuType.DeptAddChild:
      if (nodeName.value && currNode.value) {
        let dept: Meta.Dept = {
          parent_id: currNode.value._id,
          name: nodeName.value,
          en_id: '',
          suf_id: null
        }
        const result = await fetchInsertDept(dept);
        refModal.value.show(false);
      }
      break;
    case MenuType.DeptEditName:
      await fetchUpdateDeptName(currNode.value._id, nodeName.value);
      refModal.value.show(false);
      break;
    case MenuType.RoleEditName:
      await fetchUpdateRoleName(currNode.value._id, nodeName.value);
      refModal.value.show(false);
      break;
    case MenuType.RoleAddGroup:
      if (nodeName.value) {
        let role: Meta.Role = {
          parent_id: '',
          type: 'group',
          name: nodeName.value,
          en_id: '',
          suf_id: null
        }
        const result = await fetchInsertRole(role);
        refModal.value.show(false);
      }
      break;
    case MenuType.RoleAddRole:
      if (nodeName.value) {
        let role: Meta.Role = {
          parent_id: currNode.value._id,
          type: 'role',
          name: nodeName.value,
          en_id: '',
          suf_id: null
        }
        const result = await fetchInsertRole(role);
        console.log(result)
        refModal.value.show(false);
      }
      break;
  }
  emit('updateData')
}

const show = (menuType: MenuType, node?: any) => {
  nodeName.value = '';
  if ([MenuType.DeptEditName, MenuType.RoleEditName].includes(menuType)) {
    nodeName.value = node.label;
  }
  currType.value = menuType;
  currNode.value = node;

  refModal.value.show(true)
}

defineExpose({
  show
})
</script>