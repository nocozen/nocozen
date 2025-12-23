<template>
  <NSpace vertical :size="16">
    <NCard title="报表模块" :bordered="false" size="small" segmented class="card-wrapper">
      <p>{{ id }}</p><SvgIcon icon="line-md:menu-fold-right"></SvgIcon>
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';

interface Props {
  id: string;
}

defineProps<Props>();

const appStore = useAppStore();

</script>



<style scoped></style>
