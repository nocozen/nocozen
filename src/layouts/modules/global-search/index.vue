<template>
  <ButtonIcon class="text-tbox_text" :tooltip-content="$t('common.search')" @click="toggle">
    <icon-uil-search />
  </ButtonIcon>
  <SearchModal v-model:show="show" />
</template>

<script lang="ts" setup>
import { useBoolean } from '@sa/hooks';
import { $t } from '@/locales';
import SearchModal from './components/search-modal.vue';

defineOptions({ name: 'GlobalSearch' });

const { bool: show, toggle } = useBoolean();
</script>

<style lang="scss" scoped></style>
