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
            class="ml-2" />
        </template>
      </AppHeader>
    </NFlex>
    <FormView v-if="selectOption" :compType="selectOption.view" :viewType="selectOption.value"></FormView>
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

const userAuth = useAuthStore();
const selectValue = ref()
const selectOption = ref();
const currAuth = ref();
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
  if (PermGroupType.Add == viewType) {
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
        { key: '1', view: 'form', label: '添加数据', value: PermGroupType.Add },
        { key: '2', view: 'table', label: '管理本人数据', value: PermGroupType.AddEditSelf },
        { key: '3', view: 'table', label: '添加并查看全部数据', value: PermGroupType.AddViewAll },
        { key: '4', view: 'table', label: '添加并管理数据', value: PermGroupType.AddEditAll },
        { key: '5', view: 'table', label: '管理全部数据', value: PermGroupType.EditAll },
        { key: '6', view: 'table', label: '查看全部数据', value: PermGroupType.ViewAll }
      ]
    } else {
      permGroup.value = modulePerm?.module_perm?.map((m: any) => ({
        key: m.id,
        view: getViewCompType(m.type),
        label: m.name,
        value: m.type
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
  selectOption.value = option;
}

const openModuleEdit = () => {
  currModuleNode && openModuleEditProvide(MenuEventType.EditModule, currModuleNode.value.app_id, currModuleNode.value)
}

</script>

<style lang="scss" scoped></style>
