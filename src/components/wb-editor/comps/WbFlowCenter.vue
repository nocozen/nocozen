<template>
  <NCard class="card-wrapper">
    <NFlex justify="space-between">
      <RouterLink :to="{ path: '/app/flow-todo/flowCenter', query: { app_id: 'flowCenter' } }" class="flex-1">
        <CardButton title="我的待办" sizeType="lg" :badge="todo" icon="mdi:clipboard-text-clock">
        </CardButton>
      </RouterLink>
      <RouterLink :to="{ path: '/app/flow-started/flowCenter', query: { app_id: 'flowCenter' } }" class="flex-1">
        <CardButton title="我发起的" sizeType="lg" icon="fluent--play-circle-24-filled" />
      </RouterLink>
      <RouterLink :to="{ path: '/app/flow-handle/flowCenter', query: { app_id: 'flowCenter' } }" class="flex-1">
        <CardButton title="我处理的" sizeType="lg" icon="fluent--task-list-square-rtl-24-filled" />
      </RouterLink>
      <RouterLink :to="{ path: '/app/flow-received/flowCenter', query: { app_id: 'flowCenter' } }" class="flex-1">
        <CardButton title="抄送我的" sizeType="lg" :badge="unread" icon="fluent--send-24-filled" />
      </RouterLink>
      <RouterLink :to="{ path: '/app/flow-start/flowCenter', query: { app_id: 'flowCenter' } }" class="flex-1">
        <CardButton title="发起流程" sizeType="lg" icon="lets-icons--sign-in-squre-fill" />
      </RouterLink>
    </NFlex>
  </NCard>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fetchTasksCCopy, fetchTodoTasks } from '@/service/api/flow';

defineOptions({
  name: 'FlowPanel'
});

const unread = ref(0);
const todo = ref(0)

const getAllTaskTodo = async () => {
  todo.value = 0;
  const flowInsResult = await fetchTodoTasks(undefined);
  if ('ok' == flowInsResult.msg) {
    todo.value = flowInsResult.data?.length;
  }
}

const getAllUnread = async () => {
  unread.value = 0;
  const flowInsResult = await fetchTasksCCopy(undefined, false);
  if ('ok' == flowInsResult.msg) {
    for (let flow of flowInsResult.data) {
      for (let ccopy of flow.activeCCopy) {
        ccopy.isRead || unread.value++
      }
    }
  }
}

getAllTaskTodo();
getAllUnread();


</script>



<style lang="scss" scoped></style>
