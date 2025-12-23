<template>
  <NFlex justify="end" :size="0" align="center">
    <!-- <BtnIcon text class="opacity-80 mr-1" icon="lucide--view" @click.stop="onMenuClick('view')"></BtnIcon>
    <BtnIcon text class="opacity-80 mr-1" icon="uil--edit" @click.stop="onMenuClick('edit')"></BtnIcon> -->
    <template v-for="item in menuOptions">
      <BtnIcon text :disabled="item.type.startsWith('disable')" class="mx-1" :icon="item.icon"
        @click.stop="onMenuClick(item.type)"></BtnIcon>
    </template>
  </NFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue';


interface Props {
  types: Array<string>,
}

const props = withDefaults(defineProps<Props>(), {
  types: () => []
});

const options = [
  { id: 1, name: '组件背景', icon: 'mdi:trash-can-outline', type: 'bgColor' },
  { id: 2, name: '隐藏组件', icon: 'mdi:eye-remove-outline', type: 'hidden' },
  { id: 3, name: '编辑', icon: 'uil--edit', type: 'edit' },
  { id: 4, name: '标题显示', icon: 'mdi:archive-view-outline', type: 'show-title' },
  { id: 5, name: '删除', icon: 'mdi:trash-can-outline', type: 'disable-delete' },
  { id: 6, name: '删除', icon: 'mdi:trash-can-outline', type: 'delete' }
]

const menuOptions = computed(() => {
  // const allTypes = [...props.types, 'delete']
  return options.filter((item: any) => props.types.includes(item.type))
})

interface Emits {
  (e: 'onMenuClick', type: string): void;
}

const emit = defineEmits<Emits>();

const onMenuClick = (type: string) => {
  emit('onMenuClick', type)
}

</script>