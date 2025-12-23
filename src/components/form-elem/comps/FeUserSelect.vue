<template>
  <OrgSelect :i="i" :multiple="false" :orgType=MemberCheckerType.Member />
</template>

<script setup lang="ts">
import { MemberCheckerType } from '@/enum';

interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});


</script>