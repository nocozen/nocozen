<template>
  <component v-if="currModuleNode" :is="compMap[currModuleNode.type]"></component>
</template>

<script setup lang="ts">
import { Ref, ref, inject, watch } from 'vue';
import BoardModule from './board-module/index.vue';
import FormModule from './form-module/index.vue'
import FlowModule from './flow-module/index.vue'
import { ProviderName } from '@/enum';

interface Props {
}

const props = defineProps<Props>();
let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);

const compMap = {
  form: FormModule,
  flow: FlowModule,
  board: BoardModule,
} as any



</script>
