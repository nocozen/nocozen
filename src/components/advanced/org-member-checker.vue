<template>
  <ModalDialog ref="refChecker" @onOkClick="onOkClick" :title="cptTitle" footer modal-class="w-186 h-130">
    <NFlex class="pl-4" :size="0">
      <NFlex vertical class="w-94 h-106 border-r-1" :size="0">
        <NTabs type="line" v-model:value="tabValue">
          <NTab v-if="orgType.includes(MemberCheckerType.Dept)" :name="MemberCheckerType.Dept" tab="部门"></NTab>
          <NTab v-if="orgType.includes(MemberCheckerType.Role)" :name="MemberCheckerType.Role" tab="角色"></NTab>
          <NTab v-if="orgType.includes(MemberCheckerType.Member)" :name="MemberCheckerType.Member" tab="成员"></NTab>
          <NTab v-if="orgType.includes(MemberCheckerType.Dynamic)" :name="MemberCheckerType.Dynamic" tab="联动负责人"></NTab>
          <NTab v-if="orgType.includes(MemberCheckerType.DynamicHead)" :name="MemberCheckerType.DynamicHead" tab="联动主管">
          </NTab>
        </NTabs>
        <NFlex vertical v-show="orgType.includes(MemberCheckerType.Dept) && MemberCheckerType.Dept == tabValue"
          class="h-92">
          <SmoothScrollbar>
            <ModuleTree :deptCascade="deptCascade" checkable ref="refDeptTree" checkboxPlace="right"
              @onChecked="onDeptNodeChecked" type="dept" />
          </SmoothScrollbar>
          <NCheckbox v-if="deptCascadeConfig" v-model:checked="deptCascade">包含子部门</NCheckbox>
        </NFlex>
        <NFlex v-show="orgType.includes(MemberCheckerType.Role) && MemberCheckerType.Role == tabValue" class="h-92">
          <SmoothScrollbar>
            <ModuleTree checkable ref="refRoleTree" checkboxPlace="right" @onChecked="onRoleNodeChecked" type="role" />
          </SmoothScrollbar>
        </NFlex>
        <NFlex v-show="orgType.includes(MemberCheckerType.Member) && MemberCheckerType.Member == tabValue"
          class="h-95 flex" :size="0">
          <NFlex class="w-54 h-95.5 border-r-1" :size="0">
            <SmoothScrollbar>
              <ModuleTree ref="refMemberTree" :checkable="false" @onNodeClick="onMemberNodeClick" type="dept" />
            </SmoothScrollbar>
          </NFlex>
          <NFlex class="w-39 h-95 ml-0.5 mt-0.5" align="center" :size="0">
            <SmoothScrollbar>
              <NFlex class="w-full" v-for="acc in currAccList" :key="acc.key" :size="0">
                <NButton class="w-full" @click="checkedAccount(acc)" size="small" quaternary :focusable="false">
                  <AccInfo class="w-50" :account="{ avatar: acc.avatar, name: acc.label }" textWidth="21" />
                  <NCheckbox :checked="acc.selected" :key="acc.key" />
                </NButton>
              </NFlex>
            </SmoothScrollbar>
          </NFlex>
        </NFlex>
        <NFlex v-show="orgType.includes(MemberCheckerType.Dynamic) && MemberCheckerType.Dynamic == tabValue">
          <SmoothScrollbar>
            <NList class="w-full p-1" clickable hoverable :show-divider="false">
              <NListItem style="padding: 4px 8px;" class="rounded-sm mx-0 w-full h-8" @click="checkedDynamic(acc)"
                v-for="acc in currDynamic" :key="acc.value">
                {{ acc.label }}
                <template #suffix>
                  <NCheckbox :checked="acc.selected" />
                </template>
              </NListItem>
            </NList>
          </SmoothScrollbar>
        </NFlex>
        <NFlex v-show="orgType.includes(MemberCheckerType.DynamicHead) && MemberCheckerType.DynamicHead == tabValue"
          :size="0">
          <NFlex class="w-51 h-95.5 border-r-1" :size="0">
            <SmoothScrollbar>
              <NList class="w-full p-1" clickable :show-divider="false">
                <NListItem style="padding: 4px 8px;"
                  :class="[dm.value == selectedDynamicHead.value ? 'bg-blue-100 hover:bg-blue-100' : 'hover:bg-gray-100']"
                  class="rounded-sm mx-0 px-0 w-full h-8" @click="checkedDynamicHead(dm)" v-for="dm in currDynamicHead"
                  :key="dm.value">
                  {{ dm.label }}
                </NListItem>
              </NList>
            </SmoothScrollbar>
          </NFlex>
          <NFlex class="w-41 h-95 ml-1 mt-0.5" align="center" :size="0">
            <SmoothScrollbar>
              <NList class="w-full p-0" clickable hoverable :show-divider="false">
                <NListItem style="padding: 4px 8px;" class="rounded-sm mx-0 px-0 w-full h-8"
                  @click="checkedTreeLevel(level)" v-for="(level, index) in currDeptLevels" :key="level.value">
                  {{ level.label }}
                  <template #suffix>
                    <NCheckbox :checked="level.selected" />
                  </template>
                </NListItem>
              </NList>
            </SmoothScrollbar>
          </NFlex>
        </NFlex>
      </NFlex>
      <NFlex vertical class="w-80 ml-4" :size="0">
        <NFlex class="text-gray-400 h-10" align="center"><span>选择结果</span></NFlex>
        <NFlex class="border-1 border-dashed h-94">
          <SmoothScrollbar>
            <NDynamicTags :render-tag="renderTags" v-model:value="checkedNodes" size="small" class="w-full p-1 h-fit">
              <template #trigger="{ activate, disabled }">
                <NButton class="w-62 h-full" text :disabled="disabled">
                </NButton>
              </template>
            </NDynamicTags>
          </SmoothScrollbar>
        </NFlex>
      </NFlex>
    </NFlex>
  </ModalDialog>
</template>


<script setup lang="ts">
import { ref, h, computed, watch } from 'vue';
import { NButton, TreeOption } from 'naive-ui';
import ModuleTree from '@/views/center/enterprise/users_internal/modules/ModuleTree.vue';
import { NTag } from 'naive-ui';
import { nextTick } from 'vue';
import { fetchGetAccounts } from '@/service/api';
import AccInfo from './acc-info.vue';
import IconTag from '@/components/advanced/tag-icon.vue';
import { useModuleInject } from '../form-editor/useModuleInject';
import { FormElType, MemberCheckerType, AllDeptLevels } from '@/enum';


// 流程节点：不级联；如果要完整兼容级联：需要配置的部门增加是否级联的属性，统一配置页并不完美；
interface Props {
  multiple?: boolean,
  // 如果要完整兼容级联：需要配置的部门增加是否级联的属性，统一配置页并不完美；
  deptCascadeConfig?: boolean,   // 【暂时未启用】是否允许配置部门动态包含下级部门
  defDeptCascade?: boolean       // 默认部门选择是否允许嵌套选择子部门
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  deptCascadeConfig: false,
  defDeptCascade: false
});

interface Emits {
  // orgType 单独使用部门或角色选择时使用
  (e: 'onCheckedOk', orgType: MemberCheckerType, values: Array<Meta.Tag>): void,
}

const emit = defineEmits<Emits>();

const deptCascade = ref(props.defDeptCascade);
let currPgOption = {} as any;
const selectedKeys = ref([] as any)
const currAccList = ref([] as any);
const orgType = ref([] as any);   // 'dept' 'role' 'member'
const refChecker = ref();
// 类型需要兼容：DynamicTagsOption { lable: string, value: any } , Base { _id: string, name: string }
const checkedNodes = ref([] as any);
const refDeptTree = ref();
const refRoleTree = ref();
const tabValue = ref();

const { compConfigs } = useModuleInject();

// 联动负责人
const currDynamic = ref([] as any)
// 联动主管 需要保存【部门级别】列表
const currDynamicHead = ref([] as any)

const createBy = { label: '流程发起人', value: 'createBy', dynamicType: 'createBy', type: MemberCheckerType.Dynamic, selected: false }
const selectedDynamicHead = ref(createBy);
const currDeptLevels = ref([] as any)

const cptTitle = computed(() => {
  if (orgType.value.length == 1) {
    if (orgType.value.includes('dept')) {
      return '选择部门'
    } else if (orgType.value.includes('role')) {
      return '选择角色'
    } else {
      return '选择成员'
    }
  } else {
    return '选择成员'
  }

})

const renderTag = (tag: Meta.Tag) => {
  if (MemberCheckerType.Dept == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple', title: tag.label })
  } else if (MemberCheckerType.Role == tag.type) {
    return h(IconTag, { icon: 'mdi:account-multiple-check', title: tag.label })
  } else if (MemberCheckerType.Member == tag.type) {
    return h(AccInfo, { account: { avatar: tag.avatar as any, name: tag.label as any } })
  } else if (MemberCheckerType.Dynamic == tag.type) {
    return h(IconTag, { icon: 'mdi:account', title: tag.label })
  } else if (MemberCheckerType.DynamicHead == tag.type) {
    return h(IconTag, { icon: 'mdi:account', title: tag.label })
  }
}

const renderTags = (tag: Meta.Tag, index: number) => {
  return h(
    NTag,
    {
      closable: true,
      onClose: () => {
        // checkedNodes.value.splice(index, 1);
        removeTag([tag]);
      }
    },
    {
      default: () => renderTag(tag)
    }
  )
}

const removeTag = (tags: Array<Meta.Tag>) => {
  if (tags.length == 0) return;
  const keys = tags.map((t: Meta.Tag) => t.value);
  // checkedNodes.value.splice(checkedNodes.value.findIndex((t: any) => t.value == tag.value), 1);
  checkedNodes.value = checkedNodes.value.filter((n: Meta.Tag) => !keys.includes(n.value));
  selectedKeys.value = selectedKeys.value.filter((k: string) => !keys.includes(k));
  refDeptTree.value && refDeptTree.value.removeCheckedKeys(keys);
  refRoleTree.value && refRoleTree.value.removeCheckedKeys(keys);
  currAccList.value?.forEach((acc: any) => {
    if (keys.includes(acc.value)) {
      acc.selected = false;
    }
  })
  currDynamic.value?.forEach((dm: any) => {
    if (keys.includes(dm.value)) {
      dm.selected = false;
    }
  })
}

const pushTag = (tag: Meta.Tag) => {
  if (props.multiple) {
    if (checkedNodes.value.findIndex((t: Meta.Tag) => t.value == tag.value) == -1) {
      checkedNodes.value.push(tag);
      selectedKeys.value.push(tag.value)
    }
  } else {
    checkedNodes.value = [tag];
    selectedKeys.value = [tag.value];
    initCheckedKey();
  }
}

// 部门树事件
const onDeptNodeChecked = (meta: { node: any, action: 'check' | 'uncheck', unCheckChildren?: Array<any> }) => {
  meta.unCheckChildren && removeTag(meta.unCheckChildren);
  if ('check' == meta.action) {
    pushTag({
      label: meta.node.label,
      value: meta.node.value,
      type: MemberCheckerType.Dept
    });
  } else {
    removeTag([{
      label: meta.node.label,
      value: meta.node.value,
      type: MemberCheckerType.Dept
    }]);
  }
}

// 角色树事件
const onRoleNodeChecked = (meta: { node: any, action: 'check' | 'uncheck', unCheckChildren?: Array<any> }, groupCheck?: boolean) => {
  meta.unCheckChildren && removeTag(meta.unCheckChildren);
  if ('check' == meta.action) {
    if (groupCheck) {
      meta.node.children?.forEach((c: any) => pushTag({
        label: c.label,
        value: c.value,
        type: MemberCheckerType.Role
      }));
    } else {
      pushTag({
        label: meta.node.label,
        value: meta.node.value,
        type: MemberCheckerType.Role
      });
    }
  } else {
    if (groupCheck) {
      // meta.node.children.forEach((c: any) => removeTag([c]));
      removeTag(meta.node.children);
    } else {
      removeTag([meta.node]);
    }
  }
}

const checkedAccount = (acc: any) => {
  if (acc.selected) {
    acc.selected = false;
    removeTag([acc]);
  } else {
    if (!props.multiple) {
      currAccList.value?.forEach((a: any) => a.selected = false);
    }
    acc.selected = true;
    pushTag(acc);
  }
}

// 选择成员，注意tagType: member
const onMemberNodeClick = async (option: any) => {
  currAccList.value = [];
  // 查询当前部门下所有账户
  const result = await fetchGetAccounts({ accExtFilter: { 'dept._id': option._id } });
  if ('ok' == result.msg && result.data.length > 0) {
    currAccList.value = result.data.map((d: any) => ({
      label: d.name,
      value: d.acc_id,
      type: 'member',
      avatar: d.avatar,
      selected: selectedKeys.value.includes(d.acc_id)
    }));
  }
}

// 联动负责人选择
const checkedDynamic = (dm: any) => {
  if (dm.selected) {
    dm.selected = false;
    removeTag([dm])
  } else {
    dm.selected = true;
    pushTag(dm)
  }
}

const resetDeptLevelsSelected = () => {
  currDeptLevels.value?.forEach((d: any) => {
    d.selected = selectedKeys.value.includes(selectedDynamicHead.value.value + "-" + d.value);
  })
}
// 联动主管 切换
const checkedDynamicHead = (dm: any) => {
  selectedDynamicHead.value = dm;
  resetDeptLevelsSelected();
}
// 联动主管 部门级别选择
const checkedTreeLevel = (levelTag: any) => {
  if (levelTag.selected) {
    levelTag.selected = false;
    removeTag([{
      value: selectedDynamicHead.value.value + "-" + levelTag.value,
      label: selectedDynamicHead.value.label + "-" + levelTag.label,
      dynamicType: selectedDynamicHead.value.dynamicType as any,
      type: MemberCheckerType.DynamicHead
    }])
  } else {
    levelTag.selected = true;
    pushTag({
      value: selectedDynamicHead.value.value + "-" + levelTag.value,
      label: selectedDynamicHead.value.label + "-" + levelTag.label,
      dynamicType: selectedDynamicHead.value.dynamicType as any,
      type: MemberCheckerType.DynamicHead
    })
  }
}

// 在调用组件中默认部门包含子部门，和当前组件无关
// 部门选项默认不允许同时选取下级部门，目前考虑没有需要同时选中上下级，有实际需求再分析
const onOkClick = () => {
  let values = checkedNodes.value.map((node: any) => ({
    value: node.value,
    label: node.label,
    dynamicType:
      node.dynamicType,
    type: node.type,
    avatar: node.avatar
  }));
  emit('onCheckedOk', orgType.value, values)
  refChecker.value.show(false);
}


const initTreeLevel = computed(() => {
  currDeptLevels.value = [] as any;
  if (refDeptTree.value) {
    currDeptLevels.value = AllDeptLevels.slice(0, refDeptTree.value.getTreeLevel())
    resetDeptLevelsSelected();
  }
  return currDeptLevels.value
})

watch(
  () => initTreeLevel,
  (newValue, oldValue) => {
    // console.log(newValue)
  },
  { immediate: true, deep: true }
);

const initDynamicFields = () => {
  // 直接冗余10个对应部门主管最大层级，避免处理获取树层级树时机和初始化时机问题；
  currDynamic.value = [];
  currDynamicHead.value = [];
  currDynamic.value.push({ ...createBy, selected: selectedKeys.value.includes('createBy') });
  currDynamicHead.value.push({ ...createBy });
  if (orgType.value.includes(MemberCheckerType.Dynamic) && compConfigs) {
    const allSelectType = [FormElType.FeUserSelect, FormElType.FeMulUserSelect, FormElType.FeDeptSelect, FormElType.FeMulDeptSelect];
    (compConfigs as Meta.CompConfig[])?.filter((c: Meta.CompConfig) => c.nodeUid == 0 &&
      allSelectType.includes(c.type as FormElType)
    ).map((c: Meta.CompConfig) => {
      const dynamicType = [FormElType.FeUserSelect, FormElType.FeMulUserSelect].includes(c.type as FormElType) ? MemberCheckerType.Member : MemberCheckerType.Dept;
      currDynamic.value.push({
        label: c.title,
        value: c.fieldName,
        dynamicType: dynamicType,
        type: MemberCheckerType.Dynamic,
        selected: selectedKeys.value.includes(c.fieldName),
      });
      if ([FormElType.FeUserSelect, FormElType.FeDeptSelect].includes(c.type as FormElType)) {
        // 注意：暂时不支持多选组件，如有必要添加多个单选组件代替即可；
        currDynamicHead.value.push({
          label: c.title,
          value: c.fieldName,
          dynamicType: dynamicType,
          type: MemberCheckerType.DynamicHead,
          selected: false,
        });
      }
    })
  }
}

const initCheckedKey = () => {
  if (orgType.value.includes(MemberCheckerType.Dept) && refDeptTree.value) {
    refDeptTree.value.initCheckedKeys(selectedKeys.value);
  } else if (orgType.value.includes(MemberCheckerType.Role) && refRoleTree.value) {
    refRoleTree.value.initCheckedKeys(selectedKeys.value);
  }

}

const init = async () => {
  currAccList.value = [];
  let pgOption = currPgOption;
  let memberSet = new Set();
  // 初始化树节点、tags;
  if ('deptAuth' in pgOption && pgOption.deptAuth && pgOption.deptAuth.length > 0) {
    pgOption.deptAuth?.forEach((d: Meta.Base) => {
      checkedNodes.value.push({
        label: d.name,
        value: d._id,
        type: 'dept',
      });
      memberSet.add(d._id)
    })
  }
  if ('roleAuth' in pgOption && pgOption.roleAuth && pgOption.roleAuth.length > 0) {
    pgOption.roleAuth?.forEach((d: Meta.Base) => {
      checkedNodes.value.push({
        label: d.name,
        value: d._id,
        type: 'role',
      });
      memberSet.add(d._id)
    })
  }
  if ('accountAuth' in pgOption && pgOption.accountAuth && pgOption.accountAuth.length > 0) {
    pgOption.accountAuth?.forEach((d: Meta.AccBase) => {
      checkedNodes.value.push({
        label: d.name,
        value: d._id,
        type: 'member',
        avatar: d.avatar
      });
      memberSet.add(d._id)
    })
  }
  if ('nodeMember' in pgOption && pgOption.nodeMember && pgOption.nodeMember.length > 0) {
    pgOption.nodeMember?.forEach((d: Meta.Tag) => {
      checkedNodes.value.push(d);
      memberSet.add(d.value)
    })
  }
  selectedKeys.value = Array.from(memberSet);
  initCheckedKey();
  initDynamicFields();
}

const show = async (
  types: Array<MemberCheckerType>,
  option: Partial<Meta.ModulePermGroup> & { nodeMember?: Array<Meta.Tag> }) => {
  currPgOption = option;
  checkedNodes.value = [];
  orgType.value = types;
  tabValue.value = types[0];
  refChecker.value.show(true);
  nextTick(async () => {
    await init();
  })
}

defineExpose({
  show,
})
</script>
