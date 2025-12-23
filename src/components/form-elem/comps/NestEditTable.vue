<template>
  <NFlex vertical :size="0">
    <NFlex v-if="compConfig.showTitle" class="font-semibold h-8 w-full" align="center">
      <span>{{ compConfig.title }}</span>
    </NFlex>
    <NFlex :size="0">
      <EditTable :readonly="readonly" :i="i" :height="height" :optPerm="['add']"></EditTable>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { isEmpty } from 'radashi';

interface Props {
  i: string,
  readonly?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutNodes, layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const height = ref(10)

const cptCompLayout = computed(() => {
  if (compConfig.value && 'nodeUid' in compConfig.value && !isEmpty(compConfig.value.nodeUid) && layoutNodes ) {
    let h = layoutNodes.find((node: any) => node.uid == compConfig.value.nodeUid)?.layout.find((item: any) => item.i == props.i)?.h;
    return h ? h : 10;
  } else {
    return 10
  }
})

watch(
  () => cptCompLayout,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue) {
      height.value = newValue.value * layoutConfig!.value.rowHeight;
    }
  },
  { immediate: true, deep: true }
);

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);


</script>
