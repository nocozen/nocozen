<template>
  <NButton v-if="cptConfigButton.edit" class="flex w-full" size="small" @click="openCanditionDialog">
    <NFlex class="w-50 flex-1 justify-start">
      <span class="">{{ cptConfigButton.title }}</span>
    </NFlex>
    <SvgIcon :icon="cptConfigButton.icon" />
  </NButton>
  <ButtonIcon v-else size="small" @click="openCanditionDialog" level="" :icon="cptConfigButton.icon"
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
  (e: 'openCanditionDialog'): void;
}
const emit = defineEmits<Emits>();

const openCanditionDialog = () => {
  emit('openCanditionDialog')
}
const cptConfigButton = computed(() => {
  if (props.edit) {
    return {
      edit: true,
      title: '修改自定义条件',
      icon: QbIcon.Edit
    }
  } else {
    return {
      edit: false,
      title: '添加自定义条件',
      icon: QbIcon.Branch
    }
  }
})


</script>