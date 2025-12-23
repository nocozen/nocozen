
<template>
  <ButtonIcon  v-if="cptNewAppPerm" class="text-tbox_text" iconClass="text-xl"
    localIcon="material-symbols--display-settings-outline" tooltip-content="工作台定制">
  </ButtonIcon>
</template>

<script setup lang="ts">
import { computed,ref } from 'vue';
import { $t } from '@/locales';
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';
import { AdminGroupType } from '@/enum';
import { decryptPack } from '@/utils/crypto-msgpack';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({
  name: 'WorkbenchEditor',
});

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
})

const currAuth = ref();
const userAuth = useAuthStore();

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
}

// 创建阶段初始化
init();
const cptNewAppPerm = computed(() => {
  return [AdminGroupType.Creator, AdminGroupType.Super ].includes(currAuth.value?.groupRole);
})
</script>
<style scoped lang="scss"></style>
