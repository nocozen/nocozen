<template>
  <component :is="compMap[type]" :i="i" class="mx-1" :inst="inst" :show-label="showLabel" :readonly="readonly" :disabled="disabled">
  </component>
</template>

<script setup lang="ts">
import {
  FeAddress,
  FeSequenceId,
  FeMobileNumber,
  FeSignature,
  FeAttachment,
  FeImage,
  FeDivider,
  FeText,
  FeSelect,
  FeMulSelect,
  FeNumber,
  FeTextArea,
  FeRadioGroup,
  FeCheckboxGroup,
  FeUserSelect,
  FeDeptSelect,
  FeMulUserSelect,
  FeMulDeptSelect,
  FeDatetime,
  FeDataSelect,
  NestEditTable,
  TabPaneGridItem,
  NestViewTable,
} from './comps';

interface Props {
  inst?: any,
  i: number | string,
  type: string,
  showLabel?: boolean,
  readonly?: boolean,
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  // type: FormElType.FeText,
});

const compMap = {
  FeAddress: FeAddress,
  FeSequenceId: FeSequenceId,
  FeMobileNumber: FeMobileNumber,
  FeSignature: FeSignature,
  FeAttachment: FeAttachment,
  FeImage: FeImage,
  FeDivider: FeDivider,
  FeText: FeText,
  FeTextArea: FeTextArea,
  FeNumber: FeNumber,
  FeSelect: FeSelect,
  FeMulSelect: FeMulSelect,
  FeRadioGroup: FeRadioGroup,
  FeCheckboxGroup: FeCheckboxGroup,
  FeUserSelect: FeUserSelect,
  FeMulUserSelect: FeMulUserSelect,
  FeDeptSelect: FeDeptSelect,
  FeMulDeptSelect: FeMulDeptSelect,
  FeDatetime: FeDatetime,
  FeDataSelect: FeDataSelect,
  NestEditTable: NestEditTable,
  NestTabPane: TabPaneGridItem,
  NestViewTable: NestViewTable
} as any

</script>
