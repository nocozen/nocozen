<template>
  <FeSelect :i="i" :multiple="true"></FeSelect>
</template>

<script setup lang="ts">


interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});


</script>