<template>
  <NImage :object-fit="fit" :src="url" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchFileUrl } from '@/service/api/upload';

interface Props {
  gfsId: string,
  fit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',
}

const props = withDefaults(defineProps<Props>(), {
});


const url = ref('')


const init = async () => {
  if (props.gfsId) {
    url.value = await fetchFileUrl(props.gfsId, 'image/jpeg');
  } else {
    url.value = ""
  }
}

init();


</script>
