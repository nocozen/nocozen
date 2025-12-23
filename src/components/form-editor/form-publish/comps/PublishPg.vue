<template>
  <NFlex vertical class="border-l-1 flex-1 p-6" style="height: calc(100vh - 66px);">
    <NDropdown trigger="click" :options="addPgOptions" @select="addPgSelect">
      <NButton class="w-30" type="info">
        <SvgIcon icon="mdi:plus" class="text-base"/>
        <span>添加权限组</span>
      </NButton>
    </NDropdown>
    <SmoothScrollbar class="pr-2">
      <DropList @reorder="onReorder" class="flex-row w-full" :items="permGroupList">
        <template #item="{ item, index, reorder }">
          <Drag :key="item._id" :data="item" :style="{ opacity: reorder ? 0 : 1 }" class="w-full my-4">
            <PermGroup :perm-group="item" @refresh="initPg"></PermGroup>
          </Drag>
        </template>
        <template #feedback>
        </template>
      </DropList>
    </SmoothScrollbar>
  </NFlex>
  <AddDefPg ref="refAddDefPg" @refresh="initPg" @newDefPg="newPg"></AddDefPg>
  <AddCustomPg ref="refAddCustomPg"></AddCustomPg>
</template>

<script lang="ts" setup>
import { ref, provide, inject, Ref } from 'vue';
import { fetchGetPermGroups, fetchUpdateModulePgOrder, fetchNewPermGroup } from '@/service/api';
import { useRoute } from 'vue-router';
import { reOrderListBySufId } from '@/utils/dataHelper';
import { PermGroupType, ProviderName } from '@/enum';

interface Props {
  type: 'form' | 'flow'
}

const props = withDefaults(defineProps<Props>(), {
})

const currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);

const route = useRoute();
const addPgOptions = ref([
  { label: '添加预设组', key: 'default' },
  { label: '添加自定义组', key: 'custom' }
]);
const refAddDefPg = ref();
const refAddCustomPg = ref();
const permGroupList = ref([] as any);

let app_id = '' as any;
let parent_id = '' as any;

const initPg = async () => {
  permGroupList.value = [];
  app_id = currModuleNode?.value.app_id;
  parent_id = currModuleNode?.value._id;
  const result = await fetchGetPermGroups({ app_id, parent_id });
  if ('ok' == result.msg) {
    permGroupList.value = reOrderListBySufId(result.data);
  }
}

// provide('refresh', initPg);

initPg();


const newPg = async (pgOption?: any) => {
  if (!route.query.app_id || !route.params.id) {
    return;
  }
  let permGroup: Meta.ModulePermGroup = {
    name: '未命名权限组',
    app_id: app_id,
    parent_id: parent_id,
    moduleType: props.type,
    active: true,
    accountAuth: [],
    deptAuth: [],
    roleAuth: [],
    notes: '',
    suf_id: null,
    type: PermGroupType.Custom,
    view_id: '',
    optAuth: [],
    fieldAuth: [],
    dataAuth: [],
    en_id: '',
  }
  if (pgOption) {
    permGroup.name = pgOption.label;
    permGroup.type = pgOption.key;
  }
  const result = await fetchNewPermGroup(permGroup);
  if ('ok' == result.msg) {
    const pgFind = await fetchGetPermGroups({ _id: result.data.insertedIds[0] })
    if (pgOption && 'ok' == pgFind.msg && pgFind.data?.length == 1) {
      pgOption.pg = pgFind.data[0];
    }
    await initPg();
  }
}

const addPgSelect = (key: 'default' | 'custom') => {
  if ('default' == key) {
    refAddDefPg.value.show(props.type, permGroupList.value);
  } else {
    // refAddCustomPg.value.show(props.type);
    newPg();
  }
}

const onReorder = async (e: any) => {
  await e.apply(permGroupList.value);
  // 通过更新数据库，再刷新列表实现真正的顺序修改
  // let sufUpdateOptions = await getListSufIds(appList.value, e.from, e.to)
  const updateResult = await fetchUpdateModulePgOrder(permGroupList.value, e.from, e.to);
  // console.log(updateResult)
}

</script>

<style lang="scss" scoped></style>