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
          <NFlex :size="0" class="w-full">
            <DropBox boxType="startDate" :i="chartId" :list="cptStartDate" @updateList="updateStartDate"
              :acceptsType="cptAcceptStartDateType" boxName="开始时间" class="flex-1"
              labelWidth="56px" />
            <DropBox boxType="endDate" :i="chartId" :list="cptEndDate" @updateList="updateEndDate"
              :acceptsType="cptAcceptEndDateType" boxName="结束时间" class="flex-1"
              labelWidth="56px" />
            <DropBox boxType="eventText" :i="chartId" :list="cptEventText" @updateList="updateEventText"
              :acceptsType="cptAcceptTagType" boxName="事件标签" class="flex-1" labelWidth="56px" />
          </NFlex>
          <DropBox boxType="filter" :i="chartId" :list="cptFilter" @updateList="updateFilter"
            :acceptsType="[BiType.Text, BiType.Date, BiType.Number]" boxName="过滤" labelWidth="56px" />
          <NFlex style="width: 100%;height: calc(100% - 88px);" :size="0" class="bg-white">
            <QbCalendar ref="refCalendar" v-if="compConfig" :i="compConfig.i" type="pivot" @updateTitle="updateTitle" />
          </NFlex>
        </NFlex>
        <NFlex vertical class="w-80 h-full">
          <VTableConfig :compConfig="compConfig" @updateChartConfig="updateChartConfig" />
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
const refCalendar = ref();

const { compConfigs, updateCompConfig } = useModuleInject();

const cptAcceptStartDateType = computed(() => {
  if (!compConfig.value?.startDate || compConfig.value?.startDate?.length == 0) {
    return [BiType.Date];
  } else {
    return []
  }
})

const cptAcceptEndDateType = computed(() => {
  if (!compConfig.value?.endDate || compConfig.value?.endDate?.length == 0) {
    return [BiType.Date];
  } else {
    return []
  }
})

const cptAcceptTagType = computed(() => {
  if (!compConfig.value?.eventText || compConfig.value?.eventText?.length == 0) {
    return [BiType.Text];
  } else {
    return []
  }
})

const refresh = () => {
  refCalendar.value && refCalendar.value.refreshCalendar();
}

const updateDataBind = (dataBind: Meta.DataBind) => {
  if (compConfig.value && updateCompConfig) {
    compConfig.value['dataBind'] = dataBind;
    compConfig.value.startDate && (compConfig.value.startDate.length = 0);
    compConfig.value.endDate && (compConfig.value.endDate.length = 0);
    compConfig.value.eventText && (compConfig.value.eventText.length = 0);
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

const cptStartDate = computed(() => {
  return compConfig.value?.startDate;
})

const cptEndDate = computed(() => {
  return compConfig.value?.endDate;
})

const cptEventText = computed(() => {
  return compConfig.value?.eventText;
})

const cptFilter = computed(() => {
  return compConfig.value?.filter;
})

const updateStartDate = (list: any) => {
  compConfig.value
    && (compConfig.value.startDate = list)
    && (updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig));
    refresh();
}

const updateEndDate = (list: any) => {
  compConfig.value
    && (compConfig.value.endDate = list)
    && (updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig));
    refresh();
}

const updateEventText  = (list: any) => {
  compConfig.value
    && (compConfig.value.eventText = list)
    && (updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig));
    refresh();
}

const updateFilter = (list: any) => {
  compConfig.value
    && (compConfig.value.filter = list)
    && updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig);
    refresh();
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
