<template>
  <n-drawer v-model:show="show" class="rounded-none" height="100%" placement="bottom">
    <NFlex>
      <n-card>
        <n-button @click="show = false">close</n-button>
      </n-card>
    </NFlex>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const show = ref(false)

defineExpose({
  show
})

</script>
