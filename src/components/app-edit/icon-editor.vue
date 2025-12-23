<template>
  <n-modal v-model:show="showModal" :bordered="false" :mask-closable=false>
    <n-card closable class="pa-0 w-100" title="修改图标" :bordered="false" size="medium" role="dialog" aria-modal="true"
      :on-close="() => showModal = false">
      <NFlex>
        <n-form-item class="w-100" label="名称" label-placement="left" :show-feedback="false">
          <NInput placeholder="请输入MDI图标名"></NInput>
        </n-form-item>
        <NFlex class="pa-2 mr-3 w-100" justify="space-between">
          <NButton v-for="color in iconColors" :color="color" @click="currColor = color" circle></NButton>
        </NFlex>
        <n-scrollbar class="max-h-50 bg-gray-100" trigger="none">
          <NFlex class="gap-1 ma-2">
            <CardButton :color="currColor" titlePosition="none" sizeType="md" bgScope="all"
              v-for="icon in getMdiIcons()" :icon="`mdi:${icon}`">
            </CardButton>
          </NFlex>
        </n-scrollbar>
      </NFlex>
      <template #footer>
        <NFlex justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="onAddAppOk">确认</NButton>
        </NFlex>
      </template>
    </n-card>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { midMin } from './mdi'

defineOptions({
  name: 'IconEditor',
});

// 默认图标集合挑选一些有意义的，约40个左右；
// 橘黄：#ffb23f  亮粉：#f98c6a  亮紫：#b26ef7  亮青：#24cbe2  亮蓝：#5797ff  草绿：#258e43
const iconColors = ['#ffb23f', '#f98c6a', '#b26ef7', '#29f4de', '#24cbe2', '#5797ff', '#258e43']
const currColor = ref('#29f4de')
const currIcon = ref('application-outline');
const mdiIcons = ref([] as any);

const getMdiIcons = (query?: string) => {
  let newIcons = midMin;
  query && (newIcons = mdiIcons.value.filter((icon: string) => icon.includes(query)).slice(0, 300));
  return newIcons;
}


const showModal = ref(false)

const show = async () => {
  // 动态加载MDI图标集
  const mdi = await import(
    /* @vite-ignore */
    '@iconify/json/json/mdi.json'
  );
  mdiIcons.value = Object.keys(mdi.icons).map((name) => (name));
  showModal.value = true;
}

const onAddAppOk = () => {
  showModal.value = false;
}

defineExpose({
  show
})
</script>

<style lang="scss"></style>
