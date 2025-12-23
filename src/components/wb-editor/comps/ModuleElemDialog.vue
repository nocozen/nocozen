<template>
  <ModalDialog ref="refDialog" @onOkClick="onOkClick" :title="title" key="carouselDialog" modalClass="w-100" footer
    :buttons="['ok', 'cancel']">
    <NFlex class="w-full h-60 p-4">
      <SmoothScrollbar>
        <NTree :node-props="nodeProps" :renderPrefix="renderPrefix" :renderSuffix="renderSuffix"
          checkbox-placement="right" class="h-full" size="small" v-model:expanded-keys="expandedKeys" :data="data"
          block-line :selectable="false" />
      </SmoothScrollbar>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, toRaw, h } from 'vue';
import WrapIcon from '@/components/custom/wrap-icon.vue';
import { getAllModuleTree, getAllChartTree, getMyBoardTree, getOtherAppModuleTree } from '@/service/api';
import { NCheckbox, NRadio, TreeOption } from 'naive-ui';
import { WbElType } from '@/enum';
import { useModuleInject } from "@/components/form-editor/useModuleInject";
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'update'): void,
  (e: 'updateImport', keys: Array<string>): void
}

const emit = defineEmits<Emits>();

const { updateWbLayout } = useModuleInject();

const appId = ref();
const title = ref('');
const data = ref();
const expandedKeys = ref([] as any);
const refDialog = ref();
const selectedKey = ref();
const selectedOption = ref();

// const openType = ref();   // 'chart' | 'myCharts' | 'modules'
const currComp = ref();

const onOkClick = () => {
  if (currComp.value?.type == WbElType.WbChart) {
    currComp.value.value = selectedOption.value;
    updateWbLayout();
    emit('update');
  } else if (currComp.value?.type == WbElType.WbMyCharts) {
    currComp.value.value = selectedOption.value;
    updateWbLayout();
    emit('update');
  } else if (currComp.value?.type == WbElType.WbShortcut) {
    currComp.value.value = selectedKey.value;
    updateWbLayout();
    emit('update');
  } else {
    // 所有选中模块imports添加[ app_id ]
    emit('updateImport', toRaw(selectedKey.value));
  }
  refDialog.value.show(false);

}

const renderPrefix = (info: { option: any, checked: boolean, selected: boolean }) => {
  if ('app' == info.option.type) {
    return h(WrapIcon, { wrapType: 'conic', radius: 4, icon: `mdi:${info.option.icon}`, color: info.option.iconColor });
  } else if (info.option.type == 'group') {
    if (expandedKeys.value.includes(info.option.key)) {
      return h(SvgIcon, { icon: 'mdi:folder-open', class: 'text-2xl text-blue-500' });
    } else {
      if (info.option.children) {
        return h(SvgIcon, { icon: 'mingcute--folder-2-fill', class: 'text-2xl text-blue-500' });
      } else {
        return h(SvgIcon, { icon: 'mingcute--folder-2-fill', class: 'text-2xl text-blue-500/60' });
      }
    }
  } else if (['form', 'flow', 'board'].includes(info.option.type)) {
    return h(WrapIcon, { icon: `mdi:${info.option.icon}`, color: info.option.iconColor });
  } else {
    return undefined;
  }
}

const nodeProps = ({ option }: { option: TreeOption }) => {
  return {
    onClick() {
      if (option.key) {
        onChecked(option);
      }
    },
    onContextmenu(e: MouseEvent): void {
      // e.preventDefault()
    }
  }
}

const onChecked = (option: any) => {
  if (currComp.value?.type == WbElType.WbChart) {
    selectedKey.value = option.key;
    selectedOption.value = option.compConfig;
  } else if (currComp.value?.type == WbElType.WbMyCharts) {
    if (selectedKey.value.find((v: string) => v == option.key)) {
      selectedKey.value = selectedKey.value.filter((v: string) => v != option.key);
      selectedOption.value = selectedOption.value.filter((v: any) => v.i != option.key);
    } else {
      selectedKey.value.push(option.key);
      selectedOption.value.push(option.compConfig);
    }
  } else if (currComp.value?.type == WbElType.WbShortcut) {
    if (selectedKey.value.find((v: string) => v == option.key)) {
      selectedKey.value = selectedKey.value.filter((v: string) => v != option.key);
    } else {
      selectedKey.value.push(option.key);
    }
  } else {
    if (selectedKey.value.find((v: string) => v == option.key)) {
      selectedKey.value = selectedKey.value.filter((v: string) => v != option.key);
    } else {
      selectedKey.value.push(option.key);
    }
  }
}

const renderSuffix = (info: { option: any, checked: boolean, selected: boolean }) => {
  if (currComp.value?.type == WbElType.WbChart) {
    if (['app', 'form', 'flow', 'board', 'group'].includes(info.option.type)) {
      return undefined;
    } else {
      return [
        h(NRadio, {
          checked: selectedKey.value === info.option.key,
          size: 'small',
          class: 'mr-2',
          onClick: (e: Event) => {
            e.stopPropagation();
          },
          'onUpdate:checked': (checked: boolean) => onChecked(info.option)
        },
          () => ''
        ),
      ];
    }
  } else if (currComp.value?.type == WbElType.WbMyCharts) {
    if (['app', 'form', 'flow', 'board', 'group'].includes(info.option.type)) {
      return undefined;
    } else {
      return [
        h(NCheckbox, {
          checked: selectedKey.value.includes(info.option.key),
          size: 'small',
          class: 'mr-2',
          onClick: (e: Event) => {
            e.stopPropagation();
          },
          'onUpdate:checked': (checked: boolean) => onChecked(info.option)
        },
          () => ''
        ),
      ];
    }
  } else if (currComp.value?.type == WbElType.WbShortcut) {
    if (['app', 'group'].includes(info.option.type)) {
      return undefined;
    } else {
      return [
        h(NCheckbox, {
          checked: selectedKey.value.includes(info.option.key),
          size: 'small',
          class: 'mr-2',
          onClick: (e: Event) => {
            e.stopPropagation();
          },
          'onUpdate:checked': (checked: boolean) => onChecked(info.option)
        },
          () => ''
        ),
      ];
    }
  } else {
    if (['app', 'group'].includes(info.option.type)) {
      return undefined;
    } else {
      return [
        h(NCheckbox, {
          checked: selectedKey.value.includes(info.option.key),
          size: 'small',
          class: 'mr-2',
          onClick: (e: Event) => {
            e.stopPropagation();
          },
          'onUpdate:checked': (checked: boolean) => onChecked(info.option)
        },
          () => ''
        ),
      ];
    }
  }

}

const init = async () => {
  data.value = [];
  if (currComp.value) {
    if (currComp.value.type == WbElType.WbChart) {
      title.value = '添加分析图表'
      if (currComp.value.value) {
        selectedKey.value = currComp.value.value.i;
        selectedOption.value = currComp.value.value;
      } else {
        selectedKey.value = null;
        selectedOption.value = null;
      }
      data.value = await getAllChartTree();
    } else if (currComp.value.type == WbElType.WbMyCharts) {
      title.value = '添加我的图表'
      if (currComp.value.value) {
        selectedKey.value = currComp.value.value.map((v: Meta.ChartComp) => v.i);
        selectedOption.value = currComp.value.value;
      } else {
        selectedKey.value = [] as any;
        selectedOption.value = [] as any;
      }
      data.value = await getMyBoardTree();    // todo: 需要当前用户权限过滤
    } else if (currComp.value.type == WbElType.WbShortcut) {   // 类似网上业务办理在工作台提供分类入口；
      title.value = '添加快捷入口'
      if (currComp.value.value) {
        selectedKey.value = currComp.value.value;
      } else {
        selectedKey.value = [] as any;
      }
      data.value = await getAllModuleTree();    // 当前用户访问时需要依据权限控制是否可访问，应用模块权限树结果集中判断；
    }
  } else {
    title.value = '选择导入表单';
    data.value = await getOtherAppModuleTree(appId.value);
  }
}

const show = (comp: Meta.LayoutComp) => {
  currComp.value = comp;
  init();
  refDialog.value.show(true);
}

const showImport = (keys: Array<string>, app_id: string) => {
  appId.value = app_id;
  selectedKey.value = keys;
  init();
  refDialog.value.show(true);
}

defineExpose({
  show,
  showImport
})
</script>
