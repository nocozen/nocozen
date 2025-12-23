<template>
  <span class="font-semibold">选项</span>
  <NSelect v-if="![FormElType.FeRadioGroup, FormElType.FeCheckboxGroup].includes(optionType)" v-model:value="typeValue"
    @update:value="onUpdateType" size="small" placeholder="" :options="optionTypes" />

  <template v-if="FieldBindType.Custom == typeValue">
    <!-- 单选或复选配置项 -->
    <template v-if="isRadioGroup">
      <NFlex v-for="(item, index) in listItems" :key="item.value" align="center" class="mb-2">
        <NRadio size="small" :checked="item.selected" @update:checked="(checked) => onUpdateRadio(checked, item)" />
        <NInput size="small" class="flex-1 ml-2" :value="item.label"
          @update:value="(value) => onUpdateOption(value, item)" />
        <NButton @click="() => onDeleteItemClick(index)" text class="text-gray-500 ml-2" size="small">
          <SvgIcon icon="mdi:trash-can-outline" class="text-xl" />
        </NButton>
      </NFlex>
    </template>

    <template v-else-if="isCheckboxGroup">
      <NCheckboxGroup v-model:value="selectedValues" @update:value="onUpdateCheckboxGroup">
        <NFlex v-for="(item, index) in listItems" :key="item.value" align="center" class="mb-2">
          <NCheckbox size="small" :value="item.value" />
          <NInput size="small" class="flex-1 ml-2" :value="item.label"
            @update:value="(value) => onUpdateOption(value, item)" />
          <NButton @click="() => onDeleteItemClick(index)" text class="text-gray-500 ml-2" size="small">
            <SvgIcon icon="mdi:trash-can-outline" class="text-xl" />
          </NButton>
        </NFlex>
      </NCheckboxGroup>
    </template>

    <NButton @click="onAddItemClick" type="info" ghost size="small" class="mt-2">
      <SvgIcon icon="mdi:plus" class="text-xl" />
      <span>添加选项</span>
    </NButton>
  </template>

  <!-- 排列方式（仅单选/复选组显示） -->
  <template v-if="[FormElType.FeRadioGroup, FormElType.FeCheckboxGroup].includes(optionType)">
    <span class="font-semibold block mt-4 mb-2">排列方式</span>
    <NButtonGroup>
      <NButton @click="() => onUpdateVertical(false)" :type="!vertical ? 'primary' : 'default'" size="small" ghost>
        水平排列
      </NButton>
      <NButton @click="() => onUpdateVertical(true)" :type="vertical ? 'primary' : 'default'" size="small" ghost>
        垂直排列
      </NButton>
    </NButtonGroup>
  </template>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FormElType, FieldBindType } from '@/enum';
import Uid from '@/utils/uid';

interface Props {
  type?: string; // 自定义 | 关联表单数据 | 数据联动
  optionType: FormElType; // 单选下拉 | 多选下拉 | 单选组 | 复选组
  items?: Array<Meta.ListItem>;
  listVertical?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'custom',
  optionType: FormElType.FeSelect,
  items: () => [],
});

interface Emits {
  (e: 'update:type', type: string): void;
  (e: 'update:items', items: Array<Meta.ListItem>): void;
  (e: 'update:listVertical', listVertical: boolean): void;
}

const emit = defineEmits<Emits>();

const vertical = ref(false);
const typeValue = ref(props.type || FieldBindType.Custom);
const listItems = ref<Array<Meta.ListItem>>([]);
const selectedValues = ref<number[]>([]); // 仅复选组使用

const isRadioGroup = computed(() => props.optionType === FormElType.FeRadioGroup || props.optionType === FormElType.FeSelect);
const isCheckboxGroup = computed(() => props.optionType === FormElType.FeCheckboxGroup || props.optionType === FormElType.FeMulSelect);

const optionTypes = [
  { label: '自定义', value: FieldBindType.Custom },
  { label: '关联表单数据', value: FieldBindType.Relation },
  { label: '数据联动', value: FieldBindType.Cascade },
];


// 初始化 listItems
watch(
  () => props.items,
  (newItems) => {
    if (newItems?.length) {
      listItems.value = newItems.map(item => ({ ...item }));
      // 初始化 selectedValues（仅复选组）
      if (isCheckboxGroup.value) {
        selectedValues.value = listItems.value
          .filter(item => item.selected)
          .map(item => item.value as number);
      }
    }
  },
  { immediate: true }
);

// 初始化 vertical
watch(
  () => props.listVertical,
  (newVal) => {
    vertical.value = newVal ?? false;
  },
  { immediate: true }
);

// 更新选项标签
const onUpdateOption = (value: string, item: Meta.ListItem) => {
  item.label = value;
  item.value = value; // 保持 value 和 label 一致（或自定义逻辑）
  emit('update:items', listItems.value);
};

// 单选逻辑（确保只有一个选中）
const onUpdateRadio = (checked: boolean, selectedItem: Meta.ListItem) => {
  if (!checked) return; // 无法取消选中（单选组必须有一个选中）

  listItems.value.forEach(item => {
    item.selected = item.value === selectedItem.value;
  });

  emit('update:items', listItems.value);
};

// 复选组逻辑（使用 NCheckboxGroup 管理）
const onUpdateCheckboxGroup = (values: any[]) => {
  listItems.value.forEach(item => {
    item.selected = values.includes(item.value as number);
  });
  emit('update:items', listItems.value);
};

// 删除选项
const onDeleteItemClick = (index: number) => {
  listItems.value.splice(index, 1);
  emit('update:items', listItems.value);
};

// 添加选项
const onAddItemClick = () => {
  if (listItems.value?.length >= 20) return;
  
  const newValue = Uid.NextNumber();
  listItems.value.push({
    label: `选项${listItems.value.length + 1}`,
    value: newValue,
    selected: false,
  });
  
  emit('update:items', listItems.value);
};

// 更新 type
const onUpdateType = (type: string) => {  
  emit('update:type', type);
};

// 更新排列方式
const onUpdateVertical = (isVertical: boolean) => {
  vertical.value = isVertical;
  emit('update:listVertical', isVertical);
};
</script>