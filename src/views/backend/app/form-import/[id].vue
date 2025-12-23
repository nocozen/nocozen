<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NFlex wrap justify="start" class="mb-4 pb-4 border-b-1">
        <ButtonIcon icon="mdi:import" title="选择导入" size="small" level="" type="info" @click.stop="onAddClick" />
      </NFlex>
      <SmoothScrollbar style="height: calc(100vh - 210px);">
        <NFlex vertical justify="start" v-for="app in Object.keys(moduleList)" :size="0">
          <span>{{ appNames ? appNames[app] : '' }}</span>
          <NFlex wrap justify="start" class="border-1 p-2">
            <NFlex v-for="item in moduleList[app]" :size="4" align="center" class="bg-gray-100 px-2 rounded">
              <SvgIcon :icon="`mdi:${item.icon}`" class="text-2xl" :style="{ color: item.iconColor }"></SvgIcon>
              <span>{{ item.name }}</span>
              <ButtonIcon :icon="QbIcon.Delete" class="text-gray" level="text" @click="onDeleteModule(item._id)" />
            </NFlex>
          </NFlex>
        </NFlex>
      </SmoothScrollbar>
      <ModuleElemDialog ref="refModlueDialog" @update-import="updateImport"></ModuleElemDialog>
    </NCard>
  </NSpace>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { QbIcon } from '@/enum';
import { fetchDeleteModuleImports, fetchGetAppList, fetchGetAppModules, fetchUpdateModuleImports } from '@/service/api';
import { group, keys } from 'radashi';

const appStore = useAppStore();
const refModlueDialog = ref();

const column = computed(() => (appStore.isMobile ? 1 : 2));

interface Props {
  id: string;
}

// ====跨应用导入表单后支持：仪表盘可以用、数据同步可以用；其它数据聚合不可以用；=======

const props = defineProps<Props>();

const moduleList = ref([] as any);
const appNames = ref()

const init = async () => {
  const result = await fetchGetAppModules({ imports: props.id });
  if ('ok' == result.msg) {
    moduleList.value = group(result.data, app => app.app_id);
    const apps = await fetchGetAppList();
    if ('ok' == apps.msg) {
      appNames.value = Object.fromEntries(
        apps.data.map((d: Meta.AppNode) => [d._id, d.name])
      )
    }
  }
}

init();

const onDeleteModule = async (id: string) => {
  const result = await fetchDeleteModuleImports(id, props.id);
  await init();
}

const onAddClick = () => {
  refModlueDialog.value.showImport([], props.id)
}

const updateImport = async (keys: Array<string>) => {
  // keys: 导入表单id，ModuleNode中更新imports字段；
  if (keys?.length > 0 && props.id) {
    const result = await fetchUpdateModuleImports(keys, props.id);
    await init();
    // console.log(result)
  }
}

</script>

<style scoped></style>
