<template>
  <icon-local-qblogo v-if="!logoPath" />
  <NFlex v-else class="w-12 h-12" :size="0" align="center" justify="center">
    <img :src="`/${logoPath}`" class="object-contain" />
  </NFlex>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SystemLogo' });

interface Props {
  /** Button class */
  logoPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
});

</script>

<style scoped lang="scss">
</style>
