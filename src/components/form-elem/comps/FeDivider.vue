<template>
  <NFlex vertical class="w-full h-full" :size="0" justify="center" align="center">
    <NFlex class="w-full" :style="cptLineStyle" :justify="cptTextAlign">
      <NFlex v-if="compConfig.style?.shapeType?.includes(DividerShapes.Trapezoid)" :class="cptShapeType"
        class="container w-fit" justify="center" align="center" :style="{ '--before-bg-color': cptColor }">
        <span class="text-content font-semibold opacity-90" :style="cptTextColor">{{ cptTitle }}</span>
      </NFlex>
      <span v-else class="px-4 font-semibold" :style="cptShapeColor">{{ cptTitle }}</span>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { getShowLink } from './shared';
import { $t } from '@/locales';
import { DividerShapes } from '@/enum';

interface Props {
  inst?: any,
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);

// 颜色：系统配色；样式：虚线、实线、矩形背景、小圆角背景、大圆角背景、斜角背景

const init = (config: Meta.CompConfig) => {
  // showLink.value = getShowLink(config);
}

const cptTitle = computed(() => {
  return compConfig.value.showTitle ? compConfig.value.title : '';
})

const cptTextColor = computed(() => {
  if (compConfig.value.style?.color == 'transparent') {
    return null;
  } else {
    return { color: '#FFF' }
  }
})

const cptTextAlign = computed(() => {
  const align = compConfig.value.style?.textAlign || 'left';
  return align == 'left' ? 'start' : 'center';
})

const cptColor = computed(() => {
  return compConfig.value.style?.color || 'transparent';
})

const cptShapeColor = computed(() => {
  const compStyle = compConfig.value?.style;
  let style = {
    'background-color': compConfig.value.style?.color,
  } as any;
  if (compStyle?.color == 'transparent') {
    style['padding'] = '0'
  } else {
    style['color'] = 'rgba(255,255,255,0.9)';
    switch (compStyle?.shapeType) {
      case DividerShapes.RoundedTSm:
        style['border-top-right-radius'] = '4px';
        style['border-top-left-radius'] = '4px';
        break;
      case DividerShapes.RoundedTMd:
        style['border-top-right-radius'] = '6px';
        style['border-top-left-radius'] = '6px';
        break;
      case DividerShapes.RoundedTXl:
        style['border-top-right-radius'] = '12px';
        style['border-top-left-radius'] = '12px';
        break;
      case DividerShapes.RoundedTrSm:
        style['border-top-right-radius'] = '4px';
        break;
      case DividerShapes.RoundedTrMd:
        style['border-top-right-radius'] = '6px';
        break;
      case DividerShapes.RoundedTrXl:
        style['border-top-right-radius'] = '12px';
        break;
    }
    return style;
  }
})

const cptShapeType = computed(() => {
  if (compConfig.value.style?.color == 'transparent') {
    return ''
  }
  if (compConfig.value.style?.shapeType == DividerShapes.Trapezoid) {
    return 'lr-cut px-6'
  } else if (compConfig.value.style?.shapeType == DividerShapes.TrapezoidR) {
    return 'r-cut pl-3 pr-6'
  }
})

const cptLineStyle = computed(() => {
  let color = '#e5e7eb';
  compConfig.value.style?.color != 'transparent' && (color = compConfig.value.style?.color);
  let width = compConfig.value.style?.lineWidth || '1px';
  return {
    'border-bottom': `${compConfig.value.style?.lineType || 'solid'} ${color} ${width}`
  }
})


// 【不要即监听又修改，导致循环！！，监听computed属性可能导致监听循环！！】
// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        showLink.value = getShowLink(comp as Meta.FormComp); // 同步更新关联数据
        init(compConfig.value);
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

</script>

<style lang="scss" scoped>
.container {
  position: relative;
  // width: 100%;
  height: 100%;
  text-align: center;
}

.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--before-bg-color);
}

.container.lr-cut::before {
  clip-path: polygon(15% 0, 85% 0, 100% 100%, 0 100%);
}

.container.r-cut::before {
  clip-path: polygon(0 0, 85% 0, 100% 100%, 0 100%);
}

.text-content {
  position: relative;
  // padding: 20px;
  // font-size: 14px;
  // font-weight: 600;
}
</style>
