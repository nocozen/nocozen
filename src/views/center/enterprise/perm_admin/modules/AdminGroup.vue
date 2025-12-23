<template>
  <NFlex v-if="adGroup && adGroup.type == 'super'" vertical class="m-4">
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">系统管理员</span>
      <NDynamicTags :render-tag="renderTags" v-model:value="superMemberValue" size="small"
        class="flex-1 p-1 min-h-15 border-1 border-dashed cursor-pointer" @click="openChecker('super')">
        <template #trigger="{ activate, disabled }">
          <NButton class="w-30 h-full" text :disabled="disabled">
            <template v-if="superMemberValue?.length == 0">
              <Icon class="text-blue" icon="mdi:plus"></Icon>
              <span class="text-blue">添加管理员</span>
            </template>
          </NButton>
        </template>
      </NDynamicTags>
    </NFlex>
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">应用权限</span>
      <span class="text-gray">拥有所有应用权限</span>
    </NFlex>
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">通讯录权限</span>
      <span class="text-gray">拥有所有通讯录权限</span>
    </NFlex>
  </NFlex>
  <NFlex v-if="adGroup && adGroup.type == 'system'" vertical class="m-4">
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">管理员</span>
      <NDynamicTags :render-tag="renderTags" v-model:value="memberValue" size="small"
        class="flex-1 p-1 min-h-15 border-1 border-dashed cursor-pointer" @click="openChecker('member')">
        <template #trigger="{ activate, disabled }">
          <NButton class="w-30 h-full" text :disabled="disabled">
            <template v-if="memberValue?.length == 0">
              <Icon class="text-blue" icon="mdi:plus"></Icon>
              <span class="text-blue">添加成员</span>
            </template>
          </NButton>
        </template>
      </NDynamicTags>
    </NFlex>
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">应用权限</span>
      <NFlex class="flex-1">
        <NButton @click="onAppCheck(app)" v-for="app in appPerm" text class="justify-start w-40 mb-2">
          <WrapIcon wrapType='conic' :size="18" :radius="4" :icon="`mdi:${app.icon}`" :color="app.iconColor"></WrapIcon>
          <span class="ml-2 mr-1">{{ app.name }}</span>
          <NCheckbox :checked="app.checked"></NCheckbox>
        </NButton>
      </NFlex>
    </NFlex>
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">部门管理范围</span>
      <NDynamicTags :render-tag="renderTags" v-model:value="deptValue" size="small"
        class="flex-1 p-1 min-h-15 border-1 border-dashed w-full cursor-pointer" @click="openChecker('dept')">
        <template #trigger="{ activate, disabled }">
          <NButton class="w-30 h-full" text :disabled="disabled">
            <template v-if="deptValue?.length == 0">
              <Icon class="text-blue" icon="mdi:plus"></Icon>
              <span class="text-blue">添加部门</span>
            </template>
          </NButton>
        </template>
      </NDynamicTags>
    </NFlex>
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">角色管理范围</span>
      <NDynamicTags :render-tag="renderTags" v-model:value="roleValue" size="small"
        class="flex-1 p-1 min-h-15 border-1 border-dashed w-full cursor-pointer" @click="openChecker('role')">
        <template #trigger="{ activate, disabled }">
          <NButton class="w-30 h-full" text :disabled="disabled">
            <template v-if="roleValue?.length == 0">
              <Icon class="text-blue" icon="mdi:plus"></Icon>
              <span class="text-blue">添加角色</span>
            </template>
          </NButton>
        </template>
      </NDynamicTags>
    </NFlex>
    <NFlex class="w-full py-6 border-b-1">
      <span class="w-30">通讯录权限</span>
      <NFlex vertical>
        <NFlex>
          <span class="mr-6">内部部门</span>
          <NCheckbox @update:checked="onOrgPermCheck" v-model:checked="orgPerm.deptEdit">可见可管理</NCheckbox>
        </NFlex>
        <NFlex>
          <span class="mr-6">内部角色</span>
          <NCheckbox @update:checked="onOrgPermCheck" v-model:checked="orgPerm.roleView">可见</NCheckbox>
          <NCheckbox @update:checked="onOrgPermCheck" v-model:checked="orgPerm.roleEdit">可管理</NCheckbox>
        </NFlex>
      </NFlex>
    </NFlex>
  </NFlex>
  <OrgMemberChecker ref="refOrg" @onCheckedOk="onOrgMemCheckedOk"></OrgMemberChecker>
</template>


<script setup lang="ts">
import { h, ref, watch } from 'vue';
import { NTag, CheckboxProps } from 'naive-ui';
import IconTag from '@/components/advanced/tag-icon.vue';
import AccInfo from '@/components/advanced/acc-info.vue';
import { Icon } from '@iconify/vue';
import { fetchUpdateAdminGroup, fetchGetAppList } from '@/service/api';
import { MemberCheckerType } from '@/enum';

interface Props {
  adGroup: Meta.AdminGroup,
  creator: Meta.Base
}

const props = withDefaults(defineProps<Props>(), {
})

const refOrg = ref();
const superMemberValue = ref([] as any);
const memberValue = ref([] as any);
const deptValue = ref([] as any);
const roleValue = ref([] as any);
const appPerm = ref([] as any);
const orgPerm = ref({
  deptEdit: false,
  roleView: false,
  roleEdit: false
})

const onAppCheck = async (app: Meta.AppNode & CheckboxProps) => {
  app.checked = !app.checked
  if (props.adGroup._id) {
    const update = { appPerm: appPerm.value.filter((v: any) => v.checked).map((d: any) => ({ _id: d._id, name: d.name })) }
    const result = await fetchUpdateAdminGroup(props.adGroup._id, update);
  }
}

const onOrgPermCheck = async () => {
  if (props.adGroup._id) {
    const update = { orgPerm: orgPerm.value }
    const result = await fetchUpdateAdminGroup(props.adGroup._id, update);
  }
}

const renderTag = (tag: Meta.Tag) => {
  if ('dept' == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple', title: tag.label })
  } else if ('role' == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple-check', title: tag.label })
  } else if ('member' == tag.type) {
    return h(AccInfo, { account: { avatar: tag.avatar as any, name: tag.label as any } })
  }
}

const renderTags = (tag: Meta.Tag, index: number) => {
  return h(
    NTag,
    {
      closable: false,
      // onClose: () => {
      //   removePgMember(tag,index);
      // }
    },
    {
      default: () => renderTag(tag)
    }
  )
}

const initAppPerm = async () => {
  const result = await fetchGetAppList();
  if ('ok' == result.msg) {
    appPerm.value = [];
    result.data?.forEach((d: Meta.AppNode) => {
      appPerm.value.push({
        ...d,
        checked: props.adGroup.appPerm?.findIndex((g: Meta.Base) => g._id == d._id) != -1
      })
    })
  }
}

const init = async () => {
  superMemberValue.value = [];
  memberValue.value = [];
  deptValue.value = [];
  roleValue.value = [];
  if (props.adGroup.type == 'super') {
    superMemberValue.value = props.adGroup.member.map((d: Meta.AccBase) => ({ label: d.name, value: d._id, type: 'member', avatar: d.avatar }));
  } else {
    memberValue.value = props.adGroup.member.map((d: Meta.AccBase) => ({ label: d.name, value: d._id, type: 'member', avatar: d.avatar }));
    props.adGroup.deptPerm && (deptValue.value = props.adGroup.deptPerm.map((d: Meta.Base) => ({ label: d.name, value: d._id, type: 'dept' })));
    props.adGroup.rolePerm && (roleValue.value = props.adGroup.rolePerm.map((d: Meta.Base) => ({ label: d.name, value: d._id, type: 'role' })));
    props.adGroup.orgPerm && (orgPerm.value = props.adGroup.orgPerm);
  }
  await initAppPerm();
}

// init();

watch(
  () => props.adGroup,
  (newValue, oldValue) => {
    init();
  },
  { immediate: true, deep: true }
);

const mapTags = (tags: Array<Meta.Tag>) => {
  return tags.map((d: Meta.Tag) => {
    if (d.avatar) {
      return { _id: d.value, name: d.label, avatar: d.avatar }
    } else {
      return { _id: d.value, name: d.label }
    }
  });
}


const onOrgMemCheckedOk = async (orgType: MemberCheckerType, values: Array<Meta.Tag>) => {
  let update: Partial<Meta.AdminGroup> = {};
  values?.forEach((v: Meta.Tag) => {
    if (props.adGroup.type == 'super') {
      superMemberValue.value = values;
      update = { member: mapTags(superMemberValue.value) };
    } else {
      if ('dept' == v.type) {
        deptValue.value = values;
        update = { deptPerm: mapTags(deptValue.value) };
      } else if ('role' == v.type) {
        roleValue.value = values;
        update = { rolePerm: mapTags(roleValue.value) };
      } else if ('member' == v.type) {
        memberValue.value = values;
        update = { member: mapTags(memberValue.value) };
      }
    }
  })
  if (props.adGroup._id) {
    const result = await fetchUpdateAdminGroup(props.adGroup._id, update);
  }
}

const openChecker = (type: 'super' | 'dept' | 'role' | 'member') => {
  let pgOption: Partial<Meta.ModulePermGroup> = {};   // 兼容权限组配置对话框的处理；
  let orgType = [type];
  if ('super' == type) {
    pgOption = {
      accountAuth: mapTags(superMemberValue.value)
    }
    orgType = ['member'];
  } else if ('member' == type) {
    pgOption = {
      accountAuth: mapTags(memberValue.value)
    }
  } else if ('dept' == type) {
    pgOption = {
      deptAuth: mapTags(deptValue.value)
    }
  } else if ('role' == type) {
    pgOption = {
      roleAuth: mapTags(roleValue.value)
    }
  }
  refOrg.value.show(orgType, pgOption);
}

</script>