<template>
  <DarkModeContainer>
    <NCarousel effect="fade" show-arrow class="rounded-md  border-1" style="border-color: rgba(255, 255, 255, 0.09)"
      autoplay>
      <NImage v-for="url in urls" :src="url" object-fit="cover" width="100%" class="w-full h-auto [&>img]:object-top" />
      <!-- <NImage v-for="url in urls" :src="url" object-fit="cover" width="100%" class="w-full h-full"/> -->
    </NCarousel>
  </DarkModeContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { fetchFileUrl } from '@/service/api/upload';
import { fetchTestMsg } from '@/service/api';
import { useModuleInject } from "@/components/form-editor/useModuleInject";

interface Props {
  comp: Meta.LayoutComp,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutNodes }  = useModuleInject();
// 高度宽度都不留白 <NImage :src="url" object-fit="cover" width="100%" class="w-full h-full"/>
// 宽度充满顶部对齐 <NImage :src="url" object-fit="cover" width="100%" class="w-full h-auto [&>img]:object-top"/>

const urls = ref([] as any)
const init = async () => {
  urls.value = [];
  if (props.comp && props.comp.value && props.comp.value?.length > 0) {
    urls.value = await Promise.all(props.comp.value.map(async (id: string) => {
      return await fetchFileUrl(id, 'image/jpeg');
    }));
  }
}

init();

watch(
  () => props.comp,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue.value) {
      init();
    }
  },
  { immediate: true, deep: true }
);


</script>

<style scoped>
.carousel-img {
  width: 100%;
  height: auto;
  object-fit: scale-down;
}

.custom-arrow {
  display: flex;
  position: absolute;
  bottom: 6px;
  right: 6px;
}

.custom-arrow button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 12px;
  color: rgba(255, 255, 255, 0.4);
  background-color: transparent;
  border-width: 0;
  border-radius: 8px;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.custom-arrow button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.custom-arrow button:active {
  transform: scale(0.95);
  transform-origin: center;
}

.custom-dots {
  display: flex;
  margin: 0;
  padding: 0;
  position: absolute;
  bottom: 10px;
  left: 20px;
}

.custom-dots li {
  display: inline-block;
  width: 12px;
  height: 4px;
  margin: 0 3px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.4);
  transition:
    width 0.3s,
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.custom-dots li.is-active {
  width: 40px;
  background: rgba(255, 255, 255, 0.4);
}
</style>
