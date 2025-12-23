<template>
  <NFlex class="w-full group" align="center" :size="0" justify="center">
    <span :class="{'group-hover:hidden': editPerm}">{{ index }}</span>
    <SvgIcon v-if="editPerm" class="hidden group-hover:block text-base text-blue" :icon="QbIcon.Delete"/>
  </NFlex>
</template>

<script setup lang="ts">
import { QbIcon } from '@/enum';

interface Props {
  index: number,
  editPerm: boolean
}

const props = withDefaults(defineProps<Props>(), {
});



</script>