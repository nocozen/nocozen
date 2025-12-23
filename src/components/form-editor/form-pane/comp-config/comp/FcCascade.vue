<template>
  <NButton v-if="cptConfigButton.edit" class="flex w-full" size="small" @click="openCascadeDialog">
    <NFlex class="w-50 flex-1 justify-start">
      <span class="">{{ cptConfigButton.title }}</span>
    </NFlex>
    <SvgIcon :icon="cptConfigButton.icon" />
  </NButton>
  <ButtonIcon v-else size="small" @click="openCascadeDialog" level="" :icon="cptConfigButton.icon"
    :title="cptConfigButton.title" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { QbIcon } from '@/enum';

interface Props {
  edit: boolean
}

const props = withDefaults(defineProps<Props>(), {
  edit: false
});

interface Emits {
  (e: 'openCascadeDialog'): void;
}
const emit = defineEmits<Emits>();

const openCascadeDialog = () => {
  emit('openCascadeDialog')
}
const cptConfigButton = computed(() => {
  if (props.edit) {
    return {
      edit: true,
      title: '修改关联过滤设置',
      icon: QbIcon.Edit
    }
  } else {
    return {
      edit: false,
      title: '数据关联过滤设置',
      icon: QbIcon.Link
    }
  }
})


</script>