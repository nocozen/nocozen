<template>
  <NTreeSelect @update-value="onSelectForm" :options="formOptions" v-model:value="model"
    v-model:expanded-keys="expandedKeys" :renderPrefix="renderPrefix"
    :override-default-node-click-behavior="overrideGroupClick" size="small" :show-arrow="false"
    :consistent-menu-width="false" :placeholder="placeholder"></NTreeSelect>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import WrapIcon from '@/components/custom/wrap-icon.vue';
import SvgIcon from '../custom/svg-icon.vue';

interface Props {
  placeholder: string,
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: ''
});


interface Emits {
}

const emit = defineEmits<Emits>();

const formOptions = ref<Array<any>>([]);
const expandedKeys = ref([] as any);
const model = defineModel() as any;

const onSelectForm = async (key: string, option: any) => {
  // 保存dataBind
  model.value = key;
}

const overrideGroupClick = ({ option }: any) => {
  if (option.children) {
    return 'toggleExpand'
  }
  return 'default'
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

</script>