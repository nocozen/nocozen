
const enum CompInputType {
  // 文本输入框支持的输入类型
  // Field = "field",    // 暂不使用
  // SingleList = "singleList",   // 暂不使用
  // MultiList = "multiList",   // 暂不使用
  SingleListRadio = "singleListRadio",    // 单选
  MultiListCheckBox = "multiListCheckbox",    // 多选

  // 数值范围支持的输入类型
  Range = "range",            // 仅输入数值区间
  Slider = "slider",          // 滑块区间
  RangeSlider = "rangerSlider",   // 滑块区间带输入值

  // 日期输入支持的输入类型: 日期，年份，年月，时间，周次，日期区间，年份区间，年月区间，时间区间，周次区间
  Date = "date",
  DateTime = "datetime",
  Year = "year",
  Month = "month",
  Time = "time",
  Weak = "week",
  DateRange = "dateRange",
  DateTimeRange = "datetimeRange",
  YearRange = "yearRange",
  MonthRange = "monthRange",
  TimeRange = "timeRange",
  WeakRange = "weekRange",
}

const CompInputTypeName: { [key: string]: string } = {
  // 文本输入框支持的输入类型
  [CompInputType.SingleListRadio]: "单选下拉",
  [CompInputType.MultiListCheckBox]: "多选下拉",

  // 数值范围支持的输入类型
  [CompInputType.Range]: "数值区间",
  [CompInputType.Slider]: "滑块区间",
  [CompInputType.RangeSlider]: "数值滑块区间",

  // 日期输入支持的输入类型: 
  [CompInputType.Date]: "日期",
  [CompInputType.DateTime]: "日期时间",
  [CompInputType.Year]: "年份",
  [CompInputType.Month]: "年月",
  [CompInputType.Time]: "时间",
  [CompInputType.Weak]: "周次",
  [CompInputType.DateRange]: "日期区间",
  [CompInputType.DateTimeRange]: "日期时间区间",
  [CompInputType.YearRange]: "年份区间",
  [CompInputType.MonthRange]: "年月区间",
  [CompInputType.TimeRange]: "时间区间",
  [CompInputType.WeakRange]: "周次区间",
} as const


const enum AggType {
  Sum = "sum",
  Avg = "avg",
  Median = "median",    // 中位数
  Max = "max",
  Min = "min",
  StdDevPop = "stdDevPop",    // 标准差
  Variance = "variance",      // 方差
  Count = "count"
}

const AggNameMap = new Map([
  [AggType.Sum, "求和"],
  [AggType.Avg, "平均"],
  [AggType.Median, "中位数"],
  [AggType.Max, "最大值"],
  [AggType.Min, "最小值"],
  [AggType.StdDevPop, "标准差"],
  [AggType.Variance, "方差"],
  [AggType.Count, "计数"]
])

const enum SortType {
  ASC = "asc",
  DESC = "desc",
}

const SortNameMap = new Map([
  [SortType.ASC, "升序"],
  [SortType.DESC, "降序"],
])

//  年月日 年月 年 年季度 年周 | 季度 月份 月日 周次 星期 日 | 时分秒 时 分 秒 | 年月日时分秒 年月日时 年月日时分 
const enum DateType {
  Date = "date",              // 年月日 "%Y-%m-%d"
  YearMonth = "yearMonth",    // 年月 "%Y-%m"
  Year = "year",              // 年 "%Y"
  YearQuarter = "yearQuarter",// 年季度 $month / 3
  YearWeek = "yearWeek",      // 年周 "%Y-%V"

  Quarter = "quarter",        // 季度 $month / 3
  Month = "month",            // 月份 "%m"
  MonthDay = "monthDay",      // 月日 "%m-%d"
  Week = "week",              // 周次 "%V" (iso 8601)
  WeekDay = "weekDay",        // 星期 "%u" (iso 8601)
  Day = "day",                // 日 "%d"

  Time = "time",              // 时分秒 "%H:%M:%S"
  Hour = "hour",              // 时 "%H"
  Minute = "minute",          // 分 "%M"
  Second = "second",          // 秒 "%S"

  DateTime = "dateTime",      // 年月日时分秒 "%Y-%m-%d %H:%M:%S"
  DateHourMinute = "dateHourMinute",// 年月日时分 "%Y-%m-%d %H:%M"
  DateHour = "dateHour",      // 年月日时 "%Y-%m-%d %H"

}

const enum DateFmType {
  Default = "dash",
  Detail = "detail",
  Slash = "slash",
}

const DateFmString = new Map([
  [DateFmType.Default + DateType.Date, "%Y-%m-%d"],              // 年月日 "%Y-%m-%d"
  [DateFmType.Default + DateType.YearMonth, "%Y-%m"],         // 年月 "%Y-%m"
  [DateFmType.Default + DateType.Year, "%Y"],              // 年 "%Y"
  [DateFmType.Default + DateType.YearQuarter, "-%"],     // 年季度 $month / 3
  [DateFmType.Default + DateType.YearWeek, "%Y-%V"],          // 年周 "%Y-%V"
  [DateFmType.Default + DateType.Quarter, ""],           // 季度 $month / 3
  [DateFmType.Default + DateType.Month, "%m"],             // 月份 "%m"
  [DateFmType.Default + DateType.MonthDay, "%m-%d"],          // 月日 "%m-%d"
  [DateFmType.Default + DateType.Week, "%V"],              // 周次 "%V" (iso 8601)
  [DateFmType.Default + DateType.WeekDay, "%u"],           // 星期 "%u" (iso 8601)
  [DateFmType.Default + DateType.Day, "%d"],                 // 日 "%d"
  [DateFmType.Default + DateType.Time, "%H:%M:%S"],            // 时分秒 "%H:%M:%S"
  [DateFmType.Default + DateType.Hour, "%H"],                // 时 "%H"
  [DateFmType.Default + DateType.Minute, "%M"],              // 分 "%M"
  [DateFmType.Default + DateType.Second, "%S"],              // 秒 "%S"
  [DateFmType.Default + DateType.DateTime, "%Y-%m-%d %H:%M:%S"],   // 年月日时分秒 "%Y-%m-%d %H:%M:%S"
  [DateFmType.Default + DateType.DateHourMinute, "%Y-%m-%d %H:%M"],// 年月日时分 "%Y-%m-%d %H:%M"
  [DateFmType.Default + DateType.DateHour, "%Y-%m-%d %H"],       // 年月日时 "%Y-%m-%d %H"

  [DateFmType.Detail + DateType.Date, "%Y年%m月%d日"],              // 年月日 "%Y-%m-%d"
  [DateFmType.Detail + DateType.YearMonth, "%Y年%m月"],         // 年月 "%Y-%m"
  [DateFmType.Detail + DateType.Year, "%Y年"],              // 年 "%Y"
  [DateFmType.Detail + DateType.YearQuarter, "年%季度"],     // 年季度 $month / 3
  [DateFmType.Detail + DateType.YearWeek, "%Y年%V周"],          // 年周 "%Y-%V"
  [DateFmType.Detail + DateType.Quarter, "季度"],           // 季度 $month / 3
  [DateFmType.Detail + DateType.Month, "%m月"],             // 月份 "%m"
  [DateFmType.Detail + DateType.MonthDay, "%m月%d日"],          // 月日 "%m-%d"
  [DateFmType.Detail + DateType.Week, "%V周"],              // 周次 "%V" (iso 8601)
  [DateFmType.Detail + DateType.WeekDay, "%u"],           // 星期 "%u" (iso 8601)
  [DateFmType.Detail + DateType.Day, "%d日"],                 // 日 "%d"
  [DateFmType.Detail + DateType.Time, "%H时%M分%S秒"],            // 时分秒 "%H:%M:%S"
  [DateFmType.Detail + DateType.Hour, "%H时"],                // 时 "%H"
  [DateFmType.Detail + DateType.Minute, "%M分"],              // 分 "%M"
  [DateFmType.Detail + DateType.Second, "%S秒"],              // 秒 "%S"
  [DateFmType.Detail + DateType.DateTime, "%Y年%m月%d日 %H时%M分%S秒"],   // 年月日时分秒 "%Y-%m-%d %H:%M:%S"
  [DateFmType.Detail + DateType.DateHourMinute, "%Y年%m月%d日 %H时%M分"],// 年月日时分 "%Y-%m-%d %H:%M"
  [DateFmType.Detail + DateType.DateHour, "%Y年%m月%d日 %H时"],       // 年月日时 "%Y-%m-%d %H"

  [DateFmType.Slash + DateType.Date, "%Y/%m/%d"],              // 年月日 "%Y-%m-%d"
  [DateFmType.Slash + DateType.YearMonth, "%Y/%m"],         // 年月 "%Y-%m"
  [DateFmType.Slash + DateType.Year, "%Y"],              // 年 "%Y"
  [DateFmType.Slash + DateType.YearQuarter, "-%"],     // 年季度 $month / 3
  [DateFmType.Slash + DateType.YearWeek, "%Y/%V"],          // 年周 "%Y-%V"
  [DateFmType.Slash + DateType.Quarter, ""],           // 季度 $month / 3
  [DateFmType.Slash + DateType.Month, "%m"],             // 月份 "%m"
  [DateFmType.Slash + DateType.MonthDay, "%m/%d"],          // 月日 "%m-%d"
  [DateFmType.Slash + DateType.Week, "%V"],              // 周次 "%V" (iso 8601)
  [DateFmType.Slash + DateType.WeekDay, "%u"],           // 星期 "%u" (iso 8601)
  [DateFmType.Slash + DateType.Day, "%d"],                 // 日 "%d"
  [DateFmType.Slash + DateType.Time, "%H:%M:%S"],            // 时分秒 "%H:%M:%S"
  [DateFmType.Slash + DateType.Hour, "%H"],                // 时 "%H"
  [DateFmType.Slash + DateType.Minute, "%M"],              // 分 "%M"
  [DateFmType.Slash + DateType.Second, "%S"],              // 秒 "%S"
  [DateFmType.Slash + DateType.DateTime, "%Y/%m/%d %H:%M:%S"],   // 年月日时分秒 "%Y-%m-%d %H:%M:%S"
  [DateFmType.Slash + DateType.DateHourMinute, "%Y/%m/%d %H:%M"],// 年月日时分 "%Y-%m-%d %H:%M"
  [DateFmType.Slash + DateType.DateHour, "%Y/%m/%d %H"],       // 年月日时 "%Y-%m-%d %H"

])

const DateFmNameMap = new Map([
  [DateFmType.Default, "2025-10-10"],           
  [DateFmType.Detail, "2025年10月10日"],       
  [DateFmType.Slash, "2025/10/10"],              
])

const DateGroupNameMap = new Map([
  [DateType.Date, "日期"],              // 年月日 "%Y-%m-%d"
  [DateType.YearMonth, "年月"],         // 年月 "%Y-%m"
  [DateType.Year, "年份"],              // 年 "%Y"
  [DateType.YearQuarter, "年季度"],     // 年季度 $month / 3
  [DateType.YearWeek, "年周"],          // 年周 "%Y-%V"

  [DateType.Quarter, "季度"],           // 季度 $month / 3
  [DateType.Month, "月份"],             // 月份 "%m"
  [DateType.MonthDay, "月日"],          // 月日 "%m-%d"
  [DateType.Week, "周次"],              // 周次 "%V" (iso 8601)
  [DateType.WeekDay, "星期"],           // 星期 "%u" (iso 8601)
  [DateType.Day, "日"],                 // 日 "%d"

  [DateType.Time, "时分秒"],            // 时分秒 "%H:%M:%S"
  [DateType.Hour, "时"],                // 时 "%H"
  [DateType.Minute, "分"],              // 分 "%M"
  [DateType.Second, "秒"],              // 秒 "%S"

  [DateType.DateTime, "年月日时分秒"],   // 年月日时分秒 "%Y-%m-%d %H:%M:%S"
  [DateType.DateHourMinute, "年月日时分"],// 年月日时分 "%Y-%m-%d %H:%M"
  [DateType.DateHour, "年月日时"],       // 年月日时 "%Y-%m-%d %H"

])

const enum NumFormatType {
  Number = 'number',
  Percent = 'percent',
  Custom = 'custom-numformat'
}
const defSysColors = ['#ffb23f', '#f98c6a', '#b26ef7', '#29f4de', '#24cbe2', '#5797ff', '#258e43'];

const ColorGroups = {
  Default: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc", '#a6c2e3', '#f59f80', '#d48fb2'],
  // 浅色系
  Light01: ['#4257b8', '#3d9adb', '#8a9dcc', '#71bd97', '#b7d19b', '#4f9ab3', '#e6aa8a', '#e67e8d', '#e0ce82', '#ad9a3b', '#a1b2bf', '#7e7b9e'],   // 1 高雅
  Light02: ['#336291', '#559cf2', '#6c7b97', '#e6a1a5', '#e67e8d', '#f2bc1d', '#b88b6e', '#a1c76d', '#65a878', '#8dabca', '#3e7aab', '#868ba6'],   // 2 冷静
  Light03: ['#974337', '#998f53', '#e1d09f', '#6d735a', '#e39971', '#db5446', '#e78250', '#dba947', '#bfa76f', '#dcb3a2', '#7a6b68', '#bcb0ab'],   // 3 琥珀
  Light04: ['#96aeb3', '#3f6f76', '#6fbca1', '#095385', '#94baf9', '#6e7dbd', '#b8935f', '#eec072', '#ee8714', '#ffd420', '#b67162', '#eb9486'],   // 4 淡青
  Light05: ['#71ae46', '#96b744', '#c4cc38', '#ebe12a', '#eab026', '#e3852b', '#d85d2a', '#ce2626', '#ac2026', '#71ae46', '#96b744', '#c4cc38'],   // 5 渐变
  Light06: ['#3d5a75', '#e36c4b', '#d8ac9c', '#ce6262', '#ce6262', '#f5b460', '#407885', '#c6b497', '#16a596', '#839b97', '#965d62', '#c7956d'],   // 6 豆沙
  Light07: ['#002c53', '#ffa510', '#0c84c6', '#ffbd66', '#f74d4d', '#2455a4', '#41b7ac', '#002c53', '#ffa510', '#0c84c6', '#ffbd66', '#f74d4d'],   // 7 经典
  Light08: ['#323987', '#3955b9', '#5f65d3', '#714fad', '#b763b1', '#e97393', '#282e6c', '#2e4494', '#4c5ea9', '#5a3f8a', '#924f8e', '#ba5c76'],   // 8 晚霞
  Light09: ['#2465ae', '#fccc35', '#c44d6a', '#6cbdba', '#2381ad', '#d7ad65', '#936c61', '#97d685', '#1d9992', '#8bbbf4', '#7e7bcc', '#e898a8'],   // 9 时尚
  Light10: ['#867a84', '#a29baa', '#d1cfd4', '#cbd8e1', '#6689a7', '#1e2d4e', '#6b626a', '#827c88', '#a7a6aa', '#a2adb4', '#526e86', '#18243e'],   // 10 冰川
  Light11: ['#7093ee', '#4b6082', '#65bfb8', '#2596a1', '#f9b44f', '#7a73c8', '#e898a8', '#e67e8d', '#c7cc3c', '#90ad71', '#6e91b5', '#72c9e5'],   // 11 默认亮白
  Light12: ['#7495b8', '#2e5776', '#a2d2f9', '#6c819b', '#c2dcf1', '#8cabc1', '#7e8abf', '#9eb4e2', '#71789a', '#acace6', '#92d1d1', '#ccb8a2'],   // 12 冷静蓝灰
  Light13: ['#f9b057', '#5d7fa8', '#69cdd8', '#e06c6d', '#ecde7f', '#91c989', '#de8ac9', '#faae98', '#4daba7', '#8baae0', '#c4bd44', '#5493de'],   // 13 清新多彩
  Light14: ['#6ba0b3', '#4d7b75', '#d0cbbf', '#49a476', '#eab44b', '#108b8d', '#f37d79', '#6d696c', '#f4d35e', '#267c9a', '#9ccc66', '#28a3cd'],   // 14 淡雅浅绿

  // 深色系
  Dark01: ['#4fdfff', '#42a0f7', '#5a6eff', '#26e0a5', '#00b2da', '#2871d3', '#ffcf48', '#ffa343', '#89f4c2', '#78d56c', '#38975a', '#8b78fa'],   // 1 现代
  Dark02: ['#0ec8fe', '#4d708b', '#c5fffa', '#8b969e', '#00ffea', '#5585de', '#f2e8b3', '#357efe', '#c0dbbc', '#2caccf', '#124b77', '#28a49a'],   // 2 夜光
  Dark03: ['#3ae8ef', '#3ad0f9', '#78fd84', '#068eea', '#01bdbe', '#0373a1', '#f86a8c', '#d63d65', '#f4ab98', '#ffcd40', '#f28e2b', '#05a6bb'],   // 3 未来
  Dark04: ['#3d65cc', '#24afff', '#ade1ff', '#29cc8a', '#33ffd3', '#6275a6', '#d9b3ff', '#ab6eb8', '#ffabab', '#e06e7e', '#fed9bb', '#eb8550'],   // 4 深湖
  Dark05: ['#00ceb2', '#e0e5ad', '#e18169', '#79b786', '#9ed6c9', '#f3aa97', '#bfa395', '#9b755e', '#f1c15f', '#57af7f', '#a4dd99', '#f28e2c'],   // 5 轻柔
  Dark06: ['#4681f4', '#edb2c7', '#6c7b97', '#d5e1e4', '#e67e8d', '#e6c08d', '#616774', '#94a9d1', '#ffffff', '#336291', '#a7d7b6', '#657698'],   // 6 沉静
  Dark07: ['#00c5dc', '#5867c3', '#ff525e', '#ffa9cc', '#ffaa00', '#ffdb03', '#9ccc66', '#36c398', '#00a7af', '#2281bc', '#766aef', '#c576d3'],   // 7 浅色炫彩
  Dark08: ['#2f9296', '#b5e8e5', '#ed9365', '#f9cd35', '#405b90', '#badc91', '#737c81', '#d89f7b', '#8083c0', '#e4d6a7', '#3a506b', '#b0c0d8'],   // 8 清幽
  Dark09: ['#4bbc63', '#59c9ef', '#ff855e', '#69d6c1', '#ffe342', '#2376c9', '#6699ff', '#59c68d', '#a9dd66', '#f987a2', '#f7c263', '#f19272'],   // 9 自然
  Dark10: ['#da195c', '#e6658e', '#f3b2c3', '#de3352', '#e65a68', '#f29ba1', '#e54542', '#ed7068', '#f29f96', '#e66943', '#f08c67', '#fabca0'],   // 10 红色
  Dark11: ['#5a80ff', '#92baff', '#1f9aa6', '#d1d63e', '#32c9b3', '#7d75d1', '#f09dae', '#c76561', '#ffaf2a', '#2793f2', '#7db835', '#88d4d1'],   // 11 默认暗黑
  Dark12: ['#76b7b2', '#c3dde3', '#768486', '#9ae3de', '#597a86', '#b6bd6f', '#888098', '#b8bbd6', '#3b705f', '#6f9680', '#8fb6d9', '#396ca7'],   // 12 智慧数据
  Dark13: ['#405380', '#4099ff', '#add3ff', '#2e7073', '#6eecda', '#cc7a7a', '#fdc0c0', '#e6962e', '#f4c349', '#5d5ccf', '#d9b3ff', '#ab6eb8'],   // 13 科幻大屏
  Dark14: ['#57677a', '#6cd1ff', '#ff758c', '#b3c8ff', '#6d739e', '#c9ffc2', '#709986', '#fed9bb', '#ff758c', '#fed6e3', '#bf88c2', '#9ea7ff'],   // 14 现代商务

  // 平衡
  Balance01: ['#4a72c9', '#42a3b7', '#a1cb80', '#729e90', '#4294b8', '#8aa0d3', '#5f71c6', '#a3ccf7', '#479ce2', '#6087bf', '#3d8a6f', '#76b55f'],   // 1 石青
  Balance02: ['#d36534', '#ef903e', '#f5be7e', '#bfa395', '#bfa395', '#8d9a90', '#559191', '#587d85', '#466172', '#86858a', '#7b6f79', '#b68b85'],   // 2 柔彩
  Balance03: ['#19a0da', '#65bbe6', '#b2daf3', '#338ede', '#5a99e6', '#9bbff2', '#4278e5', '#688eed', '#96adf2', '#4356e6', '#6772f0', '#a0a3fa'],   // 3 蓝色
  Balance04: ['#b25757', '#e18169', '#f1c15f', '#f4ab98', '#fa706d', '#f7a552', '#9c755f', '#bfa395', '#8d9a90', '#4c9f95', '#587d85', '#6388b4'],   // 4 秋落
  Balance05: ['#3195d3', '#68e1ea', '#f47398', '#27b3c3', '#67c9f4', '#f4b66c', '#6d6d84', '#b9d51f', '#007f54', '#a195c5', '#103667', '#f19272'],   // 5 别致
}

export {
  defSysColors,
  ColorGroups,
  SortType, SortNameMap,
  DateFmString, DateFmType, DateType, DateFmNameMap,DateGroupNameMap, NumFormatType,
  AggType, AggNameMap,
  CompInputType, CompInputTypeName,
}