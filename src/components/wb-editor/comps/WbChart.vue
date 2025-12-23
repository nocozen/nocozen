<template>
  <DarkModeContainer>
    <Charts :chartConfig="comp.value" class="border-1" style="border-color: rgba(255, 255, 255, 0.09)"></Charts>
  </DarkModeContainer>
</template>

<script setup lang="ts">


interface Props {
  comp: Meta.ChartComp,
}

const props = withDefaults(defineProps<Props>(), {
});

</script>
