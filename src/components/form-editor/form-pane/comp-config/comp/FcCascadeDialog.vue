<template>
  <ModalDialog @onOkClick="onOkClick" @onCancelClick="onCancelClick" ref="refModal" title="数据联动条件设置" modal-class="w-160"
    :footer="true" :buttons="['cancel', 'ok']">
    <NFlex vertical class="h-100 p-4" align="center">
      <NFlex class="w-full" :size="0">
        <span class="w-70">过滤字段</span>
        <span class="w-56">触发联动组件</span>
        <ButtonIcon @click="onAddClick" icon="mdi:plus" title="添加条件" size="small" type="info" level="" />
      </NFlex>
      <NFlex class="w-full" :size="0" align="center">
        <template v-for="(filter, index) in cascadeFilters">
          <NFlex class="w-full mb-2" :size="0" align="center">
            <NSelect class="w-50" v-model:value="filter.filterFieldName" :render-label="renderLabel" size="small"
              placeholder="选择过滤字段" :options="filterFields" @update:value="(value, option) => updateFilterValue(filter, value, option)"/>
            <NSelect v-model:value="filter.comparison" :bordered="false" class="w-20" size="small" placeholder=""
              :options="comparisons" />
            <NSelect class="w-50" v-model:value="filter.triggerFieldName" :render-label="renderLabel" size="small"
              placeholder="选择触发联动组件" :options="triggerFields" @update:value="(value, option) => updateTriggerValue(filter, value, option)" />
            <NButton @click="onDeleteClick(index)" text class="text-gray-500 ml-2" size="small">
              <SvgIcon icon="mdi:trash-can-outline" class="text-xl"/>
            </NButton>
          </NFlex>
        </template>
      </NFlex>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, h, watch, toRaw } from 'vue';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchGetModuleConfig } from '@/service/api';
import { BaseComparOpt, ElTypeGroup, FormElType, FormElTypeIcon } from '@/enum';
import IconTag from '@/components/advanced/tag-icon.vue';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'updateConfig'): void;
}
const emit = defineEmits<Emits>();

const { currSelectCompId, compConfigs } = useModuleInject();

const refModal = ref();
const cascadeFilters = ref<Array<Meta.CascadeFilter>>([] as any);
const compConfig = ref();
const filterFields = ref([] as any);
const triggerFields = ref([] as any);
const comparisons = ref([
  { label: '等于', value: BaseComparOpt.Equal },
])

const renderLabel = (option: any, selected: boolean) => {
  return h(IconTag, { icon: FormElTypeIcon[option.type as FormElType], title: option.label });
}

const updateFilterValue = (filter: Meta.CascadeFilter, value: any, option: any) => {
  filter.filterFieldType = option.type;
}

const updateTriggerValue = (filter: Meta.CascadeFilter, value: any, option: any) => {
  filter.triggerFieldType = option.type;
}

const initData = async () => {
  const result = await fetchGetModuleConfig(compConfig.value.relation.moduleConfig_id);
  if ('ok' == result.msg && result.data.length == 1 && result.data[0]?.compConfigs?.length > 0) {
    let configs = result.data[0].compConfigs;
    filterFields.value = configs.filter((c: Meta.CompBase) => ElTypeGroup.filterTypes.includes(c.type as FormElType) && c.nodeUid == 0)
      .map((c: Meta.CompConfig) => ({
        label: c.title,
        value: c.fieldName,
        type: c.type
      }))
  }
  triggerFields.value = compConfigs?.filter((c: Meta.CompBase) =>
    c.fieldName != compConfig.value.fieldName &&
    ElTypeGroup.filterTypes.includes(c.type as FormElType) && c.nodeUid == 0
  )
    .map((c: Meta.CompBase) => ({
      label: c.title,
      value: c.fieldName,
      type: c.type
    }))
}

const init = async () => {
  cascadeFilters.value = [];
  let comp = compConfigs?.find((item: any) => item.i == currSelectCompId?.value);
  if (comp) {
    compConfig.value = comp;
    if (compConfig.value.cascadeFilters?.length > 0) {
      cascadeFilters.value = [...compConfig.value.cascadeFilters];
    } else {
      cascadeFilters.value.push({
        comparison: BaseComparOpt.Equal,
        filterFieldName: null,
        filterFieldType: null,
        triggerFieldName: null,
        triggerFieldType: null
      })
    }
  }
  initData();
}

watch(
  () => currSelectCompId,
  () => {
    init();
  },
  { immediate: true }
);
watch(
  () => compConfig.value.relation.moduleConfig_id,
  () => {
    initData();
  },
  { immediate: true, deep: true }
);

const onDeleteClick = (index: number) => {
  cascadeFilters.value.splice(index, 1);
}
const onAddClick = () => {
  cascadeFilters.value.push({
    comparison: BaseComparOpt.Equal,
    filterFieldName: null,
    filterFieldType: null,
    triggerFieldName: null,
    triggerFieldType: null
  })
}
const onOkClick = () => {
  // 输入不能为空
  const resultFilters = cascadeFilters.value.filter((v: any) => v.filterFieldName != null && v.triggerFieldName != null)
  if (resultFilters?.length > 0) {
    compConfig.value.cascadeFilters = resultFilters;
    emit('updateConfig');
    refModal.value.show(false);
  } else {
    if (cascadeFilters.value?.length == 0) {
      compConfig.value.cascadeFilters = [];
      emit('updateConfig');
      refModal.value.show(false);
    } else {
      window.$message?.warning('请完成输入或删除不需要的条件！');
    }
  }
}

const onCancelClick = () => {
  cascadeFilters.value = compConfig.value.cascadeFilters;
}

const show = () => {
  if (compConfig.value.relation && Object.values(compConfig.value.relation).filter((a: any) => a)?.length != 0) {
    init();
    refModal.value.show(true)
  } else {
    window.$message?.warning("请先绑定表单！")
  }
}

defineExpose({
  show
})
</script>