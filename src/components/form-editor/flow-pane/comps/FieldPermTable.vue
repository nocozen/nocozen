<template>
  <NTable size="small">
    <thead>
      <tr>
        <th class="w-31 max-w-31 text-center">字段</th>
        <th class="text-center">只读</th>
        <th class="text-center">编辑</th>
        <th class="text-center">摘要</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="w-31 max-w-31">全选</td>
        <td class="text-center">
          <NCheckbox v-model:checked="allViewChecked" size="small" @update-checked="onAllViewChecked" />
        </td>
        <td class="text-center">
          <NCheckbox v-model:checked="allEditChecked" size="small" @update-checked="onAllEditChecked" />
        </td>
        <td class="text-center">
        </td>
      </tr>
      <template v-for="field in props.fieldList">
        <tr>
          <td>{{ getCompTitle(field) }}</td>
          <td class="text-center">
            <NCheckbox size="small" v-model:checked="field.viewPerm"
              @update-checked="(checked) => onViewCheakClick(checked, field)" />
          </td>
          <td class="text-center">
            <NCheckbox size="small" v-model:checked="field.editPerm" @update-checked="onEditCheakClick" />
          </td>
          <td class="text-center">
            <NCheckbox v-if="'abstract' in field" size="small" v-model:checked="field.abstract" />
          </td>
        </tr>
        <template v-for="nfield in field.children">
          <tr>
            <td>
              <span class="ml-4">{{ getCompTitle(nfield) }}</span>
            </td>
            <td class="text-center">
              <NCheckbox size="small" v-model:checked="nfield.viewPerm"
                @update-checked="(checked) => onViewCheakClick(checked, nfield)" />
            </td>
            <td class="text-center">
              <NCheckbox size="small" v-model:checked="nfield.editPerm" @update-checked="onEditCheakClick" />
            </td>
            <td class="text-center">
              <NCheckbox v-if="'abstract' in field" size="small" v-model:checked="nfield.abstract" />
            </td>
          </tr>
          <template v-for="ncfield in nfield.children">
            <tr>
              <td>
                <span class="ml-4">{{ getCompTitle(ncfield) }}</span>
              </td>
              <td class="text-center">
                <NCheckbox size="small" v-model:checked="ncfield.viewPerm"
                  @update-checked="(checked) => onViewCheakClick(checked, ncfield)" />
              </td>
              <td class="text-center">
                <NCheckbox size="small" v-model:checked="ncfield.editPerm" @update-checked="onEditCheakClick" />
              </td>
              <td class="text-center">
                <NCheckbox v-if="'abstract' in field" size="small" v-model:checked="ncfield.abstract" />
              </td>
            </tr>
          </template>
        </template>
      </template>

    </tbody>
  </NTable>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { some } from 'lodash-es';
import { useModuleInject } from '../../useModuleInject';
import { FormElType } from '@/enum';

interface Props {
  fieldList: Array<any>,
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'update'): void
}
const emit = defineEmits<Emits>()

const { compConfigs } = useModuleInject();
const allViewChecked = ref(false);
const allEditChecked = ref(false);

const hasViewFalse = (items: Array<Meta.FieldPerm>, field: string): boolean => {
  return some(items, (item: any) =>
    !item[field] || (item.children && hasViewFalse(item.children, field))
  );
}

// 字段权限中的中文字段名称统一从组件配置中获取；
const getCompTitle = (field: Meta.FieldPerm) => {
  if (field.fieldType == FormElType.NestTabPane) {
    let pComp = compConfigs?.find((c: Meta.CompBase) => c.nestUid?.includes(+field.fieldName));
    return pComp!.tabs!.find((t: Meta.Tab) => t.uid.toString() == field.fieldName)!.name;
  } else {
    return compConfigs?.find((c: Meta.CompBase) => c.fieldName == field.fieldName)?.title;
  }
}

const init = () => {
  if (!hasViewFalse(props.fieldList, 'viewPerm')) {
    allViewChecked.value = true;
  } else {
    allViewChecked.value = false;
  }
  if (!hasViewFalse(props.fieldList, 'editPerm')) {
    allEditChecked.value = true;
  } else {
    allEditChecked.value = false;
  }
}


watch(
  () => props.fieldList,
  (newValue, oldValue) => {
    init();
  },
  { immediate: true, deep: true }
);

const unCheckAllPerm = (fieldPerm: Meta.FieldPerm) => {
  fieldPerm.viewPerm = false;
  fieldPerm.editPerm = false;
  if (fieldPerm.children && fieldPerm.children?.length > 0) {
    fieldPerm.children?.forEach((c: Meta.FieldPerm) => {
      unCheckAllPerm(c);
    })
  }
}
const checkAllViewPerm = (fieldPerm: Meta.FieldPerm) => {
  fieldPerm.viewPerm = true;
  if (fieldPerm.children && fieldPerm.children?.length > 0) {
    fieldPerm.children?.forEach((c: Meta.FieldPerm) => {
      checkAllViewPerm(c);
    })
  }
}
const onViewCheakClick = (checked: boolean, fieldPerm: Meta.FieldPerm) => {
  if (checked && !hasViewFalse(props.fieldList, 'viewPerm')) {
    allViewChecked.value = true;
  } else {
    allViewChecked.value && (allViewChecked.value = false);
  }
  if (!checked) {
    unCheckAllPerm(fieldPerm);
  } else {
    checkAllViewPerm(fieldPerm)
  }
  emit('update')
}

const onEditCheakClick = (checked: boolean) => {
  if (checked && !hasViewFalse(props.fieldList, 'editPerm')) {
    allEditChecked.value = true;
  } else {
    allEditChecked.value && (allEditChecked.value = false);
  }
  emit('update')
}

const onAllViewChecked = (checked: boolean) => {
  props.fieldList?.forEach((f: Meta.FieldPerm) => {
    f.viewPerm = checked;
    if (f.children && f.children?.length > 0) {
      f.children?.forEach((fc: Meta.FieldPerm) => {
        fc.viewPerm = checked;
      })
    }
  })
  emit('update')
}

const onAllEditChecked = (checked: boolean) => {
  checked && (allViewChecked.value = checked)
  props.fieldList?.forEach((f: Meta.FieldPerm) => {
    checked && (f.viewPerm = checked);
    f.editPerm = checked;
    if (f.children && f.children?.length > 0) {
      f.children?.forEach((fc: Meta.FieldPerm) => {
        checked && (fc.viewPerm = checked);
        fc.editPerm = checked;
      })
    }
  })
  emit('update')
}
</script>