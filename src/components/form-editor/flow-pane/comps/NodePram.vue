<template>
  <NFlex vertical class="p-4 w-full font-medium mt-2">
    <template v-if="currSelectFlowEl && 'node' == currSelectFlowEl.elType && 'end' != currSelectFlowEl.nodeType">
      <span class="font-semibold" key="nodeTitle">
        <Asterisk />节点名称
      </span>
      <NInput v-model:value="selectedEl.name" @blur="updateFlow" size="small" placeholder=""></NInput>
      <template v-if="!['start', 'end'].includes(currSelectFlowEl.nodeType)">
        <template v-if="'approve' == currSelectFlowEl.nodeType">
          <span class="font-semibold" key="approveTypes">
            <Asterisk />节点类型
          </span>
          <NSelect v-model:value="selectedEl['approveType']" :defaultValue="approveTypes[0].value" size="small"
            placeholder="" :options="approveTypes" @blur="updateFlow" key="approveType" />
          <span class="font-semibold" key="candidates">
            <Asterisk />节点负责人
          </span>
          <NDynamicTags v-if="ApproveType.LevelBySign != selectedEl['approveType']" @click="openEditCandidates"
            :render-tag="renderTags" v-model:value="selectedEl.candidates" size="small"
            class="p-1 min-h-15 border-1 border-dashed w-full cursor-pointer">
            <template #trigger="{ activate, disabled }">
              <NButton v-if="selectedEl.candidates?.length == 0" class="w-62 h-full" text :disabled="disabled">
                <SvgIcon icon="mdi:plus"/>
                <span>选择成员或部门</span>
              </NButton>
            </template>
          </NDynamicTags>
          <template v-if="selectedEl['approveType'] == ApproveType.LevelBySign">
            <span>逐级审批终点</span>
            <NSelect v-model:value="selectedEl['orderSignEnd']" :options="orderSignEndLevel" defaultValue="1"
              size="small" key="orderSignEndLevel" @blur="updateFlow" />
          </template>
          <NCheckbox v-model:checked="carbonCopyChecked" size="small">抄送</NCheckbox>
        </template>
        <span v-if="'send' == currSelectFlowEl.nodeType" class="font-semibold" key="carbonCopy">
          <Asterisk />抄送人
        </span>
        <NDynamicTags v-if="carbonCopyChecked || 'send' == currSelectFlowEl.nodeType" @click="openEditCarbonCopy"
          :render-tag="renderTags" v-model:value="selectedEl.carbonCopy" size="small"
          class="p-1 min-h-15 border-1 border-dashed w-full cursor-pointer">
          <template #trigger="{ activate, disabled }">
            <NButton v-if="selectedEl.carbonCopy?.length == 0" class="w-62 h-full" text :disabled="disabled">
              <SvgIcon icon="mdi:plus"/>
              <span>选择成员或部门</span>
            </NButton>
          </template>
        </NDynamicTags>
      </template>
      <NTabs v-if="'send' != currSelectFlowEl.nodeType" type="segment" size="small" v-model:value="tabValue">
        <NTab name="fieldsPerm" tab="字段权限"></NTab>
        <NTab name="nodeOpt" tab="节点操作"></NTab>
      </NTabs>
      <span v-if="'send' == currSelectFlowEl.nodeType" class="font-semibold" key="nodePerm">字段权限</span>
      <FieldPermTable v-if="tabValue == 'fieldsPerm'" v-model:fieldList="selectedEl.fieldPerm" @update="updateFlow"
        key="fieldsPerm">
      </FieldPermTable>
      <NodeOpt v-else-if="tabValue == 'nodeOpt'" key="nodeOpt" v-model:opinion="selectedEl['opinion']" v-model:nodeOpt="selectedEl.nodeOpt"
        @update="updateFlow">
      </NodeOpt>
    </template>
    <template v-else-if="currSelectFlowEl && 'link' == currSelectFlowEl.elType">
      <span class="font-semibold">连线名称</span>
      <NInput v-model:value="selectedEl.name" @blur="updateFlow" size="small" placeholder="" clearable></NInput>
      <span class="font-semibold">数据流转条件</span>
      <NSelect v-model:value="currCanditionType" :options="linkOption" :defaultValue="CanditionType.Candition"
        size="small" key="CanditionType" />
      <CanditionEdit v-if="currCanditionType != CanditionType.Else" @openCanditionDialog="openCanditionDialog"
        :edit="selectedEl.canditions && selectedEl.canditions?.length > 0"></CanditionEdit>
    </template>
    <div v-else class="text-gray-500/50 flex justify-center">请选择可配置元素</div>
    <OrgMemberChecker ref="refMemberChecker" @onCheckedOk="onOrgMemCheckedOk"></OrgMemberChecker>
    <CanditionDialog ref="refCanditionDialog" @updateFlow="updateFlow" :canditions="selectedEl.canditions">
    </CanditionDialog>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, watch, h, toRaw } from 'vue';
import { useModuleInject } from '../../useModuleInject';
import { ApproveType, CanditionType, AllDeptDescLevels } from '@/enum';
import { FormElType, MemberCheckerType } from '@/enum';
import { NTag } from 'naive-ui';
import IconTag from '@/components/advanced/tag-icon.vue';
import AccInfo from '@/components/advanced/acc-info.vue';
import { merge } from 'radashi';

const currCanditionType = ref();
const currOpenType = ref<'candidates' | 'carbonCopy'>();
const refMemberChecker = ref();
const refCanditionDialog = ref();
const carbonCopyChecked = ref(false);
const approveTypes = ref([
  {
    label: '或签',
    value: ApproveType.OrSign
  },
  {
    label: '会签',
    value: ApproveType.JointSign
  },
  {
    label: '顺序',  // 选择动态关联连续多级部门主管可以替代【逐级】
    value: ApproveType.OrderSign
  },
  {
    label: '逐级',
    value: ApproveType.LevelBySign
  },
]);
const linkOption = ref([
  {
    label: '满足自定义条件时流转',
    value: CanditionType.Candition
  },
  {
    label: '自定义条件都不满足时流转',
    value: CanditionType.Else
  }
])
const orderSignEndLevel = ref([
  ...AllDeptDescLevels
])
const tabValue = ref<'fieldsPerm' | 'nodeOpt'>('fieldsPerm')

const { flowDefs, currSelectFlowEl, updateFlowDef, compConfigs } = useModuleInject();

// { defUid: data.uid, elUid: selectedEl.uid, elType: selectedEl.elType, nodeType: selectedEl.nodeType }
const selectedEl = ref({} as any);    // link、node
const currFlowDef = ref<Meta.FlowDefinition>({} as any)

const renderTag = (tag: Meta.Tag) => {
  if ('dept' == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple', title: tag.label })
  } else if ('role' == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple-check', title: tag.label })
  } else if ('member' == tag.type) {
    return h(AccInfo, { account: { avatar: tag.avatar as any, name: tag.label as any } })
  } else if ('dynamic' == tag.type) {
    return h(IconTag, { icon: 'mdi:account', title: tag.label })
  } else if ('dynamicHead' == tag.type) {
    return h(IconTag, { icon: 'mdi:account', title: tag.label })
  }
}

const renderTags = (tag: Meta.Tag, index: number) => {
  return h(
    NTag,
    {
      closable: false,
      // onClose: () => {
      // checkedNodes.value.splice(index, 1);
      // removeTag([tag]);
      // }
    },
    {
      default: () => renderTag(tag)
    }
  )
}

const onOrgMemCheckedOk = async (orgType: MemberCheckerType, values: Array<Meta.Tag>) => {
  // 成员选择需要增加：动态负责人：流程发起人、上级主管
  if ('candidates' == currOpenType.value) {
    selectedEl.value.candidates = values;
  } else if ('carbonCopy' == currOpenType.value) {
    selectedEl.value.carbonCopy = values;
  }
  // console.log(values)
  updateFlow();
}

const updateFlow = () => {
  if (currFlowDef.value.enable) {
    window.$message?.warning("已启用流程不允许修改，请停用后修改！")
  } else {
    // 更新指定版本的流程定义
    updateFlowDef && updateFlowDef(currFlowDef.value);
  }
}

const getFieldPermList = () => {
  // 生成树结构，
  let fieldPermList: Array<Meta.FieldPerm> = [] as any;
  if (compConfigs && compConfigs?.length > 0) {
    // 创建组件分组
    const configGroup = {} as any;
    compConfigs?.forEach((config: any) => {
      if (config.nodeUid in configGroup) {
        configGroup[config.nodeUid].push(config);
      } else {
        configGroup[config.nodeUid] = [config]
      }
    })
    // 遍历添加
    configGroup[0]?.forEach((c: Meta.CompConfig) => {
      if (FormElType.NestEditTable == c.type) {
        let fieldPerm: Meta.FieldPerm = {
          fieldType: c.type,
          fieldName: c.fieldName,
          // title: c.title,
          viewPerm: false,
          editPerm: false,
          children: []
        }
        if (c.nestUid && configGroup[c.nestUid[0]]?.length > 0) {
          fieldPerm.children = configGroup[c.nestUid[0]].map((nc: Meta.CompConfig) => ({
            fieldType: nc.type,
            fieldName: nc.fieldName,
            // title: nc.title,
            viewPerm: false,
            editPerm: false,
          }))
          fieldPermList.push(fieldPerm)
        }
      } else if (FormElType.NestTabPane == c.type) {
        c.nestUid?.forEach((uid: number) => {
          const tab = c.tabs?.find((t: Meta.Tab) => t.uid == uid);
          if (configGroup[uid]) {
            let fieldPerm: Meta.FieldPerm = {
              fieldType: c.type,
              fieldName: uid.toString(),
              // title: tab!.name,
              viewPerm: false,
              editPerm: false,
              children: []
            }
            fieldPerm.children = (configGroup[uid] || []).map((tc: any) => ({
              fieldType: tc.type,
              fieldName: tc.fieldName,
              title: tc.title,
              viewPerm: false,
              editPerm: false,
            }))
            fieldPermList.push(fieldPerm)
          }
        })
      } else if (FormElType.NestViewTable == c.type) {
        fieldPermList.push({
          fieldType: c.type,
          fieldName: c.fieldName,
          // title: c.title,
          viewPerm: false,
          editPerm: false,
        })
      } else {
        fieldPermList.push({
          fieldType: c.type,
          fieldName: c.fieldName,
          // title: c.title,
          viewPerm: false,
          editPerm: false,
          abstract: false
        })
      }

    });
  }
  return fieldPermList;
}

const initSelectNode = (newValue: any) => {
  flowDefs?.find((def: Meta.FlowDefinition) => {
    if (def.uid == newValue.value.defUid) {
      currFlowDef.value = def;
      if ('link' == newValue.value.elType) {
        def.links.find((link: any) => {
          link.uid == newValue.value.elUid && (selectedEl.value = link)
        })
      } else {
        def.nodes.find((node: Meta.FlowNode) => {
          if (node.uid == newValue.value.elUid) {
            // todo: 临时处理历史数据，因为修改nodeOpt数组改为对象；【正式发布时删除】
            if (!('nodeOpt' in node) || Array.isArray(node.nodeOpt)) {
              node.nodeOpt = {
                sendBack: false,
                addSign: false,
                transfer: false,
                cancel: false,
                reject: false,
              }
            }
            // todo: 临时处理历史数据，；【正式发布时删除】
            if (!('opinion' in node)) {
              node['opinion'] = false;
            }
            selectedEl.value = node;

            if (node.fieldPerm) {
              if (node.fieldPerm?.length == 0) {
                // fieldPerm 初始化：获取当前模块配置信息，生成一个数组：[{ fieldName:xx, title: xx, },{}]
                selectedEl.value.fieldPerm = getFieldPermList();
              } else {
                // radashi merge(顺序，属性覆盖)；
                // todo: radashi merge会用后边对象更新前面关联对象的属性；重新确认需求实现用radashi是否合理正确；
                selectedEl.value.fieldPerm = merge([...getFieldPermList()], [...toRaw(node.fieldPerm)], (f: any) => f.fieldName);
              }
            }

            if (node.candidates && node.candidates?.length > 0) {
              selectedEl.value.candidates = node.candidates;
            } else {
              selectedEl.value.candidates = [];
            }

            if (node.carbonCopy && node.carbonCopy?.length > 0) {
              selectedEl.value.carbonCopy = node.carbonCopy;
              carbonCopyChecked.value = true;
            } else {
              selectedEl.value.carbonCopy = [];
              carbonCopyChecked.value = false;
            }
          }
        })
      }
    }
  })
}

watch(
  () => currSelectFlowEl,
  (newValue, oldValue) => {
    if (newValue && newValue.value) {
      initSelectNode(newValue)
    }
  },
  { immediate: true, deep: true }
);
// const modal = useModal()

const openCanditionDialog = () => {
  refCanditionDialog.value.show();
}

const openEditCandidates = () => {
  currOpenType.value = 'candidates'
  refMemberChecker.value.show(['dept', 'role', 'member', 'dynamic', 'dynamicHead'], { nodeMember: toRaw(selectedEl.value.candidates) });
}

const openEditCarbonCopy = () => {
  currOpenType.value = 'carbonCopy'
  refMemberChecker.value.show(['dept', 'role', 'member', 'dynamic', 'dynamicHead'], { nodeMember: toRaw(selectedEl.value.carbonCopy) });
}
</script>
