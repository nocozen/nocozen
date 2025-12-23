<template>
  <NFlex align="center" :size="0" justify="start">
    <NAvatar round :size="20" :src="avatarUrl" object-fit="fill" class="bg-blue">
      <template #default v-if="!avatarUrl">
        <SvgIcon icon="mdi:account-tie" />
      </template>
    </NAvatar>
    <span v-if="textWidth != 'none'" class="mx-1 truncate flex justify-start" :class="`w-${textWidth}`">{{ account.name
      }}</span>
    <NTag v-for="t in cptTags" size="small" round :type="tagType[t]">{{ t }}</NTag>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAvatar } from 'naive-ui';
import { fetchFileUrl } from '@/service/api/upload';

interface Props {
  account: { name: string, avatar: string, tags?: Array<'创建者' | '主管' | '停用'> };
  textWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  textWidth: 'fit'
});

const tagType = {
  '创建者': 'sucess',
  '主管': 'info',
  '停用': 'error'
} as any
const avatarUrl = ref('')

const cptTags = computed(() => {
  if (props.account.tags && props.account.tags.length > 0) {
    return props.account.tags
  } else {
    return []
  }
})

const init = async () => {
  if (props.account) {
    if (props.account.avatar) {
      try {
        avatarUrl.value = await fetchFileUrl(props.account.avatar, 'image/jpeg');
      } catch (e: any) {
        avatarUrl.value = "";
      }
    } else {
      avatarUrl.value = ""
    }
  }
}

watch(
  () => props.account.avatar,
  (newValue, oldValue) => {
    init()
  },
  { immediate: true, deep: true }
);
</script>
