<template>
  <NCard content-style="padding: 0;" :bordered="false" class="w-full h-full " size="small">
    <NDataTable ref="refTable" @wheel.stop :min-height="20" :style="cptTableHeight" flex-height
      @update:checked-row-keys="onTableChecked" :row-key="rowKey" :single-line="false" size="small" :columns="columns"
      :data="compConfig.fieldValue" :pagination="false" :scroll-x="scrollX" />
  </NCard>
  <NFlex v-if="!readonly && compConfig.editPerm" align="center" class="py-2">
    <ButtonIcon @click="onAddClick" type="info" title="添加" icon="mdi:add" level="text" size="small"></ButtonIcon>
  </NFlex>
</template>

<script lang="ts" setup>
import { ref, h, watch, watchEffect, nextTick, computed } from 'vue';
import { NDataTable, NInput, useMessage } from 'naive-ui';
import { fetchFindBusiData } from '@/service/api/busi';
import { useModuleInject } from '@/components/form-editor/useModuleInject';
import { merge } from 'radashi';
import Uid from '@/utils/uid';
import FormElem from '../index.vue'
import { FormElType } from '@/enum';
import BtnRowDel from './BtnRowDel.vue';

interface Props {
  i: string,
  height: number,
  optPerm: Array<'add' | 'view'>,
  readonly?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  optPerm: () => []
});
const emit = defineEmits(['openEditForm'])

const { compConfigs, layoutNodes } = useModuleInject();

const scrollX = ref();   // 设置scrollX会影响设置列宽
const defColWidth = 150;
const refTable = ref();

const columns = ref([] as any);
const refFormDialog = ref();
const compConfig = ref();
const layout = ref([] as any);
const nestComps = ref();

const rowKey = (row: any) => row.uid;


const cptTableHeight = computed(() => {
  return `height:${props.height - 80}px;`
})

const onAddClick = () => {
  if (compConfig.value.fieldValue.length > 200) {
    window.$message?.warning('最多可以添加200条');
    return;
  }
  // 基于嵌套组件初始化表格记录
  let obj = nestComps.value.reduce(
    (acc: any, item: any) => {
      if (!acc.uid) {
        acc.uid = Uid.NextNumber();
      }
      acc[item.fieldName] = null;
      return acc;
    },
    {} as { uid: string } & Record<string, null>, // 类型注解
  )
  compConfig.value.fieldValue.push(obj)

  // 确保scrollTo高度计算在push之后
  nextTick(() => {
    refTable.value.scrollTo({
      left: 0,
      top: 20000,   // 最多200条确保大于最大高度
      behavior: 'smooth'
    });
  }); // 延迟 0ms，确保 DOM 更新完成

}

const onTableChecked = (rowKeys: Array<any>) => {

}

const getMarginTopBy = (type: string) => {
  if ([FormElType.FeText, FormElType.FeNumber, FormElType.FeTextArea, FormElType.FeDatetime, FormElType.FeSelect, FormElType.FeMulSelect,
  FormElType.FeUserSelect, FormElType.FeMulUserSelect, FormElType.FeDeptSelect, FormElType.FeMulDeptSelect
  ].includes(type as FormElType)) {
    return 'mt-3 w-full';
  } else {
    return '';
  }
}

const renderComp = (row: any, config: Meta.CompConfig) => {
  const comp = compConfigs?.find((c: Meta.CompBase) => c.fieldName == config.fieldName);
  const inst = compConfig.value.fieldValue.find((d: any) => d.uid == row.uid);
  if (comp) {
    console.log(!config.editPerm)
    return h(FormElem, {
      inst: inst,
      i: config.i,
      type: config.type,
      disabled: !config.editPerm,
      showLabel: false,
      class: getMarginTopBy(config.type),
    })
  }

}

const onDelRowClick = (index: number) => {
  compConfig.value.fieldValue.splice(index, 1);
  console.log(compConfig.value.fieldValue, index)
}
const init = async () => {
  const compList = merge(layout.value, nestComps.value, (f: any) => f.i);
  if (compList.length > 0) {
    let cols = compList.map((config: any, index: number) => {
      let column = {
        title: config.title,
        key: config.fieldName,
        minWidth: 150,
        // fixed: index == 0 ? 'left' : 'false',
        titleAlign: 'start',
        align: 'start',
        // ellipsis: {
        //   tooltip: true
        // },
        render(row: any) {
          return renderComp(row, config);
        }
      } as any;
      return column;
    })
    columns.value = [
      {
        title: '序号',
        // fixed: 'left',     // todo:固定列时，超出高度出现滚动条时，固定列的底边显示有问题
        width: 46,
        key: 'index',
        titleAlign: 'center',
        render: (row: any, index: number) => {
          return h(
            BtnRowDel,
            {
              index: index + 1,
              editPerm: compConfig.value.editPerm,
              onClick: () => onDelRowClick(index)
            },
          );
        }
      },
      ...cols
    ];
    scrollX.value = defColWidth * cols.length + 40;
  }

}

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp && comp.nestUid) {
        compConfig.value = comp;
        const uid = comp.nestUid[0];
        layout.value = layoutNodes?.find((l: Meta.LayoutNode) => l.uid == uid)?.layout;
        nestComps.value = compConfigs?.filter((item: Meta.CompBase) => item.nodeUid == uid);
        compConfig.value.fieldValue || (compConfig.value.fieldValue = []);
      }
      comp && init();
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);


defineExpose({
});
</script>

<style lang="scss" scoped>
.box-with-shadows {
  /* 添加四边阴影 */
  box-shadow:
    0 10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 底部阴影 */
    0 -10px 10px -5px rgba(0, 0, 0, 0.2),
    /* 顶部阴影 */
    10px 0 10px -5px rgba(0, 0, 0, 0.2),
    /* 右侧阴影 */
    -10px 0 10px -5px rgba(0, 0, 0, 0.2);
  /* 左侧阴影 */
}

:deep(.n-data-table .n-data-table-td) {
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 2px;
}

:deep(.n-data-table-td--last-row) {
  border-bottom: solid 1px var(--n-merged-border-color) !important
}
</style>
