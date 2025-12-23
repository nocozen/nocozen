<template>
  <NFlex vertical class="w-full">
    <NFlex align="center" justify="space-between">
      <span class="font-semibold">{{ currPg.name }}</span>
      <NFlex align="center" :size="0">
        <NButton @click="onEditClick()" size="tiny" text type="info">编辑</NButton>
        <NDivider vertical></NDivider>
        <NButton v-if="PermGroupType.Add != currPg.type" size="tiny" text type="info">视图设置</NButton>
        <NDivider v-if="PermGroupType.Add != currPg.type" vertical></NDivider>
        <NButton @click="onDeletePg" size="tiny" text type="info" class="mr-2">删除</NButton>
        <NSwitch @update-value="updateActive" size="small" v-model:value="currPg.active" style="font-size: small;">
          <template #checked>启用</template>
          <template #unchecked>停用</template>
        </NSwitch>
      </NFlex>
    </NFlex>
    <NDynamicTags :render-tag="renderTags" v-model:value="tagValue" size="small"
      class="p-1 min-h-15 border-1 border-dashed w-full cursor-pointer" @click="openConfig">
      <template #trigger="{ activate, disabled }">
        <NButton v-if="tagValue?.length == 0" class="w-30 h-full" text :disabled="disabled">
          <SvgIcon icon="mdi:plus"/>
          <span>选择成员</span>
        </NButton>
      </template>
    </NDynamicTags>
    <OrgMemberChecker ref="refOrg" :defDeptCascade="true" @onCheckedOk="onOrgMemCheckedOk"></OrgMemberChecker>
    <AddCustomPg ref="refEditCustomPg"></AddCustomPg>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, h, watch, computed } from 'vue';
import { MemberCheckerType, PermGroupType } from '@/enum';
import { fetchUpdateModulePg, fetchDeleteModulePg } from '@/service/api';
import { NTag } from 'naive-ui';
import AccInfo from '@/components/advanced/acc-info.vue';
import IconTag from '@/components/advanced/tag-icon.vue';

interface Props {
  permGroup: Meta.ModulePermGroup
}

const props = withDefaults(defineProps<Props>(), {
})

interface Emits {
  (e: 'refresh'): void,
}

const emit = defineEmits<Emits>()


const currPg = ref<Meta.ModulePermGroup>({} as any)
const tagValue = ref([] as any);    // { label value tagType? }
const activeValue = ref(true);
const refOrg = ref();
const refEditCustomPg = ref();

const init = () => {
  currPg.value = props.permGroup;
  tagValue.value = [
    ...props.permGroup.deptAuth.map((d: Meta.Base) => ({ label: d.name, value: d._id, type: 'dept' })),
    ...props.permGroup.roleAuth.map((d: Meta.Base) => ({ label: d.name, value: d._id, type: 'role' })),
    ...props.permGroup.accountAuth.map((d: Meta.AccBase) => ({ label: d.name, value: d._id, type: 'member', avatar: d.avatar })),
  ];
}

// init();

watch(
  () => props.permGroup,
  (newValue, oldValue) => {
    init();
  },
  { immediate: true, deep: true }
);

const updateActive = async (value: boolean) => {
  if (currPg.value._id) {
    const result = await fetchUpdateModulePg(currPg.value._id, { active: value });
  }
}

const onDeletePg = async () => {
  const result = await fetchDeleteModulePg([{ _id: props.permGroup._id, suf_id: props.permGroup.suf_id }]);
  if ('ok' == result.msg) {
    emit('refresh');
  }
}

// 成员添加确认提交
const onOrgMemCheckedOk = async (orgType: MemberCheckerType, values: Array<Meta.Tag>) => {
  currPg.value.deptAuth = [];
  currPg.value.roleAuth = [];
  currPg.value.accountAuth = [];
  values?.forEach((v: Meta.Tag) => {
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

const removePgMember = async (tag: Meta.Tag, index: number) => {
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

// 权限组参数
const onEditClick = () => {
  refEditCustomPg.value.show(props.permGroup);
}

const openConfig = () => {
  refOrg.value.show(['dept', 'role', 'member'], props.permGroup);
}
</script>