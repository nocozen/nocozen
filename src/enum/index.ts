// soybean框架使用
export enum SetupStoreId {
  App = 'app-store',
  Theme = 'theme-store',
  Auth = 'auth-store',
  Route = 'route-store',
  Tab = 'tab-store'
}

export const enum ModuleType {
  App = 'app',
  Group = 'group',
  Form = 'form',
  Flow = 'flow',
  Board = 'board'
}

export const enum MetaField {
  En_id = 'en_id',
  App_id = 'app_id',
  Parent_id = 'parent_id',
  Suf_id = 'suf_id',
}

export const enum AppRouteType {
  AppInit = 'app_init',
  AppModule = 'app_module',
}

export const enum MenuEventType {
  AddPre = 'add-',
  AddFlowModule = 'add-flow-module',
  AddFormModule = 'add-form-module',
  AddBoardModule = 'add-board-module',

  EditModule = 'edit-module',
  EditBoardModule = 'edit-board-module',

  ModuleAddGroup = 'module-add-group',
  ModuleAddSubGroup = 'module-add-sub-group',
  ModuleGroupEditLabel = 'module-group-edit-label',
  ModuleEditLabel = 'module-edit-label',
  ModuleMove = 'module-move',
  ModuleDelete = 'module-delete',

  AppAdd = 'app-add',
  AppEditLable = 'app-edit-label',
  AppDelete = 'app-delete'
}

// const 无法在Object.values(VglDragType)中使用
export enum VglDragType {
  Default = 'Default',    // 包括所有可随意嵌套的基础组件
  BiChart = 'BiChart',
  NestEditTable = 'NestEditTable',    // 支持 Default 组件嵌入，不支持其它嵌套类型；
  NestTabPane = 'NestTabPane',   // 支持 Default EditTable 组件嵌入，不支持自己嵌入
  Nest = 'Nest'
}

export const enum FormElType {
  FeText = 'FeText',
  FeTextArea = 'FeTextArea',
  FeNumber = 'FeNumber',
  FeDatetime = 'FeDatetime',
  FeRadioGroup = 'FeRadioGroup',
  FeCheckboxGroup = 'FeCheckboxGroup',
  FeSelect = 'FeSelect',
  FeMulSelect = 'FeMulSelect',
  FeUserSelect = 'FeUserSelect',
  FeMulUserSelect = 'FeMulUserSelect',
  FeDeptSelect = 'FeDeptSelect',
  FeMulDeptSelect = 'FeMulDeptSelect',

  FeDivider = 'FeDivider',
  NestTabPane = 'NestTabPane',
  NestEditTable = 'NestEditTable',    // 表单录入时使用可编辑NTable
  NestViewTable = 'NestViewTable',

  FeImage = 'FeImage',
  FeAttachment = 'FeAttachment',
  FeAddress = 'FeAddress',
  FeButton = 'FeButton',
  FeDataSelect = 'FeDataSelect',
  FeSignature = 'FeSignature',
  FeSequenceId = 'FeSequenceId',
  FeMobileNumber = 'FeMobileNumber',

  Nest = 'Nest', // 布局容器，或做判断嵌套类型前缀使用； 图表中可使用，暂时未启用
}

// 组件分组
export const ElTypeGroup = {
  simpleTypes: [
    FormElType.FeText,
    FormElType.FeTextArea,
    FormElType.FeNumber,
    FormElType.FeDatetime,
  ],
  arrayTypes: [
    FormElType.FeCheckboxGroup,
    FormElType.FeMulSelect,
    FormElType.FeMulUserSelect,
    FormElType.FeMulDeptSelect,
  ],
  objectTypes: [
    FormElType.FeRadioGroup,
    FormElType.FeSelect,
    FormElType.FeUserSelect,
    FormElType.FeDeptSelect,
  ],
  // 值可用于过滤的组件
  filterTypes: [
    FormElType.FeText,
    FormElType.FeTextArea,
    FormElType.FeNumber,
    FormElType.FeDatetime,
    FormElType.FeRadioGroup,
    FormElType.FeCheckboxGroup,
    FormElType.FeSelect,
    FormElType.FeMulSelect,
    FormElType.FeUserSelect,
    FormElType.FeMulUserSelect,
    FormElType.FeDeptSelect,
    FormElType.FeMulDeptSelect,
  ],
  // 数据同步不可映射配置的类型
  notMapTypes: [
    FormElType.FeDivider,
    FormElType.FeButton,
    FormElType.Nest,
    FormElType.NestTabPane,
    FormElType.NestViewTable,
    FormElType.NestEditTable,
    FormElType.FeDataSelect
  ]
}

type MetaPrefixKeys = 'Coll' | 'Log' | FormElType; // 需要具体定义 FormElType 的联合类型
// 主要用于支持：服务端接口无法获取元数据时判断字段类型使用；
// 已使用：1、服务端mongodb接口【日期】类型处理；2、服务端流水号字段识别
// 针对mongodb存储字类型的映射：原则上增加组件类型，这样可以实现 组件类型-存储类型 1:1对应，方便扩展；
export const MetaPrefix: Record<MetaPrefixKeys, string> =  {
  Coll: '_mc_',      // 集合名称前缀
  Log: '_lg_',

  [FormElType.FeText]: '_tt_',
  [FormElType.FeTextArea]: '_ta_',
  [FormElType.FeNumber]: '_nb_',
  [FormElType.FeDatetime]: '_dt_',
  [FormElType.FeRadioGroup]: '_rd_',
  [FormElType.FeCheckboxGroup]: '_cb_',
  [FormElType.FeSelect]: '_st_',
  [FormElType.FeUserSelect]: '_us_',
  [FormElType.FeDeptSelect]: '_dp_',
  [FormElType.FeMulSelect]: '_ms_',
  [FormElType.FeMulUserSelect]: '_mu_',
  [FormElType.FeMulDeptSelect]: '_md_',

  [FormElType.NestEditTable]: '_et_',    // 表单录入时使用可编辑NTable
  [FormElType.NestViewTable]: '_vt_',

  [FormElType.FeImage]: '_ig_',
  [FormElType.FeAttachment]: '_am_',
  [FormElType.FeSignature]: '_sg_',

  [FormElType.FeAddress]: '_ad_',
  [FormElType.FeButton]: '_bt_',
  [FormElType.FeDataSelect]: '_ds_',
  [FormElType.FeSequenceId]: '_sq_',
  [FormElType.FeMobileNumber]: '_mn_',

  [FormElType.NestTabPane]: '_tp_',   // ?【无值类型】【无用】【仅避免编译提示】
  [FormElType.FeDivider]: '_dd_',    // 【无值类型】【无用】【仅避免编译提示】
  [FormElType.Nest]: '_tp__et__vt_',    // 【无用】【仅避免编译提示】
} as const

export const MetaPrefixGroup = {
  ObjectGroup: [MetaPrefix.FeRadioGroup, MetaPrefix.FeCheckboxGroup, MetaPrefix.FeSelect, MetaPrefix.FeUserSelect, MetaPrefix.FeDeptSelect],
  ArrayGroup: [MetaPrefix.FeMulSelect, MetaPrefix.FeMulDeptSelect, MetaPrefix.FeUserSelect]
} as any

export const FormElTypeIcon: Record<FormElType, string> = {
  [FormElType.FeText]: 'fluent--text-field-24-regular',
  [FormElType.FeTextArea]: 'ri--text-block',
  [FormElType.FeNumber]: 'mdi:numeric',
  [FormElType.FeDatetime]: 'material-symbols--date-range-outline',
  [FormElType.FeRadioGroup]: 'gg--radio-checked',
  [FormElType.FeCheckboxGroup]: 'mingcute--multiselect-line',
  [FormElType.FeSelect]: 'tabler--select',
  [FormElType.FeMulSelect]: 'fluent--task-list-square-ltr-24-regular',
  [FormElType.FeUserSelect]: 'tdesign--user',
  [FormElType.FeMulUserSelect]: 'heroicons-outline--user-group',
  [FormElType.FeDeptSelect]: 'pixelarticons--contact',
  [FormElType.FeMulDeptSelect]: 'pixelarticons--contact-multiple',

  [FormElType.FeDivider]: 'tabler--separator-horizontal',
  [FormElType.NestTabPane]: 'fluent--tab-desktop-24-regular',
  [FormElType.NestEditTable]: 'majesticons--table-plus-line',    // 表单录入时使用可编辑NTable
  [FormElType.NestViewTable]: 'material-symbols--table-eye-outline-rounded',

  [FormElType.FeImage]: 'mdi:image-outline',
  [FormElType.FeAttachment]: 'eva--cloud-upload-outline',
  [FormElType.FeAddress]: 'mdi:address-marker-outline',
  [FormElType.FeButton]: 'mdi:button-outline',
  [FormElType.FeDataSelect]: 'mdi:database-check-outline',
  [FormElType.FeSignature]: 'fluent--signature-24-regular',
  [FormElType.FeSequenceId]: 'tabler--number',
  [FormElType.FeMobileNumber]: 'uil--mobile-android-alt',

  //
  [FormElType.Nest]: 'lineicons--layout-9',    // 图表中使用
} as const

export const FormElTypeCn: Record<FormElType, string> = {
  [FormElType.FeText]: '单行文本',
  [FormElType.FeTextArea]: '多行文本',
  [FormElType.FeNumber]: '数字',
  [FormElType.FeDatetime]: '日期时间',
  [FormElType.FeRadioGroup]: '单选按钮组',
  [FormElType.FeCheckboxGroup]: '复选按钮组',
  [FormElType.FeSelect]: '下拉框',
  [FormElType.FeMulSelect]: '下拉复选框',
  [FormElType.FeUserSelect]: '成员单选',
  [FormElType.FeMulUserSelect]: '成员多选',
  [FormElType.FeDeptSelect]: '部门单选',
  [FormElType.FeMulDeptSelect]: '部门多选',

  [FormElType.FeDivider]: '分割线',
  [FormElType.NestTabPane]: '多页标签',
  [FormElType.NestEditTable]: '嵌套表单',    // 表单录入时使用可编辑NTable
  [FormElType.NestViewTable]: '关联表单',

  [FormElType.FeImage]: '图片',
  [FormElType.FeAttachment]: '附件',
  [FormElType.FeAddress]: '地址',
  [FormElType.FeButton]: '按钮',
  [FormElType.FeDataSelect]: '选择数据',
  [FormElType.FeSignature]: '手写签名',
  [FormElType.FeSequenceId]: '流水号',
  [FormElType.FeMobileNumber]: '手机号',

  [FormElType.Nest]: '布局容器', // 图表中使用
} as const

export const enum InputType {
  Text = 'text',
  Number = 'number',
  Timestamp = 'timestamp',

  // ObjArray = 'ObjArray',
  // Object = 'Object',
}

export const InputTypeCn: { [key: string]: string } = {
  [InputType.Text]: '文本',
  [InputType.Number]: '数字',
  [InputType.Timestamp]: '时间戳',

  // [InputType.ObjArray]: '数组',
  // [InputType.Object]: '对象',
} as const

export const InputTypeColor: { [key: string]: string } = {
  [InputType.Text]: 'success',
  [InputType.Number]: 'info',
  [InputType.Timestamp]: 'error',

  // [InputType.ObjArray]: 'warning',
  // [InputType.Object]: 'default',
} as const

export const enum WbElType {
  WbFlowCenter = 'WbFlowCenter',
  WbMyApps = 'WbMyApps',
  WbMyCharts = 'WbMyCharts',
  WbChart = 'WbChart',
  WbCarousel = 'WbCarousel',
  WbMyFavorites = 'WbMyFavorites',
  WbRecentUsed = 'WbRecentUsed',
  WbRich = 'WbRich',
  WbShortcut = 'WbShortcut',
  WbCalender = 'WbCalender'
}

export const enum BoardElType {
  BiChart = 'BiChart',
  BiDetailTable = 'BiDetailTable',  // 明细表
  BiPivotTable = 'BiPivotTable',    // 透视表
  BiViewTable = 'BiViewTable',  //
  BiEditTable = 'BiEditTable',
  BiDataList = 'BiDataList',
  BiCalendar = 'BiCalendar',
  BiGantt = 'BiGantt',

  BiImage = 'BiImage',
  BiRich = 'BiRich',
  BiClock = 'BiClock',
  BiShortcut = 'BiShortcut',
  BiNestPage = 'BiNestPage',

  BiFilter = 'BiFilter',
  BiButton = 'BiButton',

  Nest = 'Nest',
}
export const BiElTypeIcon: { [key: string]: string } = {
  [BoardElType.BiChart]: 'uil--chart',
  [BoardElType.BiDetailTable]: 'material-symbols--table-outline',
  [BoardElType.BiPivotTable]: 'gg--list',
  [BoardElType.BiEditTable]: 'material-symbols--table-edit-outline',
  [BoardElType.BiCalendar]: 'material-symbols--date-range-outline',
  [BoardElType.BiGantt]: 'lucide--square-chart-gantt',
  [BoardElType.BiImage]: 'mdi:image-outline',
  [BoardElType.BiRich]: 'fluent--text-field-24-regular',
  [BoardElType.BiClock]: 'mingcute--time-line',
  [BoardElType.BiShortcut]: 'ion--trail-sign-outline',
  [BoardElType.BiNestPage]: 'fluent--document-one-page-link-24-regular',
  [BoardElType.Nest]: 'lineicons--layout-9',
}

export const enum ChartType {
  Invert = 'invert_',

  Bar = 'bar',
  GroupBar = 'group-bar',
  StackBar = 'stack-bar',

  InvertBar = 'invert_bar',
  InvertGroupBar = 'invert_group-bar',
  InvertStackBar = 'invert_stack-bar',

  MultiLayer = 'multi-layer',
  MultiShape = 'multi-shape',

  Line = 'line',
  Area = 'area',
  Scatter = 'Scatter',
  Pie = 'pie',
  Ring = 'ring',
  Radar = 'radar',
  Funnel = 'funnel',
  Bubble = 'bubble',

  MetricCard = 'metric-card',
  ProgressRing = 'progress-ring',
  StatisTable = 'statis-table',
  DetailsTable = 'details-table'

}


export const ChartTypeIcon: { [key: string]: string } = {
  [ChartType.Bar]: 'material-symbols--bar-chart',
  [ChartType.GroupBar]: 'ri--bar-chart-grouped-fill',
  [ChartType.StackBar]: 'ic--twotone-stacked-bar-chart',
  [ChartType.InvertBar]: 'material-symbols--bar-chart',
  [ChartType.InvertGroupBar]: 'ri--bar-chart-grouped-fill',
  [ChartType.InvertStackBar]: 'ic--twotone-stacked-bar-chart',
  [ChartType.Line]: 'uil--chart-line',
  [ChartType.Area]: 'tdesign--chart-area-filled',
  [ChartType.Scatter]: 'lucide--chart-scatter',
  [ChartType.Pie]: 'ri--pie-chart-fill',
  [ChartType.Radar]: 'hugeicons--chart-radar',
  [ChartType.Funnel]: 'ant-design--funnel-plot-outlined',
  [ChartType.Bubble]: 'ic--round-bubble-chart',
  [ChartType.MetricCard]: 'fluent--clipboard-number-123-24-regular',
  [ChartType.ProgressRing]: 'solar--info-circle-broken',
}

export const enum ProviderName {
  CurrSelectFlowElPovide = 'currSelectFlowElPovide',
  LayoutConfigProvide = 'layoutConfigProvide',
  VglProvide = 'vglProvide',
  DefVglProvide = 'defVglProvide',
  LayoutsProvide = 'layoutsProvide',
  FlowDefsPorvide = 'flowDefsPorvide',
  FormConfigProvider = 'formConfigProvider',
  CompConfigsProvide = 'compConfigsProvide',
  CurrSelectCompIdProvide = 'currSelectCompIdProvide',
  UpdateLayoutsProvider = 'updateLayoutsProvider',
  UpdateCompConfigsProvide = 'updateCompConfigsProvide',
  DeleteCompProvide = 'deleteCompProvide',
  UpdateFlowDefProvide = 'updateFlowDefProvide',
  UpdateVglConfigProvide = 'updateVglConfigProvide',

  ModuleFormEventProvide = 'moduleFormEventProvide',

  RefreshMenuProvide = 'refreshMenuProvide',
  OpenModuleAddProvide = 'openModuleAddProvide',
  OpenModuleEditProvide = 'openModuleEditProvide',
  OpenChartEditorProvide = 'openChartEditorProvide',

  CurrModuleNodeProvide = 'currModuleNodeProvide',


}

// 文本 日期 数字；
export const enum BiType {
  Date = 'bi-date',
  Text = 'bi-text',
  Number = 'bi-number'
}
/**
 * 基础类型，字典类型，关联类型
 * 目的：基于mongo类型，逐步严格定义输入类型；
 */
export const enum MetaFieldType {
  String = 'string',    // 密码、单行文本、多行文本；枚举类型选择（单选、多选、树选）
  Password = 'password',
  Number = 'number',    // 单行文本、多行文本；枚举类型选择（单选、多选、树选）
  Date = 'date',    // 各种日期类型输入；枚举类型选择（单选、多选、树选）
  DateTime = 'dateTime',
  // Boolean = 'boolean',    // 不存在这种情况，对应枚举类型

  Dict = 'dict',      // metaFieldConfig: { bindCollName: xx, bindLabel: xx, bindValue: xx}
  Refer = 'refer',     // metaFieldConfig: { bindCollName: xx, bindLabel: xx, bindValue: xx}
  Enum = 'enum',            // metaFieldConfig: { bindValues: [ ] }
  Nest = 'nest',            // 嵌套对象
  ReferParentId = 'referParentId',    // 树结构父级节点
  Order = 'order',    // 排序字段

  Array_Nest = 'array_nest',            // 嵌套对象集合；例如：订单和订单明细
  Array_Refer = 'array_refer',     //
  Array_Enum = 'array_enum',            //

  Array_Prefix = 'array_'     // 前缀：枚举类型选择（多选、树选）
}

export const enum CanditionType {
  None = 'none',
  Candition = 'candition',
  Else = 'else'
}

export const enum ApproveType {
  JointSign = 'jointSign',        // 会签(并行会签)
  OrSign = 'orSign',              // 或签/任一
  LevelBySign = 'levleBySign',    // 逐级
  OrderSign = 'orderSign',        // 顺序会签
  VoteSign = 'voteSign'           // 票签：按比例确定
}

export const enum ComplatedState {
  Draft = 'draft',
  Review = 'review',
  Confirmed = 'confirmed',
  Cancel = 'cancel'
}

// todo: 重构：名称修改：TaskOpt
const enum BaseTaskOpt {
  Withdraw = 'withdraw',  // 【撤回】：第一个审批未执行前发起人撤回；
  Revoke = 'revoke',      // 【撤销】：发起人取消审批；【结束流程】；
  Approve = 'approve',    // 【审批】，批准
  AddSign = 'addSign',    // 加签，操作；
  Transfer = 'transfer',  // 转办，操作；
  SendBack = 'sendBack',  // 【退回】， (rollback ？回滚：更适合管理员的回退描述)
  Reject = 'reject',      // 【否决】，【结束流程】；
  Cancel = 'cancel'   // 【终止】，【结束流程】
}

// 草稿、启动、审批/回退...确认、作废
// todo: 与TaskOpt交叉，需要合并处理；需要区分：【表单操作】、【任务操作】、【任务状态】
export const enum FormOpt {
  Update = 'update',
  Delete = 'delete',
  Close = 'close',
  GoBack = 'goBack',  // 提交后，返回表单

  Draft = 'draft',    // 保存草稿
  Confirmed = 'confirmed',    // 表单直接提交，或流程完成后确认；
  Start = 'start',     // 启动流程，创建流程实例

  Withdraw = BaseTaskOpt.Withdraw,  // 【撤回】：第一个审批未执行前发起人撤回；
  Revoke = BaseTaskOpt.Revoke,      // 【撤销】：发起人取消审批；【结束流程】；
  Approve = BaseTaskOpt.Approve,    // 【审批】，批准
  AddSign = BaseTaskOpt.AddSign,    // 加签，操作；
  Transfer = BaseTaskOpt.Transfer,  // 转办，操作；
  SendBack = BaseTaskOpt.SendBack,  // 【退回】， (rollback ？回滚：更适合管理员的回退描述)
  Reject = BaseTaskOpt.Reject,      // 【否决】，【结束流程】；
  Cancel = BaseTaskOpt.Cancel   // 【终止】，【结束流程】
}

// 'notActive' | 'todo' | 'withdraw' | 'revoke' | 'approve' | 'sendBack' | 'addSign' | 'transfer' | 'reject' | 'cancel',
// todo: 重构：名称修改：TaskStatus
export const enum TaskOpt {
  NotActive = 'notActive', // 【未激活】
  Todo = 'todo',           // 【待办】已激活；

  Withdraw = BaseTaskOpt.Withdraw,  // 【撤回】：第一个审批未执行前发起人撤回；
  Revoke = BaseTaskOpt.Revoke,      // 【撤销】：发起人取消审批；【结束流程】；
  Approve = BaseTaskOpt.Approve,    // 【审批】，批准
  AddSign = BaseTaskOpt.AddSign,    // 【加签】，操作；
  Transfer = BaseTaskOpt.Transfer,  // 【转办】，操作；A转给其B审批，B审批后，进入下一节点；当前：找不到审批人时转给创建人办理，后续增加配置
  SendBack = BaseTaskOpt.SendBack,  // 【退回】， (rollback ？回滚：更适合管理员的回退描述)
  Reject = BaseTaskOpt.Reject,      // 【否决】，【结束流程】；
  Cancel = BaseTaskOpt.Cancel   // 【终止】，【结束流程】
}

export const TaskOptNames: { [key: string]: string } = {
  [TaskOpt.NotActive]: '未激活',
  [TaskOpt.Todo]: '待办',

  [TaskOpt.Withdraw]: '撤回',
  [TaskOpt.Revoke]: '撤销',
  [TaskOpt.Approve]: '审批',
  [TaskOpt.AddSign]: '加签',
  [TaskOpt.Transfer]: '转办',
  [TaskOpt.SendBack]: '退回',
  [TaskOpt.Reject]: '否决',
  [TaskOpt.Cancel]: '终止',
}
// 'active' | 'complete' | 'cancel' | 'revoke' | 'reject'
export const enum FlowStauts {
  Active = 'active',      // 【激活】
  Complete = 'complete',  // 【完成】【结束流程】
  Cancel = 'cancel',      // 【终止】【结束流程】
  Withdraw = 'withdraw',  // 【撤回】【结束流程】流程未开始审批之前可撤回
  Reject = 'reject',      // 【否决】【结束流程】
  Abort = 'abort',        // 【中断】异常中断，例如找不到审批人，管理员重新指定审批人后，可再次激活；
}

export const FlowStautNames: { [key: string]: string } = {
  [FlowStauts.Active]: '激活',
  [FlowStauts.Complete]: '完成',
  [FlowStauts.Cancel]: '终止',
  [FlowStauts.Withdraw]: '撤回',
  [FlowStauts.Reject]: '否决',
  [FlowStauts.Abort]: '中断',
}

// 成员选择对话框打开类型
export const enum MemberCheckerType {
  Dept = 'dept',
  Role = 'role',
  Member = 'member',
  Dynamic = 'dynamic',
  DynamicHead = 'dynamicHead',

  CreateBy = 'createBy'
}

export const enum QbIcon {
  Link = 'mi--link',
  Edit = 'lucide--edit',
  Branch = 'fluent--branch-16-regular',
  Config = 'mdi:cog-outline',

  Dot = 'mdi:dot',
  DotsVer = 'mdi:dots-vertical',
  DotsHor = 'mdi:dots-horizontal',
  Add = 'mdi:plus',
  Delete = 'mdi:trash-can-outline',

  ChevronDown = 'mdi:chevron-down',
  ChevronUp = 'mdi:chevron-up',

  Sort = 'mdi:sort',
  SortDesc = 'mdi:sort-descending',
  SortAsc = 'mdi:sort-ascending',
  Sigma = 'mdi:sigma',
  FormatText = 'mdi:format-text',

  Check = 'mdi:check',
  Filter = 'prime--filter',
  FilterFill = 'prime--filter-fill',
  RemoveFilter = 'prime--filter-slash',

}

export const AllDeptLevels = [
  {
    label: '直接部门主管',
    value: '1',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '上级部门主管',
    value: '2',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '三级部门主管',
    value: '3',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '四级部门主管',
    value: '4',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '五级部门主管',
    value: '5',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '六级部门主管',
    value: '6',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '七级部门主管',
    value: '7',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '八级部门主管',
    value: '8',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '九级部门主管',
    value: '9',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '十级部门主管',
    value: '10',
    type: MemberCheckerType.DynamicHead,
    selected: false
  }
]

export const AllDeptDescLevels = [
  {
    label: '最高级部门主管',
    value: '1',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下一级主管',
    value: '2',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下二级主管',
    value: '3',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下三级主管',
    value: '4',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下四级主管',
    value: '5',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下五级主管',
    value: '6',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下六级主管',
    value: '7',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下七级主管',
    value: '8',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下八级主管',
    value: '9',
    type: MemberCheckerType.DynamicHead,
    selected: false
  },
  {
    label: '最高级部门向下九级主管',
    value: '10',
    type: MemberCheckerType.DynamicHead,
    selected: false
  }
]

export const enum NodeTypes {
  Start = 'start',
  End = 'end',
  Approve = 'approve',
  Send = 'send'
}
// shared 重复
export const NodeIcons: { [key: string]: string } = {
  [NodeTypes.Start]: 'fluent--play-circle-24-filled',
  [NodeTypes.End]: 'clarity--power-solid',
  [NodeTypes.Approve]: 'mingcute--seal-fill',
  [NodeTypes.Send]: 'fluent--send-24-filled'
}

export const FlowStatusName: { [key: string]: string } = {
  [FlowStauts.Active]: '流程进行中',      // 【激活】
  [FlowStauts.Complete]: '流程已完成',  // 【完成】【结束流程】
  [FlowStauts.Cancel]: '流程已终止',      // 【终止】【结束流程】
  [FlowStauts.Withdraw]: '流程已撤回',  // 【撤回】【结束流程】流程未开始审批之前可撤回
  [FlowStauts.Reject]: '流程已否决',      // 【否决】【结束流程】
  [FlowStauts.Abort]: '流程异常中断'      // 管理员指定审批人后可再次激活；
}

export const enum PermGroupType {
  Add = 'add',
  AddEditSelf = 'add-edit-self',
  AddViewAll = 'add-view-all',
  AddEditAll = 'add-edit-all',
  EditAll = 'edit-all',
  ViewAll = 'view-all',

  StartFlow = 'start-flow',
  ViewAllFlow = 'view-all-flow',
  EditAllFlow = 'edit-all-flow',
  Custom = 'custom',
}

export const enum AdminGroupType {
  Creator = 'creator',
  Super = 'super',
  System = 'system',
  App = 'app'
}

export const enum FormatType {
  None = 'none',                // '无'
  MobilePhone = 'mobilePhone',            // 手机号码
  WiredPhone = 'wiredPhone',              // 电话号码
  ZipCode = 'zipCode',          // 邮编
  IdCard = 'idCard',    // 身份证号
  Email = 'email',              // 邮箱

  Number = 'number',            // 数值
  ThsNumber = 'thsNumber',      // 数值(千分符)
  PerNumber = 'perNumber',      // 百分比

  Month = 'month',          // 年月
  Date = 'date',            // 日期
  Datetime = 'datetime',    // 日期时间

}

export const enum FieldBindType {
  Custom = 'custom',
  Relation = 'relation',
  Cascade = 'cascade',
  Formula = 'formula',

  CurrentValue = 'currentValue'
}

// 比较条件操作符
enum Operators {  // 映射 rulepilot 操作符
  Equal = 'equal',              // 等于  【rulepilot】==
  NotEqual = 'notEqual',        // 不等于  【rulepilot】!=

  GreaterThan = 'greaterThan',   // 大于  【rulepilot】>
  LessThan = 'lessThan',        // 小于  【rulepilot】<
  GreaterThanOrEqual = 'greaterThanOrEqual', // 大于等于  【rulepilot】>=
  LessThanOrEqual = 'lessThanOrEqual',       // 小于等于  【rulepilot】<=

  EqualAny = 'equalAny',        // 等于任意一个  【rulepilot】in
  NotEqualAny = 'notEqualAny',  // 不等于任意一个  【rulepilot】not in
  Includes = 'includes',        // 包含  【rulepilot】contains
  IncludesAny = 'includesAny',  // 包含任意一个  【rulepilot】contains any
  NotIncludes = 'notIncludes',  // 不包含  【rulepilot】not contains
  NotIncludesAny = 'notIncludesAny',  // 包含任意一个  【rulepilot】not contains any

  Matches = 'matches',          // 正则匹配 【rulepilot】
  NotMatches = 'notMatches',    // 正则不匹配 【rulepilot】

  Null = 'null',                // 为空
  NotNull = 'notNull',          // 不为空
  Range = 'range',              // 值范围
  Dynamic = 'dynamic',          // 动态取值
}

export const enum BaseComparOpt {
  Equal = Operators.Equal,              // 等于
  NotEqual = Operators.NotEqual,        // 不等于
  Null = Operators.Null,
  NotNull = Operators.NotNull,
  Range = Operators.Range
}

export const enum MathOpt {
  Equal = Operators.Equal,              // 等于
  NotEqual = Operators.NotEqual,        // 不等于
  GreaterThan = Operators.GreaterThan,   // 大于
  LessThan = Operators.LessThan,        // 小于
  GreaterThanOrEqual = Operators.GreaterThanOrEqual, // 大于等于
  LessThanOrEqual = Operators.LessThanOrEqual,       // 小于等于
  Range = Operators.Range,
  Null = BaseComparOpt.Null,
  NotNull = BaseComparOpt.NotNull
}

export const MathOptOptions = [
  { label: '等于', value: MathOpt.Equal },
  { label: '不等于', value: MathOpt.NotEqual },
  { label: '大于', value: MathOpt.GreaterThan },
  { label: '小于', value: MathOpt.LessThan },
  { label: '大于等于', value: MathOpt.GreaterThanOrEqual },
  { label: '小于等于', value: MathOpt.LessThanOrEqual },
  { label: '为空', value: MathOpt.Null },
  { label: '不为空', value: MathOpt.NotNull },
];

export const enum DateOpt {
  Equal = BaseComparOpt.Equal,              // 等于
  NotEqual = BaseComparOpt.NotEqual,        // 不等于
  GreaterThanOrEqual = Operators.GreaterThanOrEqual, // 大于等于
  LessThanOrEqual = Operators.LessThanOrEqual,       // 小于等于
  Range = Operators.Range,
  Dynamic = Operators.Dynamic,
  Null = BaseComparOpt.Null,
  NotNull = BaseComparOpt.NotNull
}

export const DateOptOptions = [
  { label: '等于', value: BaseComparOpt.Equal },
  { label: '不等于', value: BaseComparOpt.NotEqual },
  { label: '大于等于', value: DateOpt.GreaterThanOrEqual },
  { label: '小于等于', value: DateOpt.LessThanOrEqual },
  { label: '选择范围', value: DateOpt.Range },
  { label: '动态筛选', value: DateOpt.Dynamic },
  { label: '为空', value: BaseComparOpt.Null },
  { label: '不为空', value: BaseComparOpt.NotNull },
];

export const enum StringOpt {
  Equal = BaseComparOpt.Equal,              // 等于
  NotEqual = BaseComparOpt.NotEqual,        // 不等于
  EqualAny = Operators.EqualAny,        // 等于任意一个
  NotEqualAny = Operators.NotEqualAny,  // 不等于任意一个
  Includes = Operators.Includes,        // 包含
  NotIncludes = Operators.NotIncludes,  // 不包含
  Null = BaseComparOpt.Null,
  NotNull = BaseComparOpt.NotNull
}

export const StringOptOptions = [
  { label: '等于', value: BaseComparOpt.Equal },
  { label: '不等于', value: BaseComparOpt.NotEqual },
  // { label: '等于任意一个', value: StringOpt.EqualAny },
  // { label: '不等于任意一个', value: StringOpt.NotEqualAny },
  { label: '包含', value: StringOpt.Includes },
  { label: '不包含', value: StringOpt.NotIncludes },
  { label: '为空', value: BaseComparOpt.Null },
  { label: '不为空', value: BaseComparOpt.NotNull },
];

export const enum LogicOpt {
  AND = 'and',    //（与）：&& 或 &（在某些上下文中）
  OR = 'or',      //（或）：|| 或 |（在某些上下文中）
  NOT = 'not',    //（非）：!或 ¬（在数学符号中）
  XOR = 'xor',    //（异或）：^
  NAND = 'nand',  //（与非）：通常通过组合使用NOT和AND来表达
  NOR = 'nor'     //（或非）：通常通过组合使用NOT和OR来表达
}

export const enum TriggerType {
  Form = 'form',    // 表单触发
  Schedule = 'schedule',    // 定时触发
  Http = 'http',    // Http触发
  Button = 'button'   // 按钮触发
}

export const TriggerTypeName: { [key: string]: string } = {
  [TriggerType.Form]: '表单',
  [TriggerType.Schedule]: '定时',
  [TriggerType.Http]: 'Http',
  [TriggerType.Button]: '按钮',
}

export const enum EventType {
  Add = 'add',
  Edit = 'edit',
  Delete = 'delete',

  FlowComplete = 'flow-complete'
}

export const EventTypeName: { [key: string]: string } = {
  [EventType.Add]: '新增',
  [EventType.Edit]: '修改',
  [EventType.Delete]: '删除',

  [EventType.FlowComplete]: '流程完成',
}

export const enum DividerShapes {
  RoundedTSm = 'rounded-t-sm',
  RoundedTMd = 'rounded-t-md',
  RoundedTXl = 'rounded-t-xl',
  Trapezoid = 'trapezoid',
  RoundedTrSm = 'rounded-tr-sm',
  RoundedTrMd = 'rounded-tr-md',
  RoundedTrXl = 'rounded-tr-xl',
  TrapezoidR = 'trapezoid-r',
}

export const DividerShapeName: { [key: string]: string } = {
  [DividerShapes.RoundedTSm]: '小圆角矩形',
  [DividerShapes.RoundedTMd]: '中圆角矩形',
  [DividerShapes.RoundedTXl]: '大圆角矩形',
  [DividerShapes.Trapezoid]: '梯形',
  [DividerShapes.RoundedTrSm]: '右侧小圆角矩形',
  [DividerShapes.RoundedTrMd]: '右侧中圆角矩形',
  [DividerShapes.RoundedTrXl]: '右侧大圆角矩形',
  [DividerShapes.TrapezoidR]: '直角梯形',
}
