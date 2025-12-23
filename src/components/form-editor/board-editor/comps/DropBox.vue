<template>
  <NFlex class="h-fit w-full border-1" :size="0" align="center">
    <span class="mx-4" :style="{ width: labelWidth }">{{ boxName }}</span>
    <DropList :acceptsType="acceptsType" :items="itemList" :acceptsData="acceptsData" @reorder="onReorder"
      @insert="onInsert" :placeholder="`添加${boxName}`"
      class="min-h-8 text-xs p-1 bg-white border-1 border-transparent flex-1 flex flex-wrap gap-1 content-center">
      <template #item="{ item, reorder }">
        <Drag :key="item.key" :type="item.type" :data="item" :style="{ opacity: reorder ? 0.3 : 1 }" class="group">
          <NTag :type="getTagType(item.type)" size="small" round closable @close="onRemove(item.key)"
            class="[&_.n-base-icon]:opacity-0 group-hover:[&_.n-base-icon]:opacity-100">
            {{ item.label }}
            <span v-if="boxType == 'meas'" class="text-gray ml-0.5">{{ cptAggType(item.key) }}</span>
            <template #icon>
              <template v-if="['dims', 'meas', 'fieldDims', 'rowDims', 'colDims'].includes(boxType)">
                <MetaMenu :i="i" :meta="item" :boxType="boxType" @format="openFormat" @filter="onFilterClick" />
                <SvgIcon v-if="'meas' == boxType && item.filter" :icon="QbIcon.FilterFill" @click="onFilterClick(item)"
                  class="mt-[1px] mr-[1px] opacity-70 cursor-pointer" />
              </template>
              <SvgIcon v-else-if="'filter' == boxType" @click="onFilterClick(item)"
                :icon="item.filter ? QbIcon.FilterFill : QbIcon.Filter"
                class="mr-0 group-hover:opacity-60 cursor-pointer" />
            </template>
          </NTag>
        </Drag>
      </template>
      <template #feedback="{ data }">
        <NTag :key="data.label" class="opacity-30" type="info" size="small" round>{{ data.label }}
        </NTag>
      </template>
    </DropList>
    <FormatDialog ref="refFormat" />
    <FilterDialog ref="refFilter" />
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BiType, QbIcon } from '@/enum';
import { AggNameMap, AggType, SortType, DateType, DateFmType } from '@/enum/biMeta';


interface Props {
  boxType: string,  // 'dims' | 'meas' | 'filter' | 'rowDims' | 'colDims' | 'startDate' | 'endDate' | 'eventText',
  acceptsType: Array<string> | string,
  boxName: string,
  i: string,
  list: Array<Meta.DropItem> | undefined,
  labelWidth?: string,
}

const props = withDefaults(defineProps<Props>(), {
  labelWidth: 'auto'
  // type: FormElType.FeText,
});

interface Emits {
  (e: 'updateList', list: Array<any>): void;
}
const emit = defineEmits<Emits>();

const refFilter = ref();
const refFormat = ref();
const itemList = ref([] as Array<Meta.DropItem>);

const cptAggType = computed(() => (key: string) => {
  const metric = props.list?.find((l) => l.key == key) as Meta.ChartMetric;
  if (metric) {
    return AggNameMap.get(metric.aggType as AggType)
  } else {
    return AggNameMap.get(AggType.Sum)
  }
})

watch(
  () => props.list,
  (newValue, oldValue) => {
    newValue && newValue?.length > 0 && (itemList.value = newValue);
  },
  { immediate: true, deep: true }
);

const getTagType = (type: string) => {
  if (props.boxType == 'filter') {
    if (BiType.Number == type) {
      return 'success'
    } else {
      return 'info'
    }
  } else {
    return props.boxType == 'meas' ? 'success' : 'info'
  }
}

const onFilterClick = (item: Meta.DropItem, boxType: string = props.boxType) => {
  refFilter.value.show(boxType, item, props.i, boxType);
}

const openFormat = (meta: Meta.DropItem) => {
  refFormat.value.show(meta)
}
// 不重复添加
const acceptsData = (data: any, type: any) => {
  return itemList.value.findIndex((item: Meta.DropItem) => item.key == data.key) == -1
}

const onReorder = async (e: any) => {
  await e.apply(itemList.value);
  // 更新数据库
  emit('updateList', itemList.value)
}

const initAxisMetaByBiType = (m: Meta.DropItem) => {
  let meta = undefined;
  if (BiType.Text == m.type) {
    meta = m as Meta.ChartDim;
    meta['sortField'] = m.key as Meta.SortField;
    meta['sortType'] = SortType.ASC;
    meta['axisType'] = 'band';          // todo: 待扩展：支持更多的轴类型
    meta['sortFieldType'] = 'group';    // todo: 待扩展： 兼容老版本；维度细粒度堆叠
    meta['aggType'] = AggType.Count;      // 允许文本字段计数
  } else if (BiType.Date == m.type) {
    meta = m as Meta.ChartDim;
    meta["axisType"] = 'band';
    meta["sortFieldType"] = "group",
    meta["sortField"] = m.key as Meta.SortField;
    meta["sortType"] = SortType.ASC;
    meta["dateType"] = DateType.Date;   // DateType
    meta["dateFmType"] = DateFmType.Default;     // DateFmType： default: 横线分隔日期 冒号分隔时间; detail: 带(汉字)文字；slash：斜杠分隔日期，冒号分隔时间
    meta['aggType'] = AggType.Count;              // 允许日期字段计数
  } else if (BiType.Number == m.type) {
    meta = m as Meta.ChartMetric;
    meta["sortFieldType"] = "group",
    meta["sortField"] = m.key as Meta.SortField;
    meta["sortType"] = SortType.ASC;
    meta['axisType'] = 'band';          // todo: 待扩展：支持更多的轴类型
    meta['aggType'] = AggType.Sum;
    meta['numFormat'] = {
      type: 'number',
      separator: true,
      decimal: 0,
      unit: '',
    },
      meta['filter']
  }
  return meta;
}

const onInsert = async (e: any) => {
  let meta = null as any;
  if (props.boxType != 'filter') {
    meta = initAxisMetaByBiType(e.data);
  } else {
    meta = {
      ...e.data,
      filter: null
    }
  }
  props.acceptsType.includes(e.data.type)
    && itemList.value.splice(e.index, 0, meta);
  // 更新数据库
  emit('updateList', itemList.value)
}
const onRemove = async (key: any) => {
  itemList.value = itemList.value.filter((d: any) => d.key != key);
  emit('updateList', itemList.value)
}
</script>

<style lang="scss" scoped>
:deep(.n-tag.n-tag--round .n-tag__icon) {
  margin-right: 0;
}
</style>