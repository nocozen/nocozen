<template>
  <NFlex class="w-full h-full">
    <NCarousel effect="fade" show-arrow class="border-1" style="border-color: rgba(255, 255, 255, 0.09)"
      autoplay>
      <NImage v-for="url in urls" :src="url" object-fit="cover" width="100%" class="w-full h-auto [&>img]:object-top" />
    </NCarousel>
  </NFlex>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { fetchFileUrl } from '@/service/api/upload';
import { useModuleInject } from "@/components/form-editor/useModuleInject";

// 组件Props
interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
})

const { compConfigs }  = useModuleInject();
const urls = ref([] as any);
const compConfig = ref();

const init = async () => {
  urls.value = [];
  if (compConfig.value && compConfig.value.images?.length > 0) {
    urls.value = await Promise.all(compConfig.value.images.map(async (gfsId: string) => {
      return await fetchFileUrl(gfsId, 'image/jpeg');
    }));
  }
}

init();

// 不要即监听又修改，导致循环，监听computed属性可能导致监听循环
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        init();
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
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
