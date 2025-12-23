<template>
  <NSpace vertical :size="0" class="p-0">
    <NCard v-if="selectedGroup" :bordered="false" size="small" content-style="padding: 0;">
      <NFlex style="height: calc(100vh - 80px);" :size="0" class="flex flex-nowrap">
        <NSplit direction="horizontal" :resize-trigger-size="2" :default-size="0.25" :max="0.4" min="230px">
          <template #1>
            <NFlex class="border-b-1 px-4 h-11 text-gray-400" align="center" justify="space-between">
              <span>管理组</span>
              <ButtonIcon @click="onAddGroupClick" icon="mdi:plus" type="info" level="text" />
            </NFlex>
            <!-- <NFlex class="m-1">
              <NInputGroup size="small" class="w-60">
                <DropSelect :options="filterOptions" @select="onFilterSelect"></DropSelect>
                <NInput size="small"></NInput>
              </NInputGroup>
            </NFlex> -->
            <SmoothScrollbar style="height: calc(100vh - 126px);">
              <NFlex class="w-full px-4 py-4">
                <NFlex vertical :size="0" class="w-full">
                  <SmoothScrollbar>
                    <NButton @click="onAdGroupClick(superGroup)" quaternary class="w-full justify-start mb-1"
                      :focusable="false" :class="{ 'bg-blue-100/50 text-blue': selectedGroup.type == 'super' }">
                      <Icon icon="mdi:account-circle" class="text-lg text-blue mr-1"></Icon>
                      <span>系统管理组</span>
                    </NButton>
                    <DropList @reorder="onGroupReorder" class="flex-row w-full" :items="systemGroups">
                      <template #item="{ item, index, reorder }">
                        <Drag :key="item._id" :data="item" :style="{ opacity: reorder ? 0 : 1 }" class="w-full mb-1">
                          <NButton @click="onAdGroupClick(item)" quaternary class="w-full group justify-start"
                            :focusable="false" :class="{ 'bg-blue-100/50 text-blue': selectedGroup._id == item._id }">
                            <NFlex :size="0" align="center" class="flex-1">
                              <Icon icon="mdi:account-multiple" class="w-5 text-lg text-blue mr-1"></Icon>
                              <span>{{ item.name }}</span>
                            </NFlex>
                            <NDropdown trigger="click" :options="menuOptions" @select="(key, option) => handleSelect(key, option, item)">
                              <div @click.stop>
                                <Icon :icon="QbIcon.DotsVer"
                                class="w-5 invisible group-hover:visible text-lg text-blue mr-1"></Icon>
                              </div>
                            </NDropdown>
                          </NButton>
                        </Drag>
                      </template>
                      <template #feedback>
                      </template>
                    </DropList>
                  </SmoothScrollbar>
                </NFlex>
              </NFlex>
            </SmoothScrollbar>
          </template>
          <template #2>
            <NFlex vertical style="height: calc(100vh - 90px);" class="flex-1" :size="0">
              <NFlex class="border-b-1 px-4 min-h-11" align="center">
                <span class="font-semibold">{{ selectedGroup.name }}</span>
              </NFlex>
              <SmoothScrollbar>
                <AdminGroup :adGroup="selectedGroup" :creator="creator"></AdminGroup>
              </SmoothScrollbar>
            </NFlex>
          </template>
        </NSplit>
      </NFlex>
    </NCard>
    <EditGroupName ref="refEditGroup" @updateData="init"></EditGroupName>
  </NSpace>

</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue';
import { NButton } from 'naive-ui';
import { fetchGetAdminGroups, fetchDeleteAdminGroup, fetchUpdateAgOrder } from '@/service/api';
import ButtonIcon from '@/components/custom/button-icon.vue';
import { Icon } from '@iconify/vue';
import AdminGroup from './modules/AdminGroup.vue';
import EditGroupName from './modules/EditGroupName.vue';
import { reOrderListBySufId } from '@/utils/dataHelper';
import { QbIcon } from '@/enum';


const refEditGroup = ref();
const creator = ref();
const superGroup = ref();
const systemGroups = ref([] as any)
const selectedGroup = ref();

const filterOptions = [
  { label: '成员', key: 0 },
  { label: '应用', key: 1 },
  { label: '管理组', key: 2 },
];

const menuOptions = [
  {
    // icon: 'fluent:document-flowchart-24-regular',
    // icon: renderIcon('line-md:edit', 'pop'),
    label: '修改名称',
    key: 'editName'
  },
  {
    // icon: 'mdi:file-document-box-outline',
    // icon: renderIcon('carbon:tag-edit', 'pop'),
    label: '删除',
    key: 'delete'
  },
]

const cptSelectedSuper = computed(() => {

})

const onGroupReorder = async (e: any) => {
  await e.apply(systemGroups.value);
  const result = await fetchUpdateAgOrder(systemGroups.value, e.from, e.to);
  console.log(result)
}

const deleteGroup = async (adGroup: Meta.AdminGroup) => {
  if (adGroup._id) {
    let suf_id = adGroup.suf_id ? adGroup.suf_id : null;
    const result = await fetchDeleteAdminGroup([{ _id: adGroup._id, suf_id: suf_id }]);
    if ('ok' == result.msg) {
      await init();
    }
  }
}

const handleSelect = (key: string | number, option: any, item: any) => {
  if ('delete' == key) {
    deleteGroup(item);
  } else if ('editName' == key) {
    refEditGroup.value.show('edit', item);
  }
}

const onAdGroupClick = async (adGroup: Meta.AdminGroup) => {
  await init();
  if (adGroup.type == 'super') {
    selectedGroup.value = superGroup.value;
  } else if (adGroup.type == 'system') {
    selectedGroup.value = systemGroups.value.find((v: Meta.AdminGroup) => v._id == adGroup._id);
  }
}
const onAddGroupClick = () => {
  refEditGroup.value.show('add');
}

const init = async () => {
  const result = await fetchGetAdminGroups();
  let sysGroupList = [] as any;

  if ('ok' == result.msg) {
    result.data?.forEach((d: Meta.AdminGroup) => {
      if (d.type == 'creator') {
        creator.value = d.member;
      } else if (d.type == 'super') {
        superGroup.value = d;
      } else if (d.type == 'system') {
        sysGroupList.push(d);
      }
    });
    systemGroups.value = reOrderListBySufId(sysGroupList);
    selectedGroup.value = superGroup.value;
  }
}

init()

</script>

<style lang="scss" scoped>
:deep(.n-button .n-button__content) {
  width: 100%
}
</style>
