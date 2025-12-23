<template>
  <NFlex class="px-3 pt-3 select-none" :size="0">
    <NFlex class="h-full w-full box-with-shadows" :size="0">
      <SmoothScrollbar class="rounded-t " style="height: calc(100vh - 52px);">
        <DarkModeContainer class="rounded-none pa-2" style="min-height: calc(100vh - 52px);" :bordered="false">
          <VglPanel ref="vglPanel" v-if="formLayoutConfig"></VglPanel>
        </DarkModeContainer>
      </SmoothScrollbar>
    </NFlex>
  </NFlex>
</template>

<script lang="ts" setup>
import { inject, ref, Ref, provide, watch, onMounted } from 'vue';
import { fetchGetModuleConfig } from '@/service/api';
import { useRoute } from 'vue-router';
import { ModuleType, ProviderName } from '@/enum';
import Uid from '@/utils/uid';
import * as _ from 'lodash-es';

interface Props {
  moduleId?: string | null;    // home首页使用
}

const props = defineProps<Props>();

let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);
const route = useRoute();
const formLayouts = ref<Array<Meta.LayoutNode>>([]);
const compConfigs = ref<Array<Meta.CompConfig>>([]);

const formLayoutConfig = ref();
const formConfig = ref<Meta.FormConfig>({} as any)

/** 查询初始化模块元数据 */
const initModuleData = async () => {
  let currModuleId = props.moduleId;
  if (!currModuleId) {
    currModuleId = currModuleNode?.value.moduleConfig_id;
  }
  // 查询模块配置并初始化；
  if (currModuleId) {
    const result = await fetchGetModuleConfig(currModuleId);
    if ('ok' == result.msg && result.data?.length > 0) {
      // 在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
      formLayouts.value.length = 0;   // init
      compConfigs.value.length = 0;   // init
      formConfig.value = {} as any;   // init

      formConfig.value = result.data[0].formConfig;
      compConfigs.value.push(...result.data[0].compConfigs);

      const formVglConfig = result.data[0].defVglConfig;
      formVglConfig.isEditable = false;   // 临时辅助参数
      formVglConfig.draggable = false;
      formLayoutConfig.value = formVglConfig;

      // 初始化布局，并添加监听标记
      if (result.data[0].layouts?.length > 0) {
        result.data[0].layouts?.forEach((node: any) => {
          formLayouts.value.push({ ...node, initFlag: Uid.NextNumber() });
        })
      }
    }
  }
}

onMounted(() => {
  initModuleData();
})

watch(
  () => route.query.open,
  (newValue, oldValue) => {   // 第一次没有加载vgl，所以二次刷新不重复
    newValue && initModuleData();
  },
  { immediate: true, deep: true }
);

provide(ProviderName.FormConfigProvider, formConfig);
provide(ProviderName.LayoutConfigProvide, formLayoutConfig);
provide(ProviderName.LayoutsProvide, formLayouts.value);
provide(ProviderName.CompConfigsProvide, compConfigs.value);


const vglPanel = ref();
const print = () => {
  vglPanel.value.print();
}

defineExpose({
  print
})

</script>

<style lang="scss" scoped>
.box-with-shadows {
  /* 添加四边阴影 */
  box-shadow:
    0 10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 底部阴影 */
    0 -10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 顶部阴影 */
    10px 0 10px -5px rgba(0, 0, 0, 0.2),
    /* 右侧阴影 */
    -10px 0 10px -5px rgba(0, 0, 0, 0.2);
  /* 左侧阴影 */
}
</style>
