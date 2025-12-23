<template>
  <div class="bg-container text-base_text transition-300" :class="{ ' text-#1f1f1f': inverted }">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DarkModeContainer' });

interface Props {
  inverted?: boolean;
}

defineProps<Props>();
</script>


<style scoped></style>
