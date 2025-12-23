<template>
  <ModalDialog @onOkClick="onOkClick" ref="refModal" title="流转条件设置" modal-class="w-160" :footer="true"
    :buttons="['cancel', 'ok']">
    <NFlex vertical class="h-100 p-4" align="center">
      <NFlex class="w-full" align="center" :size="0">
        <span>满足以下</span>
        <NSelect v-model:value="currLogicOpt" :bordered="false" class="w-18" size="small" placeholder=""
          :options="logicOptions" />
        <span>流转条件</span>
      </NFlex>
      <NFlex class="w-full" :size="0">
        <span class="w-86">条件字段</span>
        <span class="w-40">流转条件值</span>
        <ButtonIcon @click="onAddClick" icon="mdi:plus" title="添加条件" size="small" type="info" level="" />
      </NFlex>
      <NFlex class="w-full" :size="0" align="center">
        <template v-for="(c, index) in canditions">
          <NFlex class="w-full mb-2 mr-4" :size="0" align="center">
            <NSelect class="w-50" v-model:value="c.fieldName" :render-label="renderLabel" size="small"
              placeholder="选择字段" :options="canditFields"
              @update-value="(value: string, option: any) => onCanditFieldSelect(value, option, c)" />
            <NSelect v-model:value="c.comparison" :bordered="false" class="w-36" size="small" placeholder=""
              :options="initComparisons(c.fieldType)" />
            <template v-if="![BaseComparOpt.Null, BaseComparOpt.NotNull].includes(c.fieldType as BaseComparOpt)">
              <NInputNumber v-if="c.fieldType == FormElType.FeNumber" v-model:value="c.value" :readonly="!c.fieldType"
                clearable class="w-50 flex-1" size="small" placeholder="" />
              <NDatePicker v-else-if="c.fieldType == FormElType.FeDatetime" v-model:value="c.value"
                :readonly="!c.fieldType" type="date" class="w-50 flex-1" size="small" placeholder="" />
              <NInput v-else v-model:value="c.value" :readonly="!c.fieldType" clearable class="w-50 flex-1" size="small"
                placeholder="" />
            </template>
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
import { ref, h, watch, onMounted } from 'vue';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { MathOptOptions, StringOptOptions, BaseComparOpt, FormElType, FormElTypeIcon, LogicOpt } from '@/enum';
import IconTag from '@/components/advanced/tag-icon.vue';

interface Props {
  canditions: Array<Meta.Candition>
}

const props = withDefaults(defineProps<Props>(), {
  canditions: () => []
});

interface Emits {
  (e: 'updateFlow'): void;
}
const emit = defineEmits<Emits>();

const { currSelectFlowEl, compConfigs } = useModuleInject();

const refModal = ref();
const canditFields = ref([] as any);
const currLogicOpt = ref(LogicOpt.AND);
const logicOptions = ref([
  { label: '所有', value: LogicOpt.AND },
  { label: '任一', value: LogicOpt.OR }
])
const currComp = ref();

const renderLabel = (option: any, selected: boolean) => {
  return h(IconTag, { icon: FormElTypeIcon[option.type as FormElType], title: option.label });
}

const initComparisons = (type: string) => {
  if (type) {
    if (FormElType.FeNumber == type || FormElType.FeDatetime == type) {
      return MathOptOptions;
    } else {
      return StringOptOptions;
    }
  } else {
    return [{ label: '等于', value: 'equal' }]
  }

}
const initData = async () => {
  canditFields.value = compConfigs?.filter((c: Meta.CompBase) =>
    c.nodeUid == 0 && !c.type.startsWith(FormElType.Nest)
  ).map((c: Meta.CompBase) => ({
    label: c.title,
    value: c.fieldName,
    type: c.type,
    comp: c
  }))
  // 初始化条件值

}

const init = async () => {

  initData();
}

const onCanditFieldSelect = (value: string, option: any, candit: Meta.Candition) => {
  currComp.value = option.comp;
  candit.fieldName = option.value;
  candit.fieldType = option.type;
}

const onDeleteClick = (index: number) => {
  props.canditions.splice(index, 1);
}

const onAddClick = () => {
  props.canditions.push({
    fieldName: null,
    fieldType: '',
    comparison: BaseComparOpt.Equal,
    value: null,
    logicalOpt: ''
  })
}

const onOkClick = () => {
  const reuslt = props.canditions.filter((v: Meta.Candition) => v.fieldName != null)
  if (reuslt?.length > 0) {
    reuslt?.forEach((c: Meta.Candition) => c.logicalOpt == currLogicOpt.value)
    emit('updateFlow');
    refModal.value.show(false);
  } else {
    if (props.canditions?.length == 0) {
      refModal.value.show(false);
    } else {
      window.$message?.warning('请完成输入或删除不需要的条件！');
    }
  }
}

onMounted(() => {
  init();
})

const show = () => {
  refModal.value.show(true);
}

defineExpose({
  show
})
</script>
