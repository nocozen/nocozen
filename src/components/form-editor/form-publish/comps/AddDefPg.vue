<template>
  <ModalDialog @onCompleteClick="onCompleteClick" ref="refModal" title="添加预设权限组" modal-class="w-100" :footer="true"
    :buttons="['complete']">
    <NFlex class="p-4">
      <template v-for="pg in pgOptions" :key="pg.key">
        <NCheckbox @click="onCheckBoxClick(pg)" :checked="pg.checked" class="w-42">{{ pg.label }}</NCheckbox>
      </template>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref,inject,Ref } from 'vue';
import { PermGroupType } from '@/enum';
import { fetchDeleteModulePg } from '@/service/api';
import { useRoute } from 'vue-router';

interface Emits {
  (e: 'refresh'): void,
  (e: 'newDefPg', pgOption: any): void,
}

const emit = defineEmits<Emits>()

const route = useRoute();
const refModal = ref();
const pgOptions = ref([] as any);
const moduleType = ref()
// 1.仅添加、2.添加并管理本人数据、3.添加并查看全部数据、4.添加并管理全部数据、5.管理全部数据、6.查看全部数据、
const formPgs = [
  { label: '添加数据', key: PermGroupType.Add, checked: false, pg: null as any },
  { label: '管理本人数据', key: PermGroupType.AddEditSelf, checked: false, pg: null as any },
  { label: '添加并查看全部数据', key: PermGroupType.AddViewAll, checked: false, pg: null as any },
  { label: '添加并管理全部数据', key: PermGroupType.AddEditAll, checked: false, pg: null as any },
  { label: '管理全部数据', key: PermGroupType.EditAll, checked: false, pg: null as any },
  { label: '查看全部数据', key: PermGroupType.ViewAll, checked: false, pg: null as any },
]
const flowPgs = [
  { label: '发起流程', key: PermGroupType.StartFlow, checked: false, pg: null as any },
  { label: '查看全部流程', key: PermGroupType.ViewAllFlow, checked: false, pg: null as any },
  { label: '管理全部流程', key: PermGroupType.EditAllFlow, checked: false, pg: null as any },
]
const app_id = route.query.app_id?.toString();
// const module_id = route.params.id?.toString();

const onCheckBoxClick = async (pgOption: any) => {
  if (!app_id) {
    return;
  }

  if (pgOption.checked) {
    // 取消选择：删除
    const result = await fetchDeleteModulePg([{ _id: pgOption.pg._id, suf_id: pgOption.pg.suf_id }]);
    if ('ok' == result.msg) {
      emit('refresh');
    }
  } else {
    // 添加
    emit('newDefPg', pgOption);
  }
  pgOption.checked = !pgOption.checked;
}


const onCompleteClick = () => {
  refModal.value.show(false);
}

const show = (type: 'form' | 'flow', pgs: Array<Meta.ModulePermGroup>) => {
  moduleType.value = type;
  if ('form' == type) {
    formPgs?.forEach((f: any) => f.checked = false);
    pgs?.forEach((pg: Meta.ModulePermGroup) => {
      let currPg = formPgs.find((f: any) => f.key == pg.type);
      if (currPg) {
        currPg.checked = true;
        currPg.pg = pg;
      };
    })
    pgOptions.value = formPgs;
  } else {
    flowPgs?.forEach((f: any) => f.checked = false);
    pgs?.forEach((pg: Meta.ModulePermGroup) => {
      let currPg = flowPgs.find((f: any) => f.key == pg.type);
      if (currPg) {
        currPg.checked = true;
        currPg.pg = pg;
      };
    })
    pgOptions.value = flowPgs;
  }
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>