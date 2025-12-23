<template>
  <NFlex vertical class="w-52 font-medium" v-if="layoutConfig">
    <span class="font-semibold">标题布局</span>
    <NRadioGroup @update:value="layoutChange" v-model:value="currLabelLayout" name="radiobuttongroup1" size="small">
      <NRadioButton v-for="layout in labelLayout" :key="layout.value" :value="layout.value" :label="layout.label" />
    </NRadioGroup>
    <span>标题位置</span>
    <NRadioGroup @update:value="onLabelPlaceUpdate" v-model:value="layoutConfig.labelPlace" name="radiobuttongroup2"
      size="small" :disabled="currLabelLayout == 'default'">
      <NRadioButton v-for="palce in labelPlace" :key="palce.value" :value="palce.value" :label="palce.label" />
    </NRadioGroup>
    <span>标题宽度</span>
    <NRadioGroup @update:value="onLabelWidthTypeUpdate" v-model:value="layoutConfig.labelWidthType" name="radiobuttongroup3"
      size="small" :disabled="currLabelLayout == 'default'">
      <NRadioButton v-for="palce in labelWidth" :key="palce.value" :value="palce.value" :label="palce.label" />
    </NRadioGroup>
    <NInputNumber v-if="'custom' == layoutConfig.labelWidthType" v-model:value="layoutConfig.labelWidth" size="small"
      :min="10" :max="200" @update:value="onLabelWidthUpdate" :disabled="currLabelLayout == 'default'"></NInputNumber>
    <span>标题对齐</span>
    <NRadioGroup @update:value="onLabelAlignUpdate" v-model:value="layoutConfig.labelAlign" name="radiobuttongroup4"
      size="small" :disabled="currLabelLayout == 'default'">
      <NRadioButton v-for="palce in labelAlign" :key="palce.value" :value="palce.value" :label="palce.label" />
    </NRadioGroup>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { isEmpty } from 'radashi';

const { layoutConfig, vglConfig, defVglConfig, updateVglConfig } = useModuleInject();

const labelLayout = [
  {
    label: '默认',
    value: 'default'
  },
  {
    label: '自定义',
    value: 'custom'
  }
];
const labelPlace = [
  {
    label: '居左',
    value: 'left'
  },
  {
    label: '居上',
    value: 'top'
  }
];
const labelAlign = [
  {
    label: '居左',
    value: 'left'
  },
  {
    label: '居右',
    value: 'right'
  }
];
const labelWidth = [
  {
    label: '默认',
    value: 'default'
  },
  {
    label: '自动',
    value: 'auto'
  },
  {
    label: '自定义',
    value: 'custom'
  }
];

const currLabelLayout = ref('default');
const defLeftLabelRowHeight = 24;

const init = () => {
  if (isEmpty(vglConfig?.value)) {
    currLabelLayout.value = 'default';
  } else {
    currLabelLayout.value = 'custom';
  }
}

init();

const layoutChange = (layoutValue: string) => {
  if (!vglConfig) return;
  if ('default' == layoutValue) {
    let { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight } = defVglConfig!.value;
    labelPlace == 'top' ? rowHeight = defLeftLabelRowHeight * 1.5 : rowHeight = defLeftLabelRowHeight;
    layoutConfig!.value = { ...layoutConfig!.value, labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight };
    vglConfig.value = {};
  } else {
    let { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight } = layoutConfig!.value;
    labelPlace == 'top' ? rowHeight = defLeftLabelRowHeight * 1.5 : rowHeight = defLeftLabelRowHeight;
    vglConfig.value = { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight };
  }
  onConfigUpdate();
}

const onLabelPlaceUpdate = (labelPlacValue: any) => {
  if (!vglConfig) return;
  if ('default' == currLabelLayout.value) {
    let { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight } = defVglConfig!.value;
    labelPlace == 'top' ? rowHeight = defLeftLabelRowHeight * 1.5 : rowHeight = defLeftLabelRowHeight;
    layoutConfig!.value = { ...layoutConfig!.value, labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight };
    vglConfig.value = {};
  } else {
    let { labelAlign, labelWidthType, labelWidth, rowHeight } = layoutConfig!.value;
    labelPlacValue == 'top' ? rowHeight = defLeftLabelRowHeight * 1.5 : rowHeight = defLeftLabelRowHeight;
    vglConfig.value = { labelPlace: labelPlacValue, labelAlign, labelWidthType, labelWidth, rowHeight };
  }
  onConfigUpdate();
}

const onLabelWidthTypeUpdate = (labelWidthType: any) => {
  if (!vglConfig) return;
  let { labelPlace, labelAlign, labelWidth, rowHeight } = layoutConfig!.value;
  vglConfig.value = { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight };
  onConfigUpdate();
}

const onLabelWidthUpdate = (labelWidth: any) => {
  if (!vglConfig) return;
  let { labelPlace, labelAlign, labelWidthType, rowHeight } = layoutConfig!.value;
  vglConfig.value = { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight };
  onConfigUpdate();
}

const onLabelAlignUpdate = (labelAlign: any) => {
  if (!vglConfig) return;
  let { labelPlace, labelWidthType, labelWidth, rowHeight } = layoutConfig!.value;
  vglConfig.value = { labelPlace, labelAlign, labelWidthType, labelWidth, rowHeight };
  onConfigUpdate();
}


// 值修改后提交更新
const onConfigUpdate = () => {
  // 添加组件时需要默认值的属性都要初始化，此处不再处理；
  if (updateVglConfig && vglConfig) {
    updateVglConfig && updateVglConfig(vglConfig.value);
  }

}

</script>