<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <template v-if="compConfig.viewPerm">
      <NInputGroup>
        <NInput v-if="inst" v-model:value="inst[compConfig.fieldName]" :maxlength="500"
          size="small" :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" :disabled="true" clearable />
        <NInput v-else v-model:value="compConfig.fieldValue" :maxlength="500"
          size="small" :placeholder="compConfig.placeholder ? compConfig.placeholder : ''" :disabled="true" clearable />
        <ButtonIcon v-if="compConfig.editPerm" @click="openDataSelect" level="" icon="mdi:database-check-outline"
          title="选择" size="small" />
      </NInputGroup>
    </template>
    <NInput v-else size="small" placeholder="" :disabled="true">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
    <ModalDialog ref="refFormDialog" title="选择数据" modal-class="w-200 h-fit">
      <FormTable :i="i" :optPerm="['filter']" :height="450" class="px-4" :click-event-type="'rowSelected'"
        @row-selected="rowSelected" />
    </ModalDialog>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import dayjs from 'dayjs';
import { isObject } from 'radashi';

interface Props {
  inst?: any,
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const refFormDialog = ref()

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


const rowSelected = async (rowData: any) => {
  // 填充绑定字段；关联字段；
  let bindValue = rowData[compConfig.value.relation.fieldName];
  let bindId = rowData?._id;
  // 必须组件元数据类型判断，否则日期与数字无法区分；
  if (compConfig.value.relation.fieldName.startsWith('_md_')) {
    compConfig.value.fieldValue = dayjs(bindValue).format('YYYY-MM-DD HH:mm:ss');
  } else if (Array.isArray(bindValue)) {  // todo: 临时占位代码，目前不支持多选，后续可支持配置子类型
    compConfig.value.fieldValue = bindValue.map((v: Meta.Base) => v.name).join(',')
  } else if (isObject(bindValue) && 'name' in bindValue) {
    compConfig.value.fieldValue = bindValue.name;
  } else {
    compConfig.value.fieldValue = bindValue;
  }
  compConfig.value.bindId = bindId;   // 树形结构用
  compConfig.value.mapFields?.forEach((m: Meta.FieldsMap) => {
    let mapComp = compConfigs?.find((c: Meta.CompBase) => c.fieldName == m.mapField);
    // mapFields配置强制要求前后类型一致；在此处就不需要再处理；
    mapComp && (mapComp.fieldValue = rowData[m.sourceField!]);
  })

  refFormDialog.value.show(false);
}


// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);


const openDataSelect = () => {
  refFormDialog.value.show(true);
}
</script>

<style lang="scss" scoped></style>
