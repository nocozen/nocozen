<template>
  <NFlex :size="0" align="center" class="w-10 relative">
    <SvgIcon :icon="icon" class="text-base" :style="`color: ${iconColor}`" />
    <span>{{ title }}</span>
  </NFlex>

</template>


<script setup lang="ts">

interface Props {
  icon: string,
  title: string,
  iconColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'blue'
})

</script>