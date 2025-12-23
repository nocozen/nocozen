<template>
  <component :is="compMap[type]" :viewType="type"></component>
</template>

<script setup lang="ts">
import FlowForm from './FlowForm.vue';
import FlowTable from './FlowTable.vue';

interface Props {
  type: string,
}

const props = withDefaults(defineProps<Props>(), {
  type: 'form',
});

const compMap = {
  form: FlowForm,
  table: FlowTable,
} as any


</script>
