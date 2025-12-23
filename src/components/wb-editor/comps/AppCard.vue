<template>
  <div class="relative group/child">
    <CardButton :title="item.name" sizeType="lg" bg-scope="all" :icon="`mdi:${item.icon}`" :color="item.iconColor" />
    <ModuleAddMenu v-if="canEdit" :popFunc="onEditClick" :options="options">
      <div class="hidden group-hover/child-block absolute top-0 right-0 m-2 text-white hover:text-primary" @click.stop>
        <SvgIcon icon="mdi:cog" />
      </div>
    </ModuleAddMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, h, watch } from 'vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { fetchMarkAppDelete } from '@/service/api';
import { MenuEventType } from '@/enum';
import { useDialog } from 'naive-ui';
import { NInput } from 'naive-ui';

defineOptions({
  name: 'AppCard',
  // inheritAttrs: false
});

interface Emits {
  (e: 'onEditApp', appNode: Meta.AppNode): void;
  (e: 'refreshApps'): void;
}

const emit = defineEmits<Emits>();

interface Props {
  item: any,
  index: number,
  appList: Array<Meta.AppNode>,
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false
});

const dialog = useDialog();
const inputValue = ref('');

const renderIcon = (icon: string) => {
  return () => h(SvgIcon, { icon, class: 'text-lg' })
}

const options = ref([
  {
    // icon: 'fluent:document-flowchart-24-regular',
    icon: renderIcon('fluent--document-flowchart-24-regular'),
    label: '修改名称和图标',
    key: MenuEventType.AppEditLable
  },
  {
    // icon: 'mdi:file-document-box-outline',
    icon: renderIcon('mdi:file-document-box-outline'),
    label: '删除',
    key: MenuEventType.AppDelete
  }
])

const showInputDialog = async () => {
  dialog.warning({
    title: `确定要删除"${props.item.name}"`,
    content: () => [
      h('div', { style: 'margin-bottom: 4px; color: #666;' }, `确认后将删除"${props.item.name}"的所有模块和数据！`),
      h('div', { style: 'margin-bottom: 8px; color: #666;' }, '确认删除请输入要删除应用的名称：'),
      h(NInput, {
      value: inputValue.value,
      onUpdateValue: (val: string) => {
        inputValue.value = val;
      }
    })],
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      if (inputValue.value == props.item.name) {
        await deleteApp();
        return true;
      } else {
        return false;
      }
    },
    // onNegativeClick: () => {
    //   window.$message?.error('不确定');
    // }
  });


}

// 校验逻辑（示例：非空且长度≥3）
const validateInput = (val: any) => {
  return val && val?.length >= 3;
};

const deleteApp = async () => {
  // 修改前置节点的suf_id为后置节点；同时标记删除(suf_id='delete')，
  // 处理第一个和最后一个节点删除的特殊情况
  let options: Array<Meta.Order> = [{ _id: props.appList[props.index]._id, suf_id: 'delete' }];
  if (props.index > 0) {
    if (props.index == props.appList?.length - 1) {
      options.push({ _id: props.appList[props.index - 1]._id, suf_id: null })
    } else {
      options.push({ _id: props.appList[props.index - 1]._id, suf_id: props.appList[props.index + 1]._id! })
    }
  }
  const result = await fetchMarkAppDelete(options);
  if (result.msg == 'ok') {
    emit('refreshApps');
    window.$message?.success(`删除应用【${props.appList[props.index].name}】成功！`);
  } else {
    window.$message?.error('删除应用出错了！');
  }
}

const onEditClick = async (key: string) => {
  if (key == MenuEventType.AppDelete) {
    showInputDialog();
  } else if (key == MenuEventType.AppEditLable) {
    emit('onEditApp', props.appList[props.index])
  }
}

</script>