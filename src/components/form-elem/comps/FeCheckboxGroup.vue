<template>
  <FeRadioGroup :i="i" :multiple="true" />
</template>

<script setup lang="ts">


interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});


</script>