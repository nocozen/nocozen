<template>
  <NFormItem :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign" :readonly="true"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :rule="rule"
    :show-require-mark="compConfig.required">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <template v-if="compConfig.viewPerm">
      <NSelect ref="refSelect" class="horizontal-scroll-select" :multiple="multiple" :disabled="disabled"
        v-model:value="selectedValues" @click.prevent @update-value="onUpdateValue" :options="options" size="small"
        placeholder="" :clearable="!multiple" filterable :max-tag-count="20" />
    </template>
    <NInput v-else size="small" placeholder="" :disabled="true">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch, h, watchEffect, nextTick } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { BaseComparOpt, ElTypeGroup, FieldBindType, FormElType } from '@/enum';
import { fetchGetDistinct } from '@/service/api/busi';
import { QbIcon } from '@/enum';
import { getShowLink } from './shared';
import SmoothScrollbar from '@/components/common/scrollbar/SmoothScrollbar.vue';
import { isEmpty } from 'radashi';

interface Props {
  inst?: any,     // 可编辑表格嵌套组件直接传值：compConfig.value.fieldValue.find((d: any) => d.uid == row.uid);
  i: string,
  multiple?: boolean,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false
});

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any)
const showLink = ref(false);
const selectedValues = ref();
const options = ref([] as any);
const cascadeFilter = ref({} as any);
const refSelect = ref();
const editPerm = ref(true);

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

// 自定义标签渲染函数（返回 SmoothScrollbar 包裹的标签）
const renderScrollabelTags = (props: { option: any, handleClose: () => void }) => {
  return h(
    SmoothScrollbar, // 使用你的滚动组件
    {
      class: 'select-tags-scroll-container',
      style: { maxHeight: 'var(--scroll-height)' }
    },
    () => props.option.tags.map((tag: any) => h('div', { class: 'tag-item' }, [tag]))
  )
}

const rule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator() {
      if (compConfig.value.required) {
        if (isEmpty(selectedValues.value) && isEmpty(compConfig.value.fieldValue)) {
          return new Error('必填项不能为空');
        }
      }
    }
  }
})

const onUpdateValue = (values: any, option: any) => {
  if (props.multiple) {
    if (props.inst) {   // 编辑表格嵌套组件处理
      props.inst[compConfig.value.fieldName] = options.value.filter((l: any) => values.includes(l.value))
        .map((v: any) => ({ uid: v.value, name: v.label }));
    } else {
      compConfig.value.fieldValue = options.value.filter((l: any) => values.includes(l.value))
        .map((v: any) => ({ uid: v.value, name: v.label }));
    }
  } else {
    if (props.inst) { // 编辑表格嵌套组件处理
      props.inst[compConfig.value.fieldName] = {
        uid: values,
        name: options.value.find((v: any) => v.value == values)?.label
      };
    } else {
      compConfig.value.fieldValue = {
        uid: values,
        name: options.value.find((v: any) => v.value == values)?.label
      }
    }
  }

}

const mapCascadeFilters = computed(() => {
  const filter: Record<string, any> = {};
  if (compConfig.value.cascadeFilters?.length > 0) {
    for (const cf of compConfig.value.cascadeFilters) {
      let trigger = compConfigs?.find((c: Meta.CompBase) => c.fieldName == cf.triggerFieldName);
      let triggerValue = null;
      if (!trigger?.fieldValue) {
        continue;
      } else {
        // 类型：值、对象、数组；fieldValue值uid==name; trigger.type == cf.triggerFieldType
        if (ElTypeGroup.simpleTypes.includes(trigger.type as FormElType)) {
          triggerValue = trigger?.fieldValue
        } else if (Array.isArray(trigger.fieldValue)) {
          triggerValue = { $in: trigger?.fieldValue.map((v: Meta.Base) => v.name) };
        } else {
          triggerValue = trigger?.fieldValue.name;
        }
      }

      switch (cf.comparison) {
        case BaseComparOpt.Equal:
          // 类型：值、对象、数组;fieldValue值uid==name; todo: 测试==========
          if (ElTypeGroup.simpleTypes.includes(cf.filterFieldType as FormElType)) {
            filter[cf.filterFieldName] = triggerValue;
          } else if (Array.isArray(cf.filterFieldType)) {
            filter[cf.filterFieldName.name] = triggerValue;
          } else {
            filter[cf.filterFieldName.name] = triggerValue;
          }
          break;
        // case BaseComparOpt.NotEqual:
        //   filter[cf.filterFieldName] = { $ne: triggerValue };
        //   break;
        // case 'gt':
        //   filter[cf.filterFieldName] = { $gt: triggerValue };
        //   break;
        // case 'gte':
        //   filter[cf.filterFieldName] = { $gte: triggerValue };
        //   break;
        // case 'lt':
        //   filter[cf.filterFieldName] = { $lt: triggerValue };
        //   break;
        // case 'lte':
        //   filter[cf.filterFieldName] = { $lte: triggerValue };
        //   break;
        // case 'in':
        //   filter[cf.filterFieldName] = { $in: Array.isArray(triggerValue) ? triggerValue : [triggerValue] };
        //   break;
        // case 'nin':
        //   filter[cf.filterFieldName] = { $nin: Array.isArray(triggerValue) ? triggerValue : [triggerValue] };
        //   break;
        // case 'regex':
        //   filter[cf.filterFieldName] = { $regex: new RegExp(triggerValue) };
        //   break;
        default:
          throw new Error(`Unsupported comparison operator: ${cf.comparison}`);
      }
    }
  }
  cascadeFilter.value = filter;
  return filter;
})


const updateCasCadeData = async () => {
  // 获取关联配置，生成filter
  if (compConfig.value.relation) {
    const { collName, fieldName } = compConfig.value.relation;
    // 查询集合的指定列的不重复列表
    const result = await fetchGetDistinct(collName, fieldName, cascadeFilter.value);
    if ('ok' == result.msg) {
      options.value = result.data.map((d: string) => ({ label: d, value: d }));
    }
  }
}

const initOption = async () => {

  if (FieldBindType.Custom == compConfig.value.listType) {
    options.value = [...compConfig.value.listItems];
  } else if (FieldBindType.Relation == compConfig.value.listType) {
    options.value.length = 0;
    const relation = compConfig.value.relation;
    if (relation.module_id && relation.moduleConfig_id && relation.fieldName) {
      // 查询集合的指定列的不重复列表
      const result = await fetchGetDistinct(relation.collName, relation.fieldName);
      if ('ok' == result.msg) {
        options.value = result.data.map((d: string) => ({ label: d, value: d }));
      }
    }

  } else if (FieldBindType.Cascade == compConfig.value.listType) {
    const relation = compConfig.value.relation
    if (relation.module_id && relation.moduleConfig_id && relation.fieldName) {
      updateCasCadeData();
    }
  }

  let initValue = null as any;
  if (props.inst) {   // 编辑表格嵌套组件处理
    initValue = props.inst[compConfig.value.fieldName];
  } else {
    initValue = compConfig.value.fieldValue;
  }
  // 初始化值
  if (initValue) {
    if (props.multiple) {
      selectedValues.value = initValue.map((f: any) => f.name);
    } else {
      selectedValues.value = initValue.name;
    }
  } else {
    if (props.multiple) {
      if (FieldBindType.Custom == compConfig.value.listType) {
        selectedValues.value = compConfig.value.listItems.filter((item: Meta.ListItem) => item.selected).map((item: Meta.ListItem) => item.label);
      } else {
        selectedValues.value = options.value?.length > 0 ? [options.value[0].label] : [];
      }
      // 【注意】不可用selectedValues.value赋值，结果不正确
      if (!isEmpty(compConfig.value)) compConfig.value.fieldValue = [{ uid: selectedValues.value, name: selectedValues.value }];
      // compConfig.value.defValue = [{ uid: selectedValues.value, name: selectedValues.value }];
    } else {
      if (FieldBindType.Custom == compConfig.value.listType) {
        const selectItem = compConfig.value.listItems.find((item: Meta.ListItem) => item.selected);
        selectedValues.value = selectItem ? selectItem.label : null;
      } else {
        selectedValues.value = options.value?.length > 0 ? options.value[0].label : null;
      }
      // 【注意】不可用selectedValues.value赋值，结果不正确
      if (!isEmpty(compConfig.value)) compConfig.value.fieldValue = { uid: selectedValues.value, name: selectedValues.value };
      // compConfig.value.defValue = { uid: selectedValues.value, name: selectedValues.value };
    }
  }
}

watch(
  () => mapCascadeFilters,
  (newValue, oldValue) => {
    if (newValue.value) {
      updateCasCadeData()
    }
  },
  { immediate: true, deep: true }
)

watchEffect(() => {
  if (compConfig.value) {
    initOption(); // 初始化选项
  }
});

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        showLink.value = getShowLink(comp as Meta.FormComp); // 同步更新关联数据
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行; deep 确保初始化赋值成功
);

</script>

<style lang="scss" scoped>
/* 添加一个全局禁用类 */
.force-disable-inputs * {
  pointer-events: none !important;
  user-select: none !important;
}
</style>
