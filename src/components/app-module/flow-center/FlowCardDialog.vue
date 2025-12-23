<template>
  <ModalDialog ref="formDialog"  :title="title" :toolButtons="['flow']" modal-class="w-260"
    @onSwitchFlowInfo="onSwitchFlowInfo" @onShowFlowChart="onShowFlowChart">
    <NFlex id="flow-card-modal" class="w-full h-fit relative overflow-hidden" :size="0">
      <FlowContent ref="formContent" v-if="flow" class="flex-1 h-150" :flow="flow" :hOffset="readonly ? 0 : 19" @onFormEvent="onFormEvent"
        :readonly="readonly" :buttons="['cancel', 'submit']" :openType="type" />
      <NFlex v-show="showInfo" :size="0"
        class="w-80 h-full border-l-1 bg-gray-200/50 transition-transform duration-500 ease-in-out transform">
        <SmoothScrollbar>
          <NFlex vertical class="h-full w-full" :size="0">
            <NFlex class="border-b-1">
              <span class="px-4 py-2">流程动态</span>
            </NFlex>
            <NFlex :size="0" style="height: calc(100vh - 120px)">
              <SmoothScrollbar class="px-4">
                <FlowStatusCard v-for="info in flowInfo" :info="info"/>
              </SmoothScrollbar>
            </NFlex>
          </NFlex>
        </SmoothScrollbar>
      </NFlex>
    </NFlex>
  </ModalDialog>
</template>



<script setup lang="ts">
import { ref, computed } from 'vue';
import { FormOpt } from '@/enum';
import { fetchAllFlowEnabled } from '@/service/api/flow';

interface Emits {
  (e: 'refresh'): void;
}
const emit = defineEmits<Emits>();

interface Props {
  flow: Meta.FlowInstance;
  type: 'start' | 'todo' | 'handle' | 'received' | 'started'
}

const props = defineProps<Props>();

const flowInfo = ref([] as any);
const formContent = ref();
const showInfo = ref(false)
const title = ref('')

const readonly = computed(() => {
  if (props.type == 'todo') {
    return false;
  } else {
    return true;
  }
})

const onFormEvent = (opt: FormOpt) => {
  formDialog.value.show(false);
  emit('refresh');
}

const formDialog = ref();

const onSwitchFlowInfo = () => {
  showInfo.value = !showInfo.value
}

const onShowFlowChart = () => {
  formContent.value.showFlowChart();
}


const init = async () => {
  const result = await fetchAllFlowEnabled({ _id: props.flow._id });
  if ('ok' == result.msg && result.data?.length > 0) {
    const flowIns: Meta.FlowInstance = result.data[0];
    // 从激活节点和激活任务中生成日志，后续流程实例添加日志记录；
    let nodes = {} as any;
    flowIns.activeNodes?.forEach((n: any) => {
      nodes[n.uid] = n;
    })
    flowIns.activeTasks?.forEach((t: any) => {
      flowInfo.value.push({
        nodeName: nodes[t.nodeUid].name,
        nodeComplete: nodes[t.nodeUid].complete,
        nodeCompleteAt: nodes[t.nodeUid].updateAt,
        nodeExecStatus: nodes[t.nodeUid].execStatus,
        nodeExecMsg: nodes[t.nodeUid].execMsg,
        ...t,
      })
    });
  }
}

init();

const show = (show: boolean) => {
  title.value = props.flow.moduleName;
  formDialog.value.show(show);
}

defineExpose({
  show
})

</script>
