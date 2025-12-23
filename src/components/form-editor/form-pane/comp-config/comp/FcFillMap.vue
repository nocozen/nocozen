<template>
  <NButton v-if="cptConfigButton.edit" class="flex w-full" size="small" @click="openFillMapDialog">
    <NFlex class="w-50 flex-1 justify-start">
      <span class="">{{ cptConfigButton.title }}</span>
    </NFlex>
    <SvgIcon :icon="cptConfigButton.icon" />
  </NButton>
  <ButtonIcon v-else size="small" @click="openFillMapDialog" level="" :icon="cptConfigButton.icon"
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
  (e: 'openFillMapDialog'): void;
}
const emit = defineEmits<Emits>();

const openFillMapDialog = () => {
  emit('openFillMapDialog')
}
const cptConfigButton = computed(() => {
  if (props.edit) {
    return {
      edit: true,
      title: '修改填充字段',
      icon: QbIcon.Edit
    }
  } else {
    return {
      edit: false,
      title: '填充字段设置',
      icon: QbIcon.Link
    }
  }
})


</script>