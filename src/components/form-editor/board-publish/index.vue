<template>
  <NFlex vertical class="w-200 mt-10" align="top">
    <SmoothScrollbar style="height: calc(100vh - 90px);">
      <NCard content-style="padding: 0;" class="min-h-100 " :bordered="true" size="small">
        <NFlex align="center" class="p-4 border-b-1">
          <span class="font-semibold">组织内发布</span>
        </NFlex>
        <NFlex align="center" class="px-4 pt-4 pb-1" justify="space-between">
          <span class="font-semibold">查看仪表盘</span>
          <NSwitch @update-value="updateActivePg" size="small" v-model:value="currPg.active" style="font-size: small;">
            <template #checked>启用</template>
            <template #unchecked>停用</template>
          </NSwitch>
        </NFlex>
        <NDynamicTags :render-tag="renderTags" v-model:value="tagValue" size="small"
          class="mx-4 p-1 min-h-25 border-1 border-dashed w-192 cursor-pointer" @click="openConfig">
          <template #trigger="{ activate, disabled }">
            <NButton v-if="tagValue?.length == 0" class="w-192 h-full" text :disabled="disabled">
              <SvgIcon icon="mdi:plus"/>
              <span>选择成员或部门</span>
            </NButton>
          </template>
        </NDynamicTags>
        <NFlex align="center" class="mt-8 p-4 border-t-1 border-b-1" justify="space-between">
          <span class="font-semibold">设置为应用首页</span>
          <NSwitch @update-value="updateActiveHome" size="small" v-model:value="bindHome" style="font-size: small;">
            <template #checked>启用</template>
            <template #unchecked>停用</template>
          </NSwitch>
        </NFlex>
      </NCard>
    </SmoothScrollbar>
    <OrgMemberChecker ref="refOrg" :defDeptCascade="true" @onCheckedOk="onOrgMemCheckedOk" />
  </NFlex>
</template>

<script setup lang="ts">
import { ref, h, watch, inject, Ref } from 'vue';
import { MemberCheckerType, PermGroupType, ProviderName } from '@/enum';
import { fetchGetPermGroups, fetchUpdateModulePg, fetchNewPermGroup, fetchFindAppNode, fetchUpdateAppHome } from '@/service/api';
import { NTag } from 'naive-ui';
import AccInfo from '@/components/advanced/acc-info.vue';
import IconTag from '@/components/advanced/tag-icon.vue';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
})

interface Emits {
  (e: 'refresh'): void,
}

const emit = defineEmits<Emits>()

const currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);

const currPg = ref<Meta.ModulePermGroup>({} as any)
const tagValue = ref([] as any);    // { label value tagType? }
const refOrg = ref();
const bindHome = ref(false);

let app_id = '' as any;
let parent_id = '' as any;


const init = async () => {
  app_id = currModuleNode?.value.app_id;
  parent_id = currModuleNode?.value._id;
  const result = await fetchGetPermGroups({ app_id, parent_id });
  if ('ok' == result.msg) {
    if (result.data?.length > 0) {
      currPg.value = result.data[0];
    } else {
      // 初始化新增
      currPg.value = {
        name: '查看仪表盘',
        app_id: app_id,
        parent_id: parent_id,
        moduleType: 'board',
        active: true,
        accountAuth: [],
        deptAuth: [],
        roleAuth: [],
        notes: '',
        suf_id: null,
        type: PermGroupType.ViewAll,
        view_id: '',
        optAuth: [],
        fieldAuth: [],
        dataAuth: [],
        en_id: '',
      }
      // 仪表盘只有一条，避免重复添加
      const result = await fetchNewPermGroup(currPg.value);
      // console.log(result.msg)
    }
  }

  tagValue.value = [
    ...currPg.value.deptAuth.map((d: Meta.Base) => ({ label: d.name, value: d._id, type: 'dept' })),
    ...currPg.value.roleAuth.map((d: Meta.Base) => ({ label: d.name, value: d._id, type: 'role' })),
    ...currPg.value.accountAuth.map((d: Meta.AccBase) => ({ label: d.name, value: d._id, type: 'member', avatar: d.avatar })),
  ];

  // 查询当前模块所属的应用home绑定是否当前仪表盘，初始化绑定按钮；
  if (currModuleNode?.value.app_id) {
    const appResult = await fetchFindAppNode({ _id: currModuleNode?.value.app_id });
    if ('ok' == appResult.msg && appResult.data?.length == 1) {
      if (appResult.data[0].home_id && appResult.data[0].home_id == currModuleNode?.value.moduleConfig_id) {
        bindHome.value = true;
      } else {
        bindHome.value = false;
      }
    }
  }

}

init();

const updateActivePg = async (value: boolean) => {
  if (currPg.value._id) {
    const result = await fetchUpdateModulePg(currPg.value._id, { active: value });
  }
}

const updateActiveHome = async (value: boolean) => {
  let home_id = null;
  if (value) {
    if (currModuleNode?.value._id) {
      // 更新当前应用的home_id;
      home_id = currModuleNode.value.moduleConfig_id || null;
    }
  }
  const result = await fetchUpdateAppHome(app_id, home_id);
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

const openConfig = () => {
  refOrg.value.show(['dept', 'role', 'member'], currPg.value);
}
</script>