<template>
  <NFlex class="bg-gray-100/10 w-full" justify="center">
    <NCard class="w-230 my-2" content-style="padding: 0;" size="small">
      <NFlex :size="0">
        <NTabs v-model:value="selectedTab" @update-value="onChangeTab" placement="left" class="mt-4 w-40">
          <NTab v-for="tab in tabs" :name="tab.name" class="w-40">
            <SvgIcon :icon="tab.icon" class="ml-4 mr-2 text-base"/>
            {{ tab.title }}
          </NTab>
        </NTabs>
        <NFlex class="border-l-1 flex-1" vertical style="height: calc(100vh - 66px);">
          <NFlex class="w-full  h-12 border-b-1 p-4" :size="0" align="center">
            <span class="font-semibold">{{ tabNames[selectedTab] }}</span>
          </NFlex>
          <NFlex class="w-full p-4" align="start">
            <ButtonIcon @click="addDataSync" icon="mdi:plus" :title="`添加${getAddButtonName()}`" type="info" level=""
              size="small" />
          </NFlex>
          <SmoothScrollbar style="height: calc(100vh - 210px);" class="px-2">
            <DropList placeholder="" @reorder="onReorder" class="w-full flex-column gap-2" :items="dataSyncsList">
              <template #item="{ item, index, reorder }">
                <Drag :key="item.uid" :data="item" :style="{ opacity: reorder ? 0 : 1 }" class="w-full px-2">
                  <NFlex vertical class="border-1 h-36 w-full px-4 rounded shadow-sm hover:shadow-md">
                    <NFlex class="w-full h-10 border-b-1" align="center" justify="space-between">
                      <span class="font-bold">{{ item.name }}</span>
                      <NFlex :size="0">
                        <NButton @click="onViewLogClick(item)" text size="tiny" type="info">执行日志</NButton>
                        <NDivider vertical></NDivider>
                        <NButton :disabled="item.enable" @click="onEditClick(item)" text size="tiny" type="info">编辑</NButton>
                        <NDivider vertical></NDivider>
                        <NButton :disabled="item.enable" @click="onDeleteClick(item)" text size="tiny" type="info">删除</NButton>
                        <NDivider vertical></NDivider>
                        <NSwitch v-model:value="item.enable" @update-value="onEnableClick(item)" size="small"
                          style="font-size: small;">
                          <template #checked>启用</template>
                          <template #unchecked>停用</template>
                        </NSwitch>
                      </NFlex>
                    </NFlex>
                    <NFlex vertical class="h-20" justify="center">
                      <NFlex class="">
                        <span class="">{{ dataSyncCardMsg(item) }}</span>
                      </NFlex>
                    </NFlex>
                  </NFlex>
                </Drag>
              </template>
              <template #feedback></template>
            </DropList>
          </SmoothScrollbar>
        </NFlex>
      </NFlex>
      <DataSyncDialog ref="refDataSyncDialog" @refresh="initData" />
    </NCard>
  </NFlex>
</template>

<script lang="ts" setup>
import { ref, toRaw } from "vue";
import { fetchDeleteModuleDataSync, fetchGetModuleConfig, fetchSetModuleDataSyncEnable } from "@/service/api";
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { TriggerTypeName, EventTypeName } from "@/enum";

const { currModuleNode } = useModuleInject();
const refDataSyncDialog = ref();
const selectedTab = ref('dataAsync');
const tabs = [
  { name: 'dataAsync', title: '数据同步', icon: 'mdi:database' },
  { name: 'dataSend', title: '数据推送', icon: 'mdi:email-sync-outline' },
  { name: 'printTemp', title: '打印模板', icon: 'mdi:printer-outline' },
  { name: 'customBtn', title: '自定义按钮', icon: 'mdi:button-cursor' },
  { name: 'message', title: '消息提醒', icon: 'mingcute--notification-line' },
];

const tabNames = {
  dataAsync: '数据同步',
  dataSend: '数据推送',
  printTemp: '打印模板',
  customBtn: '自定义按钮',
  message: '消息提醒',
} as any;

const dataSyncsList = ref([] as any);
const dataSyncCardMsg = (item: any) => {
  let msg = item.triggerConfig.name + ">" + EventTypeName[item.triggerAction] + "数据➡️ " + TriggerTypeName[item.triggerType] + "触发➡️ " +
    item.updateConfig.name + ">" + EventTypeName[item.updateAction] + "数据"
  return msg;
}
const getAddButtonName = () => {
  let name = tabNames[selectedTab.value];
  if (['dataAsync', 'dataSend'].includes(selectedTab.value)) {
    name = name + '节点';
  }
  return name;
}

const onChangeTab = (value: string) => {
  // console.log(value)
}

const addDataSync = () => {
  refDataSyncDialog.value.show();
}
// 用于判断是否显示占位样式
const onReorder = async (e: any) => {
  await e.apply(dataSyncsList.value);
}

const initData = async () => {
  if (currModuleNode?.value.moduleConfig_id) {
    const result = await fetchGetModuleConfig(currModuleNode?.value.moduleConfig_id);
    if ('ok' == result.msg && result.data?.length == 1) {
      dataSyncsList.value = result.data[0].dataSync;
    }
  }
}

initData();

const onEditClick = async (item: Meta.DataSync) => {
  refDataSyncDialog.value.show(toRaw(item));
}

const onDeleteClick = async (item: Meta.DataSync) => {
  if (currModuleNode?.value.moduleConfig_id && item.uid) {
    const result = await fetchDeleteModuleDataSync(currModuleNode?.value.moduleConfig_id, item.uid);
    initData();
  }
}

const onViewLogClick = async (item: Meta.DataSync) => {

}

const onEnableClick = async (item: Meta.DataSync) => {
  if (currModuleNode?.value.moduleConfig_id && item.uid) {
    const result = await fetchSetModuleDataSyncEnable(currModuleNode?.value.moduleConfig_id, item.uid, item.enable);
    console.log(result)
    initData();
  }
}


</script>

<style lang="scss" scoped>
:deep(.n-tabs-tab--active) {
  background-color: rgb(239 246 255 / var(--tw-bg-opacity, 1));
}
</style>
