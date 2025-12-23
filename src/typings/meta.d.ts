// 数据集合对象结构
declare namespace Meta {

  interface Regiter {
    en: Enterprise,
    acc: Account,
  }

  interface Base {
    _id?: string,
    name: string
  }

  interface NestBase {
    uid: number | undefined,
    name: string
  }

  interface EnBase {
    _id?: string,
    createAt?: Date,
    updateAt?: Date,
    en_id: string
  }

  interface Order {
    _id?: string,
    suf_id: string | null,   // 后节点_id，用于排序；软删除标记：delete
  }

  interface Node extends Order {
    parent_id: string | null,   // 备用：增加分组管理时使用；
  }

  interface ParamNode extends Node {
    dropPosition?: 'before' | 'inside' | 'after'
  }


  // 主要提供给业务表系统附加字段用
  interface EnMeta extends EnBase {
    createBy?: AccBase,   // 表单创建人、流程启动人
  }

  interface Enterprise extends Base {
    fullName: string,
    logo?: any,   // 可以存图片源文件
    // 其它属性后续增加
    wbComps: Array<LayoutComp>, // provider需要兼容vgl布局 结构：LayoutNode: { uid: , layout: , hiddenItems: }
    createAt?: Date,
    updateAt?: Date,
  }

  // 应用：
  interface AppNode extends Base, EnBase, Node {
    icon: string,
    iconColor: string,
    type: 'app' | 'app-group',
    formLayout: FormLayoutConfig,
    boardLayout: LayoutConfig,
    home_id: Array<string> | null,     // 支持绑定多个 app 类型对应【首页】仪表盘id，普通用户home==[]时加载第一个菜单项；
    dbName?: string     // 允许应用模块的业务数据单独指定数据库，依据分库规则配置使用；
    imports?: Array<Meta.Base>,
  }

  // 模块：类型、图标
  interface ModuleNode extends Base, EnBase, Node {
    app_id: string | null,
    icon: string,
    iconColor: string,
    type: 'group' | 'form' | 'flow' | 'board'
    moduleConfig_id?: string | null,
  }

  interface LayoutNode {
    uid: number,    // 布局uid，用以支持嵌套布局
    layout: Array<LayoutItem>,
    hiddenItems?: Array<LayoutItem>,
    initFlag?: number,   // 更新标记用于监听
  }

  interface Tab {
    uid: number,
    name: string,
  }

  interface LayoutComp extends LayoutItem {
    config?: any,   // 扩展配置
    value?: any,    // 组件实例值：文本内容、图片数组、模块数组
  }

  interface CompBase {
    nodeUid?: number,    // LayoutNode.uid 顶层uid==0；先归纳分组，然后依次处理；
    i: string,        // 
    type: string,     // 组件类型
    title: string,

    nestUid?: Array<number>,  // 嵌套布局uid集合，有多个时顺序和tabs一致；
    tabs?: Array<Tab>,

    [key: string]: any;
    fieldValue?: any,     // 组件输入值；【辅助字段】
  }

  interface CompStyle {
    titleStyle?: any,
    bgStyle?: any,
  }

  interface ChartOptions extends CompStyle {
    legend?: any,
    tooltip?: any,
    label?: any,
  }

  interface DataBind {
    moduleConfig_id: string | null,
    collName: string | null,
    metaData: Array<any>
  }

  // drop组件基础属性
  interface DropItem {
    key: string,
    label: string,
    type: 'bi-date' | 'bi-number' | 'bi-text',  // 字段元数据类型，相当于字段分类，区别于其它类型所以加bi前缀；
  }

  // 轴共用配置项
  interface AxisDropItem extends DropItem {
    alias?: string,   // 显示名
    // d3.js 坐标轴比例尺类型，维度轴、指标轴可以分下类？？；
    axisType?: 'band' | 'linear' | 'time' | 'pow' | 'log' | 'symlog' | 'ordinal' | 'point' | 'sequential' | 'diverging' | 'quantile' | 'threshold',
  }

  type SortField =
    | "date"
    | "yearMonth"
    | "year"
    | "yearQuarter"
    | "yearWeek"
    | "quarter"
    | "month"
    | "monthDay"
    | "week"
    | "weekDay"
    | "day"
    | "time"
    | "hour"
    | "minute"
    | "second"
    | "dateTime"
    | "dateHourMinute"
    | "dateHour";
  // 维度字段配置  
  interface ChartDim extends AxisDropItem {
    fieldType: string,
    biType: 'bi-date' | 'bi-number' | 'bi-text',
    sortFieldType: 'group' | 'dim'  // 兼容老版本：维度细粒度堆叠
    sortType: "auto-sort" | "asc" | "desc" | "custom-sort",     // 只有维度能排序，排序提供所有可用字段；
    sortField: SortField,
    // 目前只支持维度轴有日期分组类型
    dateType: string,     // 日期分组类型：年月日 年月 年 年季度 年周 | 季度 月份 月日 周次 星期 日 | 时分秒 时 分 秒 | 年月日时分秒 年月日时 年月日时分 
    dateFmType: "dash" | "detail" | "slash"     // 日期格式(x-x-x、x年x月x日、x/x/x)
    aggType: "sum" | "avg" | "media" | "max" | "min" | "stdDevPop" | "variance" | "count",   // todo: 允许未读字段计数统计
  }

  // 指标字段配置
  interface ChartMetric extends AxisDropItem {
    numFormat?: {
      type: 'number' | 'percent',
      separator: boolean,
      decimal: number,
      unit: string,
    },    // 数值格式(数值/百分比，千分数，小数位，后缀)
    aggType: "sum" | "avg" | "media" | "max" | "min" | "stdDevPop" | "variance" | "count",   // 中位数、标准差、方差
    filter: Filter | null,     // 统计字段过滤配置；明细字段过滤同一使用compConfig.filter保存；

    sortFieldType?: 'group' | 'dim'  // 兼容老版本：维度细粒度堆叠
    sortType?: "auto-sort" | "asc" | "desc" | "custom-sort",     // 只有维度能排序，排序提供所有可用字段；
    sortField?: SortField,
  }

  interface Filter {
    candition: 'and' | 'or',    // todo: 修改：combinationType
    fieldName: string,
    type: 'bi-text' | 'bi-number' | 'bi-date'
    fieldType: string,
    operator: 'equal' | 'notEqual' | 'range',   // 可以逐步按需扩展
    filerValue: Array<string | number>    // 字符串类型支持多个字符串，数字和日期支持选择范围：【最小值，最大值】
  }

  interface ChartFilter extends DropItem {
    filter: Filter | null
  }

  interface ChartComp extends CompBase {
    chartType?: string,
    dims?: Array<ChartDim>,
    metrics?: Array<ChartMetric>,
    filter?: Array<ChartFilter>,
    dataBind?: DataBind,         // 模块配置_id；（是否冗余保存字段？冗余后需要支持同步；）
    options?: Array<ChartOptions>     // 数组第一项为【全部】图形配置，针对混合或多层图形会有多个配置；
    // 数据表格相关
    startDate?: Array<any>,
    endDate?: Array<any>,
    date?: Array<any>,
    // 甘特图
    taskTitle?: Array<any>,
    // 日历图
    eventText?: Array<any>,
    // 轮播图
    images?: Array<string>,   // gfsIds
    // 富文本
    rich?: string | null,
    // 嵌入页面url
    url?: string,
  }

  interface Range {
    min: number,
    max: number
  }

  interface Relation {
    module_id: string,
    moduleConfig_id: string,
    collName: string,
    fieldName: Array<string> | string | null,   // 绑定字段
    sortFieldName: string | null,
    descSort: boolean,   // 默认 false
    addPerm?: boolean,     // 默认 false 嵌套表单中控制【添加】按钮
  }

  interface ListItem {
    label: string,
    value?: string | number,
    color?: string,
    selected?: boolean,
  }

  // todo: 统一Filter类型
  interface CascadeFilter {
    comparison: string | null,
    filterFieldName: string | null,
    filterFieldType: string | null,
    triggerFieldName: string | null,
    triggerFieldType: string | null
  }

  interface FieldsMap {
    sourceField: string | null,
    sourceType: string | null,
    mapField: string | null,
    mapType: string | null
  }

  interface DividerStyle {
    color: string,      // hex | transparent
    textColor: 'default',   // color有颜色则设置字体：白色
    textAlign: 'left' | 'center',
    lineType: 'solid' | 'dashed',
    lineWidth: string,
    shapeType: string,    // DividerShapes
  }

  interface SequenceRule {
    fixedString: string | null,
    dateString: string | null,
    counterLength: number,
    counterType: 'year' | 'month' | 'day' | 'never',
    subRuleOrder: Array<'fixedString' | 'dateString'>
  }

  interface FormComp extends CompBase {
    bindId?: any,      // FeDataSelect: parent_id ; 
    // children?: any[],  //关联嵌套数据备用...
    // fieldAlias?: string,   // 字段中文名 / 标签名称
    fieldName: string,   // 自动生成： _mf_1111111 ; 结构：_mf_<i> 
    fieldType: string,  // 未启用；【有比较多重名的，但是属于不同的接口中需要注意】
    /** Mongodb存储映射类型 */    
    mongoType: 'String' | 'Number' | 'Boolean' | 'Date' | 'Array' | 'Object' | 'ObjectId' | 'Binary' | 'Null' | 'Regular' | 'Timestamp' | 'Decimal128',

    selfColl?: boolean,       // false: 当前集合嵌套，true: 独立集合存储
    selfCollName?: string,    // 独立集合存储时的集合名称：_mc_<i>

    showTitle?: boolean,      // 是否显示标题
    placeholder?: string,     // 输入占位符文本

    style?: DividerStyle | any,   // 分割线样式，也可扩展到其它组件

    formatType?: string,      // 文本格式、数字格式。。。
    formatValue?: string,     // 例如日期类型格式字符串，正则表达式字符串；
    lengthRange?: Range | null,      // 字符串长度范围
    numberRange?: Range | null,      // 数值大小范围
    memberRange?: any,        // 成员选择范围，对应成员选择对话框中的对象类型设计；
    dataLimit?: any,          // 日期可选范围：可选星期、最早可选时间、最晚可选时间
    decimalPlaces?: number | null,   // 小数位数

    listType?: 'custom' | 'relation' | 'cascade',   // relation 关联表单数据 cascade 数据联动(触发)
    listItems?: Array<ListItem>,   // 对象数组，对象保存选项设置颜色等参数
    selectRange?: Range | null,       // 可选数量范围
    listVertical?: boolean,   // 选项列表默认垂直排列 
    relation?: Relation,      // 关联表单
    // 数据联动实现：通过Provider方法桥接事件触发，事件参数中确认是否是需要响应的字段输入事件；
    // 数据联动：当前表单cascadeFieldName字段输入后触发基于cascadeFilter查询cascadeModule_id获取bindFieldName
    // cascade 数据联动设置需要的过滤条件：输入触发字段、当前表过滤字段；依赖【relation】
    cascadeFilters?: Array<CascadeFilter>,  // {comparison, filterFieldName, triggerFieldName}
    mapFields?: Array<FieldsMap>,   // 【选择数据】配置【数据联动】映射字段；
    mappedFieldNames?: Array<string>,    // 方便显示绑定图标【标记被绑定的-选择数据组件id】组件fieldName；对应mapFields的绑定

    controlRules?: Array<any>,  // 控制显示隐藏等规则配置；
    canCustomItem?: boolean,    // 允许输入时添加选项

    defValue?: any,       // 默认值
    defValueType?: 'custom' | 'cascade' | 'formula' | 'currentValue',   // 默认值类型，默认'custom'; cascade 数据联动 formula 公式编辑
    formula?: any,                    // formula 公式配置
    sequenceRule?: SequenceRule,

    required?: boolean,       // 必填
    unique?: boolean,         // 唯一

    // 字段权限
    viewPerm?: boolean,       // 可见
    editPerm?: boolean,       // 可编辑
  }

  interface CompConfig extends ChartComp, FormComp {


  }

  interface FormConfig {   // _id: 保存表单集合名称 _mc_111111 ; name: 保存集合中文名称
    collName?: string,     // 主表单集合名称 _mc_111111 
    collAlias?: string,    // 主集合中文名称 / 模块名称

    // 以下作废：统一到布局配置
    // triggerType?: 'none' | 'update' | 'flow',   // none | update: 并发同步、定时同步、顺序同步。。。 | flow
    // lablePlace?: 'left' | 'top',
    // lableWidth?: number | 'auto',
    // lableAlign?: 'left' | 'right'
  }

  interface LayoutItem {
    i: string,
    x: number,
    y: number,
    w: number,
    h: number,
    type: string,
    hidden?: boolean,
    nestUid?: Array<number>,      // 包含布局uid，用以支持嵌套布局
    dragData?: any,   // 拖拽对象参数数据
    event?: 'add' | null    //  新增组件：new
  }

  interface LayoutConfig {
    draggable?: boolean,    // 编辑状态解决嵌套表格鼠标事件冲突
    layoutPadding: Array<number>,
    colNum: number,
    defCompWidth: number,
    defCompHeight: number,
    rowHeight: number,
    itemPadding: Array<number>,
    // 以下简化传参数用
    layoutType: 'form' | 'board',   // 临时副作用参数
    isEditable: boolean,        // 临时副作用参数
    vglHeightPadding: number    // 临时副作用参数
  }
  interface FormLayoutConfig extends LayoutConfig {
    // FormConfig迁移过来的
    labelPlace: 'left' | 'top',
    labelWidthType: 'default' | 'auto' | 'custom',
    labelWidth: number,
    labelAlign: 'left' | 'right'
  }

  // 下拉列表项通用结构
  interface Option {
    label: string,
    value: string,
    type: string
  }

  // DynamicTagsOption 只有label、value；需要兼容，其它属性需要可选；
  interface Tag {
    label: string,
    value: string,
    type?: 'dept' | 'role' | 'member' | 'dynamic' | 'dynamicHead',
    dynamicType?: 'dept' | 'member' | 'createBy',   // 动态字段来源组件类型
    avatar?: string,     // avatar | icon ... 扩展使用
  }

  // 【废弃，用Tag】节点负责人/审批人/候选人
  // interface Candidate {
  //   // 节点负责人/审批人/候选人: 部门，角色，成员，
  //   // 动态负责人：【流程发起人】，【成员字段】，【部门字段】，主管：【流程发起人/申请员工】,【直接/1/2/3..级】)
  //   type: 'dept' | 'role' | 'member' | 'dynamic' | 'dynamicHead',
  //   // 各类型检索用id：部门_id、角色_id、成员_id；对应字段：_id
  //   // 流程发起人/成员字段/部门字段/。。。/ 对应字段：fieldName   
  //   value: string,    
  //   label: string,   // 显示名 name // 流程发起人/成员字段/部门字段/。。。/ 对应字段：title
  // }

  interface FieldPerm {
    fieldType: string,
    fieldName: string,    // 字段id
    // title: string,     // 字段中文名【废弃】，改为从组件配置动态获取

    viewPerm: boolean,    // 只读
    editPerm: boolean,     // 可编辑
    abstract?: boolean     // 摘要中显示

    children?: Array<FieldPerm>
  }

  // 审批意见
  interface ApproveOpinion {
    showTitle: boolean,
    required: string,
    requiredOpts: Array<any>,   // 必填选择：【指定操作必填】 时需要配置操作按钮；
    Presets: string,            // 预设值，同意、不同意。。。
    defValue: string            // 默认值
    attachment?: any,           // 审批意见附件
  }

  interface FlowNode {
    uid: number,
    name: string,
    type: 'start' | 'end' | 'send' | 'approve',   // NodeTypes
    x: number,
    y: number,

    // 审批类型：并发会签、任意、逐级、顺序会签、票签
    approveType?: 'jointSign' | 'orSign' | 'levleBySign' | 'orderSign' | 'voteSign',
    // 节点负责人/审批人/候选人: 部门，角色，成员，
    // 动态负责人：【流程发起人】，【成员字段】，【部门字段】，主管：【流程发起人/申请员工】,【直接/1/2/3..级】)
    candidates?: Array<Tag>,    // 审批候选人
    orderSignEnd?: string,      // 审批终点部门层级，从最顶层部门开始：1 ~ 10 级；默认使用节点负责人配置的部门主管及层级可追溯至最顶层；
    carbonCopy?: Array<Tag>,    // 抄送人，和动态负责人相同配置；
    fieldPerm?: Array<FieldPerm>, // 字段权限：只读、编辑、摘要
    // 审批操作按钮启用配置: 【提交】、回退、【否决】、暂存、【加签】、【转交】、结束流程
    nodeOpt?: {
      sendBack: boolean,
      addSign: boolean,
      transfer: boolean,
      cancel: boolean,
      reject: boolean,
    },   // 启用添加到数组，未启用数组中不包含 【标识名】通过枚举类TaskOpt翻译中文
    opinion?: ApproveOpinion | boolean,     // 审批意见
    sign?: { required: string, requiredOpts: Array<any> } | undefined,    // 签名

    hasLink?: boolean   // 非必要，冗余，【辅助】
  }

  // 流程图绘制【辅助】属性
  interface FlowLinkExt extends FlowLink {
    sX?: number,
    sY?: number,
    tX?: number,
    tY?: number,
    titleWidth?: number,
    coord?: { sX: number, sY: number, tX: number, tY: number, sPos: string, tPos: string },
    pathD?: string,
    points?: Array<any>,
    polygonPoints?: string,
    arrowPoints?: string | null,
    titlePos?: { x: number, y: number },
  }

  interface Candition {
    fieldName: string | null,
    fieldType: string,
    comparison: string,
    value: any,
    logicalOpt: string
  }

  interface FlowLink {
    uid: number,
    name: string | null,
    sourceId: number,
    sourcePos: string,
    targetId: number,
    targetPos: string,

    canditions?: Array<Candition> | 'else',     // 默认 []
  }

  interface FlowDefinition {
    uid: number,
    verId: number, // 版本号 V<顺序递增>，关联用uid，版本号只做展示用；新启动流程用最新版本；
    nodes: Array<FlowNode>,
    links: Array<FlowLink>,
    enable: boolean,    // 当前启用的流程，只能启用一个版本；
  }


  interface ConditionConfig {
    combinationType: 'and' | 'or',
    preParentName?: string | null,   // NestEditTable组件子元素需要附件父组件fieldName
    preFieldName: string,
    preFieldType: string,    // 组件类型 FormElType,
    operator: string,   //'null' | 'equal' | 'notEqual' | 'range',   // 可以逐步按需扩展
    valueParentName?: string | null, // NestEditTable组件子元素需要附件父组件fieldName
    valueType: 'bind' | 'custom',
    valueFieldValue: any,    // valueType-bind: fieldName; valueType-custom: any
    valueFieldType: string | null  // 组件类型 FormElType
  }


  interface DataSync extends NestBase {
    version?: number,    // uid 数据同步配置版本号，版本号不变不需要更新mapper缓存；
    enable: boolean,    // 是否启用
    triggerType: 'form' | 'schedule' | 'http' | 'button',   // 触发条件：表单、定时、http、按钮；
    triggerForm: string | undefined,  // 表单_id
    triggerConfig: any,   // 表单 | 触发时间、频率等
    triggerAction: ['add' | 'edit' | 'delete'],     // 【新增】、【修改】、【删除】
    triggerConditCombiType: 'and' | 'or',
    triggerCondition: Array<ConditionConfig>,  // 触发条件
    updateForm: string | undefined,     // 同步表单_id
    updateConfig: any,      // 更新表单。。。
    updateAction: 'add' | 'edit' | 'delete',     // 【新增】、【修改】、【删除】
    updateFilterCombiType: 'and' | 'or',
    updateFilter: Array<ConditionConfig>,      // 过滤条件(需要更新数据)
    upsert: boolean,     // 找不到数据时是否新增等；
    addFieldMap: Array<ConditionConfig>,           // 新增时的字段映射
    updateFieldMap: Array<ConditionConfig>,           // 更新时的字段映射
    editRelation: Array<ConditionConfig>,       // 修改多条时关联匹配；多对多修改时需要设置(例如1对多的嵌套明细，嵌套表格类型，关联数据类型？)；
    nestUpsert: boolean        // 嵌套表格数据如果关联不上任务数据是否插入；todo: 目前多个数组字段共用一个配置，后续可扩展各子独立配置；
  }

  // 表单、布局、组件配置...等都要独立更新，新建时统一初始化；
  interface ModuleConfig extends AppMeta {
    // app_id: string | null,
    moduleType: 'form' | 'flow' | 'board',
    formConfig: any,      // 表单、报表基础配置：标题、外观样式。。。// 
    vglConfig: Partial<FormLayoutConfig>,    // vgl布局配置参数，单独存储副本，全局参数修改不影响已创建表单布局；
    layouts: Array<LayoutNode>,   // vgl组件布局 
    compConfigs: Array<CompConfig>,   // 组件单独更新 
    flowDefs?: Array<FlowDefinition>,    // 需要版本号控制所以多条；
    ext?: any,
    dataSync?: Array<DataSync>     // 数据同步配置
    dataFlow?: any,
    publish?: any,        // 公开，权限控制   

    // 关联查询ModuleNode
    moduleNode?: ModuleNode
  }

  interface BiDoc extends AppMeta {
    // 草稿：'draft' ，审核：'review' ，已确认：'confirmed'， 作废：'cancel'
    complatedState: 'draft' | 'review' | 'confirmed' | 'cancel',
    [key: string]: any;
  }

  interface AppMeta extends EnMeta {
    app_id?: string | null,
  }

  interface ActiveNode extends FlowNode {
    taskAssignCount: number,     // 分派任务数量，
    taskExecCount: number,       // 已执行任务数量；并发会签:执行完分派任务后流转、票签:完成指定比例后流转；
    taskActOrder: number,   // 当前顺序执行节点的序号 ;
    complete: boolean,      // 流转过后标记为true;未流转无属性或标记为false; 处理中 | 已完成
    createAt: Date,
    updateAt: Date,

    // 标记任务是否异常，展示时通过任务关联，展示到流程日志中；
    execStatus: 'normal' | 'warning' | 'error',
    execMsg: string
  }


  // todo： 流程结束后一定时间后转储到历史表，结构可以和实例表统一一个？
  interface FlowInstance extends AppMeta {
    // app_id: string | null,
    module_id: string,
    moduleName: string,
    collName: string,     // 关联业务数据集合名
    formMeta: any,            // 【废弃】2020.3.15 由FlowNode.fieldPerm中获取字段名称及权限信息；
    formData: BiDoc,           // 表单_id
    flowDef: FlowDefinition,   // 流程定义
    // 流程当前激活节点；并发汇集控制：连入的节点都完成才可以执行；
    activeNodes: Array<ActiveNode>, // 
    // 当前待办任务 
    activeTasks: Array<FlowTask>,   // 'notActive' | 'sendBack' | 'todo' 
    activeCCopy: Array<CCopyTask>,   // 未读抄送
    flowLogs?: Array<FlowLog>,          // 流程动态/审批日志
    comments?: Array<any>,          // 评论，
    // 流程状态：进行中、已结束(完成；终止；撤回；撤销；否决；异常中断)
    status: 'active' | 'complete' | 'cancel' | 'withdraw' | 'revoke' | 'reject' | 'abort',

    // 受限于更新任务无法同时更新多个数组，
    // 目前采取的方案activeTasks、activeCCopy中保留了历史记录；
    // 已执行完毕的任务历史；历史转储用；
    // 当前：查询结果使用hisTasks、hisCCopy别名临时用转储字段名避免修改接口；包含历史和当前激活的所有数据；
    hisTasks?: Array<FlowTask>,  // 'withdraw' | 'revoke' | 'approve' | 'sendBack' | 'transfer' | 'reject' | 'cancel'
    hisCCopy?: Array<CCopyTask> // 已读抄送，carbonCopy ；历史转储用；

    creatorDeptId?: string,     // 临时保存流程发起人的所属部门多个时选择一个； 
  }

  // todo: 暂时未确定启用，流程信息通过激活节点获取；
  interface FlowLog {
    uid: number,          // 任务日期Uid
    nodeUid: number,      // 所属流程节点
    nodeName: string,     // 节点名称
    nodeType: string,     // 节点类型
    // 操作类型: 流程状态、任务状态。。。；节点进入/流转：激活/生成任务、节点审批等操作;
    // 创建任务、执行任务、任务异常中断...
    optType: string,
    executor: Base,   // 任务执行人
    optMsg?: string,  // 审批意见 | 系统日志消息
    createAt: Date,
  }

  interface FlowTask {
    uid: number,          // 任务Uid
    nodeUid: number,      // 所属流程节点
    approveType: string,  // 审批类型
    execOrder: number,     // 顺序任务顺序编号，没轮到时不激活；并发会签全部置 0 ;taskActOrder标记
    // 流程操作：【待激活】、【待办】、【撤回】、【撤销:发起人终止】、【批准】、【退回】、【转交】、【否决】、【作废/中断结束】
    // 顺序任务生成时先激活第一个，下一个再激活；撤回：下一节点未审批前；
    status: 'notActive' | 'todo' | 'withdraw' | 'revoke' | 'approve' | 'sendBack' | 'transfer' | 'reject' | 'cancel',
    opinion?: string,           // 审批意见
    attachment?: Array<string>, // 审批意见附件
    sign?: string,              // 签名【图片id】
    executor: Base,   // 任务执行人
    limitedTime?: string,   // 限时处理 天:D 小时:H 分钟:M
    urged?: Date,   // 催办：5分钟有效展示；在此催办更新时间；
    createAt: Date,
    updateAt: Date,
  }

  interface CCopyTask {
    uid: number,          // 任务Uid
    nodeUid: number,      // 所属流程【抄送节点】或【审批节点】
    fieldPerm: Array<FieldPerm>,    // 所属节点获取的字段权限
    isRead: boolean,      // 是否已读
    executor: Base,   // 任务执行人
    limitedTime?: string,   // 限时处理 天:D 小时:H 分钟:M
    urged?: Date,   // 催办：5分钟有效展示；在此催办更新时间；
    createAt: Date,
    updateAt: Date,
  }

  interface Dept extends Base, EnBase, Order {
    manager?: Array<Base>,   // 部门主管
    parent_id: string | null,
  }

  interface Role extends Base, EnBase, Order {
    parent_id: string,
    type: 'group' | 'role',   // group role
  }

  // 初始化默认权限组
  // 每个权限组对应一种视图；
  // 预设：1.仅添加、2.添加并管理本人数据、3.添加并查看全部数据、4.添加并管理全部数据、5.管理全部数据、6.查看全部数据、
  // 7.自定义: 多条，且有权限定义；
  // 预设只有类型即可，不满足的可自定义；
  // ModulePermGroup 的扩展属性，没有单独的集合；
  interface PermGroup {
    type: 'add' | 'add-edit-self' | 'add-view-all' | 'add-edit-all' | 'edit-all' | 'view-all' | 'custom',
    view_id: string,    // ModuleView._id todo: 基于默认视图使用 form、table，后续扩展 card
    optAuth: Array<any>,    // 操作权限，按钮。。。
    fieldAuth: Array<any>,   // 字段权限
    dataAuth: Array<any>    // 数据权限：过滤条件
  }

  // todo: 暂不使用视图；基于默认视图使用 form、table，后续扩展 card
  interface ModuleView extends EnBase, Base {
    module_id: string,                // 应用模块
    type: 'form' | 'table' | 'card',
    config: any                       // 不同类型配置项不同
  }

  // 一个模块 => 多个权限组ModulePermGroup ; 
  // ModulePerm.name == PermGroup.name
  interface ModulePermGroup extends PermGroup, EnBase, Base {   // name 作为权限组名称
    app_id: string,
    parent_id: string,          // 应用模块id
    moduleType: 'form' | 'flow' | 'board',
    active: boolean,            // 启用、停用
    accountAuth: Array<AccBase>,   // 成员 集合
    deptAuth: Array<Base>,      // 部门 集合
    roleAuth: Array<Base>,      // 角色 集合
    notes: string,              // 注释
    suf_id: string | null,
  }

  // 管理员、部门管理：管理功能是否可用、管理应用范围、管理角色范围；
  // 应用管理组：不能增加删除，只负责修改配置；
  interface AdminGroup extends Base, EnBase {
    type: "creator" | "super" | "system" | 'app',   // （企业）创建人、系统管理员、普通管理组、应用管理组
    member: Array<AccBase>,
    appCd?: boolean,   // 是否可添加删除应用；
    appPerm?: Array<any>,   // 可管理的应用;【普通管理组】专用
    modulePerm?: Array<any>, // 可管理的模块；【应用管理组】专用
    deptPerm?: Array<Base>,     // 表单发布范围可选部门
    rolePerm?: Array<Base>,     // 表单发布范围可选角色
    orgPerm?: any,     // 内部部门：可见可管理；内部角色：可见、可管理
    parent_id?: string,
    suf_id?: string | null,
  }

  interface AccBase extends Base {
    avatar?: string,      // 头像图片 metaId在Gfs中查出，使用最后一个；
  }

  interface Account extends AccBase {
    loginName?: string,    // 真实姓名，name 是账户名称
    nickName?: string,    // 昵称
    code?: string,    // 工号 唯一
    phone?: string,
    email?: string,
    password?: string,
    active?: boolean,    // 启用、停用
    onJob?: boolean,     // 在职、离职
    en_ids?: Array<any>,   // 一个账户可以加入多个企业，登录时如果有多个需要弹出选择界面或默认登录第一个
    createBy?: Base,
    createAt?: Date,
    updateAt?: Date
  }

  interface AccountEn extends EnMeta {  // _id 取自Accouont
    // _id?: string,
    acc_id: string,
    dept: Array<Base>,    // ?? 
    role: Array<Base>
  }

  interface BaseLog {
    _id?: string,
    logAt: Date,
    en_id: string,
  }

  interface BiDataLog extends BaseLog {
    type: 'add' | 'edit' | 'delete',
    data: any,    // 完整一条数据； 修改时保留修改前后的值；_mf_xxxx old_mf_xxxxx
    optAccount: AccBase,
  }

  interface OptLog extends BaseLog {
    optAccount: AccBase,
    app_id: string,
    optMsg: string, // 接口对应的操作消息：xx表增加/修改/删除xx 操作是否成功，错误消息。。。
    exeResult: boolean,
  }

  interface LoginLog extends BaseLog {
    acc_id: string,
    login: string,
    name: string,
    avatar: string,
    ip: string,
    os: string,
    osVersion: string,
    browser: string,
    browserVersion: string,
    device: string,
  }

  interface DataSyncLog extends BaseLog {
    triggerAt: Date,
    triggerAccount: AccBase | null,   // 触发人
    execResult: boolean,  //执行结果
    resultMsg: string,   //执行结果消息
    dataSyncConfig: { app_id: string, dataSyncUid: number },         // 数据同步配置
  }

  interface GfsMeta {
    metaId: number,   // uid，唯一标识组件，通过metaId查询组件绑定的所有文件
    checkCode: string,    // 文件唯一校验码
    fileType?: string,     // 文件类型；文件后缀名
    aliasName?: string,
    contentType?: string
    // en_id?: string,
    // acc_id?: string,
    // app_id: string,
    // module_id?: string,
    // formData_id?: string,   // 表单数据_id;
    // imgField_id?: string,    // 表单数据[图片字段]id, 一个字段可有多个图片；
  }

  interface GfsFile {
    _id?: any,
    fileId: string,     // 浏览器加载文件后的id
    length?: number,
    chunkSize?: number,
    uploadDate?: any,
    filename: string,
    metadata: GfsMeta,      // 
  }

  interface UserAuth {
    groupRole: 'creator' | 'super' | 'system' | 'app' | 'none',   // 管理组角色
    agAppPerm: Array<any>,
    adminGroup: Array<any>,

    permGroupCount: Array<any>
  }

  interface AdvancedModule {
    uuid: string;
    moduleName: string;
    limit: boolean;   // true 可用；false 不可用
  }

  // 授权类别、客户名称、系统版本、app数量、模块数量、高级模块[]、日期限制
  interface SystemAuth {
    uuid: string;   // 46318643c947442d9a98127e5f337c11
    enFullName: string;
    enNmuberLimit: number;    // 企业数量限制，
    appNumberLimit: number;   // 应用数量限制
    userNumberLimit: number;  // 用户数量限制
    moduleNumberLimit: number;  // 模块数量限制；
    // formNumberLimit: number;  // 表单数量限制
    // flowNumberLimit: number;  // 流程表单数量限制
    // boardNumberLimit: number; // 图表报表数量限制
    AdvancedModuleLimit?: Array<AdvancedModule>;   // 高级功能限制
    // free：免费无授权
    // base: 授权免费版(比free增加授权范围，根据客户需求适当定制)；
    // limit：企业定制版(有限免费，按功能服务收费)，针对行业项目及代理商
    // nolimit：VIP企业版(项目收费客户功能无限制，支持集群),针对项目付费大企业客户(5万/年)
    authType: 'free' | 'base' | 'limit' | 'nolimit';
    // 不同authType共用一套代码；打包版本号：v1.0_20250726 ; 
    // v1版本号变化修改api加密key，授权key;
    sysVersion: string;
  }

}