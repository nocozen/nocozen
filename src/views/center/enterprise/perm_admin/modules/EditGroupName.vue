<template>
  <ModalDialog @onOkClick="onOkClick" ref="refModal" :title="currTitle" modal-class="w-100" :footer="true">
    <NFlex class="w-full h-14" align="center" justify="center" :size="0">
      <div class="w-full mx-4">
        <NInput v-model:value="groupName" placeholder="请输入"></NInput>
      </div>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalDialog from '@/components/advanced/modal-dialog.vue';
import { fetchNewAdminGroup, fetchUpdateAdminGroup } from '@/service/api';

interface Emits {
  (e: 'updateData'): void
}

const emit = defineEmits<Emits>();

const refModal = ref();
const groupName = ref();
const currGroup = ref();
const currType = ref();
const currTitle = ref()

const onOkClick = async () => {
  if (!groupName.value) return;
  if ('add' == currType.value) {
    const result = await fetchNewAdminGroup({
      name: groupName.value,
      type: 'system',
      member: [],
      appCd: false,
      appPerm: [],
      modulePerm: [],
      deptPerm: [],
      rolePerm: [],
      orgPerm: null,
      en_id: '',
    })
    if ('ok' == result.msg) {
      refModal.value.show(false);
      emit('updateData');
    }
  } else {
    // 修改
    const result = await fetchUpdateAdminGroup(currGroup.value._id, { name: groupName.value});
    if ('ok' == result.msg) {
      refModal.value.show(false);
      emit('updateData');
    }
  }

}

const show = (type: 'add' | 'edit', adminGroup?: Meta.AdminGroup) => {
  groupName.value = '';
  if ('add' == type) {
    currTitle.value = '添加管理组';
  } else {
    currTitle.value = '修改管理组名称';
    adminGroup && adminGroup.name && (groupName.value = adminGroup.name);
  }
  currType.value = type;
  currGroup.value = adminGroup;

  refModal.value.show(true);
}

defineExpose({
  show
})
</script>