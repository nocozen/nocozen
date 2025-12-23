<template>
  <div class="h-full">
    <NFlex class="h-10 w-full sticky top-0 z-1">
      <AppHeader class="w-full">
        <template #header>
          <span>{{ title }}</span>
        </template>
      </AppHeader>
    </NFlex>
    <DashBoard v-if="id && id?.length == 24" :moduleId="id" />
    <NFlex v-else style="height: calc(100% - 40px);" :size="16" align="center" class="p-4">
      <NCard class="card-wrapper h-full pb-20">
        <NFlex vertical class="w-full h-full" align="center" justify="center">
          <NFlex class="w-full h-fit " align="center" justify="center">
            <CardButton @click="openEditor(MenuEventType.AddFlowModule)" :class="btnClass" title="新建流程表单" sizeType="lg"
              icon="fluent--document-flowchart-24-regular" />
            <CardButton @click="openEditor(MenuEventType.AddFormModule)" :class="btnClass" title="新建表单" sizeType="lg"
              icon="mdi:file-document-box-outline" />
          </NFlex>
          <NFlex class="w-full h-fit" align="center" justify="center">
            <CardButton @click="openEditor(MenuEventType.AddBoardModule)" :class="btnClass" title="新建仪表板" sizeType="lg"
              icon="material-symbols--space-dashboard-outline" />
            <CardButton @click="openEditor(MenuEventType.ModuleAddGroup)" :class="btnClass" title="新建分组" sizeType="lg"
              icon="ci--folder-add" />
          </NFlex>
        </NFlex>
      </NCard>
      <AddApp ref="refAddApp" @refreshMenu="refreshMenu"></AddApp>
    </NFlex>
  </div>

</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { $t } from '@/locales';
import AppHeader from '@/layouts/modules/app-header/index.vue';
import { ProviderName, MenuEventType } from '@/enum';
import { useRoute } from 'vue-router';


interface Props {
  id: string;
}

const props = defineProps<Props>();

const openModuleAdd = inject<any>(ProviderName.OpenModuleAddProvide);
const refreshMenu = inject<any>(ProviderName.RefreshMenuProvide);

const refAddApp = ref();
const route = useRoute();
const title = ref('应用初始页');
document.title = title.value;
// 初始页获取到app id, 需要获取 首页 id , 没有首页，需要默认定位第一个菜单项；
// 普通用户没有菜单无法访问应用，管理员可进入无菜单应用，初始化页添加应用，未发布页面只有管理员可访问；
const btnClass = 'h-36 max-w-80 select-none cursor-pointer shadow-md outline outline-1 outline-gray-100 hover:bg-blue-50 '

// 添加表单打开编辑面板，可操作添加的节点是app、group；可操作修改、删除的是module;
const openEditor = async (eventType: string) => {  // 当前节点作为父节点
  const app_id = route.query.app_id?.toString();
  if (app_id) {
    if ([MenuEventType.AddFlowModule, MenuEventType.AddFormModule, MenuEventType.AddBoardModule].includes(eventType as any)) {   // 添加流程表单
      await openModuleAdd(eventType, app_id);
    }
    else if (eventType == MenuEventType.ModuleAddGroup) {  // 添加分组
      await refAddApp.value.openAdd(eventType, app_id);
    } else if (eventType == MenuEventType.ModuleAddSubGroup) {  // 添加子分组
      await refAddApp.value.openAdd(eventType, app_id);
    }
    await refreshMenu();
  }

}


</script>

<style scoped></style>
