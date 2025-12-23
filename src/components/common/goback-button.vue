<template>
  <RouterLink :to="backPath">
    <NButton text>
      <icon-ion-chevron-back class="ml-4 w-8 h-8 text-primary opacity-80 hover:opacity-100" />
    </NButton>
  </RouterLink>
</template>

<script lang="ts" setup>
// import { useRouter } from 'vue-router';
// import { router as globalRouter } from '@/router';
// import { useRouterPush } from '@/hooks/common/router';

defineOptions({ name: 'GoBackButton' });

interface Props {
  backPath: string;
}

const props = withDefaults(defineProps<Props>(), {
  backPath: '/home'
})

// const { routerPush } = useRouterPush();
const goBack = () => {
  // console.log('back')
  // routerBack();   // 重复在当前主菜单中回退，应该推到上一个主界面，
}

</script>



<style scoped></style>
