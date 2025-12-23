<template>
  <NDrawer v-model:show="showModel" class="rounded-none select-none" height="100%" placement="bottom">
    <NFlex vertical :size="0" class="h-full w-full min-w-230 ">
      <NFlex :size="0" class="h-12 shadow-md" align="center">
        <NFlex class="flex-1">
          <ButtonIcon type="info" class="text-base" iconClass="text-lg" icon="mdi:chart-box-outline"
            :title="compConfig?.title" />
        </NFlex>
        <NFlex class="flex-none mr-2" justify="end">
          <ButtonIcon @click="closeEditor" level='' type="info" icon="tabler--check" title="完成" />
        </NFlex>
      </NFlex>
      <NFlex class="w-full flex-nowrap bg-gray-100/50" :size="0" style="height: calc(100% - 50px);">
        <NFlex vertical class="w-60 h-full p-4 ">
          <MetaConfig :dataBind="compConfig?.dataBind" @updateDataBind="updateDataBind"></MetaConfig>
        </NFlex>
        <NFlex class="h-full p-4 outline outline-slate-200/50 outline-1" style="width: calc(100% - 560px);">
          <DropBox boxType="dims" :i="chartId" :list="cptDims" @updateList="updateDims"
            :acceptsType="[BiType.Text, BiType.Date, BiType.Number]" boxName="维度" />
          <DropBox boxType="meas" :i="chartId" :list="cptMetrics" @updateList="updateMetrics"
            :acceptsType="[BiType.Text, BiType.Date, BiType.Number]" boxName="指标" />
          <DropBox boxType="filter" :i="chartId" :list="cptFilter" @updateList="updateFilter"
            :acceptsType="[BiType.Text, BiType.Date, BiType.Number]" boxName="过滤" />
          <NFlex style="width: 100%;height: calc(100% - 132px);" :size="0" class="bg-white">
            <Charts v-if="chartId" :i="chartId" isEditable @updateTitle="updateTitle"></Charts>
          </NFlex>
        </NFlex>
        <NFlex vertical class="w-80 h-full">
          <ChartConfig :compConfig="compConfig" @updateChartConfig="updateChartConfig"></ChartConfig>
        </NFlex>
      </NFlex>
    </NFlex>
  </NDrawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useModuleInject } from "../useModuleInject";
import ChartConfig from './comps/ChartConfig.vue';
import MetaConfig from './comps/MetaConfig.vue';
import { BiType, BoardElType } from '@/enum';


const showModel = ref(false);
const chartId = ref();
const compConfig = ref<Meta.ChartComp>();

const { compConfigs, updateCompConfig } = useModuleInject();

const updateDataBind = (dataBind: Meta.DataBind) => {
  if (compConfig.value && updateCompConfig) {
    compConfig.value['dataBind'] = dataBind;
    compConfig.value.dims && (compConfig.value.dims.length = 0);
    compConfig.value.metrics && (compConfig.value.metrics.length = 0);
    compConfig.value.filter && (compConfig.value.filter.length = 0);
    updateCompConfig(compConfig.value as Meta.CompConfig);

  }
}

const updateChartConfig = () => {
  if (compConfig.value && updateCompConfig) {
    updateCompConfig(compConfig.value as Meta.CompConfig);
  }
}

const updateTitle = (title: string) => {
  if (title && compConfig?.value?.title && compConfig.value.title != title && updateCompConfig) {
    compConfig.value.title = title;
    updateCompConfig(compConfig.value as Meta.CompConfig);
  }
}

const cptDims = computed(() => {
  return compConfig.value?.dims;
})

const cptMetrics = computed(() => {
  return compConfig.value?.metrics;
})

const cptFilter = computed(() => {
  return compConfig.value?.filter;
})

const updateDims = (list: any) => {
  compConfig.value
    && (compConfig.value.dims = list)
    && (updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig))
}

const updateMetrics = (list: any) => {
  compConfig.value
    && (compConfig.value.metrics = list)
    && (updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig))
}

const updateFilter = (list: any) => {
  compConfig.value
    && (compConfig.value.filter = list)
    && updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig);
}

const closeEditor = () => {
  showModel.value = false;
}

const openEditor = (i: string) => {
  chartId.value = i;
  compConfig.value = compConfigs?.find((item: any) => item.i == i);
  showModel.value = true;
}

defineExpose({
  openEditor
})
</script>
