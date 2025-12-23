<template>
  <NFlex vertical class="w-full h-full px-3" :size="0" justify="start">
    <NFlex v-if="compConfig?.showTitle != false" class="font-semibold min-h-8 max-h-8 w-full" align="center"
      justify="start">
      <NInput v-if="layoutConfig?.isEditable" @blur="onTitleBlur"
        class="w-full flex min-h-8 max-h-8 h-8 flex-center font-bold title-box [&_.n-input-wrapper]:pl-1"
        style="max-width: 100%;" v-model:value="chartTitle"></NInput>
      <span v-else-if="compConfig.showTitle != false"
        class="flex min-h-8 max-h-8 h-8 flex-center font-bold text-base-text">{{ chartTitle }}</span>
    </NFlex>
    <div class="gantt-middle-container" ref="middleContainer">
      <div ref="ganttContainer" style="width: 100%; height: 100%; margin: 0; padding: 0;"></div>
    </div>
  </NFlex>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Gantt, type GanttConstructorOptions, type ColumnDefine } from '@visactor/vtable-gantt';
import vtableTheme from '@/theme/vtableTheme';
import { useModuleInject } from '../../useModuleInject';
import dayjs from 'dayjs';
import { fetchBusiData } from '@/service/api/busi';
import { createEditorFilter } from '@/utils/filterHelper.js';

// 组件Props
interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
})

// 事件定义
interface Emits {
  (e: 'updateTitle', title: string): void;
}
const emit = defineEmits<Emits>();

// 定义任务数据类型接口
interface TaskItem {
  id: string;
  title: string;
  start: string;
  end?: string;
  type?: 'milestone';
  progress: number;
  parent: string;
}

// DOM容器引用
const ganttContainer = ref<HTMLDivElement | null>(null);
let ganttInstance: InstanceType<typeof Gantt> | null = null;
const compConfig = ref();
const chartTitle = ref('');
const scalesUnit = ref('week');   // 'year' | 'month' | 'week'
const { layoutNodes, layoutConfig, compConfigs } = useModuleInject();

const onTitleBlur = (e: any) => {
  emit('updateTitle', chartTitle.value)
}

const records: TaskItem[] = [] as any;
const columns: ColumnDefine[] = [] as any;
const headerBgColor = '#5389ff';
const headerFontColor = '#FFF';
const lineColor = "#E0E4E9";
const hoverBgColor = 'rgba(217, 230, 255, 0.6)'; // 悬停时背景色，浅蓝透明度叠加
const selectedBgColor = '#dcefff';                // 选中时背景色，浅蓝色
const selectedBorderColor = '#a3c8ff';            // 选中后的边框颜色，稍深的蓝色

function getBackgroundColor(args: any): string {
  const { row, table } = args;
  // if (row < table.frozenRowCount) {
  //   return "#FFF";
  // }
  const index = row - table.frozenRowCount;
  if (!(index & 1)) {
    return '#F4F8FF';
  }
  return '#FFF';
}

let option = {
  overscrollBehavior: 'none',
  records: records,   // 数据
  taskListTable: {
    columns: columns,   // 列表字段
    widthMode: 'standard',
    tableWidth: 'auto',
    minTableWidth: 110,
    maxTableWidth: 900,
    // theme: vtableTheme,
    theme: {
      headerStyle: {
        borderColor: lineColor,
        fontSize: 14,
        fontFamily: 'PingFang SC',
        fontWeight: 500,
        color: headerFontColor,
        // bgColor: headerBgColor,
        padding: [12, 16]
      },
      bodyStyle: {
        fontSize: 14,
        fontFamily: 'PingFang SC',
        // color: '#595959',
        bgColor: getBackgroundColor,
        // borderColor: '#F3F8FF',
        padding: [0, 16]
      },
    }
  },
  frame: {
    outerFrameStyle: {
      borderColor: lineColor,
      borderLineWidth: 1,
      cornerRadius: 0,
    } as any,
    verticalSplitLineMoveable: true,
    verticalSplitLine: {
      lineColor: lineColor, // 移除重复定义
      lineWidth: 4,
    }
  },
  grid: {
    backgroundColor: '#FFF',
    weekendBackgroundColor: 'rgba(94, 180, 245, 0.10)',
    verticalLine: {
      lineWidth: 1,
      lineColor: lineColor
    },
    horizontalLine: {
      lineWidth: 1,
      lineColor: lineColor
    }
  },
  headerRowHeight: 42,
  rowHeight: 40,
  taskBar: {
    startDateField: 'start',    // 绑定开始时间字段
    endDateField: 'end',        // 绑定结束时间字段
    progressField: 'progress',  // 绑定进度字段
    moveable: true,
    hoverBarStyle: {
      barOverlayColor: 'rgba(99, 144, 0, 0.2)'
    },
    labelText: '{title} {progress}%', //
    labelTextStyle: {
      // padding: 2,
      fontFamily: 'Arial',
      fontSize: 14,
      textAlign: 'left',
      textOverflow: 'ellipsis',
      color: 'rgb(240, 246, 251)'
    },
    barStyle: {
      width: 24,
      barColor: 'rgba(59, 162, 114, 0.4)',    //'#d6e4ff',
      completedBarColor: 'rgba(59, 162, 114, 0.7)',   //'#597ef7',
      cornerRadius: 6,
      borderLineWidth: 0,
      borderColor: 'rgba(59, 162, 114, 0.7)'
    },
    milestoneStyle: {
      width: 16,
      fillColor: ((value: any) => (value.record.progress >= 100 ? '#597ef7' : '#d6e4ff')) as any,
      borderColor: '#597ef7',
      borderLineWidth: 0,
      labelText: '{title}',
      labelTextStyle: {
        fontSize: 14,
        color: 'rgb(1, 43, 75)'
      }
    }
  },
  timelineHeader: {
    colWidth: 50,
    backgroundColor: headerBgColor,
    horizontalLine: {
      lineWidth: 1,
      lineColor: lineColor
    },
    verticalLine: {
      lineWidth: 1,
      lineColor: lineColor
    },
    scales: [
      {
        unit: 'month',
        step: 1,
        format(date: any) {
          return `${date.dateIndex}月`;
        },
        style: {
          fontSize: 14,
          fontFamily: 'PingFang SC',    // ts不识别，可能需要扩展类型
          textAlign: 'center',
          textBaseline: 'middle',
          color: headerFontColor,
          padding: [8, 0]
        } as any
      },
      {
        unit: 'day',
        step: 1,
        format(date: any) {
          return date.dateIndex.toString();
        },
        style: {
          fontSize: 14,
          fontFamily: 'PingFang SC',     // ts不识别，可能需要扩展类型
          textAlign: 'center',
          textBaseline: 'middle',
          color: headerFontColor,
          padding: [8, 0]
        } as any
      }
    ]
  },
  markLine: [
    {
      date: dayjs().format('YYYY-MM-DD'),
      style: {
        lineWidth: 1,
        lineColor: headerBgColor,
        lineDash: [6, 4]
      }
    },
    // {
    //   date: '2025-10-22',
    //   style: {
    //     lineWidth: 1,
    //     lineColor: 'red',
    //     lineDash: [8, 4]
    //   }
    // }
  ],
  rowSeriesNumber: {
    title: '行号',
    dragOrder: true,
    headerStyle: {
      bgColor: headerBgColor,
      borderColor: lineColor
    },
    style: {
      borderColor: lineColor
    }
  },
  scrollStyle: {
    scrollRailColor: '#f5f5f5',
    scrollSliderColor: '#bbb',
    visible: 'scrolling',
    width: 6,
    scrollSliderCornerRadius: 2,
  }
};

const updateScalesUnit = (unit: string) => {
  if (ganttContainer.value) {
    option.timelineHeader.scales[0].unit = unit;
    option.timelineHeader.scales[0].format = (date: any) => {
      if (unit === 'year') {
        return `${date.dateIndex.toString()}年`;
      } else if (unit === 'month') {
        return `${date.dateIndex.toString()}月`;
      } else if (unit === 'week') {
        return `第${date.dateIndex.toString()}周`;
      } else {
        return date.dateIndex.toString();
      }
    }
    ganttInstance?.updateScales(option.timelineHeader.scales as any)

  }
}

const reLoadGantt = async () => {
  const collName = compConfig.value?.dataBind?.collName;
  let filter = {};
  // 过滤
  if (compConfig.value?.filter?.length > 0) {
    filter = createEditorFilter(compConfig.value.filter);
  }
  const findReslut = await fetchBusiData(collName, filter, { updateAt: 1 });
  const titleField = Array.isArray(compConfig.value?.taskTitle) ? compConfig.value?.taskTitle[0]?.key : '';
  const startDateField =  Array.isArray(compConfig.value?.startDate) ? compConfig.value?.startDate[0]?.key : null;
  const endDateField = Array.isArray(compConfig.value?.endDate) ? compConfig.value?.endDate[0]?.key : null;
  const progressField = Array.isArray(compConfig.value?.progress) ? compConfig.value?.progress[0]?.key : null;

  const fieldMap: Record<string, string> = {};
  if (titleField) fieldMap[titleField] = 'title';
  if (startDateField) fieldMap[startDateField] = 'start';
  if (endDateField) fieldMap[endDateField] = 'end';
  if (progressField) fieldMap[progressField] = 'progress';

  if ('ok' === findReslut.msg && findReslut.data?.length > 0) {
    option.records = findReslut.data?.map((d: any) => {
      let isMilestone = true;
      if (d[endDateField] && !dayjs(d[startDateField]).isSame(d[endDateField], 'day')) {
        isMilestone = false;
      }
      return {
        id: d._id,
        title: d[titleField],
        start: d[startDateField],
        end: d[endDateField],
        type: isMilestone ? 'milestone' : undefined,
        progress: d[progressField],
        parent: '0'
      }
    })
    let columns = compConfig.value?.dims?.map((d: any) => {
      const field = fieldMap[d.key] || d.key; // 如果在映射表中，使用固定字段名，否则保留原始 key
      return {
        field,
        title: d.label,
        width: 'auto',
        style: {
          fontFamily: 'PingFang SC',
          padding: [8, 16],
          textAlign: field === 'progress' ? 'center' : 'left',
          color: (arg: any) => {
            // 只有当字段是 'progress' 时才应用颜色逻辑
            if (field === 'progress') {
              if (arg.value >= 80) return '#52c41a';    // 绿色
              if (arg.value >= 30) return 'red' //'#1890ff';    // 蓝色
              return '#595959';                     // 灰色（<30）
            }
            // 其他字段或不满足条件时：返回 undefined，使用默认颜色
            return '#595959';
          }
        }
      }
    })
    option.taskListTable.columns = columns;
    if (ganttContainer.value && option.taskListTable.columns?.length > 0) {
      if (ganttInstance) {
        ganttInstance.updateOption(option as any);
      } else {
        if (option.taskListTable.columns?.length > 0)
          ganttInstance = new Gantt(ganttContainer.value, option as any);
      }
    } else {
      releaseInstance();
    }
  }

}

const releaseInstance = () => {
  if (ganttInstance) {
    ganttInstance.release();
    ganttInstance = null;
  }
}

// 不要即监听又修改，导致循环，监听computed属性可能导致监听循环
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        chartTitle.value = comp.title || '未命名';
        if (layoutConfig?.value.isEditable) reLoadGantt();
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

onMounted(() => {
  reLoadGantt();
});

onUnmounted(() => {
  releaseInstance();
});

defineExpose({
  reLoadGantt
})
</script>

<style lang="scss" scoped>
.title-box {
  :deep(.n-input__border) {
    border: none;
  }
}

.gantt-middle-container {
  position: relative;
  /* 关键：作为分割线的定位父容器 */
  width: 100%;
  height: calc(100% - 44px);
  box-sizing: border-box;
  /* 确保padding不影响容器总尺寸 */
}
</style>
