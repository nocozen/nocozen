<template>
  <NFlex align="center" class="px-4 py-1 h-10 w-full sticky top-0  bg-gray-100/50" justify="space-between">
    <NTabs class="w-60" type="segment" size="small" animated @update:value="onTabClick">
      <NTab v-for="f in filter" :name="f.value" :disabled="f.disabled">
        <NBadge v-if="f.value == 'unread'" :value="unread" :dot="unread > 0" :offset="[8, 13]">{{ f.label }}</NBadge>
        <p v-else>{{f.label}}</p>
      </NTab>
    </NTabs>
    <NFlex align="center">
      <NFlex class="w-60">
        <NInput round size="tiny" @update:value="updateFilter">
          <template #prefix>
            <SvgIcon icon="mingcute--search-line"></SvgIcon>
          </template>
        </NInput>
      </NFlex>
      <ButtonIcon class="mt-0.5" icon="mingcute--filter-line" title="筛选" size="small"></ButtonIcon>
      <ButtonIcon class="mt-0.5" icon="ph--sort-ascending" title="排序" size="small"></ButtonIcon>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  type: string,
  unread?: number
}

const props = withDefaults(defineProps<Props>(), {
  unread: 0,
});

// 定义emit
interface Emits {
  (e: 'onTodoFilter', value: 'all' | 'timeout' | 'urged' | 'sendBack'): void,
  (e: 'onFlowFilter', value: 'all' | 'active' | 'complete'): void,
  (e: 'onCopyFilter', value: 'all' | 'unread' | 'read'): void,
  (e: 'onUpdateFiler', value: string): void,
}
const emit = defineEmits<Emits>();

const selectedButton = ref('全部')
const filter = computed(() => {
  if ('todo' == props.type) {
    return fTodo;
  } else if ('received' == props.type) {
    return fCcopy;
  } else {
    return fflow;
  }
})

const fTodo = [
  { label: '全部', value: 'all' },
  { label: '已超时', value: 'timeout', disabled: true },
  { label: '催办', value: 'urged', disabled: true },
  { label: '退回', value: 'sendBack', disabled: true },
] as any
const fflow = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'complete' },
] as any
const fCcopy = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' },
] as any


const onTabClick = (value: any) => {
  if ('todo' == props.type) {
    emit('onTodoFilter', value);
  } else if ('received' == props.type) {
    emit('onCopyFilter', value);
  } else {
    emit('onFlowFilter', value);
  }
}

const updateFilter = (value: string) => {
  emit('onUpdateFiler', value);
}
</script>