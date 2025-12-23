<template>
  <NFlex vertical :size="0">
    <NFlex class="h-10 w-full">
      <AppHeader class="w-full">
        <template #header>
          <NButton v-if="permGroup?.length == 1" size="small" class="font-bold">{{ selectOption && selectOption.label }}
          </NButton>
          <NPopselect v-else v-model:value="selectValue" :options="permGroup" @update:value="onViewSelect"
            trigger="click" placement="bottom-start">
            <NButton size="small" class="font-bold">{{ selectOption && selectOption.label }}</NButton>
          </NPopselect>
          <ButtonIcon v-if="cptEditModulePerm" @click="openModuleEdit" icon="line-md--edit" title="编辑" size="small"
            class="ml-2"></ButtonIcon>
        </template>
      </AppHeader>
    </NFlex>
    <FlowView v-if="selectOption" :type="selectOption.view"></FlowView>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, Ref, inject, watch } from 'vue';
import AppHeader from '@/layouts/modules/app-header/index.vue';
import { AdminGroupType, MenuEventType, ProviderName, PermGroupType } from '@/enum';
import { getUserModulePerm } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { decryptPack } from '@/utils/crypto-msgpack';


let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);
let openModuleEditProvide = inject<any>(ProviderName.OpenModuleEditProvide);

//
const userAuth = useAuthStore();
const selectValue = ref("1");
const currAuth = ref();
const selectOption = ref();
// 类型：form data-table data-view
const permGroup = ref([] as any)

const cptEditModulePerm = computed(() => {
  let result = false;
  if ([AdminGroupType.Creator, AdminGroupType.Super].includes(currAuth.value?.groupRole)) {
    result = true;
  } else {
    result = currAuth.value?.agAppPerm.includes(currModuleNode?.value._id)
  }
  return result;
})


const getViewCompType = (viewType: string) => {
  if (PermGroupType.StartFlow == viewType) {
    return 'form'
  } else {
    return 'table'
  }
}

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
  if (currModuleNode?.value.app_id && currModuleNode?.value._id) {
    const modulePerm = await getUserModulePerm(currAuth.value, currModuleNode?.value.app_id, currModuleNode?.value._id);
    if (['creator', 'super', 'system', 'app'].includes(modulePerm['groupRole'])) {
      permGroup.value = [
        { key: '1', view: 'form', label: '发起流程', value: PermGroupType.StartFlow },
        { key: '2', view: 'table', label: '查看全部流程', value: PermGroupType.ViewAllFlow },
        { key: '3', view: 'table', label: '管理全部流程', value: PermGroupType.EditAllFlow },
      ]
    } else {
      permGroup.value = modulePerm?.module_perm?.map((m: any) => ({
        key: m.id,
        view: getViewCompType(m.type),
        label: m.name,
        value: m.id
      }))
    }

    if (permGroup.value?.length > 0) {
      selectOption.value = permGroup.value[0];
      selectValue.value = permGroup.value[0].value;
    }
  }
}

init();

const onViewSelect = (value: string, option: any) => {
  // moduleTitle.value = option.label;
  selectOption.value = option;
}

const openModuleEdit = () => {
  currModuleNode && openModuleEditProvide(MenuEventType.EditModule, currModuleNode?.value.app_id, currModuleNode.value)
}

</script>
