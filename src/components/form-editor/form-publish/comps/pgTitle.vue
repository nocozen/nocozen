<template>
  <NInput  @blur="onNameBlur" v-model:value="pgName" size="small"></NInput>
  <NFlex class="w-full" style="height: calc(100% - 40px);">
    <NInput  @blur="onNotesBlur" v-model:value="pgNotes" type="textarea" size="small" :autosize="{ minRows: 8 }"></NInput>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { fetchUpdateModulePg } from '@/service/api';

interface Props {
  permGroup: Meta.ModulePermGroup
}

const props = withDefaults(defineProps<Props>(), {
})

const pgName = ref('');
const pgNotes = ref('')
const refresh = inject<any>('refresh');

const init = () => {
  if (props.permGroup) {
    pgName.value = props.permGroup.name;
    pgNotes.value = props.permGroup.notes;
  }
}

init();

const onNameBlur = async () => {
  if (props.permGroup._id && pgName) {
    const result = await fetchUpdateModulePg(props.permGroup._id, { name: pgName.value });
    refresh && refresh();
  }
}

const onNotesBlur = async () => {
  if (props.permGroup._id && pgNotes) {
    const result = await fetchUpdateModulePg(props.permGroup._id, { notes: pgNotes.value });
  }
}

</script>