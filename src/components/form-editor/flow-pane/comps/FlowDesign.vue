<template>
  <NFlex vertical style="width: calc(100% - 280px)" :size="0">
    <NFlex class="flex-nowrap min-w-205 px-4 gap-1 border-b-1" align="center" :size="0">
      <NFlex class="h-11 flex-1 flex-nowrap" align="center">
        <ButtonIcon icon="clarity--align-middle-line" tooltipContent="水平居中"></ButtonIcon>
        <ButtonIcon icon="clarity--align-center-line" tooltipContent="垂直居中"></ButtonIcon>
        <NDivider vertical></NDivider>
        <ButtonIcon icon="tdesign--center-focus-strong"></ButtonIcon>
        <ButtonIcon @click="onFlowMoveClick" icon="mynaui--move" :color="flowMove ? hoverColor : 'none'"
          :focusable="false"></ButtonIcon>
        <NDivider vertical></NDivider>
        <ButtonIcon icon="fluent--subtract-24-filled"></ButtonIcon>
        <ButtonIcon>100%</ButtonIcon>
        <ButtonIcon icon="fluent--add-24-filled"></ButtonIcon>
        <NDivider vertical></NDivider>
        <ButtonIcon @click="onDeleteClick" icon="mdi:trash-can-outline" v-if="!currFlowDef.enable" :focusable="false">
        </ButtonIcon>
      </NFlex>
      <NFlex align="center" :size="0" class="w-44 flex-nowrap">
        <DropSelect v-if="flowVers?.length > 0" :options="flowVers" @select="onFlowDefSelect" quaternary
          :showIcon="false"></DropSelect>
        <NSwitch :value="currFlowDef.enable" size="small" @update:value="activeFlow">
          <template #checked>
            启用
          </template>
          <template #unchecked>
            停用
          </template>
        </NSwitch>
      </NFlex>
    </NFlex>
    <FlowSvg ref="refSvg" :readonly="currFlowDef.enable"></FlowSvg>
  </NFlex>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, h, nextTick } from 'vue';
import FlowSvg from './FlowSvg.vue';
import { useModuleInject } from '../../useModuleInject';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { NodeTypes, ApproveType } from '@/enum';

interface Props {
  svgSize: { w: number, h: number },
}

const props = withDefaults(defineProps<Props>(), {
});

const { flowDefs, updateFlowDef } = useModuleInject();
const currFlowDef = ref<Meta.FlowDefinition>(flowDefs ? flowDefs[0] : {} as any);
const refSvg = ref();

const getVerIcon = (enable: boolean) => {
  let iconClass = enable ? 'text-lg text-green' : 'text-lg text-orange';
  let iconName = enable ? 'fluent--play-circle-24-regular' : 'mdi:progress-pencil';
  return { iconName, iconClass }
}

const renderIcon = (enable: boolean) => {
  return () => h(SvgIcon, { icon: getVerIcon(enable).iconName, class: getVerIcon(enable).iconClass })
}

const flowVers = computed(() => {
  if (flowDefs && flowDefs?.length > 0) {
    return flowDefs?.map((def: any) => ({
      key: def.uid,
      label: `流程版本V${def.verId}`,
      verId: def.verId,
      enable: def.enable,
      iconName: getVerIcon(def.enable).iconName,
      iconClass: getVerIcon(def.enable).iconClass,
      icon: renderIcon(def.enable)
    }))
  } else {
    return []     // 正常不会出现没有值
  }
})

const hoverColor = "rgb(87, 151, 255)"
const flowMove = ref(false)

const updateFlow = async () => {
  // 更新指定版本的流程定义
  updateFlowDef && updateFlowDef(currFlowDef.value);
}

const checkFlowDef = () => {
  const reuslt = currFlowDef.value.nodes.filter((n: Meta.FlowNode) => {
    if (n.type == NodeTypes.Start) {
      const checkLink = currFlowDef.value.links.findIndex((l: Meta.FlowLink) => l.sourceId == n.uid) != -1;
      const checkFieldPerm = n.fieldPerm?.findIndex((p: Meta.FieldPerm) => p.viewPerm) != -1;
      if (!checkLink || !checkFieldPerm) return true;
    } else if (n.type == NodeTypes.End) {
      const checkLink = currFlowDef.value.links.findIndex((l: Meta.FlowLink) => l.targetId == n.uid) != -1;
      if (!checkLink) return false;
    } else if (n.type == NodeTypes.Send) {
      const checkLink = currFlowDef.value.links.findIndex((l: Meta.FlowLink) => l.targetId == n.uid) != -1;
      const checkFieldPerm = n.fieldPerm?.findIndex((p: Meta.FieldPerm) => p.viewPerm) != -1;
      if (!checkLink || n.carbonCopy?.length == 0 || !checkFieldPerm) return true;
    } else {
      const checkPreLink = currFlowDef.value.links.findIndex((l: Meta.FlowLink) => l.targetId == n.uid) != -1;
      const checkSufLink = currFlowDef.value.links.findIndex((l: Meta.FlowLink) => l.sourceId == n.uid) != -1;
      const checkFieldPerm = n.fieldPerm?.findIndex((p: Meta.FieldPerm) => p.viewPerm) != -1;
      let checkCandidates = false;
      if (ApproveType.LevelBySign == n.approveType) {
        // 除了逐级审批，其它都需要配置审批负责人
        checkCandidates = true;
      } else {
        checkCandidates = n.candidates!.length > 0;
      }
      // 校验通过为true，然后取反返回true；
      if (!checkPreLink || !checkSufLink || n.candidates?.length == 0 || !checkFieldPerm || !checkCandidates) return true;
    }
  })
  return reuslt?.length == 0 ;
}

// 启用流程
const activeFlow = (value: boolean) => {
  if (!updateFlowDef) return;
  // 校验流程定义：
  // 1、审批节点前后都至少一条连线；抄送节点不限制；开始有后连线，结束有前连线；
  // 2、节点负责人不能空；3、字段权限不能空；
  if (value) {
    if (checkFlowDef()) {
      currFlowDef.value.enable = true;
      updateFlowDef(currFlowDef.value);
    } else {
      window.$message?.warning("请检查是否完成连接线、节点负责人、字段权限等必要配置！")
    }
  } else {
    currFlowDef.value.enable = false;
    updateFlowDef(currFlowDef.value);
  }

}

const onFlowDefSelect = (option: any) => {
  currFlowDef.value = option;
}

// 删除节点或连线
const onDeleteClick = async () => {
  refSvg.value.onDeleteClick();
  await updateFlow();
}

// 移动流程图
const onFlowMoveClick = () => {
  refSvg.value.onFlowMoveClick(flowMove.value);
}

// 初始化流程图
const initFlow = async () => {
  if (refSvg.value) {
    refSvg.value.initFlowDef(currFlowDef.value.uid)
    refSvg.value.initSvg()
    refSvg.value.drawFlow();
  }
}

onMounted(() => {
  initFlow();
})

// 启动/停止流程、修改node、link名称等需要刷新图
watch(
  () => currFlowDef.value.enable,
  (newValue, oldValue) => {
    nextTick(() => {
      refSvg.value.reSetSvg();
      initFlow();
    })
  },
  { immediate: true, deep: true }
);

const cptCurrFlowDef = computed(() => {
  const { links, nodes } = currFlowDef.value;
  return { links, nodes }
})
watch(
  () => cptCurrFlowDef,
  (newValue, oldValue) => {
    nextTick(() => {
      if (!currFlowDef.value.enable) {
        refSvg.value.initFlowDef(currFlowDef.value.uid)
        refSvg.value.drawFlow();
      }
    })
  },
  { immediate: true, deep: true }
);


</script>

<style lang="scss" scoped></style>
