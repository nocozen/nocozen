<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"  :rule="rule"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :show-require-mark="compConfig.required">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <template v-if="compConfig.viewPerm">
      <NCascader class="min-w-5!" v-model:value="compConfig.fieldValue" :options="options" :on-load="handleLoad" remote
        check-strategy="child" :placeholder="compConfig.placeholder" size="small" :disabled="disabled"/>
    </template>
    <NInput v-else :maxlength="500" size="small" placeholder="" :disabled="true">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
  </NFormItem>
</template>

<script setup lang="ts">
import { ref, watchEffect, computed, watch } from 'vue';
import province from '@/localdb/division-cn/province.json';
import pccd from '@/localdb/division-cn/pccd.json';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { getShowLink } from './shared';
import { QbIcon } from '@/enum';
import { isEmpty } from 'radashi';

interface Props {
  inst?: any,
  i: string,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
});

const showLink = ref(false);
const options = ref<RegionNode[]>([]);

interface RegionNode {
  label: string;
  value: string;
  isLeaf?: boolean;
  children?: RegionNode[];
}

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);

const rule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator() {
      if (compConfig.value.required) {
        if (isEmpty(compConfig.value.fieldValue)) {
          return new Error('必填项不能为空');
        }
      }
    }
  }
})

const cptLabelWidth = computed(() => {
  if (layoutConfig?.value.labelWidthType == 'auto') {
    return 'auto';
  } else {
    return layoutConfig?.value.labelWidth;
  }
})

const cptLabelAlign = computed(() => {
  if (layoutConfig?.value.labelPlace == 'top') {
    return 'start';
  } else {
    if (layoutConfig?.value.labelAlign == 'left') {
      return 'start';
    } else {
      return 'end'
    }
  }
})

// 直辖市代码
const MUNICIPALITY_CODES = new Set(['110000', '120000', '310000', '500000', "810000", "820000"]);

/**
 * 判断是否为直辖市（省级）
 */
const isMunicipality = (code: string): boolean => {
  return MUNICIPALITY_CODES.has(code);
};

/**
 * 初始化省级选项
 */
const init = async (config: Meta.CompConfig) => {
  showLink.value = getShowLink(config);
  options.value = Object.entries(province).map(([code, name]) => ({
    label: name as string,
    value: code,
    isLeaf: false, // 所有省都不是叶子节点
  }));

  // 处理默认值（区级编码）
  const fieldValue = config.fieldValue;
  if (fieldValue && typeof fieldValue === 'string') {
    const path: string[] = [];
    const leafCode = fieldValue;

    // 1. 找到市级（通过截取前4位 + "00"）
    const cityCode = leafCode.slice(0, 4) + '00';
    path.unshift(leafCode);
    path.unshift(cityCode);

    // 2. 找到省级（直辖市或普通省）
    let provinceCode: string;
    if (isMunicipality(cityCode)) {
      provinceCode = cityCode;
    } else {
      provinceCode = cityCode.slice(0, 2) + '0000';
    }
    path.unshift(provinceCode);

    // 3. 加载省级子节点（所有市）
    const provinceNode = options.value.find(opt => opt.value === provinceCode);
    if (provinceNode) {
      provinceNode.children = getChildrenByParentCode(provinceCode);
      provinceNode.isLeaf = false;

      // 4. 加载市级子节点（所有区）
      const cityNode = provinceNode.children?.find(c => c.value === cityCode);
      if (cityNode) {
        cityNode.children = getChildrenByParentCode(cityCode);
        cityNode.isLeaf = false;
      }
    }

  }
};

/**
 * 根据父级代码获取子节点列表
 * @param parentCode 父级行政区划代码
 * @returns 子节点数组
 */
const getChildrenByParentCode = (parentCode: string): RegionNode[] => {
  return Object.entries(pccd)
    .filter(([code]) => {
      // 根节点：加载所有省级（以0000结尾）
      if (parentCode === '0') {
        return code.endsWith('0000') && code !== '0';
      }

      // 省级节点（xxx0000）：加载其下级
      if (parentCode.endsWith('0000')) {
        if (isMunicipality(parentCode)) {
          // 直辖市：直接加载区级（非0000且非00结尾）
          return (
            code.startsWith(parentCode.slice(0, 2)) &&
            !code.endsWith('0000') &&
            !code.endsWith('00')
          );
        } else {
          // 普通省份：加载地级市（xx00结尾，但非0000）
          return (
            code.startsWith(parentCode.slice(0, 2)) &&
            code.endsWith('00') &&
            !code.endsWith('0000')
          );
        }
      }

      // 市级节点（xxxx00）：加载区级（非00结尾）
      if (parentCode.endsWith('00')) {
        return code.startsWith(parentCode.slice(0, 4)) && !code.endsWith('00');
      }

      // 其他情况：无子级
      return false;
    })
    .map(([code, name]) => ({
      label: name as string,
      value: code,
      isLeaf: !code.endsWith('00'), // 区级（非00结尾）为叶子节点
    }));
};

/**
 * 异步加载子节点
 */
const handleLoad = async (node: any): Promise<void> => {
  const children = getChildrenByParentCode(node.value);

  if (children?.length > 0) {
    node.children = children;
    node.isLeaf = false; // ✅ 关键修复：只要有子节点，就不是叶子！
  } else {
    node.isLeaf = true;
  }
};

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        init(compConfig.value);
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

</script>


<style scoped>
/* 可选样式 */
.n-cascader {
  min-width: 240px;
}
</style>
