<template>
  <ModalDialog @onOkClick="onOkClick" @onCancelClick="onCancelClick" ref="refModal" title="填充字段设置" modal-class="w-160"
    :footer="true" :buttons="['cancel', 'ok']">
    <NFlex vertical class="h-100 p-4" align="center">
      <NFlex class="w-full" :size="0">
        <span class="w-70">选中数据的字段</span>
        <span class="w-56">填充表单字段</span>
        <ButtonIcon @click="onAddClick" icon="mdi:plus" title="添加设置" size="small" type="info" level="" />
      </NFlex>
      <NFlex class="w-full" :size="0" align="center">
        <template v-for="(filter, index) in mapFields">
          <NFlex class="w-full mb-2" :size="0" align="center">
            <NSelect class="w-50" v-model:value="filter.sourceField" :render-label="renderLabel" size="small"
              placeholder="选择数据字段" :options="filterFields"
              @update-value="(value, option) => updateSourceValue(filter, value, option)" />
            <span class="mx-4">填充到</span>
            <NSelect class="w-50" v-model:value="filter.mapField" :render-label="renderLabel" size="small"
              placeholder="选择填充字段" :options="triggerFields.filter((t: Meta.CompBase) => t.type == filter.sourceType)"
              @update-value="(value, option) => updateMapValue(filter, value, option)" />
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
import { ref, h, watch } from 'vue';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchGetModuleConfig } from '@/service/api';
import { ElTypeGroup, FormElType, FormElTypeIcon } from '@/enum';
import IconTag from '@/components/advanced/tag-icon.vue';
import { c } from 'naive-ui';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'updateConfig'): void;
}
const emit = defineEmits<Emits>();

const { updateCompConfig, currSelectCompId, compConfigs } = useModuleInject();

const refModal = ref();
const mapFields = ref<Array<Meta.FieldsMap>>([] as any);
const compConfig = ref();
const filterFields = ref([] as any);
const triggerFields = ref([] as any);

const renderLabel = (option: any, selected: boolean) => {
  return h(IconTag, { icon: FormElTypeIcon[option.type as FormElType], title: option.label });
}

const updateSourceValue = (filter: Meta.FieldsMap, value: any, option: any) => {
  filter.sourceType = option.type;
}
const updateMapValue = (filter: Meta.FieldsMap, value: any, option: any) => {
  filter.mapType = option.type;
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
    ElTypeGroup.filterTypes.includes(c.type as FormElType) 
    && c.nodeUid == 0
  )
    .map((c: Meta.CompBase) => ({
      label: c.title,
      value: c.fieldName,
      type: c.type
    }))
}

const init = async () => {
  mapFields.value = [];
  let comp = compConfigs?.find((item: any) => item.i == currSelectCompId?.value);
  if (comp) {
    compConfig.value = comp;
    if (compConfig.value.mapFields && compConfig.value.mapFields.length > 0) {
      mapFields.value = [...compConfig.value.mapFields];
    } else {
      mapFields.value.push({
        sourceField: null,
        sourceType: null,
        mapField: null,
        mapType: null
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
  mapFields.value.splice(index, 1);
}

const onCancelClick = () => {
  mapFields.value = compConfig.value.mapFields;
}

const onAddClick = () => {
  mapFields.value.push({
    sourceField: null,
    sourceType: null,
    mapField: null,
    mapType: null
  })
}

// 当前组件更新统一使用父组件updateCompConfig方法，填充配置同步更新mappedFieldNames使用当前方法；
const updateMappedCompConfig = (config: Meta.CompConfig) => {
  updateCompConfig && updateCompConfig(config)
}

const onOkClick = () => {
  // 输入不能为空
  if (mapFields.value.filter((v: any) => v.filterFieldName != null)) {
    compConfig.value.mapFields = mapFields.value;
    // 遍历所有字段，已绑定的添加标记；
    compConfigs?.forEach((config: Meta.CompBase) => {
      if (mapFields.value.find((v: any) => v.triggerFieldName == config.fieldName)) {
        // mappedFieldNames 辅助显示绑定图标
        if (config.mappedFieldNames) {
          config.mappedFieldNames.push(compConfig.value.fieldName);
        } else {
          config.mappedFieldNames = [compConfig.value.fieldName];
        }
        // 更新组件配置
        updateMappedCompConfig(config as Meta.CompConfig);
      } else {
        if (config.mappedFieldNames) {
          let mappedFieldIndex = config.mappedFieldNames.findIndex((c: string) => compConfig.value.fieldName == c);
          // 更新组件配置
          if (mappedFieldIndex != -1) {
            config.mappedFieldNames.splice(mappedFieldIndex, 1);
            updateMappedCompConfig(config as Meta.CompConfig);
          }
        }
      }
    })
    emit('updateConfig');
    refModal.value.show(false);
  } else {
    window.$message?.warning('请完成输入或删除不需要的条件！');
  }
}


const show = () => {
  if (compConfig.value.relation && Object.values(compConfig.value.relation).filter((a: any) => a).length != 0) {
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