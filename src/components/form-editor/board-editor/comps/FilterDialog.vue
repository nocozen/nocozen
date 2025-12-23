<template>
  <ModalDialog @onCompleteClick="onCompleteClick" ref="refModal" title="过滤条件" modal-class="w-100" :footer="true"
    :buttons="['complete']">
    <NFlex vertical class="p-8 w-full h-50">
      <NFlex class="mb-4">
        <NSelect v-model:value="canditionValue" :options="canditions" class="w-26 border-b-1" :bordered="false"
          size="small" />
        <NSelect v-model:value="fieldValue" :options="fieldOptions" :readonly="true" class="w-55" size="small" />
      </NFlex>
      <NFlex class="mb-4">
        <NSelect v-model:value="operatorValue" :options="operators" class="w-26 border-b-1" :bordered="false"
          size="small" />
        <NSelect v-if="currItem?.type == BiType.Text" v-model:value="selectedValue" :options="selectedValueOptions"
          @update:value="updateSelectValue" :multiple="true" class="w-55" size="small" />
      </NFlex>
      <NFlex v-if="currItem?.type == BiType.Number">
        <n-input-number v-model:value="rangeMinValue" size="small" class="w-40 mr-1" />
        <n-input-number v-model:value="rangeMaxValue" size="small" class="w-40" />
      </NFlex>
      <n-date-picker v-if="currItem?.type == BiType.Date" v-model:value="dateRange" type="datetimerange"
        format="yyyy-MM-dd HH:mm" clearable size="small" />
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { toRaw, ref } from 'vue';
import { BiType, BaseComparOpt, LogicOpt, FormElType, ElTypeGroup } from '@/enum';
import { useModuleInject } from '../../useModuleInject';
import { fetchGetDistinct } from '@/service/api/busi';
import { AggNameMap } from '@/enum/biMeta';
import { isEmpty } from 'radashi';

interface Emits {
  (e: 'update'): void,
}

const emit = defineEmits<Emits>()
const { compConfigs, updateCompConfig } = useModuleInject();

const refModal = ref();
const currItem = ref();
const chartId = ref();
const boxType = ref<'dim' | 'meas' | 'filter'>('filter');

const fieldOptions = ref([] as any);    // 过滤字段；todo: 后续可扩展允许选择切换字段；
const selectedValueOptions = ref([] as any);  // 文本字段可选值列表
const operators = ref([] as any);       // 过滤值比较操作
const canditionValue = ref(LogicOpt.AND); // 条件操作符

const operatorValue = ref();
const fieldValue = ref();
const selectedValue = ref();
let selectedOption = [] as any;
const rangeMaxValue = ref(0);
const rangeMinValue = ref(0);
const now = new Date().getTime();
const dateRange = ref<[number, number]>([now, now]);
const compConfig = ref();

const canditions = ref([
  { label: '并且', value: LogicOpt.AND },
  // { label: '或者', value: LogicOpt.OR },
])
const mathOptions = ref([
  { label: '选择范围', value: BaseComparOpt.Range },
])
const stringOptions = ref([
  { label: '等于', value: BaseComparOpt.Equal },
  { label: '不等于', value: BaseComparOpt.NotEqual },
] as any)

const updateFilter = () => {
  updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig);
}

const updateSelectValue = (value: any, option: any) => {
  selectedOption = option.map((o: any) => toRaw(o.raw));
}
const onCompleteClick = () => {
  let filter: Meta.Filter = {
    candition: canditionValue.value as any,
    fieldName: fieldValue.value,
    type: currItem.value.type,    // BiType
    fieldType: currItem.value.fieldType,  // FormElType
    operator: operatorValue.value,
    filerValue: []
  }

  let filterItem = null;
  if (boxType.value == 'filter') {
    filterItem = compConfig.value.filter.find((f: Meta.ChartFilter) => f.key == currItem.value.key);
    // 提交保存
    if (currItem.value.type == BiType.Text) {
      if (!isEmpty(selectedOption)) {
        filter.filerValue = toRaw(selectedOption);
        filterItem.filter = filter;
      } else {
        return;
      }
    } else if (currItem.value.type == BiType.Number) {
      if ((rangeMinValue.value + rangeMaxValue.value) != 0 && rangeMinValue.value < rangeMaxValue.value) {
        filter.filerValue = [rangeMinValue.value, rangeMaxValue.value];
        filterItem.filter = filter;
      } else {
        window.$message?.warning('输入范围不合法')
        return;
      }
    } else if (currItem.value.type == BiType.Date) {
      if (dateRange.value?.length > 0 && dateRange.value[0] < dateRange.value[1]) {
        filter.filerValue = dateRange.value;
        filterItem.filter = filter;
      } else {
        window.$message?.warning('输入范围不合法')
        return;
      }
    }
  } else if (boxType.value == 'meas') {
    filterItem = compConfig.value.metrics.find((f: Meta.ChartFilter) => f.key == currItem.value.key);
    if ((rangeMinValue.value + rangeMaxValue.value) != 0 && rangeMinValue.value < rangeMaxValue.value) {
      filter.filerValue = [rangeMinValue.value, rangeMaxValue.value];
      filterItem.filter = filter;
    }
  }

  updateFilter();
  refModal.value.show(false);
}

const getValueByType = (fieldType: string, value: any) => {
  if (isEmpty(value)) return [];
  if (Array.isArray(value)) {
    if (ElTypeGroup.arrayTypes.includes(fieldType as FormElType)) {
      return value.map((v: any) => v.name);
    } else {
      return value;
    }
  } else if (value && typeof value === 'object') {
    // 对象类型 - 修复：label 是显示文本，value 是实际值
    // return value._id || value.uid;
    return value.name || value;
  } else {
    // 值类型
    return value;
  }
}
// 数字、日期类型：选择范围；文本类型：等于、不等于；(支持多值匹配)
// 汇总字段过滤不在此处理，挂到指标字段上；
const init = async () => {
  compConfig.value = compConfigs?.find((c: Meta.ChartComp) => c.i == chartId.value);
  if (boxType.value == 'filter') {
    fieldOptions.value = [
      { label: currItem.value.label, value: currItem.value.key, raw: currItem.value }
    ]
  } else {
    fieldOptions.value = [
      { label: `${currItem.value.label}(${AggNameMap.get(currItem.value.aggType)})`, value: currItem.value.key }
    ]
  }

  fieldValue.value = currItem.value?.key;
  operators.value = mathOptions;
  if (BiType.Text == currItem.value.type) {
    operators.value = stringOptions.value;
  } else {
    operators.value = mathOptions.value;
  }
  // console.log(currItem.value?.filter?.filerValue)
  if (currItem.value?.filter) {
    const filter: Meta.Filter = currItem.value?.filter;
    operatorValue.value = filter.operator;
    if (currItem.value.type == BiType.Text) {
      selectedValue.value = getValueByType(currItem.value.fieldType, filter.filerValue);
    } else if (currItem.value.type == BiType.Number) {
      rangeMinValue.value = filter.filerValue[0] as number;
      rangeMaxValue.value = filter.filerValue[1] as number;
    } else if (currItem.value.type == BiType.Date) {
      dateRange.value = filter.filerValue as [number, number];
    }
  } else {
    operatorValue.value = operators.value[0].value;
    if (currItem.value.type == BiType.Text) {
      selectedValue.value = null;
    } else if (currItem.value.type == BiType.Number) {
      rangeMinValue.value = 0;
      rangeMaxValue.value = 0;
    } else if (currItem.value.type == BiType.Date) {
      dateRange.value = [Date.now(), Date.now()];
    }
  }

  // 文本类型：获取组件配置中的集合名称，查询当前字段所有可能的值；
  const collName = compConfig.value?.dataBind.collName;
  if (collName) {
    const result = await fetchGetDistinct(collName, currItem.value.key);
    if ('ok' == result.msg && result.data?.length > 0) {

      const getDisplayLabel = (obj: any): string => {
        if (!obj) return '';
        // 显示标签：优先使用名称类字段
        return obj.name ?? obj.label ?? obj.title ?? obj.text ?? JSON.stringify(obj);
      };

      const getIdentifierValue = (obj: any): any => {
        if (!obj) return '';
        // 标识符值：优先使用ID类字段
        return obj._id ?? obj.id ?? obj.uid ?? obj.key ?? obj.value ?? getDisplayLabel(obj);
      };

      selectedValueOptions.value = result.data
        .filter((d: any) => !isEmpty(d))
        .flatMap((value: any) => {
          if (Array.isArray(value)) {
            return value.map((d: any) => {
              const label = typeof d === 'object' ? getDisplayLabel(d) : d?.toString() ?? '';
              const val = typeof d === 'object' ? getIdentifierValue(d) : d;
              const raw = d;
              return val != null && val !== '' // 排除无效 value
                ? { label, value: val, raw }
                : null; // 过滤掉无效项
            });
          } else if (typeof value === 'object') {
            const label = getDisplayLabel(value);
            const val = getIdentifierValue(value);
            return val != null && val !== ''
              ? { label, value: val, raw: value }
              : null;
          } else {
            return value != null && value !== ''
              ? { label: value?.toString() ?? '', value, raw: value }
              : null;
          }
        })
        .filter(Boolean) // 过滤 null/undefined
        // 🔥 核心：使用 Map 按 value 去重，保留第一个遇到的
        .reduce((unique, option: any) => {
          if (!unique.has(option?.value)) {
            unique.set(option?.value, option);
          }
          return unique;
        }, new Map<string | number, { label: string; value: any; raw: any }>)
        .values() // 提取 Map 的值
        .toArray(); // 如果在 Vue 3 + Ref 中使用，可能需要 Array.from()
    }
  }
}



const show = (type: 'dim' | 'meas' | 'filter', item: Meta.DropItem, i: string) => {
  boxType.value = type;
  currItem.value = { ...item };
  chartId.value = i;
  init();
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>
