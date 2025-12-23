<template>
  <n-modal v-model:show="showModal" :bordered="false" :mask-closable=false>
    <div>对话框</div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showModal = ref(false)



</script>