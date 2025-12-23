<template>
  <NDrawer v-model:show="showModel" class="rounded-none select-none" height="100%" placement="bottom"
    :auto-focus="false">
    <NFlex vertical :size="0" class="h-full">
      <NFlex :size="0" class="h-12 shadow-md" align="center">
        <NFlex>
          <NButton text class="ml-4" size="small" :focusable="false">
            <WrapIcon icon="mdi:document" />
            <span class="text-base ml-2">{{ moduleNodeOption?.name }}</span>
          </NButton>
        </NFlex>
        <NFlex class="flex-1" justify="center">
          <NTabs @update-value="changeEditor" :default-value="tabValue" justify-content="center"
            tab-class="h-12 flex-center text-base w-30" animated>
            <template v-for="t in tabOption">
              <NTab v-if="t.types.includes(moduleNodeOption?.type as ModuleType)" :name="t.name">
                <span class="text-base">{{ t.title }}</span>
              </NTab>
            </template>
          </NTabs>
        </NFlex>
        <NFlex class="flex-none mr-2 w-56" justify="end">
          <NDropdown v-if="tabValue == TabName.BoardPane" trigger="click" :options="hiddenItemsOptions"
            @select="onShowHiddenItem">
            <NButton>
              <slot>
                <SvgIcon icon="lucide--view" class="text-base mr-1" />
                <span>显示隐藏组件</span>
              </slot>
            </NButton>
          </NDropdown>
          <!-- <ButtonIcon ref="refBtnPreview" @click="onPreviewClick" level='' icon="fluent--preview-link-24-regular" title="预览"/> -->
          <ButtonIcon ref="refBtnPreview" @click="closeEditor" level='' type="info" icon="tabler--check" title="完成" />
        </NFlex>
      </NFlex>
      <NFlex class="flex-1 overflow-auto" :size="0" justify="center">
        <FormPane v-if="tabValue == TabName.FormPane"></FormPane>
        <FlowPane v-else-if="tabValue == TabName.FormFlowPane"></FlowPane>
        <FormExtConfig v-else-if="tabValue == TabName.FormExtConfig"></FormExtConfig>
        <FormPublish v-else-if="tabValue == TabName.FormPublish"
          :type="'form' == moduleNodeOption?.type ? 'form' : 'flow'">
        </FormPublish>
        <BoardPane v-else-if="tabValue == TabName.BoardPane"></BoardPane>
        <BoardPublish v-else-if="tabValue == TabName.BoardPublish"></BoardPublish>
      </NFlex>
    </NFlex>
    <BoardEditor ref="refBoardEditor"></BoardEditor>
  </NDrawer>
</template>

<script setup lang="ts">
import { ref, Ref, inject, nextTick, useTemplateRef, toRaw, provide } from 'vue'
import { MetaPrefix, FormElType, ModuleType, MenuEventType, AppRouteType, ProviderName, ApproveType, FormatType, FieldBindType, DividerShapes, BoardElType } from '@/enum'
import { UpdateVglConfig, UpdateCompConfig, UpdateLayoutEvent, DeleteComp } from './type'
import {
  fetchUpdateModuleConfig,
  fetchInsertModuleNode,
  fetchDeleteModuleComp,
  fetchGetModuleConfig,
  fetchUpdateNestModuleConfig,
  fetchAddNestModuleConfig
} from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import Uid from '@/utils/uid';
import { NodeTypes, NodeNames, NodeIcons, NodeIconColors, IconsPathD } from './flow-pane/shared';
import { isEmpty } from 'radashi';
import { FocusTrap } from 'vueuc';

let currModuleNode = inject<Ref<Meta.ModuleNode>>(ProviderName.CurrModuleNodeProvide);


const enum TabName {
  FormPane = 'formPane',
  FormFlowPane = 'formFlowPane',
  FormExtConfig = 'formExtConfig',
  FormPublish = 'formPublish',
  BoardPane = 'boardPane',
  BoardPublish = 'boardPublish'
}
const tabOption = ref([
  { id: 1, types: [ModuleType.Form, ModuleType.Flow], name: TabName.FormPane, title: '表单设计' },
  { id: 2, types: [ModuleType.Flow], name: TabName.FormFlowPane, title: '流程设计' },
  { id: 3, types: [ModuleType.Form, ModuleType.Flow], name: TabName.FormExtConfig, title: '扩展配置' },
  { id: 4, types: [ModuleType.Form, ModuleType.Flow], name: TabName.FormPublish, title: '表单发布' },

  { id: 5, types: [ModuleType.Board], name: TabName.BoardPane, title: '仪表盘设计' },
  { id: 6, types: [ModuleType.Board], name: TabName.BoardPublish, title: '仪表盘发布' },
])

const { routerPush, routerPushByKey } = useRouterPush();
const btnPreview = useTemplateRef('refBtnPreview');
const hiddenItemsOptions = ref([] as any)
const refBoardEditor = ref();
const currAppId = ref(null as any);
const showModel = ref(false);
const tabValue = ref();
const moduleNodeOption = ref<Meta.ModuleNode>();

/** 当前选中的组件 */
const currSelectFlowEl = ref<any>(null);
const currSelectCompId = ref<string>('');
const formLayouts = ref<Array<Meta.LayoutNode>>([]);
const compConfigs = ref<Array<Meta.CompBase>>([]);
const formConfig = ref<Meta.FormConfig>({});
const flowDefs = ref<Array<Meta.FlowDefinition>>([]);
const layoutConfig: Ref<Meta.FormLayoutConfig> = ref({} as any);
const defVglConfig: Ref<Meta.FormLayoutConfig> = ref({} as any);
const vglConfig: Ref<Partial<Meta.FormLayoutConfig>> = ref({} as any);

const updateFlowDef = async (flowDef: Meta.FlowDefinition) => {
  if (moduleNodeOption.value?.moduleConfig_id) {
    await fetchUpdateNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { flowDefs: [flowDef] });
  }
}

const onShowHiddenItem = async (e: any, option: any) => {
  const node = formLayouts.value[option.uid];
  const comp = node.hiddenItems?.find((item: any) => item.i == option.value.i);
  const isDup = node.layout?.findIndex((item: any) => item.i == option.value.i) == -1;
  if (moduleNodeOption.value?.moduleConfig_id && comp && isDup) {
    node.layout = [...node.layout, comp];
    node.hiddenItems = node.hiddenItems?.filter((item: any) => item.i != option.value.i);
    node['initFlag'] = Uid.NextNumber();    // 通知刷新布局
    // uid > 0 时嵌套组件容器如果隐藏也需要处理；
    if (option.uid > 0) {
      // uid从compConfigs中查找nestUid.included(uid) => i;
      const pCompConfig = compConfigs.value.find((config: any) => config.nestUid.included(option.uid));
      const pNode = formLayouts.value[pCompConfig?.uid];
      let pComp = pNode.hiddenItems?.find((item: any) => item.i == pCompConfig?.i);
      if (pComp) {
        pNode.layout.push(pComp);
        pNode.hiddenItems = pNode.hiddenItems?.filter((item: any) => item.i != pCompConfig?.i);
        pNode['initFlag'] = Uid.NextNumber();    // 通知刷新布局
        await fetchUpdateNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { layouts: [pNode, node] });
        hiddenItemsOptions.value = hiddenItemsOptions.value.filter((h: any) => h.key != option.value.i || h.key != pCompConfig?.i);
      }
    } else {
      await fetchUpdateNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { layouts: [node] });
      hiddenItemsOptions.value = hiddenItemsOptions.value.filter((h: any) => h.key != option.value.i);
    }
  }
}

// 生成字段名称，固定前缀+i
const getFieldName = (newComp: Meta.LayoutItem) => {
  // 2025.9.23 qyk: 扩展所有组件类型定制集合前缀
  let fieldName = `${MetaPrefix[newComp.type as FormElType]}${newComp.i}`;
  return fieldName;
}

const initBoardCompConfig = (layoutUid: number, newComp: Meta.LayoutItem) => {
  let config = {
    nodeUid: layoutUid,
    i: newComp.i,
    type: newComp.dragData.type,
    title: '未命名' + newComp.dragData.title,
  } as Meta.ChartComp
  return config;
}
// 根据组件类型初始化必要的默认属性值
// 全部参数初始化，确保切换组件后配置面板无需再初始化；
const initCompConfig = (layoutUid: number, newComp: Meta.LayoutItem) => {
  let fieldName = getFieldName(newComp);
  let config: Meta.CompConfig = {
    nodeUid: layoutUid,
    i: newComp.i,
    type: newComp.dragData.type,
    title: newComp.dragData.title, // 数据集合字段中文显示名

    fieldName: fieldName,      // 数据集合字段名
    // fieldAlias: newComp.dragData.title, // 数据集合字段中文显示名
    fieldValue: null,

    placeholder: '',
    showTitle: true,
    viewPerm: true      // 可见
  } as any;
  switch (newComp.dragData.type) {
    case FormElType.FeText:
      config = {
        ...config,
        formatType: FormatType.None,
        defValueType: FieldBindType.Custom,
        defValue: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        mappedFieldNames: [],
        formula: null,

        required: false,
        unique: false,
        lengthRange: null,
        editPerm: true,
      };
      break;
    case FormElType.FeNumber:
      config = {
        ...config,
        formatType: FormatType.Number,
        defValueType: FieldBindType.Custom,
        defValue: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        decimalPlaces: null,
        cascadeFilters: [],
        mappedFieldNames: [],
        formula: null,

        required: false,
        numberRange: null,
        editPerm: true,
      };
      break;
    case FormElType.FeTextArea:
      config = {
        ...config,
        defValueType: FieldBindType.Custom,
        defValue: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        mappedFieldNames: [],
        formula: null,

        required: false,
        editPerm: true,
      };
      break;
    case FormElType.FeSelect:
      config = {
        ...config,
        listType: FieldBindType.Custom,
        defValue: null,
        listItems: [
          { label: '选项1', value: Uid.NextNumber(), selected: false },
          { label: '选项2', value: Uid.NextNumber(), selected: false },
        ],
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        mappedFieldNames: [],
        controlRules: [],
        canCustomItem: false,

        required: false,
        unique: false,
        editPerm: true,
      }
      break;
    case FormElType.FeMulSelect:
      config = {
        ...config,
        listType: FieldBindType.Custom,
        defValue: [],
        listItems: [
          { label: '选项1', value: Uid.NextNumber(), selected: false },
          { label: '选项2', value: Uid.NextNumber(), selected: false },
        ],
        selectRange: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        mappedFieldNames: [],
        canCustomItem: false,
        required: false,
        editPerm: true,
      }
      break;
    case FormElType.FeDeptSelect:
      config = {
        ...config,
        defValue: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        required: false,
        unique: false,
        editPerm: true,
      };
      break;
    case FormElType.FeMulDeptSelect:
      config = {
        ...config,
        selectRange: null,
        defValue: [],
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        required: false,
        editPerm: true,
      };
      break;
    case FormElType.FeUserSelect:
      config = {
        ...config,
        defValue: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        required: false,
        unique: false,
        editPerm: true,
      };
      break;
    case FormElType.FeMulUserSelect:
      config = {
        ...config,
        selectRange: null,
        defValue: [],
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        required: false,
        editPerm: true,
      };
      break;
    case FormElType.FeRadioGroup:
      config = {
        ...config,
        listVertical: false,
        defValue: null,
        listItems: [
          { label: '选项1', value: Uid.NextNumber(), selected: false },
          { label: '选项2', value: Uid.NextNumber(), selected: false },
        ],
        mappedFieldNames: [],
        required: false,
        editPerm: true,
      }
      break;
    case FormElType.FeCheckboxGroup:
      config = {
        ...config,
        listVertical: false,
        defValue: [],
        listItems: [
          { label: '选项1', value: Uid.NextNumber(), selected: false },
          { label: '选项2', value: Uid.NextNumber(), selected: false },
        ],
        mappedFieldNames: [],
        selectRange: null,
        required: false,
        editPerm: true,
      }
      break;
    case FormElType.FeDatetime:
      config = {
        ...config,
        formatType: FormatType.Date,
        defValueType: FieldBindType.CurrentValue,
        defValue: null,
        dataLimit: null,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        mappedFieldNames: [],
        formula: null,
        required: false,
        editPerm: true,
      }
      break;
    case FormElType.FeDataSelect:
      config = {
        ...config,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        mapFields: [],
        required: false,
        unique: false,
        editPerm: true,
      }
      break;
    case FormElType.NestEditTable:
      config = {
        ...config,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
        },
        cascadeFilters: [],
        mappedFieldNames: [],
        selectRange: null,
        required: false,
        editPerm: true,
      }
      break;
    case FormElType.NestTabPane:
      config = {
        ...config,
        nestUid: [],
        tabs: [],
        style: { type: 'card' },      // type: 'bar' | 'line' | 'card' | 'segment'
      }
      break;
    case FormElType.NestViewTable:
      config = {
        ...config,
        relation: {
          module_id: '',
          moduleConfig_id: '',
          collName: '',
          fieldName: null,
          sortFieldName: null,
          descSort: false,
          addPerm: false,
        },
        cascadeFilters: [],
        viewPerm: true
      }
      break;
    case FormElType.FeDivider:
      config = {
        ...config,
        style: {
          color: 'transparent',
          textColor: 'default',
          textAlign: 'left',
          lineType: 'solid',
          lineWidth: '1px',
          shapeType: DividerShapes.RoundedTSm,
        },
        viewPerm: true
      }
      break;
    case FormElType.FeAddress:
      config = {
        ...config,
        viewPerm: true,
        editPerm: true,
      }
      break;
    case FormElType.FeAttachment:
      config = {
        ...config,
        viewPerm: true,
        editPerm: true,
      }
      break;
    case FormElType.FeImage:
      config = {
        ...config,
        viewPerm: true,
        editPerm: true,
      }
      break;
    case FormElType.FeButton:
      config = {
        ...config,
        viewPerm: true,
        editPerm: true,
      }
      break;
    case FormElType.FeMobileNumber:
      config = {
        ...config,
        viewPerm: true,
        editPerm: true,
      }
      break;
    case FormElType.FeSequenceId:
      config = {
        ...config,
        sequenceRule: {
          fixedString: '',
          dateString: 'YYYYMMDD',
          counterLength: 5,
          counterType: 'never',
          subRuleOrder: ['fixedString', 'dateString']
        },
        viewPerm: true,
      }
      break;
    case FormElType.FeSignature:
      config = {
        ...config,
        viewPerm: true,
        editPerm: true,
      }
      break;

  }

  return config;
}

// 新增组件
const addNewComp = async (layoutUid: number, newComp: Meta.LayoutItem) => {
  let config: Meta.CompBase = {} as any;

  // 新增Form组件   // todo：图表、表格、。。。。归纳对象结构
  if (ModuleType.Board == moduleNodeOption.value?.type) {
    config = initBoardCompConfig(layoutUid, newComp)
  } else {
    config = initCompConfig(layoutUid, newComp);
  }

  compConfigs.value.push(config);
  currSelectCompId.value = newComp.i;
  newComp.event = null;

  if (moduleNodeOption.value?.moduleConfig_id) {
    // if ([FormElType.NestTabPane, FormElType.NestEditTable, FormElType.Nest].includes(newComp.type as FormElType)) {
    if (newComp.type?.startsWith(FormElType.Nest)) {
      const newLayoutUid = Uid.NextNumber();
      config['nestUid'] = [newLayoutUid];
      if (FormElType.NestTabPane == newComp.type) {
        config['tabs'] = [{ name: '标签1', uid: newLayoutUid }];
      }
      await fetchAddNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { compConfigs: [config as Meta.CompConfig] });
      // 新增嵌套布局提交，顶层布局在打开窗口创建模块节点方法已经初始化；
      await fetchAddNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { layouts: [{ uid: newLayoutUid, layout: [] }] });
    } else {
      await fetchAddNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { compConfigs: [config as Meta.CompConfig] });
    }
  }

}

// 更新布局及新增组件，【Gridlayout同步方法，不可以在此方法中初始化模块，触发循环！！】；
const updateLayoutsEvent: UpdateLayoutEvent = async (layoutNode: Meta.LayoutNode) => {
  // 保存更新布局
  const layout = layoutNode.layout.map((item: any) => {
    const { i, x, y, w, h, type } = item;
    return { i, x, y, w, h, type }
  });
  const hiddenItems = layoutNode.hiddenItems?.map((item: any) => {
    // 同步隐藏列表 hiddenItemsOptions
    if (hiddenItemsOptions.value.findIndex((h: any) => h.key == item.i) == -1) {
      hiddenItemsOptions.value.push({
        label: compConfigs.value.find((config: any) => item.i == config.i)?.title,
        key: item.i,
        uid: layoutNode.uid,
        value: item
      })
    }
    const { i, x, y, w, h, type } = item;
    return { i, x, y, w, h, type }
  });


  if (moduleNodeOption.value?.moduleConfig_id && layout?.length > 0) {
    const layoutOption: Meta.LayoutNode = { uid: layoutNode.uid, layout: layout, hiddenItems: hiddenItems };
    // 更新布局
    await fetchUpdateNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { layouts: [layoutOption] });
    const currNode = formLayouts.value.find((node: any) => node.uid == layoutNode.uid);
    if (currNode) { // 布局已存在更新
      currNode.layout = layout;
      currNode.hiddenItems = hiddenItems;
    } else {
      formLayouts.value.push(layoutOption); // 嵌套布局在缓存对象中不存在则添加
    }
  }

  if (layoutNode.layout?.length > 0) {
    // 新增组件新增配置
    let newComp = layoutNode.layout?.find((comp: any) => comp.event == 'add');
    if (newComp && moduleNodeOption.value?.moduleConfig_id) {
      await addNewComp(layoutNode.uid, { ...newComp });
      newComp.event = null;   // 嵌套组件不清空'add'会导致重复添加空布局；
    }
  }
};

// 更新组件配置
const updateCompConfigs: UpdateCompConfig = async (config: Meta.CompConfig) => {
  // 传参数更新指定属性
  if (moduleNodeOption.value?.moduleConfig_id && config) {
    await fetchUpdateNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { compConfigs: [config] });
  }
}

// 更新组件配置
const updateVglConfig: UpdateVglConfig = async (config: Partial<Meta.FormLayoutConfig>) => {
  // 传参数更新指定属性
  if (moduleNodeOption.value?.moduleConfig_id) {
    await fetchUpdateModuleConfig(moduleNodeOption.value?.moduleConfig_id, { vglConfig: config });
    await initModuleData();
  }
}

// 删除组件
const deleteComp: DeleteComp = async (uid: number, i: string) => {
  // 基于uid找到对应的布局，删除组件【i】
  const layouts = formLayouts.value.find((l: any) => l.uid == uid);
  const newLayout = layouts?.layout.filter((item: any) => item.i != i);

  if (moduleNodeOption.value?.moduleConfig_id) {
    const layoutOption = { uid: uid, layout: newLayout ? newLayout : [] };
    // 更新布局
    await fetchUpdateNestModuleConfig(moduleNodeOption.value?.moduleConfig_id, { layouts: [layoutOption] });
    // 如果是嵌套元素需要删除子布局
    const delComp = compConfigs.value.find((comp: any) => comp.i == i);
    if (delComp?.nestUid && delComp?.nestUid?.length > 0) {
      // 删除嵌套布局
      await fetchDeleteModuleComp(moduleNodeOption.value?.moduleConfig_id, { layouts: { uid: { $in: delComp.nestUid } } });
      // 删除嵌套布局对应包含的所有组件
      await fetchDeleteModuleComp(moduleNodeOption.value?.moduleConfig_id, { compConfigs: { nodeUid: { $in: delComp.nestUid } } })
    }
    // 删除组件配置
    await fetchDeleteModuleComp(moduleNodeOption.value?.moduleConfig_id, { compConfigs: { i: i } })

    await initModuleData();    // todo: 低优先级： 是否可以更新本地对象而不需要刷新，步骤比较多是否划算？
  }
}


/** 初始化，清空 */
const init = async () => {
  currSelectFlowEl.value = null;
  currSelectCompId.value = '';
  formLayouts.value.length = 0;
  compConfigs.value.length = 0;
  formConfig.value = {} as any;
  flowDefs.value.length = 0;
  hiddenItemsOptions.value.length = 0;
}

/** 查询初始化数据 */
const initModuleData = async () => {
  // 查询模块配置并初始化；
  if (moduleNodeOption.value?.moduleConfig_id) {
    const result = await fetchGetModuleConfig(moduleNodeOption.value?.moduleConfig_id);
    if ('ok' == result.msg) {
      init(); // ！！！在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
      if (moduleNodeOption.value?.type == ModuleType.Board) {
        tabValue.value = TabName.BoardPane;
      } else {
        tabValue.value = TabName.FormPane;
      }
      vglConfig.value = result.data[0].vglConfig;
      defVglConfig.value = result.data[0].defVglConfig;
      // vglConfig 不存在，或者配置：默认，取defVglConfig
      if (isEmpty(result.data[0].vglConfig)) {
        layoutConfig.value = result.data[0].defVglConfig;
      } else {
        layoutConfig.value = { ...result.data[0].defVglConfig, ...result.data[0].vglConfig };
      }
      result.data[0].compConfigs?.length > 0 && (compConfigs.value.push(...result.data[0].compConfigs));
      Object.keys(result.data[0].formConfig)?.length > 0 && (formConfig.value = { ...result.data[0].formConfig });
      result.data[0].flowDefs?.length > 0 && flowDefs.value.push(...result.data[0].flowDefs);
      // 初始化布局，并添加监听标记
      if (result.data[0].layouts?.length > 0) {
        result.data[0].layouts?.forEach((node: any) => {
          formLayouts.value.push({ ...node, initFlag: Uid.NextNumber() });
          // 初始化隐藏组件列表
          if (node.hiddenItems && node.hiddenItems?.length > 0) {
            node.hiddenItems?.forEach((item: any) => {
              hiddenItemsOptions.value.push({
                label: compConfigs.value.find((config: any) => item.i == config.i)?.title,
                key: item.i,
                uid: node.uid,
                value: item
              })
            })
          }
        })
      }
    }
  }
}

const initFlowDef = () => {
  const nodesIds = [Uid.NextNumber(), Uid.NextNumber(), Uid.NextNumber()];
  const flowDef: Meta.FlowDefinition = {
    uid: Uid.NextNumber(),
    verId: 1,
    nodes: [    // 开始、结束节点位置固定在开始位置；
      {
        uid: nodesIds[0],
        name: NodeNames[NodeTypes.Start],
        type: NodeTypes.Start,
        x: 500,
        y: 100,
        hasLink: true,

        approveType: ApproveType.OrSign,
        candidates: [],
        orderSignEnd: '1',
        carbonCopy: [],
        fieldPerm: [],
        nodeOpt: {
          sendBack: false,
          addSign: false,
          transfer: false,
          cancel: false,
          reject: false,
        },
        opinion: false,
        sign: undefined
      },
      {
        uid: nodesIds[1],
        name: NodeNames[NodeTypes.End],
        type: NodeTypes.End,
        x: 500,
        y: 400,
        hasLink: true,

        approveType: ApproveType.OrSign,
        candidates: [],
        orderSignEnd: '1',
        carbonCopy: [],
        fieldPerm: [],
        nodeOpt: {
          sendBack: false,
          addSign: false,
          transfer: false,
          cancel: false,
          reject: false,
        },
        opinion: false,
        sign: undefined
      },
      {
        uid: nodesIds[2],
        name: NodeNames[NodeTypes.Approve],
        type: NodeTypes.Approve,
        x: 500,
        y: 250,
        hasLink: true,

        approveType: ApproveType.OrSign,
        candidates: [],
        orderSignEnd: '1',
        carbonCopy: [],
        fieldPerm: [],
        nodeOpt: {
          sendBack: false,
          addSign: false,
          transfer: false,
          cancel: false,
          reject: false,
        },
        opinion: false,
        sign: undefined
      },
    ],
    links: [
      {
        uid: Uid.NextNumber(),
        sourceId: nodesIds[0],
        sourcePos: 'bottom',
        targetId: nodesIds[2],
        targetPos: 'top',
        name: '',
        canditions: []
      },
      {
        uid: Uid.NextNumber(),
        sourceId: nodesIds[2],
        sourcePos: 'bottom',
        targetId: nodesIds[1],
        targetPos: 'top',
        name: '',
        canditions: []
      },
    ],
    enable: false
  }
  return flowDef;
}

const addModule = async (type: string, appId: string | null, pNode: any) => {
  init();// ！！！在await方法前执行init，如果连续刷新会导致init多次先执行而无法按预期初始化；
  tabValue.value = TabName.FormPane
  // 【form】类型初始配置
  // layoutConfig.value = layoutInitConfig.form;

  let pId = pNode ? pNode._id : appId;
  // 加载应用节点信息，初始展示首页（无首页绑定则展示初始页）,添加组件不创建模块配置；
  moduleNodeOption.value = {
    _id: '',
    app_id: appId,
    name: '未命名表单',
    icon: 'document',
    iconColor: '#29f4de',
    parent_id: pId,
    suf_id: null,
    type: ModuleType.Form,
    moduleConfig_id: '',
    en_id: ''
  }

  // moduleConfig 初始化值
  const moduleConfig: Meta.ModuleConfig = {
    app_id: '',
    moduleType: ModuleType.Form,
    formConfig: {},
    vglConfig: {},
    layouts: [{ uid: 0, layout: [] }],    // 初始化顶层布局容器uid:0
    compConfigs: [],
    flowDefs: [],
    ext: {},
    publish: {},
    dataSync: [],
    en_id: ''
  }

  if (type == MenuEventType.AddFormModule) {  // 添加表单
    moduleConfig.moduleType = ModuleType.Form;
    moduleConfig.formConfig = {
      collName: `${MetaPrefix.Coll}${Uid.NextNumber()}`,
      collAlias: moduleNodeOption.value.name,
      // 以下已废弃：统一到布局配置中；
      // triggerType: 'none',
      // lablePlace: 'left',
      // lableAlign: 'left',
      // lableWidth: 100
    };
  } else if (type == MenuEventType.AddFlowModule) {   // 添加流程表单
    moduleNodeOption.value.type = ModuleType.Flow;
    moduleNodeOption.value.name = '未命名流程表单';
    moduleConfig.moduleType = ModuleType.Flow;
    moduleConfig.formConfig = {
      collName: `${MetaPrefix.Coll}${Uid.NextNumber()}`,
      collAlias: moduleNodeOption.value.name,
      triggerType: 'none',
      lablePlace: 'left',
      lableAlign: 'left',
      lableWidth: 100
    };
    let flow: Meta.FlowDefinition = initFlowDef();
    moduleConfig.flowDefs?.push(flow);
    flowDefs.value.push(flow);
  } else if (type == MenuEventType.AddBoardModule) {   // 添加仪表板
    tabValue.value = TabName.BoardPane;
    // layoutConfig.value = layoutInitConfig.board;
    moduleNodeOption.value.name = '未命名仪表盘';
    moduleNodeOption.value.type = ModuleType.Board;
    moduleConfig.moduleType = ModuleType.Board;
  }
  const result = await fetchInsertModuleNode(moduleNodeOption.value, moduleConfig);
  if ('ok' == result.msg) {
    moduleNodeOption.value._id = result.data.insertedIds[0];
    // todo: result.data.insertedIds[1] 临时解决，多个id没有名字容易混淆，后续需要再优化
    moduleNodeOption.value.moduleConfig_id = result.data.insertedIds[1];
  } else {
    throw new Error(result.msg);
  }
  currModuleNode && moduleNodeOption.value && (currModuleNode.value = moduleNodeOption.value);    // 发布表单时要使用app_id module._id
}

const openEditor = async (type: string, appId: string | null, pNode: any) => {
  try {
    currAppId.value = appId;
    if (type == MenuEventType.AddFormModule || type == MenuEventType.AddFlowModule || type == MenuEventType.AddBoardModule) {
      await addModule(type, appId, pNode);
      await initModuleData();
    } else if (MenuEventType.EditModule == type) {
      moduleNodeOption.value = pNode;
      // 初始化
      await initModuleData();
    }
    nextTick(() => {
      showModel.value = true;
      btnPreview.value && btnPreview.value.setFoucs();
    })
  } catch (e: any) {
    window.$message?.error(e.message);
  }

}


const routeToBack = () => {
  routerPushByKey(AppRouteType.AppModule,
    {
      params: { id: moduleNodeOption.value?.moduleConfig_id as any },
      query: { app_id: currAppId.value, open: Uid.NextNumber().toString() }
    }
  );
  showModel.value = false;
}

const openChartEditor = (i: string) => {
  refBoardEditor.value.openEditor(i);
}

const onPreviewClick = () => {
  // 增加预览窗口
  console.log(compConfigs.value[0])
}

const changeEditor = (tab: TabName) => {
  tabValue.value = tab;
}

const closeEditor = () => {
  routeToBack();
  // 路由到新建的表单
}

// 使用 provide 提供 handleEvent 函数  todo: 抽取封装，和应用模块页面共用；
provide(ProviderName.UpdateFlowDefProvide, updateFlowDef);
provide(ProviderName.DeleteCompProvide, deleteComp);
provide(ProviderName.UpdateCompConfigsProvide, updateCompConfigs);
provide(ProviderName.UpdateLayoutsProvider, updateLayoutsEvent);
provide(ProviderName.UpdateVglConfigProvide, updateVglConfig);

provide(ProviderName.LayoutsProvide, formLayouts.value);
provide(ProviderName.FlowDefsPorvide, flowDefs.value);
provide(ProviderName.CompConfigsProvide, compConfigs.value);
provide<Ref<Meta.FormConfig>>(ProviderName.FormConfigProvider, formConfig);
provide(ProviderName.LayoutConfigProvide, layoutConfig);
provide(ProviderName.VglProvide, vglConfig);
provide(ProviderName.DefVglProvide, defVglConfig);
provide(ProviderName.OpenChartEditorProvide, openChartEditor);
provide<Ref<string>>(ProviderName.CurrSelectCompIdProvide, currSelectCompId);
provide<Ref<any>>(ProviderName.CurrSelectFlowElPovide, currSelectFlowEl);

defineExpose({
  openEditor
})

</script>

<style lang="scss" scoped></style>
