<template>
  <span class="mt-4 mx-4 text-sm font-semibold">表单组件</span>
  <NScrollbar class="pr-1">
    <div class="absolute h-full w-full opacity-100" :class="{ 'z-1': disabled }"></div>
    <NList :show-divider="false" class="px-2 ">
      <template v-for="n of 12">
        <NListItem style="padding: 0">
          <NFlex :size="8">
            <ToolboxButton :drag-type="getDragType(comps[2 * n - 2].type)" :disabled="comps[2 * n - 2].disabled"
              @draging="draging" class="ma-1" :icon="comps[2 * n - 2].icon" :title='comps[2 * n - 2].title'
              :data="comps[2 * n - 2]">
            </ToolboxButton>
            <ToolboxButton :drag-type="getDragType(comps[2 * n - 1].type)" :disabled="comps[2 * n - 1].disabled"
              @draging="draging" class="ma-1" :icon="comps[2 * n - 1].icon" :title='comps[2 * n - 1].title'
              :data="comps[2 * n - 1]">
            </ToolboxButton>
          </NFlex>
        </NListItem>
      </template>
    </NList>
  </NScrollbar>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { FormElType, FormElTypeIcon, FormElTypeCn, VglDragType } from '@/enum';

const comps = ref([
  { id: '1', title: FormElTypeCn[FormElType.FeText], icon: FormElTypeIcon[FormElType.FeText], type: FormElType.FeText },
  { id: '2', title: FormElTypeCn[FormElType.FeTextArea], icon: FormElTypeIcon[FormElType.FeTextArea], type: FormElType.FeTextArea },
  { id: '3', title: FormElTypeCn[FormElType.FeNumber], icon: FormElTypeIcon[FormElType.FeNumber], type: FormElType.FeNumber },
  { id: '4', title: FormElTypeCn[FormElType.FeDatetime], icon: FormElTypeIcon[FormElType.FeDatetime], type: FormElType.FeDatetime },
  { id: '5', title: FormElTypeCn[FormElType.FeRadioGroup], icon: FormElTypeIcon[FormElType.FeRadioGroup], type: FormElType.FeRadioGroup },
  { id: '6', title: FormElTypeCn[FormElType.FeCheckboxGroup], icon: FormElTypeIcon[FormElType.FeCheckboxGroup], type: FormElType.FeCheckboxGroup },
  { id: '7', title: FormElTypeCn[FormElType.FeSelect], icon: FormElTypeIcon[FormElType.FeSelect], type: FormElType.FeSelect },
  { id: '8', title: FormElTypeCn[FormElType.FeMulSelect], icon: FormElTypeIcon[FormElType.FeMulSelect], type: FormElType.FeMulSelect },
  { id: '9', title: FormElTypeCn[FormElType.FeUserSelect], icon: FormElTypeIcon[FormElType.FeUserSelect], type: FormElType.FeUserSelect },
  { id: '10', title: FormElTypeCn[FormElType.FeMulUserSelect], icon: FormElTypeIcon[FormElType.FeMulUserSelect], type: FormElType.FeMulUserSelect },
  { id: '11', title: FormElTypeCn[FormElType.FeDeptSelect], icon: FormElTypeIcon[FormElType.FeDeptSelect], type: FormElType.FeDeptSelect },
  { id: '12', title: FormElTypeCn[FormElType.FeMulDeptSelect], icon: FormElTypeIcon[FormElType.FeMulDeptSelect], type: FormElType.FeMulDeptSelect },
  { id: '13', title: FormElTypeCn[FormElType.NestTabPane], icon: FormElTypeIcon[FormElType.NestTabPane], type: FormElType.NestTabPane },
  { id: '14', title: FormElTypeCn[FormElType.FeDivider], icon: FormElTypeIcon[FormElType.FeDivider], type: FormElType.FeDivider, disabled: false },

  { id: '15', title: FormElTypeCn[FormElType.FeImage], icon: FormElTypeIcon[FormElType.FeImage], type: FormElType.FeImage, disabled: false },
  { id: '16', title: FormElTypeCn[FormElType.FeAttachment], icon: FormElTypeIcon[FormElType.FeAttachment], type: FormElType.FeAttachment, disabled: false },
  { id: '17', title: FormElTypeCn[FormElType.NestEditTable], icon: FormElTypeIcon[FormElType.NestEditTable], type: FormElType.NestEditTable },
  { id: '18', title: FormElTypeCn[FormElType.NestViewTable], icon: FormElTypeIcon[FormElType.NestViewTable], type: FormElType.NestViewTable },
  { id: '19', title: FormElTypeCn[FormElType.FeDataSelect], icon: FormElTypeIcon[FormElType.FeDataSelect], type: FormElType.FeDataSelect },

  { id: '20', title: FormElTypeCn[FormElType.FeAddress], icon: FormElTypeIcon[FormElType.FeAddress], type: FormElType.FeAddress, disabled: false },
  { id: '21', title: FormElTypeCn[FormElType.FeButton], icon: FormElTypeIcon[FormElType.FeButton], type: FormElType.FeButton, disabled: true },
  { id: '22', title: FormElTypeCn[FormElType.FeSignature], icon: FormElTypeIcon[FormElType.FeSignature], type: FormElType.FeSignature, disabled: false },
  { id: '23', title: FormElTypeCn[FormElType.FeSequenceId], icon: FormElTypeIcon[FormElType.FeSequenceId], type: FormElType.FeSequenceId, disabled: false },
  { id: '24', title: FormElTypeCn[FormElType.FeMobileNumber], icon: FormElTypeIcon[FormElType.FeMobileNumber], type: FormElType.FeMobileNumber, disabled: false },
] as any)
const disabled = ref(false);

//====注意：处理嵌套用，非嵌套ToolboxButton可以不添加，添加错误会导致drop无响应====
const draging = (state: boolean) => {
  disabled.value = state;
}

const getDragType = (type: FormElType) => {
  switch (type) {
    case FormElType.NestTabPane:
      return VglDragType.NestTabPane;
    case FormElType.NestEditTable:
      return VglDragType.NestEditTable;
    case FormElType.Nest:
      return VglDragType.Nest;
    default:
      return VglDragType.Default
  }
}


</script>

<style lang="scss" scoped></style>