<template>
  <div class="h-full">
    <NFlex align="center" class="h-10 w-full sticky top-0 z-1">
      <AppHeader class="w-full">
        <template #header>
          <span class="font-semibold">我的待办</span>
        </template>
      </AppHeader>
    </NFlex>
    <FlowFilter type="todo"></FlowFilter>
    <SmoothScrollbar style="height: calc(100% - 80px);">
      <NFlex class="p-2">
        <template v-for="ins in flows">
          <FlowInfoCard v-if="ins" :flow="ins" type="todo" @refresh="getAllTaskTodo"  class="shadow-sm hover:shadow-md"  :key="ins.uid"/>
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
import { fetchTodoTasks } from '@/service/api/flow';
const route = useRoute();

interface Props {
  id: string;
}

const props = defineProps<Props>();

const flows = ref()

// 查询流程实例：当前账户所属或关联任务的实例,流程表单内容；
const getAllTaskTodo = async () => {
  const app_id = (props.id == 'flowCenter' ? undefined : props.id);
  const flowInsResult = await fetchTodoTasks(app_id);
  if ('ok' == flowInsResult.msg) {
    flows.value = flowInsResult.data;
  }
}
getAllTaskTodo();


</script>

<style scoped></style>
