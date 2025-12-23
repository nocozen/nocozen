<template>
  <NCard content-style="padding: 0;" :bordered="false" size="small" @click="onCardClick" class="cursor-pointer">
    <NFlex class="px-4 h-10 w-full border-b-1" align="center">
      <NFlex class="flex-1" align="center" :size="0">
        <span class="min-w-30 mr-4 font-semibold">{{ flowInfo.title }}</span>
        <!-- <SvgIcon icon="charm:organisation" class="w-3 h-3 mt-0.5"></SvgIcon> -->
        <SvgIcon v-if="type == 'todo'" :icon="flowInfo.actNodeIcon" class="w-3 h-3 mt-0.5 text-blue"></SvgIcon>
        <span v-if="type == 'todo'" class="ml-1 text-xs mt-1">{{ flowInfo.actNodeName }}</span>
      </NFlex>
      <NButton v-if="type != 'todo'" size="tiny" class="ml-4"
        :type="props.flow.status == 'active' ? 'info' : 'success'">
        {{ flowInfo.status }}
      </NButton>
      <span class="text-xs">{{ dayjs(flowInfo.actTaskUpdateAt).format('YYYY-MM-DD HH:mm') }}</span>
    </NFlex>
    <NFlex align="center" class="p-4 text-sm" justify="start">
      <NFlex align="center" class="flex-1 max-w-56 min-w-20">
        <AccInfo :account="{ name: flow?.createBy?.name || '', avatar: flow?.createBy?.avatar || '' }" />
      </NFlex>
      <NFlex class="flex-1 flex-wrap min-w-20 text-tbox_text">
        <span v-for="(d, index) in flowInfo.data" class="w-50" style="font-size: 13px" :key="index">{{ d }}</span>
      </NFlex>
    </NFlex>
    <FlowCardDialog ref="flowForm" @onClose="onClose" @refresh="refresh" :flow="flow" :type="type" />
  </NCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NodeIcons } from '@/enum';
import dayjs from 'dayjs';
import { FormOpt, FlowStatusName } from '@/enum';

interface Emits {
  (e: 'onClose'): void;
  (e: 'refresh'): void;
  (e: 'onRead', flow: Meta.FlowInstance): void;
}

const emit = defineEmits<Emits>();

interface Props {
  flow: Meta.FlowInstance;
  type: 'start' | 'todo' | 'handle' | 'received' | 'started'
}

const props = defineProps<Props>();

const flowForm = ref()

const getFieldValueBy = (key: string, value: any) => {
  const type = typeof value;
  switch (type) {
    case 'undefined':
      return '';
    case 'object':
      if (value === null) {
        return '';
      } else if (Array.isArray(value)) {
        return value.map((v: any) => 'name' in value ? value.name : '')
      }
      return 'name' in value ? value.name : '';
    default:
      if (key.startsWith('_md_')) {
        return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
      } else {
        return value;
      }
  }
}
const flowInfo = computed(() => {
  // formMeta提供简报字段标题，(暂时不改变，后续再考虑是否优化；若使用compConfigs需要自己查，当前没有provider;)
  const data = Object.entries(props.flow.formMeta).map(([key, value]) => `${value}: ${getFieldValueBy(key, props.flow.formData[key])}`);
  if (props.flow) {
    let actNodeIcon = '';
    let actNodeName = '';
    if (props.type == 'todo') {
      if (props.flow.activeTasks && props.flow.activeTasks?.length > 0) {
        const myTask = props.flow.activeTasks.at(-1);
        let actNode = props.flow.activeNodes.find(node => node.uid == myTask?.nodeUid);
        actNode || (actNode = props.flow.activeNodes[0]);
        actNodeIcon = NodeIcons[actNode.type];
        actNodeName = actNode.name;
      }
    }

    return {
      title: props.flow.moduleName,
      actNodeIcon: actNodeIcon,
      actNodeName: actNodeName,
      actTaskUpdateAt: props.flow.updateAt,
      data: data,
      status: FlowStatusName[props.flow.status],
    }
  } else {
    return {} as any;
  }
})

const onClose = () => {
  emit('onClose');
}

const refresh = () => {
  emit("refresh");
}

const onCardClick = () => {
  flowForm.value.show(true);
  if (props.type == 'received') {
    // 修改已读
    emit('onRead', props.flow);
  }
}




</script>
