<template>
  <div class="h-full">
    <NFlex class="h-10 w-full sticky top-0 z-1">
      <AppHeader class="w-full">
        <template #header>
          <span class="font-semibold">抄送我的</span>
        </template>
      </AppHeader>
    </NFlex>
    <FlowFilter type="received" @onCopyFilter="onCopyFilter" :unread="unread"></FlowFilter>
    <SmoothScrollbar style="height: calc(100% - 80px);">
      <NFlex class="p-2">
        <template v-for="ins in flows">
          <FlowInfoCard v-if="ins" @onRead="onRead" @onClose="refresh" :flow="ins" type="received" class="shadow-sm hover:shadow-md"
            :key="ins.uid" />
        </template>
      </NFlex>
      <n-divider />
    </SmoothScrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import AppHeader from '@/layouts/modules/app-header/index.vue';
import { useRoute } from 'vue-router';
import { fetchTasksCCopy, updateFlowCCopy } from '@/service/api/flow';


const route = useRoute();

interface Props {
  id: string;
}

const props = defineProps<Props>();

const authStore = useAuthStore();
const flows = ref();
const unread = ref(0);
const isRead = ref();

const refresh = () => {
  loadData();
}
const onRead = async (flow: Meta.FlowInstance) => {
  // 更新该流程中的所有抄送任务，因为一个流程可能多个环节都有抄送；
  if (flow._id && authStore.userInfo._id) {
    const result = await updateFlowCCopy(flow._id, authStore.userInfo._id);
  }
}

const onCopyFilter = (value: string) => {
  if (value == 'read') {
    isRead.value = true;
  } else if (value == 'unread') {
    isRead.value = false;
  } else {
    isRead.value = undefined;
  }
  loadData();
}

// 查询流程实例：当前账户所属或关联任务的实例,流程表单内容；
const loadData = async () => {
  unread.value = 0;
  const app_id = (props.id == 'flowCenter' ? undefined : props.id);
  const flowInsResult = await fetchTasksCCopy(app_id, isRead.value);
  // console.log(flowInsResult)
  if ('ok' == flowInsResult.msg) {
    flows.value = flowInsResult.data;
    for (let flow of flows.value) {
      for (let ccopy of flow.activeCCopy) {
        ccopy.isRead || unread.value++
      }
    }
  }
}
loadData();

</script>


<style scoped></style>
