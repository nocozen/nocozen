<template>
  <OrgSelect :i="i" :multiple="false" :orgType=MemberCheckerType.Dept />
</template>

<script setup lang="ts">
import { MemberCheckerType } from '@/enum';

interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});


</script>