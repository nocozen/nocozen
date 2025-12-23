<template>
  <NFlex v-if="compConfig && currSelectCompId" class="w-full">
    <NFlex v-if="FormElType.NestTabPane == compConfig.type" vertical>
      <FcTabs />
    </NFlex>
    <NFlex v-else vertical class="w-full font-medium">
      <NFlex class="w-full" justify="space-between">
        <span class="font-semibold">标题</span>
        <span class="text-gray">{{ FormElTypeCn[compConfig.type as FormElType] }}</span>
      </NFlex>
      <NInput size="small" placeholder="" v-model:value="compConfig.title" @update:value="onConfigUpdate"></NInput>
      <NCheckbox v-model:checked="compConfig.showTitle" size="small" @click="onConfigUpdate">显示标题</NCheckbox>
      <span class="font-semibold">提示</span>
      <NInput size="small" placeholder="" v-model:value="compConfig.placeholder" @update:value="onConfigUpdate" />
      <FcFormat v-if="[FormElType.FeDatetime, FormElType.FeText, FormElType.FeNumber].includes(compConfig.type)"
        :optionType="compConfig.type" v-model:value="compConfig.formatType"
        v-model:decimalPlaces="compConfig.decimalPlaces" @update:decimalPlaces="onConfigUpdate"
        @update:value="onConfigUpdate" />
      <FcDefValue
        v-if="[FormElType.FeDatetime, FormElType.FeText, FormElType.FeNumber, FormElType.FeTextArea].includes(compConfig.type)"
        v-model:type="compConfig.defValueType" v-model:value="compConfig.defValue" :optionType="compConfig.type"
        @update:type="onConfigUpdateDefType" @update:value="onConfigUpdateDefValue" />
      <FcOptions
        v-if="[FormElType.FeSelect, FormElType.FeMulSelect, FormElType.FeRadioGroup, FormElType.FeCheckboxGroup].includes(compConfig.type)"
        v-model:type="compConfig.listType" v-model:listVertical="compConfig.listVertical"
        v-model:items="compConfig.listItems" :optionType="compConfig.type" @update:items="onConfigUpdateListItems"
        @update:listVertical="onConfigUpdate" @update:type="onConfigUpdateSelectType" />
      <span v-if="FormElType.FeDataSelect == compConfig.type" class="font-semibold">数据联动</span>
      <span v-if="FormElType.NestViewTable == compConfig.type" class="font-semibold">数据绑定</span>
      <FcRelation
        v-if="FormElType.NestViewTable == compConfig.type || FormElType.FeDataSelect == compConfig.type ||
          FieldBindType.Cascade == compConfig.defValueType || [FieldBindType.Relation, FieldBindType.Cascade].includes(compConfig.listType)"
        :multiple="FormElType.NestViewTable == compConfig.type" :opt-perm="FormElType.NestViewTable == compConfig.type"
        v-model:relation="compConfig.relation" @update:relation="onConfigUpdate">
        <FcCascade v-if="FieldBindType.Cascade == compConfig.defValueType || FieldBindType.Cascade == compConfig.listType ||
          FormElType.NestViewTable == compConfig.type" @openCascadeDialog="openCascadeDialog"
          :edit="compConfig.cascadeFilters?.length > 0" />
      </FcRelation>
      <FcFormula v-if="FieldBindType.Formula == compConfig.defValueType" :i="currSelectCompId"
        @updateConfig="onConfigUpdate" />
      <FcFillMap v-if="FormElType.FeDataSelect == compConfig.type" @openFillMapDialog=openFillMapDialog
        :edit="compConfig.mapFields?.length > 0" />
      <template v-if="![FormElType.FeDivider, FormElType.FeSequenceId].includes(compConfig.type)">
        <span class="font-semibold">校验</span>
        <NCheckbox v-model:checked="compConfig.required" size="small" @click="onConfigUpdate" key="required">必填
        </NCheckbox>
        <NCheckbox v-if="[FormElType.FeText, FormElType.FeNumber].includes(compConfig.type)"
          v-model:checked="compConfig.unique" size="small" @click="onConfigUpdate" key="unique">值唯一</NCheckbox>
      </template>
      <FcSequenceId v-if="FormElType.FeSequenceId === compConfig.type" v-model:sequence-rule="compConfig.sequenceRule"
        @update:sequenceRule="onConfigUpdate" :i="compConfig.i"></FcSequenceId>
      <template
        v-if="currModuleNode!.type == 'form' && ![FormElType.FeDivider, FormElType.FeSequenceId].includes(compConfig.type)">
        <span class="font-semibold">字段权限</span>
        <NCheckbox v-model:checked="compConfig.viewPerm" size="small" @update:checked="updateViewPerm" key="viewPerm">可见
        </NCheckbox>
        <NCheckbox v-model:checked="compConfig.editPerm" size="small" @update:checked="updateEditPerm" key="editPerm">
          可编辑</NCheckbox>
        <FcCascadeDialog
          v-if="FieldBindType.Cascade == compConfig.defValueType || FieldBindType.Cascade == compConfig.listType ||
            FormElType.NestViewTable == compConfig.type || FormElType.FeDataSelect == compConfig.type ||
            FieldBindType.Cascade == compConfig.defValueType || [FieldBindType.Relation, FieldBindType.Cascade].includes(compConfig.listType)"
          ref="refCascadeDialog" @updateConfig="onConfigUpdate" />
        <FcFillMapDialog v-if="FormElType.FeDataSelect == compConfig.type" ref="refFillMapDialog"
          @updateConfig="onConfigUpdate" />
      </template>
      <FcDivider v-if="FormElType.FeDivider == compConfig.type" v-model:ddStyle="compConfig.style"
        @updateConfig="onConfigUpdate" />
    </NFlex>
  </NFlex>
  <NFlex v-else class="text-gray w-full" justify="center">未选中任何组件</NFlex>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { FormatType, FormElType, FieldBindType, FormElTypeCn } from '@/enum';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
});

const { updateCompConfig, compConfigs, currSelectCompId, currModuleNode } = useModuleInject();

const compConfig = ref();
const refCascadeDialog = ref();
const refFillMapDialog = ref();

const openFillMapDialog = () => {
  refFillMapDialog.value.show();
}
const openCascadeDialog = () => {
  refCascadeDialog.value && refCascadeDialog.value.show();
}
const updateViewPerm = (checked: boolean) => {
  if (!checked) {
    compConfig.value.editPerm = false;
  }
  onConfigUpdate();
}
const updateEditPerm = (checked: boolean) => {
  if (checked) {
    compConfig.value.viewPerm = true;
  }
  onConfigUpdate();
}

const onConfigUpdateListItems = () => {
  const selectItems = compConfig.value.listItems.filter((v: Meta.ListItem) => v.selected).map((v: Meta.ListItem) => ({ uid: v.value, name: v.label }));
  if (compConfig.value.type == FormElType.FeCheckboxGroup) { // 多选时checkbox
    // 多选，设置默认值
    if (selectItems?.length > 0) {
      compConfig.value.fieldValue = selectItems;    // 值：对象数组
    }
  } else {    // 单选时radiobox
    // 单选，设置默认值
    if (selectItems?.length > 0) {
      compConfig.value.fieldValue = selectItems[0];   // 值对象；selectItems为数组
    }
  }
  onConfigUpdate();
}

// 列表项类型下拉切换；需要重置未选类型；
const onConfigUpdateSelectType = (type: string) => {
  if (type === FieldBindType.Custom) {
    compConfig.value.relation = {
      module_id: '',
      moduleConfig_id: '',
      collName: '',
      fieldName: null,
      sortFieldName: null,
      descSort: false,
    };
    compConfig.value.cascadeFilters.length = 0;
  }
  onConfigUpdate();
}

// 修改默认值
const onConfigUpdateDefValue = (value: any) => {
  compConfig.value.defValue = value;
  onConfigUpdate();
}

// 默认值下拉切换；需要重置未选类型；
const onConfigUpdateDefType = (type: string) => {
  if (type === FieldBindType.Custom || type === FieldBindType.CurrentValue) {
    compConfig.value.formula = null;
    compConfig.value.relation = {
      module_id: '',
      moduleConfig_id: '',
      collName: '',
      fieldName: null,
      sortFieldName: null,
      descSort: false,
    };
  }
  onConfigUpdate();
}


// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watchEffect(() => {
  if (Array.isArray(compConfigs)) {
    const comp = compConfigs.find((item) => item.i === currSelectCompId?.value);
    if (comp) {
      compConfig.value = comp;
    }
  }
});

// 值修改后提交更新
const onConfigUpdate = () => {
  // 添加组件时需要默认值的属性都要初始化，此处不再处理；
  updateCompConfig && updateCompConfig(compConfig.value);
}

</script>
