<template>
  <ModalDialog @onOkClick="onOkClick" @onCancelClick="onCancelClick" ref="refModal" title="数据同步设置"
    modal-class="w-178 select-none" :footer="true" :buttons="['cancel', 'ok']">
    <SmoothScrollbar class="pb-4 py-4 px-6">
      <NFlex vertical class="h-140" align="start" justify="start" :size="0">
        <NFormItem label-placement="left" class="w-160 border-b-1 mb-2">
          <span class="w-35 font-bold flex">节点名称<p class="text-red-600">*</p></span>
          <NInput size="small" v-model:value="dataSync.name"></NInput>
        </NFormItem>
        <NFormItem label-placement="left" class="w-160">
          <span class="w-35 font-bold flex">触发方式<p class="text-red-600">*</p></span>
          <NSelect :disabled="true" :options="triggerTypeOptions" v-model:value="dataSync.triggerType" size="small">
          </NSelect>
        </NFormItem>
        <NFormItem label-placement="left" class="w-160">
          <span class="w-35 font-bold flex">触发表单<p class="text-red-600">*</p></span>
          <!-- <NInput :disabled="true" size="small" :value="dataSync.triggerForm.name"></NInput> -->
          <FromTreeSelect :disabled="true" v-model="dataSync.triggerForm" :options="formList" class="w-full"
            size="small" placeholder="" />
        </NFormItem>
        <NFormItem label-placement="left" class="w-160">
          <span class="w-35 font-bold flex">触发时机<p class="text-red-600">*</p></span>
          <NSelect multiple :options="triggerTimingOptions" v-model:value="dataSync.triggerAction" size="small">
          </NSelect>
        </NFormItem>
        <NFlex class="w-full mb-2" :size="0" align="center">
          <span class="w-29 font-bold">触发条件</span>
          <span class="w-22">触发数据满足</span>
          <NSelect :options="logicOpt" v-model:value="dataSync.triggerConditCombiType" :bordered="false" class="w-18"
            size="small" placeholder="" />
          <span class="w-66">条件后触发后续事件</span>
          <NPopselect v-model:value="triggerFieldValues" @update-value="selectTriggerFields" multiple
            :options="triggerFieldList" trigger="click" placement="bottom-end" scrollable>
            <NButton size="small" type="info" text>
              <SvgIcon icon="mdi:plus" class="text-base" />
              添加触发条件
            </NButton>
          </NPopselect>
        </NFlex>
        <NFlex class="w-full pl-29 mb-2" :size="0" align="center">
          <template v-for="(condit, index) in dataSync.triggerCondition">
            <NFlex class="w-fit mb-2" :size="0" align="center">
              <NSelect class="w-50" v-model:value="condit.preFieldName" :render-label="renderLabel" size="small"
                placeholder="选择条件字段" :options="triggerFieldList" :show-arrow="false" :show="false" />
              <NSelect v-model:value="condit.operator" :bordered="false" class="w-31" size="small" placeholder=""
                :options="comparisons" />
              <NInputNumber v-if="FormElType.FeNumber == condit.preFieldType" class="w-50!"
                v-model:value="condit.valueFieldValue" size="small" placeholder="请输入数字" />
              <NDatePicker v-else-if="FormElType.FeDatetime == condit.preFieldType" class="w-50!"
                v-model:value="condit.valueFieldValue" size="small" placeholder="请输入日期" />
              <NSelect v-else-if="ElTypeGroup.arrayTypes.includes(condit.preFieldType as any)" class="w-50!"
                v-model:value="condit.valueFieldValue" size="small" filterable multiple tag placeholder="回车可输入多个"
                :show-arrow="false" :show="false" />
              <NInput v-else class="w-50!" v-model:value="condit.valueFieldValue" size="small" placeholder="请输入文本" />
              <NButton @click="deleteTriggerConditions(index, condit.preFieldName)" text class="text-gray-500 ml-1"
                size="small">
                <SvgIcon icon="mdi:trash-can-outline" class="text-xl"/>
              </NButton>
            </NFlex>
          </template>
        </NFlex>
        <NFlex class="w-fit pt-2 border-t-1" :size="0" align="center">
          <NFormItem label-placement="left" class="w-160">
            <span class="w-35 font-bold flex">目标表单<p class="text-red-600">*</p></span>
            <FromTreeSelect v-model="dataSync.updateForm" @update:value="updateBindFormSelect" :options="formList"
              class="w-full" size="small" placeholder="选择表单" />
          </NFormItem>
        </NFlex>
        <NFlex class="w-fit" :size="0" align="center">
          <NFormItem label-placement="left" class="w-160">
            <span class="w-35 font-bold flex">同步类型<p class="text-red-600">*</p></span>
            <NSelect :options="syncTypeOption" v-model:value="dataSync.updateAction" @update-value="selectSyncType"
              size="small" placeholder="选择事件类型" />
          </NFormItem>
        </NFlex>
        <NFlex v-if="'add' != dataSync.updateAction" class="w-full mb-2" :size="0" align="center">
          <span class="w-29 font-bold flex">表单数据筛选<p class="text-red-600">*</p></span>
          <span class="w-8">满足</span>
          <NSelect :options="logicOpt" v-model:value="dataSync.updateFilterCombiType" :bordered="false" class="w-18"
            size="small" placeholder="" />
          <span class="w-24">条件</span>
          <NFlex :size="0" class="w-43 mr-13">
            <NCheckbox v-if="'edit' == mapTabValue" v-model:checked="dataSync.upsert">
              筛选无匹配结果时新增
            </NCheckbox>
          </NFlex>
          <NPopselect v-model:value="formFieldFilterValues" @update-value="selectFormFilterFields" multiple
            :options="targetFormFieldList" trigger="click" placement="bottom-end" scrollable>
            <NButton size="small" type="info" text>
              <SvgIcon icon="mdi:plus" class="text-base" />
              添加筛选条件
            </NButton>
          </NPopselect>
        </NFlex>
        <NFlex class="w-full mb-2 pl-29" :size="0" align="center">
          <template v-for="(filter, index) in dataSync.updateFilter">
            <NFlex class="w-fit mb-2  " :size="0" align="center">
              <NSelect class="w-50" v-model:value="filter.preFieldName" :render-label="renderLabel" size="small"
                placeholder="选择字段" :options="targetFormFieldList" :show-arrow="false" :show="false" />
              <NSelect v-model:value="filter.operator" :bordered="false" class="w-31" size="small" placeholder=""
                :options="comparisons" />
              <NInputGroup class="w-50">
                <NPopselect v-model:value="filter.valueType" :options="inputTypeList"
                  :render-label="renderInputTypeLabel" trigger="click"
                  @update:value="(value, option) => selectValueType(filter, value, option)">
                  <NButton size="small">
                    <SvgIcon :icon="inputTypeList.find((t: any) => t.value == filter.valueType)?.icon!" />
                  </NButton>
                </NPopselect>
                <NSelect v-if="'bind' == filter.valueType" class="w-50" v-model:value="filter.valueFieldValue"
                  :render-label="renderLabel" size="small" placeholder="选择字段" :options="triggerFieldList"
                  @update:value="(value, option) => updateFormFilterValue(filter, value, option)" />
                <template v-else-if="'custom' == filter.valueType">
                  <NInputNumber v-if="FormElType.FeNumber == filter.preFieldType" class="w-50"
                    v-model:value="filter.valueFieldValue" size="small" placeholder="请输入数字" />
                  <NDatePicker v-else-if="FormElType.FeDatetime == filter.preFieldType" class="w-50"
                    v-model:value="filter.valueFieldValue" size="small" placeholder="请输入日期" />
                  <NSelect v-else-if="ElTypeGroup.arrayTypes.includes(filter.preFieldType as any)" class="w-50"
                    v-model:value="filter.valueFieldValue" size="small" filterable multiple tag placeholder="回车可输入多个"
                    :show-arrow="false" :show="false" />
                  <NInput v-else class="w-50" v-model:value="filter.valueFieldValue" size="small" placeholder="请输入文本" />
                </template>
              </NInputGroup>
              <NButton @click="deleteFormFilter(index, filter.preFieldName)" text class="text-gray-500 ml-1"
                size="small">
                <SvgIcon icon="mdi:trash-can-outline" class="text-xl"/>
              </NButton>
            </NFlex>
          </template>
        </NFlex>
        <template v-if="'delete' != dataSync.updateAction">
          <NFlex class="w-fit border-t-1 pt-2" :size="0" align="center">
            <span class="w-29 font-bold flex">同步字段设置<p class="text-red-600">*</p></span>
            <NFlex class="w-fit border-b-1" :size="0" align="center">
              <NFlex class="w-131 h-8" :size="0" align="center" justify="space-between">
                <NTabs v-model:value="mapTabValue" :key="mapTabKey" size="small" type="line" animated class="w-105">
                  <NTab v-if="'edit' == dataSync.updateAction" name="edit">修改数据</NTab>
                  <NTab v-if="'add' == dataSync.updateAction || dataSync.upsert" name="add">新增数据</NTab>
                </NTabs>
                <NFlex :size="0" align="center" justify="end" class="flex-1">
                  <NPopselect v-if="'edit' == mapTabValue" v-model:value="editFormFieldValues"
                    @update-value="selectFormUpdateFields" multiple :options="targetFormFieldList" trigger="click"
                    placement="bottom-end" scrollable>
                    <NButton size="small" type="info" text>
                      <SvgIcon icon="mdi:plus" class="text-base" />
                      添加同步字段
                    </NButton>
                  </NPopselect>
                </NFlex>
              </NFlex>
            </NFlex>
          </NFlex>
          <NFlex class="w-full pt-2 pl-29" :size="0" align="center">
            <template v-if="'edit' == mapTabValue" v-for="(condit, index) in dataSync.updateFieldMap">
              <NFlex class="w-fit mb-2" :size="0" align="center">
                <NSelect class="w-50" v-model:value="condit.preFieldName" :render-label="renderLabel" size="small"
                  placeholder="选择字段" :options="targetFormFieldList" :show-arrow="false" :show="false" />
                <span class="w-7 ml-4">=</span>
                <NInputGroup class="w-70">
                  <NPopselect v-model:value="condit.valueType" :options="inputTypeList"
                    :render-label="renderInputTypeLabel" trigger="click"
                    @update:value="(value, option) => selectValueType(condit, value, option)">
                    <NButton size="small">
                      <SvgIcon :icon="inputTypeList.find((t: any) => t.value == condit.valueType)?.icon!" />
                    </NButton>
                  </NPopselect>
                  <NSelect v-if="'bind' == condit.valueType" class="w-70" v-model:value="condit.valueFieldValue"
                    :render-label="renderLabel" size="small" placeholder="选择字段" :options="triggerFieldList"
                    @update:value="(value, option) => updateFormUpdateFieldValue(condit, value, option)" />
                  <template v-else-if="'custom' == condit.valueType">
                    <NInputNumber v-if="FormElType.FeNumber == condit.preFieldType" class="w-50"
                      v-model:value="condit.valueFieldValue" size="small" placeholder="请输入数字" />
                    <NDatePicker v-else-if="FormElType.FeDatetime == condit.preFieldType" class="w-50"
                      v-model:value="condit.valueFieldValue" size="small" placeholder="请输入日期" />
                    <NSelect v-else-if="ElTypeGroup.arrayTypes.includes(condit.preFieldType as any)" class="w-50"
                      v-model:value="condit.valueFieldValue" size="small" filterable multiple tag placeholder="回车可输入多个"
                      :show-arrow="false" :show="false" />
                    <NInput v-else class="w-50" v-model:value="condit.valueFieldValue" size="small"
                      placeholder="请输入文本" />
                  </template>
                </NInputGroup>
                <NButton @click="deleteUpdateField(index, condit.preFieldName)" text class="text-gray-500 ml-1"
                  size="small">
                  <SvgIcon icon="mdi:trash-can-outline" class="text-xl"/>
                </NButton>
              </NFlex>
            </template>
            <template v-else v-for="(condit, index) in dataSync.addFieldMap">
              <NFlex class="w-fit mb-2" :size="0" align="center">
                <NSelect tag class="w-50" v-model:value="condit.preFieldName" :render-label="renderLabel" size="small"
                  placeholder="选择字段" :options="targetFormFieldList" :show-arrow="false" :show="false" />
                <span class="w-7 ml-4">=</span>
                <NInputGroup class="w-70">
                  <NPopselect v-model:value="condit.valueType" :options="inputTypeList"
                    :render-label="renderInputTypeLabel" trigger="click"
                    @update:value="(value, option) => selectValueType(condit, value, option)">
                    <NButton size="small">
                      <SvgIcon :icon="inputTypeList.find((t: any) => t.value == condit.valueType)?.icon!" />
                    </NButton>
                  </NPopselect>
                  <NSelect v-if="'bind' == condit.valueType" class="w-70" v-model:value="condit.valueFieldValue"
                    :render-label="renderLabel" size="small" placeholder="选择字段" :options="triggerFieldList"
                    @update:value="(value, option) => updateFormAddFieldValue(condit, value, option)" />
                  <template v-else-if="'custom' == condit.valueType">
                    <NInputNumber v-if="FormElType.FeNumber == condit.preFieldType" class="w-50"
                      v-model:value="condit.valueFieldValue" size="small" placeholder="请输入数字" />
                    <NDatePicker v-else-if="FormElType.FeDatetime == condit.preFieldType" class="w-50"
                      v-model:value="condit.valueFieldValue" size="small" placeholder="请输入日期" />
                    <NSelect v-else-if="ElTypeGroup.arrayTypes.includes(condit.preFieldType as any)" class="w-50"
                      v-model:value="condit.valueFieldValue" size="small" filterable multiple tag placeholder="回车可输入多个"
                      :show-arrow="false" :show="false" />
                    <NInput v-else class="w-50" v-model:value="condit.valueFieldValue" size="small"
                      placeholder="请输入文本" />
                  </template>
                </NInputGroup>
              </NFlex>
            </template>
          </NFlex>
          <template v-if="'edit' == mapTabValue">
            <NFlex class="w-fit mb-2 border-t-1 mt-4 pt-2 ml-29" :size="0" align="center">
              <span class="w-50">设置嵌套多条数据的关联条件</span>
              <NFlex :size="0" class="w-43 mr-13">
                <NCheckbox v-if="'edit' == mapTabValue" v-model:checked="dataSync.nestUpsert">
                  关联无匹配结果时新增
                </NCheckbox>
              </NFlex>
              <NPopselect v-model:value="formFieldRelationValues" @update-value="selectFormRelationFields" multiple
                :options="targetFormFieldList.filter((f: ListOption) => f.nestTable)" trigger="click" placement="bottom-end" scrollable>
                <NButton size="small" type="info" text>
                  <SvgIcon icon="mdi:plus" class="text-base" />
                  添加关联条件
                </NButton>
              </NPopselect>
            </NFlex>
            <NFlex class="w-full pl-29" :size="0" align="center">
              <template v-for="(condit, index) in dataSync.editRelation">
                <NFlex class="w-fit mb-2" :size="0" align="center">
                  <NSelect class="w-50" v-model:value="condit.preFieldName" :render-label="renderLabel" size="small"
                    placeholder="选择字段" :options="targetFormFieldList" :show-arrow="false" :show="false" />
                  <span class="w-7 ml-4">=</span>
                  <NSelect class="w-70" v-model:value="condit.valueFieldValue" :render-label="renderLabel" size="small"
                    placeholder="选择字段" :options="triggerFieldList"
                    @update:value="(value, option) => updateRelationFormFieldValue(condit, value, option)" />
                  <NButton @click="deleteFormRelationField(index, condit.preFieldName)" text class="text-gray-500 ml-1"
                    size="small">
                    <SvgIcon icon="mdi:trash-can-outline" class="text-xl"/>
                  </NButton>
                </NFlex>
              </template>
            </NFlex>
          </template>
        </template>
      </NFlex>
    </SmoothScrollbar>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, h, toRaw, Ref, computed, nextTick } from 'vue';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { fetchGetModuleConfig, fetchUpdateModuleDataSync } from '@/service/api';
import { BaseComparOpt, ElTypeGroup, EventType, EventTypeName, FormElType, FormElTypeIcon, LogicOpt, TriggerType, TriggerTypeName } from '@/enum';
import IconTag from '@/components/advanced/tag-icon.vue';
import { isEmpty, merge, remove } from 'radashi';
import { without } from 'lodash-es';
import { getAllModuleTree } from '@/service/api';
import { useRoute } from 'vue-router';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'refresh'): void;
}
const emit = defineEmits<Emits>();
const { currModuleNode, compConfigs } = useModuleInject();

interface ListOption extends Meta.Option {
  nestTable?: {
    title: string,
    fieldName: string
  }
}

const dataSync = ref<Meta.DataSync>({} as any)

const inputTypeList = ref([
  { value: 'bind', label: '字段值', icon: 'mdi:form-select' },
  { value: 'custom', label: '自定义', icon: 'mdi:square-edit-outline' },
  { value: 'null', label: '空值', icon: 'mdi:null' },
])
const renderInputTypeLabel = (option: any) => {
  return h('div', { style: 'display: flex; align-items: center; gap: 4px' }, [
    h(SvgIcon, { icon: option.icon }),
    option.label
  ])
}
const comparisons = ref([
  { label: '等于', value: BaseComparOpt.Equal },
  { label: '不等于', value: BaseComparOpt.NotEqual },
  { label: '为空', value: BaseComparOpt.Null },
  { label: '不为空', value: BaseComparOpt.NotNull },
])
const triggerTypeOptions = [
  { value: TriggerType.Form, label: TriggerTypeName[TriggerType.Form] },
  { value: TriggerType.Schedule, label: TriggerTypeName[TriggerType.Schedule] },
  { value: TriggerType.Http, label: TriggerTypeName[TriggerType.Http] },
  { value: TriggerType.Button, label: TriggerTypeName[TriggerType.Button] },
];
const triggerTimingOptions = ref([] as any)
const syncTypeOption = [
  { value: EventType.Add, label: EventTypeName[EventType.Add] },
  { value: EventType.Edit, label: EventTypeName[EventType.Edit] },
  { value: EventType.Delete, label: EventTypeName[EventType.Delete] },
]
const logicOpt = [
  { value: LogicOpt.AND, label: '所有' },
  { value: LogicOpt.OR, label: '任一' }
]
const mapTabValue = ref(dataSync.value?.updateAction);
const mapTabKey = ref(0);
const route = useRoute();
const refModal = ref();

const triggerFieldValues = ref([] as any);   // 触发表单字段列表
// 触发更新的表单包含的字段列表
const triggerFieldList = computed(() => {
  let list = [] as any;
  if (compConfigs) {
    // 嵌套表格类型需要特殊处理:子元素添加父组件fieldName
    const nestTables = {} as any; // nestUid: comp
    compConfigs.filter((c: Meta.CompBase) => FormElType.NestEditTable == c.type)
      .map((c: any) => {
        const { nestUid, fieldName, title } = c;
        nestTables[nestUid[0]] = { fieldName, title };
      })
    for (let c of compConfigs) {
      // 过滤不可映射值的类型；
      if (!ElTypeGroup.notMapTypes.includes(c.type as any)) {
        list.push({
          label: c.title,
          value: c.fieldName,
          type: c.type,
          nestTable: c.nodeUid != 0 ? nestTables[c.nodeUid!] : null
        })
      }
    }
  }
  return list;
});
// const bindFormKey = ref('');
const formList = ref([] as any);    // 所有表单列表
const targetFormFieldList = ref([] as any);   // 目标表单字段列表
const editFormFieldValues = ref();      // 表单修改需要更新的字段选中值
const formFieldFilterValues = ref([] as any);    // 表单筛选条件选中值
const formFieldRelationValues = ref([] as any);   // 表单修改关联条件值；

const renderLabel = (option: any, selected: boolean) => {
  return h(IconTag, { icon: FormElTypeIcon[option.type as FormElType], title: option.label });
}

const getFormList = async () => {
  const appId = route.query.app_id?.toString();
  const result = await getAllModuleTree(appId, ['form', 'flow']);
  if (result) {
    formList.value = result[0].children;
    // 下拉菜单创建后添加 currFormBind 显示名称实现模块名称同步,
    // dataBind 不存名称，关联：currFormBind.node.moduleConfig_id == props.dataBind.moduleConfig_id
    // props.dataBind?.moduleConfig_id && (currFormBind.value = formOptions.value.find((o: any) => o.node.moduleConfig_id == props.dataBind.moduleConfig_id));
  }
}

const optionMapList = (option: any) => {
  // 同步过滤条件
  const conditions: Array<Meta.ConditionConfig> = option.map((o: ListOption) => ({
    combinationType: 'and',
    preParentName: o.nestTable?.fieldName,
    preFieldName: o.value,
    preFieldType: o.type,
    operator: 'equal',
    valueParentName: null,
    valueType: 'bind',
    valueFieldValue: null,
    valueFieldType: null
  }))
  return conditions;
}

// 触发条件选择
const selectTriggerFields = (value: any, option: any) => {
  const selectedList = optionMapList(option);
  // todo: radashi merge会用后边对象更新前面关联对象的属性；重新确认需求实现用radashi是否合理正确；
  dataSync.value.triggerCondition = merge(selectedList, toRaw(dataSync.value.triggerCondition), (f) => f.preFieldName);

}

// 选择同步类型
const selectSyncType = (value: any, option: any) => {
  mapTabKey.value++
  if ('edit' != value) {
    dataSync.value.upsert = false;
    if ('add' == value) {
      dataSync.value.updateFilter.length = 0;
    }
  }

  mapTabValue.value = value;
}

// 表单筛选条件选择
const selectFormFilterFields = (value: any, option: any) => {
  const selectedList = optionMapList(option)
  dataSync.value.updateFilter = merge(selectedList, toRaw(dataSync.value.updateFilter), (f) => f.preFieldName);
}

// 表单修改映射字段选择
const selectFormUpdateFields = (value: any, option: any) => {
  const selectedList = optionMapList(option);
  dataSync.value.updateFieldMap = merge(selectedList, toRaw(dataSync.value.updateFieldMap), (f) => f.preFieldName);
}

// 表单修改映射字段关联条件选择
const selectFormRelationFields = (value: any, option: any) => {
  const selectedList = optionMapList(option)
  dataSync.value.editRelation = merge(selectedList, toRaw(dataSync.value.editRelation), (f) => f.preFieldName);
}

const initTargetFormField = async (moduleId: string) => {
  // 初始化pre字段列表；根据id查询compConfigs
  let list = [] as any;
  const result = await fetchGetModuleConfig(moduleId);
  if ('ok' == result.msg && result.data?.length == 1) {
    // 嵌套表格类型需要特殊处理:子元素添加父组件fieldName
    const nestTables = {} as any; // nestUid: comp
    result.data[0].compConfigs?.filter((c: Meta.CompBase) => FormElType.NestEditTable == c.type)
      .map((c: any) => {
        const { nestUid, fieldName, title } = c;
        nestTables[nestUid[0]] = { fieldName, title };
      })

    // 初始化【更新表单】字段列表；嵌套字段不支持直接配置，嵌套表格子字段可直接配置；
    for (let d of result.data[0].compConfigs) {
      if (!ElTypeGroup.notMapTypes.includes(d.type)) {  // 过滤不可映射值的类型
        list.push({
          label: d.title,
          value: d.fieldName,
          type: d.type,
          nestTable: d.nodeUid != 0 ? nestTables[d.nodeUid!] : null
        })
      }
    }
  }
  return list;
}

const initDataBind = async (node: any) => {
  // 清空表单筛选条件、表单字段映射；
  dataSync.value.updateFilter.length = 0;
  dataSync.value.updateFieldMap.length = 0;
  dataSync.value.addFieldMap.length = 0;
  dataSync.value.editRelation.length = 0;
  // 获取目标集合名称
  let collName = null;
  if (node?.moduleConfig_id) {
    const findResult = await fetchGetModuleConfig(node.moduleConfig_id);
    if ('ok' == findResult.msg && findResult.data?.length == 1) {
      collName = findResult.data[0].formConfig.collName;
    }
  }
  dataSync.value.updateConfig = { _id: node?._id, name: node?.name, moduleConfig_id: node?.moduleConfig_id, collName };
  // 初始化pre字段列表；根据id查询compConfigs
  const list = await initTargetFormField(node.moduleConfig_id!);
  if (list?.length > 0) {
    targetFormFieldList.value = list;
    list?.forEach((d: ListOption) => {
      if (!ElTypeGroup.notMapTypes.includes(d.type as any)) {  // 过滤不可映射值的类型
        dataSync.value.addFieldMap.push({
          combinationType: 'and',
          preParentName: d.nestTable?.fieldName,
          preFieldName: d.value,
          preFieldType: d.type,
          operator: 'equal',
          valueParentName: null,
          valueType: 'bind',
          valueFieldValue: null,
          valueFieldType: null
        })
      }
    })
  }
}


const init = async (item?: Meta.DataSync) => {
  await getFormList();
  if ('flow' == currModuleNode?.value.type) {
    // todo: 后续逐步扩展，当前只有【流程完成时】
    triggerTimingOptions.value = [
      { value: EventType.FlowComplete, label: EventTypeName[EventType.FlowComplete] + '时' },
    ]
  } else {
    triggerTimingOptions.value = [
      { value: EventType.Add, label: EventTypeName[EventType.Add] + '时' },
      { value: EventType.Edit, label: EventTypeName[EventType.Edit] + '时' },
      { value: EventType.Delete, label: EventTypeName[EventType.Delete] + '时' },
    ]
  }
  if (item) {
    targetFormFieldList.value = await initTargetFormField(item.updateConfig.moduleConfig_id);
    // 字段变动后新增映射暂不更新，避免无法识别原有配置；后续可增加【重置】按钮，或删除重配置；
    dataSync.value = item;
    mapTabValue.value = dataSync.value.updateAction;    // 初始化tab选中状态
    // 添加触发条件 选中值初始化
    triggerFieldValues.value = dataSync.value.triggerCondition.map((f: Meta.ConditionConfig) => f.preFieldName);
    // 添加筛选条件 选中值初始化
    formFieldFilterValues.value = dataSync.value.updateFilter.map((f: Meta.ConditionConfig) => f.preFieldName);
    // 添加同步字段 选中值初始化
    editFormFieldValues.value = dataSync.value.updateFieldMap.map((f: Meta.ConditionConfig) => f.preFieldName);
    // 添加关联条件 选中值初始化
    formFieldRelationValues.value = dataSync.value.editRelation.map((f: Meta.ConditionConfig) => f.preFieldName);
    // console.log(dataSync.value)

    // 依据表单元数据实时初始化列表；
    // 依据dataSync存储内容初始化字段值
  } else {
    // 添加触发条件 选中值初始化
    triggerFieldValues.value = [];
    // 添加筛选条件 选中值初始化
    formFieldFilterValues.value = [];
    // 添加同步字段 选中值初始化
    editFormFieldValues.value = [];
    // 添加关联条件 选中值初始化
    formFieldRelationValues.value = [];
    dataSync.value = {
      uid: undefined,
      name: currModuleNode?.value.name + '数据同步',
      enable: false,
      triggerType: 'form',
      triggerForm: currModuleNode?.value._id || '',
      triggerConfig: { _id: currModuleNode?.value._id, name: currModuleNode?.value.name },
      triggerAction: [triggerTimingOptions.value[0].value],
      triggerConditCombiType: 'and',
      triggerCondition: [],
      updateForm: undefined,
      updateConfig: null,
      updateAction: 'add',
      updateFilterCombiType: 'and',
      updateFilter: [],
      upsert: false,
      addFieldMap: [],
      updateFieldMap: [],
      editRelation: [],
      nestUpsert: false
    }
  }
}

// 更新表单绑定
const updateBindFormSelect = async (value: any, option: any) => {
  await initDataBind(option.node);
  //
  // console.log(dataSync.value.addFieldMap)
}

const deleteTriggerConditions = (index: number, preFieldName: string) => {
  triggerFieldValues.value = without(triggerFieldValues.value, preFieldName);
  dataSync.value.triggerCondition.splice(index, 1);
}

const deleteFormFilter = (index: number, preFieldName: string) => {
  formFieldFilterValues.value = without(formFieldFilterValues.value, preFieldName);
  dataSync.value.updateFilter.splice(index, 1);
}

const deleteUpdateField = (index: number, preFieldName: string) => {
  editFormFieldValues.value = without(editFormFieldValues.value, preFieldName);
  dataSync.value.updateFieldMap.splice(index, 1);
}

const deleteFormRelationField = (index: number, preFieldName: string) => {
  formFieldRelationValues.value = without(formFieldRelationValues.value, preFieldName);
  dataSync.value.editRelation.splice(index, 1);
}

// 过滤值字段列表选择
const updateFormFilterValue = (filter: Meta.ConditionConfig, value: any, option: any) => {
  filter.valueFieldType = option.type;
  filter.valueParentName = option.nestTable?.fieldName;
}

// 新增值字段列表选择
const updateFormAddFieldValue = (condit: Meta.ConditionConfig, value: any, option: any) => {
  condit.preFieldType = option.type;
  condit.valueParentName = option.nestTable?.fieldName;
}

// 修改值字段列表选择
const updateFormUpdateFieldValue = (condit: Meta.ConditionConfig, value: any, option: any) => {
  condit.preFieldType = option.type;
  condit.valueParentName = option.nestTable?.fieldName;
}

// 关联值字段列表选择
const updateRelationFormFieldValue = (condit: Meta.ConditionConfig, value: any, option: any) => {
  condit.preFieldType = option.type;
  condit.valueParentName = option.nestTable?.fieldName;
}

// 值类型切换
const selectValueType = (condit: Meta.ConditionConfig, value: any, option: any) => {
  condit.valueFieldValue = null;
}

const submitCheck = async () => {
  // 输入不能为空
  if (isEmpty(dataSync.value.name) || isEmpty(dataSync.value.updateForm)) {
    window.$message?.warning('必填项不能为空！');
    return false;
  }
  if ('add' == dataSync.value.updateAction || dataSync.value.upsert) {
    // 映射字段值至少填写一个
    const notNullValues = dataSync.value.addFieldMap.filter((m: Meta.ConditionConfig) => !isEmpty(m.valueFieldValue));
    if (notNullValues?.length == 0) {
      window.$message?.warning('同步字段值不能全部为空！');
      return false;
    }
  }
  if ('edit' == dataSync.value.updateAction) {
    if (dataSync.value.updateFilter?.length == 0 || dataSync.value.updateFieldMap?.length == 0) {
      window.$message?.warning('筛选条件、同步字段值不能全部为空！');
      return false;
    } else {
      const notNullFilter = dataSync.value.updateFilter.filter((m: Meta.ConditionConfig) => !isEmpty(m.valueFieldValue));
      const notNullFieldMap = dataSync.value.updateFieldMap.filter((m: Meta.ConditionConfig) => !isEmpty(m.valueFieldValue));
      if (notNullFilter?.length == 0 || notNullFieldMap?.length == 0) {
        window.$message?.warning('筛选条件、同步字段值不能全部为空！');
        return false;
      }
    }
  }
  return true;
}

const onOkClick = async () => {
  console.log(toRaw(dataSync.value))
  if (await submitCheck() && currModuleNode?.value.moduleConfig_id) {
    // 提交配置
    const result = await fetchUpdateModuleDataSync(currModuleNode?.value.moduleConfig_id, toRaw(dataSync.value));
    refModal.value.show(false);
    emit('refresh');
  }
}

const onCancelClick = () => {
  // cascadeFilters.value = compConfig.value.cascadeFilters;
}

const show = async (item?: Meta.DataSync) => {
  await init(item);
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>

<style lang="scss" scoped>
:deep(.n-tabs .n-tabs-nav.n-tabs-nav--line-type.n-tabs-nav--top .n-tabs-nav-scroll-content) {
  border-bottom: none;
}
</style>
