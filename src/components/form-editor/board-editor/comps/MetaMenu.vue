<template>
  <NDropdown trigger="click" size="small" :options="options" :render-icon="renderIcon" :renderLabel="renderLabel"
    @select="handleSelect" placement="bottom-start">
    <div @click.stop="onClick">
      <SvgIcon :icon="QbIcon.ChevronDown" class="text-base mr-0 group-hover:opacity-60 cursor-pointer" />
    </div>
  </NDropdown>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { BiType, BoardElType, QbIcon } from '@/enum';
import { SortType, AggType, AggNameMap, DateFmType, DateGroupNameMap, DateFmNameMap, DateType } from '@/enum/biMeta';
import { useModuleInject } from '../../useModuleInject';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  i: string,
  meta: Meta.DropItem | Meta.ChartDim | Meta.ChartMetric;
  boxType: string,  // 'date' | 'dims' | 'meas' | 'filter' | 'rowDims' | 'colDims',
}
const props = withDefaults(defineProps<Props>(), {
});
interface Emits {
  (e: 'format', meta: Meta.DropItem): void;
  (e: 'filter', meta: Meta.DropItem, boxType: string): void;
}
const emit = defineEmits<Emits>();

const { compConfigs, updateCompConfig } = useModuleInject();

enum MenuType {
  Filter = 'filter',
  RemoveFilter = 'remove-filter',
  Sort = 'sort',
  DescSort = 'desc-sort',
  AscSort = 'asc-sort',
  DateGroup = 'date-group',
  DateFormat = 'date-format',
  NumberFormat = 'number-format',
  Agg = 'agg',
  Delete = 'delete'
}

// 注意菜单的类型和 Meta.DropItem 不是相同类型，type 属性注意区分；
// 按 MenuType 类型查找；默认添加【默认】
interface MenuOption {
  label: string,
  key: string,
  type?: MenuType | any,
  iconName?: string,
  children?: Array<MenuOption>
}


const options = ref<Array<MenuOption | { type: 'divider' }>>([] as any);
const selectedSort = ref<MenuOption>(
  {
    label: '',
    key: '',
    type: null,
    iconName: ''
  }
);

const selectedAgg = ref<MenuOption>(
  {
    label: '',
    key: '',
    type: null,
  }
);

const selectedDateGroup = ref<MenuOption>(
  {
    label: '',
    key: '',
    type: null,
  }
);

const selectedDateFm = ref<MenuOption>(
  {
    label: '',
    key: '',
    type: null,
  }
);

const compConfig = ref();


let sortMenu: Array<MenuOption | { type: 'divider' }> = [] as any;

const delMenu = [
  {
    iconName: QbIcon.Delete,
    label: '删除',
    type: 'menu',
    key: 'delete'
  }
]

const dateGroupMenu = [
  {
    iconName: QbIcon.Delete,
    label: '删除',
    type: 'menu',
    key: 'delete'
  }
]

const dateFmMenu = [
  {
    iconName: 'iconamoon:category-light',
    label: '分组',
    key: MenuType.DateGroup,
    children: Array.from(DateGroupNameMap, ([id, name]) => ({ label: name, type: MenuType.DateGroup, key: id }))
  },
  {
    iconName: QbIcon.FormatText,
    label: '格式',
    key: MenuType.DateFormat,
    children: [
      {
        label: "2025-10-10",
        type: MenuType.DateFormat,
        key: DateFmType.Default,
      },
      {
        label: "2025年10月10日",
        type: MenuType.DateFormat,
        key: DateFmType.Detail,
      },
      {
        label: "2025/10/10",
        type: MenuType.DateFormat,
        key: DateFmType.Slash,
      }
    ],
  }
];

let aggMenu: Array<MenuOption | { type: 'divider' }> = [] as any;

const mapMetricsMenu = (comp: Meta.ChartComp, sortType: MenuType) => {
  if (comp.type != BoardElType.BiChart) return [];
  if (comp && 'metrics' in comp) {
    return comp.metrics!.map((m: Meta.ChartMetric) => ({
      label: m.label,
      type: sortType,
      key: sortType + m.key,
    }))
  } else {
    return [];
  }

}

const init = (comp: Meta.ChartComp) => {
  if (!comp) return;
  // props.boxType 判定 meata 类型；获取初始配置
  if (['dims', 'fieldDims', 'rowDims', 'colDims'].includes(props.boxType)) {
    let meta = props.meta as Meta.ChartDim;
    sortMenu = [
      {
        iconName: QbIcon.Sort,
        label: '升序',
        key: MenuType.AscSort,
        children: [
          {
            label: meta.label,
            type: MenuType.AscSort,
            key: MenuType.AscSort + meta.key,
          },
          ...mapMetricsMenu(comp, MenuType.AscSort)
        ]
      },
      {
        iconName: QbIcon.Sort,
        label: '降序',
        key: MenuType.DescSort,
        children: [
          {
            label: meta.label,
            type: MenuType.DescSort,
            key: MenuType.DescSort + meta.key,
          },
          ...mapMetricsMenu(comp, MenuType.DescSort)
        ]
      }]

    // 当前排序配置，每个维度都有一个排序；
    if (compConfig.value[props.boxType]?.length > 0) {
      selectedSort.value.label = compConfig.value[props.boxType].find((c: Meta.AxisDropItem) => c.key == meta.sortField)?.label;
      if (!selectedSort.value.label && compConfig.value.metrics?.length > 0) {
        selectedSort.value.label = compConfig.value.metrics.find((c: Meta.AxisDropItem) => c.key == meta.sortField)?.label;
      }
    }
    // selectedSort.value.label = [...compConfig.value[props.boxType], ...compConfig.value.metrics].find((c: Meta.AxisDropItem) => c.key == meta.sortField).label;
    let newSortType = meta.sortType == SortType.DESC ? MenuType.DescSort : MenuType.AscSort;
    selectedSort.value.key = newSortType + (meta.sortField ? meta.sortField : meta.key);
    selectedSort.value.type = newSortType;

    if (props.meta.type == BiType.Text) {
      options.value = sortMenu; // [...sortMenu, ...dateFmMenu];
    } else if (props.meta.type == BiType.Date) {
      options.value = [...sortMenu, ...dateFmMenu]
    } else {
      options.value = sortMenu;
    }
    // 日期分组类型初始化
    selectedDateGroup.value = {
      label: DateGroupNameMap.get(meta.dateType as DateType)!,
      type: MenuType.DateGroup,
      key: meta.dateType ? meta.dateType : DateType.Date
    }
    // 日期格式初始化
    selectedDateFm.value = {
      label: DateFmNameMap.get(meta.dateFmType as DateFmType)!,
      type: MenuType.DateFormat,
      key: meta.dateFmType ? meta.dateFmType : DateFmType.Default
    }
  } else if (props.boxType == 'meas') {
    let meta = props.meta as Meta.ChartMetric;
    let aggChildren = [{
      label: AggNameMap.get(AggType.Count)!,
      type: MenuType.Agg,
      key: AggType.Count,
    }]
    // todo: 支持日期时间 指标轴
    if (meta.type == BiType.Number) {
      aggChildren = [
        {
          label: AggNameMap.get(AggType.Sum)!,
          type: MenuType.Agg,
          key: AggType.Sum,
        },
        {
          label: AggNameMap.get(AggType.Avg)!,
          type: MenuType.Agg,
          key: AggType.Avg,
        },
        {
          label: AggNameMap.get(AggType.Median)!,
          type: MenuType.Agg,
          key: AggType.Median,
        },
        {
          label: AggNameMap.get(AggType.Max)!,
          type: MenuType.Agg,
          key: AggType.Max,
        },
        {
          label: AggNameMap.get(AggType.Min)!,
          type: MenuType.Agg,
          key: AggType.Min,
        },
        {
          label: AggNameMap.get(AggType.StdDevPop)!,
          type: MenuType.Agg,
          key: AggType.StdDevPop,
        },
        {
          label: AggNameMap.get(AggType.Count)!,
          type: MenuType.Agg,
          key: AggType.Count,
        }
      ]
    }

    // 指标不支持排序；维度排序已经支持指标排序；
    aggMenu = [
      {
        iconName: QbIcon.Sigma,
        label: '汇总',
        key: MenuType.Agg,
        children: aggChildren
      },
      { type: 'divider' },
      {
        iconName: QbIcon.FormatText,
        label: '格式',
        key: MenuType.NumberFormat,
      }
    ];
    if ('filter' in props.meta && props.meta.filter) {
      aggMenu.push(
        { type: 'divider' },
        {
          iconName: QbIcon.RemoveFilter,
          label: '移除过滤',
          key: MenuType.RemoveFilter,
        },
      )
    } else {
      aggMenu.push(
        { type: 'divider' },
        {
          iconName: QbIcon.Filter,
          label: '添加过滤',
          key: MenuType.Filter,
        },
      )
    }
    options.value = aggMenu;

    // 初始化
    selectedAgg.value = {
      label: AggNameMap.get(meta.aggType as AggType)!,
      type: MenuType.Agg,
      key: meta.aggType ? meta.aggType : AggType.Sum
    }
  }
}

init(compConfig.value);

// NDropDowList 菜单项高度通过 size ('small'|'medium'|'large'|'huge') 来设置

const renderIcon = (option: MenuOption | any) => {
  // 处理非可选项
  // console.log(selectedSort.value.key, option.key)
  if (selectedSort.value.key == option.key) {
    return h(SvgIcon, { icon: QbIcon.Check, class: 'text-sm text-primary mt-0.5 opacity-100' })
  }
  if (option.key == MenuType.AscSort && selectedSort.value.type == MenuType.AscSort) {
    return h(SvgIcon, { icon: QbIcon.Check, class: 'text-sm text-primary mt-0.5 opacity-100' })
  }
  if (option.key == MenuType.DescSort && selectedSort.value.type == MenuType.DescSort) {
    return h(SvgIcon, { icon: QbIcon.Check, class: 'text-sm text-primary mt-0.5 opacity-100' })
  }
  if (selectedAgg.value.key == option.key) {
    return h(SvgIcon, { icon: QbIcon.Check, class: 'text-sm text-primary mt-0.5 opacity-100' })
  }
  if (selectedDateGroup.value.key == option.key) {
    return h(SvgIcon, { icon: QbIcon.Check, class: 'text-sm text-primary mt-0.5 opacity-100' })
  }
  if (selectedDateFm.value.key == option.key) {
    return h(SvgIcon, { icon: QbIcon.Check, class: 'text-sm text-primary mt-0.5 opacity-100' })
  }
  // 分组节点没有type属性；
  if (option.key == MenuType.AscSort || option.key == MenuType.DescSort) {
    return undefined;
  } else {
    return h(SvgIcon, { icon: option.iconName, class: 'text-sm mt-0.5' });
  }
};

const renderLabel = (option: MenuOption | any) => {
  if (option.key == MenuType.AscSort && MenuType.AscSort == selectedSort.value.type) {
    return h('span', { style: { fontSize: '12px' } }, `${option.label}(${selectedSort.value.label})`);
  }
  if (option.key == MenuType.DescSort && MenuType.DescSort == selectedSort.value.type) {
    return h('span', { style: { fontSize: '12px' } }, `${option.label}(${selectedSort.value.label})`);
  }
  if (option.key == MenuType.Agg) {
    return h('span', { style: { fontSize: '12px' } }, `${option.label}(${AggNameMap.get(selectedAgg.value.key as AggType)})`);
  }
  if (option.key == MenuType.DateGroup) {
    return h('span', { style: { fontSize: '12px' } }, `${option.label}(${selectedDateGroup.value.label})`);
  }
  if (option.key == MenuType.DateFormat) {
    return h('span', { style: { fontSize: '12px' } }, `${option.label}(${selectedDateFm.value.label})`);
  }
  return h('span', { style: { fontSize: '12px' } }, option.label);
};

const onClick = (e: any) => {
  e.stopPropagation()
}

// 排序：只有维度；
const handleSelect = (key: string, option: MenuOption | any) => {
  if ([MenuType.NumberFormat, MenuType.Delete, MenuType.Filter, MenuType.RemoveFilter].includes(option.key as MenuType)) {
    if (MenuType.NumberFormat == option.key) {  //  用key，功能菜单没有type
      emit('format', props.meta);
    } else if (MenuType.Filter == option.key) { // 用key，功能菜单没有type
      emit('filter', props.meta, props.boxType);
    } else if (MenuType.RemoveFilter == option.key) {
      let currMetric: Meta.ChartMetric = compConfig.value.metrics.find((m: Meta.ChartMetric) => m.key == props.meta.key);
      // console.log(currMetric)
      if (currMetric) {
        currMetric.filter = null;
      }
    } else if (MenuType.Delete == option.key) { //  用key，功能菜单没有type todo: 推后实现
      // console.log(option.type)
    }
  } else {
    let currMeta: Meta.ChartDim = compConfig.value[props.boxType]?.find((d: Meta.ChartDim) => d.key == props.meta.key);

    if (option.type?.includes(MenuType.Sort)) {
      selectedSort.value.label = option.label;
      selectedSort.value.type = option.type;
      selectedSort.value.key = option.key;
      // 维度排序会出现指标的分级汇总，同一个指标可以绑定多次，会重复，同一个菜单中需要添加升、降类型前缀区分；不同菜单不影响；
      // 根据字段名称找到当前字段配置，并添加统计配置；
      // 字段一定是存在的，不存在当前菜单就不可能存在；
      if (currMeta) {
        currMeta.sortField = key.slice(option.type?.length) as Meta.SortField;
        currMeta.sortType = option.type == MenuType.AscSort ? SortType.ASC : SortType.DESC;
        currMeta.sortFieldType = 'group'    // 兼容老版本；维度细粒度堆叠
      }

    } else if (MenuType.DateGroup == option.type) {
      selectedDateGroup.value.label = option.label;
      selectedDateGroup.value.type = option.type;
      selectedDateGroup.value.key = option.key;
      if (currMeta) {
        currMeta.dateType = option.key;
      }
    } else if (MenuType.DateFormat == option.type) {
      selectedDateFm.value.label = option.label;
      selectedDateFm.value.type = option.type;
      selectedDateFm.value.key = option.key;
      if (currMeta) {
        currMeta.dateFmType = option.key;
      }
    } else if (MenuType.Agg == option.type) {
      selectedSort.value.label = option.label;
      selectedSort.value.type = option.type;
      selectedSort.value.key = option.key;
      // 指标不会重复，所以不添加类型前缀
      let currMetric: Meta.ChartMetric = compConfig.value.metrics.find((m: Meta.ChartMetric) => m.key == props.meta.key);
      if (currMetric) {
        currMetric.aggType = option.key;
      } else {
        currMetric = {
          ...props.meta,
          aggType: option.key,
          filter: null
        }
      }
    }
  }
  // 注意：dims、metrics中的type==biType；与当前Option的type不同；
  updateConfig();
}

const updateConfig = () => {
  updateCompConfig && updateCompConfig(compConfig.value)
}

const cptCompConfig = computed(() => {
  return compConfigs?.find((item: any) => item.i == props.i);
})

watch(
  () => cptCompConfig,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue && newValue.value) {
      compConfig.value = newValue.value;
      init(compConfig.value);
    }
  },
  { immediate: true, deep: true }
);

</script>

<style lang="scss" scoped></style>
