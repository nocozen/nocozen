<template>
  <NCard class="card-wrapper">
    <NFlex align="center" justify="space-between" class="mb-4">
      <span class="font-bold">我的应用</span>
      <NFlex :size="0" class="w-10" justify="end">
        <BtnIcon v-if="cptNewAppPerm" @click="onAddAppClick" icon="mingcute--add-line" title="新建" type="primary" round class="px-3.5 h-6"/>
        <!-- <BtnIcon icon="lucide--import" ></BtnIcon> -->
      </NFlex>
      <AddApp ref="refAddApp" @refreshMenu="refreshMenu"></AddApp>
    </NFlex>
    <NFlex justify="start" class="mb-4 mx-6 min-h-28">
      <DropList placeholder="暂无应用可访问" @reorder="onReorder" class="w-full flex-center gap-2" :items="appList">
        <template #item="{ item, index, reorder }">
          <Drag :disabled="canEdit" @click="onAppClick(item)" :key="item.name" :data="item"
            :style="{ opacity: reorder ? 0 : 1 }" class="w-48">
            <AppCard :canEdit="cptNewAppPerm" @refreshApps="refreshMenu" @onEditApp="onEditApp" :item="item" :index="index" :appList="appList" />
          </Drag>
        </template>
        <template #feedback>
        </template>
      </DropList>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getUserAppPerm, fetchUpdateAppOrder, fetchGetPermGroupCount } from '@/service/api';
import { Drag, DropList } from "@/components/dnd";
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';
import AppCard from './AppCard.vue';
import { MenuEventType, AdminGroupType } from '@/enum';
import { useAuthStore } from '@/store/modules/auth';
import { decryptPack } from '@/utils/crypto-msgpack';


defineOptions({
  name: 'AppPanel'
});

const userAuth = useAuthStore();
const route = useRoute();
const { routerPush } = useRouterPush();
const refAddApp = ref();

const canEdit = ref(false);
const appList = ref([] as any);

const currAuth = ref();

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
  appList.value = await getUserAppPerm(currAuth.value);
}

// 创建阶段初始化
init();

const cptNewAppPerm = computed(() => {
  return [AdminGroupType.Creator, AdminGroupType.Super ].includes(currAuth.value?.groupRole);
})

// 弹窗点击确认；
const refreshMenu = () => {
  init();
}

// 添加应用
const onAddAppClick = () => {
  refAddApp.value.openAdd(MenuEventType.AppAdd, null, null);
}

// 编辑应用名称和图标
const onEditApp = (appNode: Meta.AppNode) => {
  refAddApp.value.openEdit(MenuEventType.AppEditLable, appNode);
}

// 进入首页的逻辑：无模块管理员可进入，普通用户不能进入；有模块绑定首页进入后打开首页，无绑定打开第一个模块；
// 针对普通用户：禁用首页可以把app.home_id置空；启用首页需要给首页绑定模块；
const onAppClick = (appNode: Meta.AppNode) => {
  let from = route.query['from'];
  let curr = route.path.split('/', 3).join('/');
  let path = '/app/';
  if (appNode.home_id) {
    path += `init/${appNode.home_id}`;
  } else {
    path += 'init/first';
  }
  if (from == curr) {
    routerPush({ path: path, query: { from: from, app_id: appNode._id } })
  } else {
    routerPush({ path: path, query: { from: curr, app_id: appNode._id } })
  }
}

// 用于判断是否显示占位样式
const onReorder = async (e: any) => {
  await e.apply(appList.value);
  // 通过更新数据库，再刷新列表实现真正的顺序修改
  // let sufUpdateOptions = await getListSufIds(appList.value, e.from, e.to)
  const updateResult = await fetchUpdateAppOrder(appList.value, e.from, e.to);
}

</script>



<style scoped lang="scss">
.number {
  padding: 15px;
  text-align: start;
  border-style: solid;
  border-width: 0.8rem;
  width: 100px;
  background-color: pink;
}
</style>
