<template>
  <NFlex :size="0" align="center">
    <SvgIcon :icon="icon" class="text-base mr-1" :class="iconClass" />
    <span>{{ title }}</span>
  </NFlex>

</template>


<script setup lang="ts">

interface Props {
  icon: string,
  title: string,
  iconClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconClass: 'text-blue'
})

</script>