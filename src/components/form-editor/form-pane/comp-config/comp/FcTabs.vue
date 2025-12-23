<template>
  <span class="font-semibold">样式</span>
  <NSelect v-model:value="compConfig.style.type" :options="tabOptions" size="small" @update:value="updateTabStyle"/>
  <span class="font-semibold">标签页</span>
  <NFlex align="center" v-for="(item, index) in tabItems">
    <NInput size="small" class="flex-1" v-model:value="item.name" @blur="update"></NInput>
    <NButton :disabled="disDelete" @click="onDeleteItemClick(item, index)" text class="text-gray-500" size="small">
      <SvgIcon icon="mdi:trash-can-outline" class="text-xl"/>
    </NButton>
  </NFlex>
  <NButton @click="onAddItemCick()" type="info" ghost size="small">
    <SvgIcon icon="mdi:plus" class="text-xl"/>
    <span>添加选项</span>
  </NButton>
</template>

<script setup lang="ts">
import { computed, ref, watch, h } from 'vue';
import Uid from '@/utils/uid';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchAddNestModuleConfig, fetchDeleteModuleComp, } from '@/service/api';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'update:tabs', tabs: Array<Meta.Tab>): void;
}

const emit = defineEmits<Emits>();
const { currModuleNode, layoutNodes, updateCompConfig, compConfigs, currSelectCompId } = useModuleInject();

const compConfig = ref();
const tabItems = ref([] as any);
const disDelete = ref(false);
const tabOptions = ref([
  { value: 'bar', label: '文本' },      // 'bar' | 'line' | 'card' | 'segment'
  { value: 'line', label: '文本带底边' },
  { value: 'card', label: '卡片' },
  { value: 'segment', label: '滑块' },
])

const updateTabStyle = async(value: string) => {
  await update();
}

const cptCompConfig = computed(() => {
  return compConfigs?.find((item: any) => item.i == currSelectCompId?.value);
})

watch(
  () => cptCompConfig,        // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue.value) {
      compConfig.value = newValue.value;
      tabItems.value = newValue.value.tabs;
    }
  },
  { immediate: true, deep: true }
);

const update = async () => {
  compConfig.value.tabs = tabItems.value;
  updateCompConfig && updateCompConfig(compConfig.value);
}

const deleteLayout = async (uid: number) => {
  if (currModuleNode && currModuleNode.value.moduleConfig_id) {
    // 删除嵌套布局
    await fetchDeleteModuleComp(currModuleNode.value?.moduleConfig_id, { layouts: { uid: uid } });
    // 删除嵌套布局对应包含的所有组件
    await fetchDeleteModuleComp(currModuleNode.value?.moduleConfig_id, { compConfigs: { nodeUid: uid } })
  }
}

const newLayout = async (uid: number) => {
  // 新增布局
  if (currModuleNode && currModuleNode.value.moduleConfig_id) {
    const layoutOption: Meta.LayoutNode = { uid: uid, layout: [], hiddenItems: [] };
    // Tab嵌套容器组件多个布局，如果容器还未添加需要添加
    await fetchAddNestModuleConfig(currModuleNode.value.moduleConfig_id, { layouts: [layoutOption] });
    layoutNodes && layoutNodes.push(layoutOption);
  }
}

const onDeleteItemClick = async (item: Meta.Tab, index: any) => {
  tabItems.value.splice(index, 1);
  compConfig.value.nestUid = compConfig.value.nestUid.filter((uid: number) => uid == item.uid);
  await update();
  await deleteLayout(item.uid);
  if (tabItems.value?.length == 1) {
    disDelete.value = true;
  }

}

const onAddItemCick = async () => {
  if (tabItems.value?.length < 20) {
    let item = { name: `标签${tabItems.value?.length + 1}`, uid: Uid.NextNumber() };
    tabItems.value.push(item);
    compConfig.value.nestUid.push(item.uid);
    await update();
    await newLayout(item.uid);
    if (tabItems.value?.length > 1) {
      disDelete.value = false;
    }
  }
}


</script>
