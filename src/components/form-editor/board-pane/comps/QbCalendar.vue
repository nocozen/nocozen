<template>
  <NFlex class="w-full h-full px-3 overflow-hidden" :size="0" vertical justify="start" align="center">
    <NFlex v-if="compConfig?.showTitle != false" class="font-semibold min-h-8 max-h-8 w-full" align="center"
      justify="start">
      <NInput v-if="layoutConfig?.isEditable" @blur="onTitleBlur"
        class="w-full flex min-h-8 max-h-8 h-8 flex-center font-bold title-box [&_.n-input-wrapper]:pl-1"
        style="max-width: 100%;" v-model:value="chartTitle"></NInput>
      <span v-else-if="compConfig.showTitle != false"
        class="flex min-h-8 max-h-8 h-8 flex-center font-bold text-base-text">{{ chartTitle }}</span>
    </NFlex>
    <NFlex class="w-full h-8 mt-0.5" align="start">
      <NButton @click="goToPreviousMonth" size="tiny" type="info">
        <template #icon>
          <SvgIcon icon="mdi:arrow-left" />
        </template>
      </NButton>
      <span>{{ dayjs(currentMonth).format('MM月,YYYY') }}</span>
      <NButton @click="goToNextMonth" size="tiny" type="info" icon="mdi:arrow-right">
        <template #icon>
          <SvgIcon icon="mdi:arrow-right" />
        </template>
      </NButton>
      <NButton @click="goToCurrMonth" size="tiny" type="info" icon="mdi:arrow-right">
        今天
      </NButton>
    </NFlex>
    <div ref="calendarContainer" class="w-full h-full"></div>
  </NFlex>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, Ref, nextTick, watch, computed } from 'vue';
import { Calendar } from '../VtCalendar.ts';
import type { Calendar as CalendarType, CalendarConstructorOptions, ICustomEvent } from '../VtCalendar.ts';
import dayjs from 'dayjs';
import vtableTheme from '@/theme/vtableTheme';
import { useModuleInject } from '../../useModuleInject';
import { fetchBusiData } from '@/service/api/busi.js';
import { ColorGroups } from '@/enum/biMeta.js';
import { createEditorFilter } from '@/utils/filterHelper.js';

// 组件Props
interface Props {
  i: string,
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
})

// 事件定义
interface Emits {
  (e: 'updateTitle', title: string): void;
}
const emit = defineEmits<Emits>();

// DOM容器引用
const calendarContainer: Ref<HTMLDivElement | null> = ref(null);
// 日历实例引用
let calendarInstance: CalendarType | null = null;
// 当前显示月份
const currentMonth = ref(new Date()); // 默认显示2025年10月

const compConfig = ref();
const { layoutNodes, layoutConfig, compConfigs } = useModuleInject();
const defHeight = 80;
const height = ref(defHeight);
const chartTitle = ref('');

const onTitleBlur = (e: any) => {
  emit('updateTitle', chartTitle.value)
}

function getColorByIndex(index: number): string {
  const colors = ColorGroups.Default;
  // 处理索引超出范围的情况
  if (index < 0 || index >= colors.length) {
    // 可以返回默认颜色或循环使用颜色
    return colors[Math.abs(index) % colors.length];
  }
  return colors[index];
}

/**
 * 根据当前月份筛选静态事件
 */
const getOptions = async () => {
  // 查询当前指定月份的数据：开始日期和结束日期在当前月份;

  const collName = compConfig.value?.dataBind?.collName;
  const textField = Array.isArray(compConfig.value?.eventText) ? compConfig.value?.eventText.at(0)?.key : '';
  const startDateField = Array.isArray(compConfig.value?.startDate) ? compConfig.value?.startDate.at(0)?.key : null;
  const endDateField = Array.isArray(compConfig.value?.endDate) ? compConfig.value?.endDate.at(0)?.key : null;
  // 开始、结束日期在当前月份
  let filter = {};
  // 过滤
  if (compConfig.value?.filter?.length > 0) {
    filter = createEditorFilter(compConfig.value?.filter);
  }
  const findReslut = await fetchBusiData(collName, filter);
  let customEvents = [] as any;
  let minStartDate: Date = new Date();
  let maxEndDate: Date = new Date();
  if ('ok' === findReslut.msg && findReslut.data?.length > 0) {
    // 第一步：生成 customEvents
    customEvents = findReslut.data
      .map((d: any, index: number) => {
        const startDate = d[startDateField];
        const endDate = d[endDateField];
        // 更严谨的类型判断
        let type = 'list';
        if (startDate && endDate && !dayjs(startDate).isSame(endDate, 'day')) {
          type = 'bar';
        }

        // 公共属性
        const baseEvent = {
          id: d._id || `event-${index}`,
          type: type,
          text: d[textField] || '未命名事件',
          color: 'rgba(255, 255, 255, 0.8)',
        };

        if (type === 'list') {
          // 单日事件
          const eventDate = startDate || endDate;
          if (!eventDate) return null;
          const dateObj = dayjs(eventDate).toDate();
          return {
            ...baseEvent,
            date: dateObj,
          };
        } else {
          const eventStart = dayjs(startDate).toDate();
          const eventEnd = dayjs(endDate).toDate();
          const bgColor = getColorByIndex(index);

          // ✅ 在这里更新 minStartDate 和 maxEndDate
          if (eventStart && (!minStartDate || eventStart < minStartDate)) {
            minStartDate = eventStart;
          }
          if (eventEnd && (!maxEndDate || eventEnd > maxEndDate)) {
            maxEndDate = eventEnd;
          }

          return {
            ...baseEvent,
            bgColor: bgColor,
            startDate: eventStart,
            endDate: eventEnd,
          };
        }
      })
      .filter(Boolean) as ICustomEvent[]; // 过滤 null 并断言类型
  }

  const calendarOptions: CalendarConstructorOptions = {
    // startDate: dayjs('2025-09-01').toDate(),
    // endDate: dayjs('2025-11-01').toDate(),
    // currentDate: dayjs('2025-10-01').toDate(),
    // // dayTitles: ['日', '一', '二', '三', '四', '五', '六'],
    // showTitle: true,
    customEventOptions: {
      // contentHeight: 600,
      barHeight: 200,
      barCornerRadius: 0,
    },
    customEvents: customEvents,
    tableOptions: {
      theme: vtableTheme,
    }
  }
  return calendarOptions;
};


const refreshCalendar = async () => {
  const container = calendarContainer.value!;

  const calendarOptions: any = await getOptions();
  calendarOptions.tableOptions.theme.bodyStyle.bgColor = '#FFF';
  try {
    if (calendarOptions && calendarOptions.customEvents.length > 0) {
      if (calendarInstance) {
        calendarInstance.updateCustomEvents(calendarOptions.customEvents);
        // calendarInstance.release();
        // calendarInstance = new Calendar(container, calendarOptions);
      } else {
        calendarInstance = new Calendar(container, calendarOptions);
      }
    }
  } catch (error) {
    console.error('日历初始化失败:', error);
  }
}

// 不要即监听又修改，导致循环，监听computed属性可能导致监听循环！！】
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        chartTitle.value = comp.title || '未命名';
        nextTick(() => {
          if (layoutConfig?.value.isEditable) refreshCalendar();
        });
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

const goToPreviousMonth = () => {
  calendarInstance?.jumpToDate(dayjs(currentMonth.value).subtract(1, 'month').toDate());
};

const goToNextMonth = () => {
  calendarInstance?.jumpToDate(dayjs(currentMonth.value).add(1, 'month').toDate());
};

const goToCurrMonth = () => {
  calendarInstance?.jumpToDate(new Date());
};

const cptCompLayout = computed(() => {
  let h = layoutNodes?.find((node: any) => node.uid == compConfig.value?.nodeUid)?.layout?.find((item: any) => item.i == props.i)?.h;
  return h ? h : 3;
})

watch(
  () => cptCompLayout,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue) {
      height.value = newValue.value * layoutConfig!.value.rowHeight - 76;
      nextTick(() => {
        refreshCalendar();
      });
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  if (calendarContainer.value) {
    nextTick(() => {
      refreshCalendar();
    });
  }
});

onUnmounted(() => {
  if (calendarInstance) {
    calendarInstance.release();
    calendarInstance = null;
  }
});

defineExpose({
  refreshCalendar
})
</script>

<style lang="scss" scoped>
.title-box {
  :deep(.n-input__border) {
    border: none;
  }
}
</style>
