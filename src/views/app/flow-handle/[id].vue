<template>
  <div class="h-full">
    <NFlex class="h-10 w-full sticky top-0 z-1">
      <AppHeader class="w-full">
        <template #header>
          <span class="font-semibold">我处理的</span>
        </template>
      </AppHeader>
    </NFlex>
    <FlowFilter type="handle" @onFlowFilter="onFlowFilter"></FlowFilter>
    <SmoothScrollbar style="height: calc(100% - 80px);">
      <NFlex class="p-2">
        <template v-for="ins in flows">
          <FlowInfoCard v-if="ins" :flow="ins" type="handle" class="shadow-sm hover:shadow-md"  :key="ins.uid"/>
        </template>
      </NFlex>
    </SmoothScrollbar>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import AppHeader from '@/layouts/modules/app-header/index.vue';
import { useRoute } from 'vue-router';
import { fetchHandledTasks } from '@/service/api/flow';
const route = useRoute();

interface Props {
  id: string;
}

const props = defineProps<Props>();

const flows = ref();
const status = ref();

const onFlowFilter = (value: string) => {
  status.value = value == 'all' ? undefined : value;
  loadData();
}

// 查询流程实例：当前账户所属或关联任务的实例,流程表单内容；
const loadData = async () => {
  const app_id = (props.id == 'flowCenter' ? undefined : props.id);
  const flowInsResult =  await fetchHandledTasks(app_id, status.value);
  if ('ok' == flowInsResult.msg) {
    flows.value = flowInsResult.data;
  }
}
loadData();

</script>



<style scoped></style>
