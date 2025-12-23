<template>
  <span class="font-semibold">文本位置</span>
  <NRadioGroup v-model:value="ddStyle.textAlign" @update:value="onUpdateTextAlign" size="small">
    <NRadioButton value="left">居左</NRadioButton>
    <NRadioButton value="center">居中</NRadioButton>
  </NRadioGroup>
  <span class="font-semibold">配色</span>
  <NFlex class="pa-2 w-full border-1 rounded-md" justify="space-between">
    <template v-for="color in dividerColors" :key="color">
      <NButton v-if="color == 'transparent'" @click="onColorClick(color)" circle class="text-red"
        :class="ddStyle.color == color ? 'border-solid border-blue-500 border-2' : ''">
        <template #icon>
          <SvgIcon icon="mdi:remove" />
        </template>
      </NButton>
      <NButton v-else :color="color" @click="onColorClick(color)" circle
        :class="ddStyle.color == color ? 'border-solid border-blue-500 border-2' : ''" />
    </template>
  </NFlex>
  <span class="font-semibold">线条类型</span>
  <NSelect v-model:value="ddStyle.lineType" @update:value="onUpdateLineType" size="small" placeholder=""
    :options="lineOptions" />
  <span class="font-semibold">线条宽度</span>
  <NSelect v-model:value="ddStyle.lineWidth" @update:value="onUpdateLineWidth" size="small" placeholder=""
    :options="lineWidthOptions" />
  <span class="font-semibold">背景形状</span>
  <NSelect v-model:value="ddStyle.shapeType" @update:value="onUpdateShapeType" size="small" placeholder=""
    :options="shapeOptions" />
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { defSysColors } from '@/enum/biMeta';
import { DividerShapeName, DividerShapes } from '@/enum';
import { isEmpty } from 'radashi';

interface Props {
  ddStyle: Meta.DividerStyle,
}

const props = withDefaults(defineProps<Props>(), {
  ddStyle: () => ({
    color: 'transparent',
    textColor: 'default',
    textAlign: 'left',
    lineType: 'solid',
    lineWidth: '1px',
    shapeType: DividerShapes.RoundedTSm,
  })
});

interface Emits {
  (e: 'updateConfig'): void;
  // todo: 暂时没有用双向绑定，需要时参考FcDefValue
  (e: 'update:ddStyle', ddStyle?: Meta.DividerStyle): void;
}

const emit = defineEmits<Emits>();

// 颜色：系统配色；
// 样式：虚线、实线、矩形背景、小圆角背景、大圆角背景、斜角背景

const dividerColors = ['transparent', ...defSysColors];

const lineOptions = ref([
  { label: '虚线', value: 'dashed' },
  { label: '实线', value: 'solid' },
])
const lineWidthOptions = ref([
  { label: '1像素', value: '1px' },
  { label: '2像素', value: '2px' },
  { label: '3像素', value: '3px' },
  { label: '4像素', value: '4px' },
])
const shapeOptions = ref([
  { label: DividerShapeName[DividerShapes.RoundedTSm], value: DividerShapes.RoundedTSm },
  { label: DividerShapeName[DividerShapes.RoundedTMd], value: DividerShapes.RoundedTMd },
  { label: DividerShapeName[DividerShapes.RoundedTXl], value: DividerShapes.RoundedTXl },
  { label: DividerShapeName[DividerShapes.Trapezoid], value: DividerShapes.Trapezoid },
  { label: DividerShapeName[DividerShapes.RoundedTrSm], value: DividerShapes.RoundedTrSm },
  { label: DividerShapeName[DividerShapes.RoundedTrMd], value: DividerShapes.RoundedTrMd },
  { label: DividerShapeName[DividerShapes.RoundedTrXl], value: DividerShapes.RoundedTrXl },
  { label: DividerShapeName[DividerShapes.TrapezoidR], value: DividerShapes.TrapezoidR },
])

const init = () => {
  isEmpty(props.ddStyle.color) && (props.ddStyle.color = 'transparent');
  isEmpty(props.ddStyle.textColor) && (props.ddStyle.textColor = 'default');
  isEmpty(props.ddStyle.textAlign) && (props.ddStyle.textAlign = 'left');
  isEmpty(props.ddStyle.lineType) && (props.ddStyle.lineType = 'solid');
  isEmpty(props.ddStyle.lineWidth) && (props.ddStyle.lineWidth = '1px');
  isEmpty(props.ddStyle.shapeType) && (props.ddStyle.shapeType = DividerShapes.RoundedTSm);
}

init();

const onColorClick = (color: string) => {
  props.ddStyle.color = color;
  emit('updateConfig');
}
const onUpdateTextAlign = (value: 'left' | 'center') => {
  emit('updateConfig');
}

const onUpdateLineType = (value: 'solid' | 'dashed', option: any) => {
  emit('updateConfig');
}

const onUpdateLineWidth  = (value: string, option: any) => {
  emit('updateConfig');
}

const onUpdateShapeType = (value: string, option: any) => {
  emit('updateConfig');
}
</script>
