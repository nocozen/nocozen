<template>
  <NFormItem v-if="compConfig" :label-width="cptLabelWidth" :label-align="layoutConfig!.labelAlign"
    :label-placement="layoutConfig!.labelPlace" label-style="font-weight: 600" :rule="rule"
    :show-require-mark="compConfig.required">
    <template #label v-if="compConfig.showTitle">
      <NFlex align="center" :size="0" :justify="cptLabelAlign">
        <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" />
        <span>{{ compConfig.title }}</span>
      </NFlex>
    </template>
    <NDynamicTags v-if="compConfig.viewPerm" :render-tag="renderTags"
      v-model:value="tagValue" size="small" :max="20" class="p-1 min-h-8 h-full border-1 border-dashed w-full @container"
      :class="[compConfig.editPerm ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-100/50']" @click="openConfig">
      <template #trigger="{ activate, disabled }">
        <NButton v-if="tagValue?.length == 0 && compConfig.editPerm" class="h-full " text>
          <SvgIcon icon="mdi:plus"/>
          <span class="hidden @[80px]:block">{{ `选择${orgType == 'dept' ? '部门' : '成员'}` }}</span>
        </NButton>
        <OrgMemberChecker ref="refOrg" :multiple="multiple" @onCheckedOk="onOrgMemCheckedOk"></OrgMemberChecker>
      </template>
    </NDynamicTags>
    <NInput v-else  class="min-h-8 h-full border-1 border-dashed w-full" size="small" :bordered="false"
      placeholder="">
      <template #prefix>
        <SvgIcon icon="mingcute--lock-line" />
      </template>
    </NInput>
  </NFormItem>
</template>

<script setup lang="ts">
import { computed, ref, watch, h } from 'vue';
import { NTag } from 'naive-ui';
import AccInfo from '@/components/advanced/acc-info.vue';
import IconTag from '@/components/advanced/tag-icon.vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { FormElType, QbIcon } from '@/enum';
import { getShowLink } from './shared';
import { MemberCheckerType } from '@/enum';

interface Props {
  inst?: any,
  i: string,
  orgType: MemberCheckerType,
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false
});

const refOrg = ref()
const tagValue = ref([] as any);    // { label value tagType? }
const { layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);

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

const rule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator() {
      if (compConfig.value.required && !compConfig.value.fieldValue) {
        return new Error('不能为空')
      }
    }
  }
})

const mapTags = (tags: Array<Meta.Tag>) => {
  return tags.map((d: Meta.Tag) => {
    if (d.avatar) {
      return { _id: d.value, name: d.label, avatar: d.avatar }
    } else {
      return { _id: d.value, name: d.label }
    }
  });
}

const mapTagType = () => {
  if ([FormElType.FeUserSelect, FormElType.FeMulUserSelect].includes(compConfig.value.type)) {
    return 'member'
  } else {
    return 'dept'
  }
}

const init = () => {
  showLink.value = getShowLink(compConfig.value);

  if (props.inst) {
    const value = props.inst[compConfig.value.fieldName];
    if (!value) return;
    if (props.multiple) {
      tagValue.value = props.inst[compConfig.value.fieldName].map((f: Meta.AccBase) => ({
        value: f._id,
        label: f.name,
        type: mapTagType(),
        avatar: f.avatar
      }))
    } else {
      tagValue.value = [{
        value: value._id,
        label: value.name,
        type: mapTagType(),
        avatar: value.avatar
      }];
    }
  } else {
    const value = compConfig.value.fieldValue;
    if (!value) return;
    if (props.multiple) {
      tagValue.value = value.map((f: Meta.AccBase) => ({
        value: f._id,
        label: f.name,
        type: mapTagType(),
        avatar: f.avatar
      }))
    } else {
      tagValue.value = [{
        value: value._id,
        label: value.name,
        type: mapTagType(),
        avatar: value.avatar
      }]
    }
  }
}

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        init();
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

const openConfig = () => {
  if (!compConfig.value.editPerm) return;
  let pgOption: Partial<Meta.ModulePermGroup> = {};   // 兼容权限组配置对话框的处理；
  if ('member' == props.orgType) {
    pgOption = {
      accountAuth: mapTags(tagValue.value)
    }
  } else if ('dept' == props.orgType) {
    pgOption = {
      deptAuth: mapTags(tagValue.value)
    }
  }
  refOrg.value.show([props.orgType], pgOption);
}

const renderTag = (tag: Meta.Tag) => {
  if ('dept' == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple', title: tag.label })
  } else if ('role' == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple-check', title: tag.label })
  } else if ('member' == tag.type) {
    return h(AccInfo, { account: { avatar: tag.avatar as any, name: tag.label as any } })
  }
}

const renderTags = (tag: Meta.Tag, index: number) => {
  return h(
    NTag,
    {
      closable: false,
      // onClose: () => {
      //   removePgMember(tag,index);
      // }
    },
    {
      default: () => renderTag(tag)
    }
  )
}

// 成员添加确认提交
const onOrgMemCheckedOk = async (orgType: MemberCheckerType, values: Array<Meta.Tag>) => {
  tagValue.value = values;
  const mapValues = [] as any;
  values?.forEach((v: Meta.Tag) => {
    if ('dept' == v.type) {
      mapValues.push({ _id: v.value, name: v.label })
    } else if ('member' == v.type) {
      mapValues.push({ _id: v.value, name: v.label, avatar: v.avatar })
    }
  })

  if (props.multiple) {
    if (props.inst) {
      props.inst[compConfig.value.fieldName] = mapValues
    } else {
      compConfig.value.fieldValue = mapValues;
    }
  } else {
    if (props.inst) {
      mapValues?.length > 0 && (props.inst[compConfig.value.fieldName] = mapValues[0]);
    } else {
      mapValues?.length > 0 && (compConfig.value.fieldValue = mapValues[0]);
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
