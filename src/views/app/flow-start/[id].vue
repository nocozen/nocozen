<template>
  <div class="h-full">
    <NFlex class="h-10 w-full sticky top-0 z-1">
      <AppHeader class="w-full">
        <template #header>
          <span class="font-semibold">发起流程</span>
        </template>
      </AppHeader>
    </NFlex>
    <SmoothScrollbar style="height: calc(100% - 40px);" class="p-2">
      <NCard v-for="app in appModules" content-style="padding: 0;" class="mb-1 p-4 " :bordered="false" size="small">
        <NFlex class="my-1 border-b-2" :style="{'border-color': app.iconColor}">
          <span>{{ app.name }}</span>
        </NFlex>
        <NFlex class="w-full mt-4 mb-2">
          <CardButton v-for="m in app.nodes" @click="onAddClick(m)"
            class="max-w-48 outline outline-1 outline-gray-100 shadow-md hover:bg-blue-100" :title="m.name"
            sizeType="lg" bg-scope="none" :icon="`mdi:${m.icon}`" :iconColor="app.iconColor" />
        </NFlex>
      </NCard>
    </SmoothScrollbar>
    <FlowDialog ref="refFormDialog" openType="table"></FlowDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import AppHeader from '@/layouts/modules/app-header/index.vue';
import { useAuthStore } from '@/store/modules/auth';
import { decryptPack } from '@/utils/crypto-msgpack';
import { fetchGetAppModules, getUserAppPerm } from '@/service/api';


interface Props {
  id: string;
}

const props = defineProps<Props>();

const userAuth = useAuthStore();
const currAuth = ref();
const appModules = ref();
const refFormDialog = ref();


const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
  const appPerm = await getUserAppPerm(currAuth.value);
  const result = await fetchGetAppModules({ type: 'flow' });
  if ('ok' == result.msg) {
    const boardAppPerm = appPerm.filter((d: Meta.ModuleNode) => 'module_ids' in d);
    for (let d of result.data) {
      let app = boardAppPerm.find((ap: any) => ap._id == d.app_id);
      if (app && app.module_ids.includes(d._id)) { // 判断是否有权限
        if ('nodes' in app) {
          app.nodes.push(d);
        } else {
          app['nodes'] = [d];
        }
      }
    }
  }
  appModules.value = appPerm.filter((app: any) => app.nodes?.length > 0)
}

init();

const onAddClick = (module: Meta.ModuleNode) => {
  refFormDialog.value.show('add', module)
}
</script>

<style scoped></style>
