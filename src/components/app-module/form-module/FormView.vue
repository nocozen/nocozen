<template>
    <!-- <component :is="compMap[compType]"></component> -->
     <FillForm v-if="'form' == compType"></FillForm>
     <FilterTable v-else-if="'table' == compType" :viewType="viewType"></FilterTable>
</template>

<script setup lang="ts">
import { PermGroupType } from '@/enum';
import FillForm from './FillForm.vue';
import FilterTable from './FilterTable.vue';

interface Props {
  compType: string,
  viewType: PermGroupType
}

const props = withDefaults(defineProps<Props>(), {
  compType: 'form',

});

const compMap = {
  form: FillForm,
  table: FilterTable,
} as any

</script>
