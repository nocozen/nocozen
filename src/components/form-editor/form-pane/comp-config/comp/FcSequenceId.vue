<template>
  <NFlex>
    <NFlex class="w-full" justify="space-between" align="center">
      <span class="font-semibold">流水号规则</span>
      <NPopselect v-model:value="ruleConfig.subRuleOrder" trigger="click" multiple @update:value="onUpdateRule"
        size="small" placeholder="" :options="ruleOptions">
        <NButton size="small" text type="info">添加
          <template #icon>
            <SvgIcon icon="mdi:plus" />
          </template>
        </NButton>
      </NPopselect>
    </NFlex>
    <NFlex class="w-full">
      <NInputGroup v-for="subType in ruleConfig.subRuleOrder">
        <NInputGroupLabel size="small">{{ RuleNameMap[subType] }}</NInputGroupLabel>
        <NInput v-if="SeqIdSubType.FixedString === subType" v-model:value="ruleConfig.fixedString" :maxlength="20"
          size="small" />
        <NSelect v-else-if="SeqIdSubType.DateString === subType" v-model:value="ruleConfig.dateString"
          :options="dateFormatOptions" size="small" />
      </NInputGroup>
      <NFlex justify="center" align="center" class="w-full">
        <NInputGroup>
          <NInputGroupLabel size="small">计数位数</NInputGroupLabel>
          <NInputNumber size="small" v-model:value="ruleConfig.counterLength" :min="2" :max="12" />
        </NInputGroup>
        <NInputGroup>
          <NInputGroupLabel size="small">计数重置</NInputGroupLabel>
          <NSelect v-model:value="ruleConfig.counterType" :options="counterTypeOptions" size="small" />
        </NInputGroup>
      </NFlex>
      <NFlex justify="space-between" align="center" class="w-full">
        <NButton size="small" :disabled="!isChange" @click="onCancelClick">取消</NButton>
        <NButton size="small" :disabled="!isChange" type="info" @click="onSaveClick">保存</NButton>
      </NFlex>
    </NFlex class="w-full" justify="space-between" align="center">
      <NInputGroup>
        <NFlex class="w-full border-1 pl-2" justify="start" align="center">当前计数：{{ currCount ?? '未计数' }}</NFlex>
        <NButton size="small" :disabled="!currCount" @click="onResetClick">重置</NButton>
      </NInputGroup>
  </NFlex>

</template>

<script setup lang="ts">
import { fetchGetCurrSequence, fetchResetSequence } from '@/service/api';
import { isEmpty, isEqual } from 'radashi';
import { computed, ref, watch } from 'vue';


interface Props {
  i: string,
  sequenceRule: Meta.SequenceRule,
}

const props = withDefaults(defineProps<Props>(), {
  sequenceRule: () => ({
    fixedString: '',
    dateString: 'YYYYMMDD',
    counterLength: 5,
    counterType: PeriodType.Never,
    subRuleOrder: ['fixedString', 'dateString']
  })
});


interface Emits {
  (e: 'update:sequenceRule', rule: Meta.SequenceRule): void;
}

const emit = defineEmits<Emits>();

const enum SeqIdSubType {
  FixedString = 'fixedString',
  DateString = 'dateString',
  Counter = 'conterNumber'
}
const RuleNameMap: { [key: string]: string } = {
  [SeqIdSubType.FixedString]: '固定字符',
  [SeqIdSubType.DateString]: '日期格式',
  [SeqIdSubType.Counter]: '计数序号'
}

const ruleOptions = ref([
  { label: '固定字符', value: SeqIdSubType.FixedString },
  { label: '日期格式', value: SeqIdSubType.DateString }
])
const dateFormatOptions = ref([
  { label: '2025', value: 'YYYY' },
  { label: '202501', value: 'YYYYMM' },
  { label: '20250101', value: 'YYYYMMDD' },
  { label: '2025-01', value: 'YYYY-MM' },
  { label: '2025-01-01', value: 'YYYY-MM-DD' },
  { label: '2025/01', value: 'YYYY/MM' },
  { label: '2025/01/01', value: 'YYYY/MM/DD' },
  { label: '0101', value: 'MMDD' },
  { label: '01-01', value: 'MM-DD' },
  { label: '01/01', value: 'MM/DD' },
])
const isChange = ref(false);

// 'year' | 'month' | 'day' | 'never'
const enum PeriodType {
  Year = 'year',
  Month = 'month',
  Day = 'day',
  Never = 'never'
}

const counterTypeOptions = ref([
  { label: '不重置', value: PeriodType.Never },
  { label: '每日重置', value: PeriodType.Day },
  { label: '每月重置', value: PeriodType.Month },
  { label: '每年重置', value: PeriodType.Year },
])

const ruleConfig = ref<Meta.SequenceRule>({ ...props.sequenceRule });
const currCount = ref();

const init = async () => {
  const currSeqValue = await fetchGetCurrSequence(props.i);
  if ('ok' == currSeqValue.msg && currSeqValue.data?.length > 0) {
    currCount.value = currSeqValue.data[0].count;
  }
}
init();

const onUpdateRule = (value: string, option: any) => {
  // console.log(value)
  if (!value.includes(SeqIdSubType.FixedString)) {
    ruleConfig.value.fixedString = '';
  }
  if (!value.includes(SeqIdSubType.DateString)) {
    ruleConfig.value.dateString = 'YYYYMMDD';
  }
}


watch(
  () => [props.sequenceRule, ruleConfig.value],
  ([newRule, newConfig]) => {
    if (isEqual(newRule, newConfig)) {
      isChange.value = false;
    } else {
      isChange.value = true;
    }
  },
  { deep: true } // 深监听
);

const onResetClick = async () => {
  const result = await fetchResetSequence(props.i);
  if ('ok' == result.msg) {
    await init();
    window.$message?.success('重置成功');
  } else {
    window.$message?.error('重置失败:' + result.msg);
  }
}

const onCancelClick = () => {
  ruleConfig.value = { ...props.sequenceRule };
}

const onSaveClick = () => {
  // 保存组件配置
  emit('update:sequenceRule', { ...ruleConfig.value });
  window.$message?.success('设置成功');
}

</script>

<style lang="scss" scoped>
:deep(.n-button .n-button__icon) {
  margin-right: 0;
}
</style>