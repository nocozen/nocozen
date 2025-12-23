<template>
  <span class="text-gray">{{`绑定表单 (${cptIsCurrModule})`}}</span>
  <FromTreeSelect v-model="moduleValue" size="small" placeholder="请选择绑定表单" @update-value="updateModuleValue"
    :options="moduleOptions"/>
  <span class="text-gray">绑定字段</span>
  <NSelect v-model:value="fieldValue" :multiple="multiple" @update-value="updateFieldsValue" size="small" placeholder="请选择绑定字段"
    :options="fieldOptions" />
  <span class="text-gray">排序字段</span>
  <NFlex class="w-full" align="center" :size="0">
    <NSelect class="flex-1" v-model:value="sortValue" @update-value="updateSortFieldValue" size="small" placeholder="请选择排序字段"
      :options="fieldOptions" clearable />
    <NSwitch v-if="sortValue" v-model:value="descSortValue" @update-value="updateDescSortValue" size="small"
      class="ml-1 mr-0.5" :rail-style="railStyle">
      <template #checked>降</template>
      <template #unchecked>升</template>
    </NSwitch>
  </NFlex>
  <slot></slot>
  <template v-if="optPerm" >
    <span class="text-gray">操作权限</span>
    <NCheckbox v-model:checked="addPermValue" @update:checked="updateAddPermValue">允许新增表单数据</NCheckbox>
  </template>
</template>


<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { fetchGetAppModules, getModuleTree, fetchGetModuleConfig } from '@/service/api';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import type { CSSProperties } from 'vue';

interface Props {
  relation: Meta.Relation,
  multiple: boolean,
  optPerm: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  optPerm: false
});

interface Emits {
  (e: 'update:relation', relation: Meta.Relation): void;
}
const emit = defineEmits<Emits>();

const { currModuleNode, currSelectCompId } = useModuleInject();

const expandedKeys = ref([] as any)
const moduleOptions = ref([] as any);
const fieldOptions = ref([] as any);
const moduleValue = ref();
const moduleConfigValue = ref();
const collNameValue = ref();
const fieldValue = ref<Array<string> | string | null>(null);
const sortValue = ref<string | null>(null);
const descSortValue = ref(false);
const addPermValue = ref(false);

const railStyle = (info: { focused: boolean, checked: boolean }) => {
  const style: CSSProperties = {}
  if (info.checked) {
    style.background = '#2080f0'
    if (info.focused) {
      style.boxShadow = '0 0 0 2px #2080f040'
    }
  } else {
    style.background = '#36ad6a'
    if (info.focused) {
      style.boxShadow = '0 0 0 2px #36ad6a40'
    }
  }
  return style
}

const cptIsCurrModule = computed(() => {
  if (moduleConfigValue.value) {
    if (moduleConfigValue.value == currModuleNode?.value.moduleConfig_id) {
      return '当前表单'
    } else {
      return '其它表单'
    }
  } else {
    return '未绑定'
  }
})
const initData = async () => {
  moduleValue.value = props.relation.module_id;
  moduleConfigValue.value = props.relation.moduleConfig_id;
  collNameValue.value = props.relation.collName;
  fieldValue.value = null;
  sortValue.value = null;
  descSortValue.value = false;
  addPermValue.value = false;
  // 查询所有模块列表
  if (currModuleNode && currModuleNode.value.app_id) {
    const app_id = currModuleNode.value.app_id;
    const result = await fetchGetAppModules({ app_id: app_id })
    if ('ok' == result.msg && result.data?.length > 0) {
      let moduleTree = getModuleTree(app_id, result.data);
      moduleOptions.value = [ ...moduleTree ]
      await initOptions(moduleConfigValue.value);
      props.relation.fieldName && (fieldValue.value = props.relation.fieldName);
      props.relation.sortFieldName && (sortValue.value = props.relation.sortFieldName);
      props.relation.descSort && (descSortValue.value = true);
      props.relation.addPerm && (addPermValue.value = true);
    }
  }
}
// initData();

// 复杂对象属性传递会丢失响应
watch(
  () => currSelectCompId,
  (newValue, oldValue) => {
    initData();
  },
  { immediate: true, deep: true }
);

const initOptions = async (config_id: string) => {
  const result = await fetchGetModuleConfig(config_id);
  if ('ok' == result.msg && result.data?.length == 1 && result.data[0].compConfigs && result.data[0].compConfigs?.length > 0) {
    result.data[0].formConfig.collName && (collNameValue.value = result.data[0].formConfig.collName);
    let configs = result.data[0].compConfigs;
    fieldOptions.value = configs.map((c: Meta.CompConfig) => ({
      label: c.title,
      value: c.fieldName
    }))
  }
}

const updateAddPermValue = (checked: boolean) => {
  emit('update:relation',
    {
      module_id: moduleValue.value,
      moduleConfig_id: moduleConfigValue.value,
      collName: collNameValue.value,
      fieldName: fieldValue.value,
      sortFieldName: sortValue.value,
      descSort: descSortValue.value,
      addPerm: checked
    }
  )
}

const updateSortFieldValue = (value: string, option: any) => {
  emit('update:relation',
    {
      module_id: moduleValue.value,
      moduleConfig_id: moduleConfigValue.value,
      collName: collNameValue.value,
      fieldName: fieldValue.value,
      sortFieldName: value,
      descSort: descSortValue.value,
      addPerm: addPermValue.value
    }
  )
}

const updateDescSortValue = (value: boolean) => {
  emit('update:relation',
    {
      module_id: moduleValue.value,
      moduleConfig_id: moduleConfigValue.value,
      collName: collNameValue.value,
      fieldName: fieldValue.value,
      sortFieldName: sortValue.value,
      descSort: value,
      addPerm: addPermValue.value
    }
  )
}

const updateModuleValue = async (value: string, option: any) => {
  fieldValue.value = null;
  sortValue.value = null;
  // id 获取 config 生成 fieldOptions
  const config_id = option.option.moduleConfig_id;
  moduleConfigValue.value = config_id;
  await initOptions(config_id)
  emit('update:relation',
    {
      module_id: value,
      moduleConfig_id: config_id,
      collName: collNameValue.value,
      fieldName: fieldValue.value,
      sortFieldName: sortValue.value,
      descSort: descSortValue.value,
      addPerm: addPermValue.value
    }
  )
}
const updateFieldsValue = (value: any, option: any) => {
  emit('update:relation',
    {
      module_id: moduleValue.value,
      moduleConfig_id: moduleConfigValue.value,
      collName: collNameValue.value,
      fieldName: value,
      sortFieldName: sortValue.value,
      descSort: descSortValue.value,
      addPerm: addPermValue.value
    }
  )
}


</script>
