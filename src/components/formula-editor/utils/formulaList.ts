import type { FormulaItem } from '../interfaces'
import { mean, max, min, sum } from 'lodash-es';
import dayjs from 'dayjs';



// 标准日期时间格式
const STANDARD_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const DATE_ONLY_FORMAT = 'YYYY-MM-DD';
// ========== 日期解析工具函数 ==========
/**
 * 使用 Day.js 解析多种格式的日期参数
 */
function parseDate(date: any): dayjs.Dayjs {
  if (dayjs.isDayjs(date)) {
    return date;
  }

  // Day.js 自动处理各种格式
  const d = dayjs(date);
  if (d.isValid()) {
    return d;
  }

  // 尝试数字解析（可能是字符串格式的时间戳）
  if (typeof date === 'string') {
    const timestamp = Number(date);
    if (!isNaN(timestamp)) {
      return dayjs(timestamp);
    }
  }

  // 返回无效的 Day.js 对象
  return dayjs('invalid');
}
/**
 * 安全加法（避免浮点误差）
 * @param a 数字
 * @param b 数字
 * @returns 精确结果
 */
function safeAdd(a: number, b: number): number {
  if (isNaN(a) || isNaN(b)) return NaN;
  const factor = Math.pow(10, Math.max(decimalPlaces(a), decimalPlaces(b)));
  return (Math.round(a * factor) + Math.round(b * factor)) / factor;
}

/**
 * 获取数字小数位数
 */
function decimalPlaces(num: number): number {
  const str = num.toString();
  const match = str.match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) return 0;
  const decimalLen = match[1] ? match[1]?.length : 0;
  const exp = match[2] ? parseInt(match[2], 10) : 0;
  return Math.max(0, decimalLen - exp);
}

/**
 * 安全求和（使用 safeAdd 累加）
 */
function preciseSum(...nums: number[]): number {
  return nums.reduce((sum, num) => {
    if (isNaN(num)) return sum;
    return safeAdd(sum, num);
  }, 0);
}

/**
 * 安全平均值
 */
function preciseAverage(...nums: number[]): number {
  const validNums = nums.filter(num => !isNaN(num));
  if (validNums?.length === 0) return 0;
  const sum = preciseSum(...validNums);
  return safeDivide(sum, validNums.length);
}

/**
 * 安全除法（避免 0.1/0.2 不精确）
 */
function safeDivide(a: number, b: number): number {
  if (isNaN(a) || isNaN(b) || b === 0) return NaN;
  const factor = Math.pow(10, decimalPlaces(a) + decimalPlaces(b));
  return Math.round((a / b) * factor) / factor;
}

export const FORMULA_Advanced: FormulaItem[] = [
  {
    name: 'VLOOKUP',
    type: 'advanced',
    handler: (lookupValue: any, table: any[], colIndex: any, exactMatch: any = false) => {
      if (!Array.isArray(table)) return '';

      for (const row of table) {
        if (exactMatch ? row[0] == lookupValue : String(row[0]).includes(String(lookupValue))) {
          const index = Math.max(0, Math.min(Number(colIndex) - 1, row.length - 1));
          return row[index];
        }
      }
      return '';
    },
    desc: '在表格中垂直查找值',
    usage: 'VLOOKUP(查找值, 表格范围, 列索引, 精确匹配)',
    example: 'VLOOKUP("A", [["A",1],["B",2]], 2, true) 返回 1'
  },
  {
    name: 'CHOOSE',
    type: 'advanced',
    handler: (index: any, ...values: any[]) => {
      const idx = Number(index) - 1;
      return values[idx] !== undefined ? values[idx] : '';
    },
    desc: '根据索引从值列表中选择值',
    usage: 'CHOOSE(索引, 值1, 值2, ...)',
    example: 'CHOOSE(2, "A", "B", "C") 返回 "B"'
  }
]

export const FORMULA_Logic: FormulaItem[] = [
  {
    name: 'IF',
    type: 'logic',
    handler: (condition: any, trueVal: any, falseVal: any) => {
      return condition ? trueVal : falseVal;
    },
    desc: '根据条件返回不同的值',
    usage: 'IF(条件, 真时值, 假时值)',
    example: 'IF(1>2, "是", "否") 返回 "否"'
  },
  {
    name: 'AND',
    type: 'logic',
    handler: (...conditions: any[]) => conditions.every(cond => Boolean(cond)),
    desc: '所有参数为真时返回true',
    usage: 'AND(条件1, 条件2, ...)',
    example: 'AND(1<2, 2<3) 返回 true'
  },
  {
    name: 'OR',
    type: 'logic',
    handler: (...conditions: any[]) => conditions.some(cond => Boolean(cond)),
    desc: '任一参数为真时返回true',
    usage: 'OR(条件1, 条件2, ...)',
    example: 'OR(1>2, 2<3) 返回 true'
  },
  {
    name: 'NOT',
    type: 'logic',
    handler: (condition: any) => !condition,
    desc: '对逻辑值取反',
    usage: 'NOT(条件)',
    example: 'NOT(1>2) 返回 true'
  },
  {
    name: 'IFS',
    type: 'logic',
    handler: (...conditions: any[]) => {
      for (let i = 0; i < conditions.length; i += 2) {
        if (conditions[i] && conditions[i + 1] !== undefined) {
          return conditions[i + 1];
        }
      }
      return '';
    },
    desc: '检查多个条件并返回第一个真条件对应的值',
    usage: 'IFS(条件1, 值1, 条件2, 值2, ...)',
    example: 'IFS(1>2, "A", 2<3, "B") 返回 "B"'
  }

]

export const FORMULA_Date: FormulaItem[] = [
  {
    name: 'NOW',
    type: 'date',
    handler: () => dayjs().format(STANDARD_FORMAT),
    desc: '返回当前日期和时间',
    usage: 'NOW()',
    example: 'NOW() 返回 "2023-10-01 15:30:45"'
  },
  {
    name: 'TODAY',
    type: 'date',
    handler: () => dayjs().format(DATE_ONLY_FORMAT) + ' 00:00:00',
    desc: '返回当前日期',
    usage: 'TODAY()',
    example: 'TODAY() 返回 "2023-10-01 00:00:00"'
  },
  {
    name: 'DATE',
    type: 'date',
    handler: (year: any, month: any, day: any) => {
      const d = dayjs().year(Number(year)).month(Number(month) - 1).date(Number(day));
      return d.isValid() ? d.format(STANDARD_FORMAT) : '';
    },
    desc: '返回特定日期',
    usage: 'DATE(年, 月, 日)',
    example: 'DATE(2023, 10, 1) 返回 "2023-10-01 00:00:00"'
  },
  {
    name: 'YEAR',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.year() : '';
    },
    desc: '返回日期的年份',
    usage: 'YEAR(日期/时间戳)',
    example: 'YEAR("2023-10-01") 返回 2023'
  },
  {
    name: 'MONTH',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.month() + 1 : ''; // Day.js 月份是 0-11
    },
    desc: '返回日期的月份(1-12)',
    usage: 'MONTH(日期/时间戳)',
    example: 'MONTH("2023-10-01") 返回 10'
  },
  {
    name: 'DAY',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.date() : '';
    },
    desc: '返回日期的天数(1-31)',
    usage: 'DAY(日期/时间戳)',
    example: 'DAY("2023-10-01") 返回 1'
  },
  {
    name: 'HOUR',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.hour() : '';
    },
    desc: '返回时间的小时数(0-23)',
    usage: 'HOUR(日期/时间戳)',
    example: 'HOUR("2023-10-01 15:30:00") 返回 15'
  },
  {
    name: 'MINUTE',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.minute() : '';
    },
    desc: '返回时间的分钟数(0-59)',
    usage: 'MINUTE(日期/时间戳)',
    example: 'MINUTE("15:30:00") 返回 30'
  },
  {
    name: 'SECOND',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.second() : '';
    },
    desc: '返回时间的秒数(0-59)',
    usage: 'SECOND(日期/时间戳)',
    example: 'SECOND("15:30:45") 返回 45'
  },
  {
    name: 'WEEKDAY',
    type: 'number',
    handler: (date: any, type: any = 1) => {
      const d = parseDate(date);
      if (!d.isValid()) return '';

      const day = d.day(); // Day.js 的 day() 返回 0-6 (周日到周六)

      switch (Number(type)) {
        case 2: return day === 0 ? 7 : day; // 周一=1 到 周日=7
        case 3: return day === 0 ? 6 : day - 1; // 周一=0 到 周日=6
        default: return day === 0 ? 7 : day + 1; // 周日=1 到 周六=7
      }
    },
    desc: '返回日期的星期几',
    usage: 'WEEKDAY(日期/时间戳, 类型)',
    example: 'WEEKDAY("2023-10-01") 返回 7 (周日)'
  },
  {
    name: 'DATEDIF',
    type: 'number',
    handler: (startDate: any, endDate: any, unit: any = 'd') => {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      if (!start.isValid() || !end.isValid()) return '';

      const unitType = unit.toLowerCase();

      switch (unitType) {
        case 'y': return end.diff(start, 'year');
        case 'm': return end.diff(start, 'month');
        case 'd': return end.diff(start, 'day');
        case 'h': return end.diff(start, 'hour');
        case 'min': return end.diff(start, 'minute');
        case 's': return end.diff(start, 'second');
        default: return end.diff(start, 'day');
      }
    },
    desc: '计算两个日期之间的差异',
    usage: 'DATEDIF(开始日期, 结束日期, 单位)',
    example: 'DATEDIF("2023-01-01", "2023-10-01", "m") 返回 9'
  },
  {
    name: 'DATEADD',
    type: 'date',
    handler: (date: any, number: any, unit: any = 'd') => {
      const d = parseDate(date);
      const num = Number(number);
      if (!d.isValid() || isNaN(num)) return '';

      const unitType = unit.toLowerCase();
      const result = d.add(num, unitType as dayjs.ManipulateType);
      return result.isValid() ? result.format(STANDARD_FORMAT) : '';
    },
    desc: '在日期上添加时间间隔',
    usage: 'DATEADD(日期, 数量, 单位)',
    example: 'DATEADD("2023-01-01", 1, "month") 返回 "2023-02-01 00:00:00"'
  },
  {
    name: 'DATESUB',
    type: 'date',
    handler: (date: any, number: any, unit: any = 'd') => {
      const d = parseDate(date);
      const num = Number(number);
      if (!d.isValid() || isNaN(num)) return '';

      const unitType = unit.toLowerCase();
      const result = d.subtract(num, unitType as dayjs.ManipulateType);
      return result.isValid() ? result.format(STANDARD_FORMAT) : '';
    },
    desc: '在日期上减去时间间隔',
    usage: 'DATESUB(日期, 数量, 单位)',
    example: 'DATESUB("2023-02-01", 1, "month") 返回 "2023-01-01 00:00:00"'
  },
  {
    name: 'TIMESTAMP',
    type: 'number',
    handler: (date: any) => {
      const d = parseDate(date);
      return d.isValid() ? d.valueOf() : '';
    },
    desc: '返回日期的时间戳',
    usage: 'TIMESTAMP(日期)',
    example: 'TIMESTAMP("2023-10-01") 返回 1696147200000'
  },
  {
    name: 'FROMTIMESTAMP',
    type: 'date',
    handler: (timestamp: any) => {
      const ts = Number(timestamp);
      if (isNaN(ts)) return '';
      const d = dayjs(ts);
      return d.isValid() ? d.format(STANDARD_FORMAT) : '';
    },
    desc: '从时间戳创建日期',
    usage: 'FROMTIMESTAMP(时间戳)',
    example: 'FROMTIMESTAMP(1696147200000) 返回 "2023-10-01 00:00:00"'
  },
  {
    name: 'FORMATDATE',
    type: 'text',
    handler: (date: any, format: any = 'YYYY-MM-DD') => {
      const d = parseDate(date);
      return d.isValid() ? d.format(String(format)) : '';
    },
    desc: '格式化日期',
    usage: 'FORMATDATE(日期, 格式)',
    example: 'FORMATDATE(NOW(), "YYYY年MM月DD日") 返回 "2023年10月01日"'
  },
  {
    name: 'START_OF',
    type: 'date',
    handler: (date: any, unit: any = 'day') => {
      const d = parseDate(date);
      if (!d.isValid()) return '';

      const unitType = unit.toLowerCase();
      const result = d.startOf(unitType as dayjs.OpUnitType);
      return result.format(STANDARD_FORMAT);
    },
    desc: '返回日期的开始时间',
    usage: 'START_OF(日期, 单位)',
    example: 'START_OF("2023-10-01", "month") 返回 "2023-10-01 00:00:00"'
  },
  {
    name: 'END_OF',
    type: 'date',
    handler: (date: any, unit: any = 'day') => {
      const d = parseDate(date);
      if (!d.isValid()) return '';

      const unitType = unit.toLowerCase();
      const result = d.endOf(unitType as dayjs.OpUnitType);
      return result.format(STANDARD_FORMAT);
    },
    desc: '返回日期的结束时间',
    usage: 'END_OF(日期, 单位)',
    example: 'END_OF("2023-10-01", "month") 返回 "2023-10-01 23:59:59"'
  }
]

export const FORMULA_Text: FormulaItem[] = [
  {
    name: 'CONCAT',
    type: 'text',
    handler: (...texts: any[]) => texts.join(''),
    desc: '连接多个文本字符串',
    usage: 'CONCAT(文本1, 文本2, ...)',
    example: 'CONCAT("Hello", " ", "World") 返回 "Hello World"'
  },
  {
    name: 'LEN',
    type: 'number',
    handler: (text: any) => String(text || '').length,
    desc: '返回文本字符串的字符数',
    usage: 'LEN(文本)',
    example: 'LEN("Hello") 返回 5'
  },
  {
    name: 'LEFT',
    type: 'text',
    handler: (text: any, numChars: any = 1) => {
      const str = String(text || '');
      const n = Math.max(0, Math.min(Number(numChars), str.length));
      return str.substring(0, n);
    },
    desc: '从文本左侧返回指定数量的字符',
    usage: 'LEFT(文本, 字符数)',
    example: 'LEFT("Hello", 2) 返回 "He"'
  },
  {
    name: 'RIGHT',
    type: 'text',
    handler: (text: any, numChars: any = 1) => {
      const str = String(text || '');
      const n = Math.max(0, Math.min(Number(numChars), str.length));
      return str.substring(str.length - n);
    },
    desc: '从文本右侧返回指定数量的字符',
    usage: 'RIGHT(文本, 字符数)',
    example: 'RIGHT("Hello", 3) 返回 "llo"'
  },
  {
    name: 'MID',
    type: 'text',
    handler: (text: any, start: any, numChars: any) => {
      const str = String(text || '');
      const s = Math.max(0, Number(start) - 1);
      const n = Math.max(0, Number(numChars));
      return str.substring(s, s + n);
    },
    desc: '从文本指定位置返回指定数量的字符',
    usage: 'MID(文本, 起始位置, 字符数)',
    example: 'MID("Hello", 2, 3) 返回 "ell"'
  },
  {
    name: 'UPPER',
    type: 'text',
    handler: (text: any) => String(text || '').toUpperCase(),
    desc: '将文本转换为大写',
    usage: 'UPPER(文本)',
    example: 'UPPER("hello") 返回 "HELLO"'
  },
  {
    name: 'LOWER',
    type: 'text',
    handler: (text: any) => String(text || '').toLowerCase(),
    desc: '将文本转换为小写',
    usage: 'LOWER(文本)',
    example: 'LOWER("HELLO") 返回 "hello"'
  },
  {
    name: 'TRIM',
    type: 'text',
    handler: (text: any) => String(text || '').trim(),
    desc: '移除文本前后的空格',
    usage: 'TRIM(文本)',
    example: 'TRIM("  hello  ") 返回 "hello"'
  },
  {
    name: 'REPLACE',
    type: 'text',
    handler: (text: any, start: any, numChars: any, newText: any) => {
      const str = String(text || '');
      const s = Math.max(0, Number(start) - 1);
      const n = Math.max(0, Number(numChars));
      return str.substring(0, s) + String(newText || '') + str.substring(s + n);
    },
    desc: '替换文本中指定位置的字符',
    usage: 'REPLACE(原文本, 起始位置, 字符数, 新文本)',
    example: 'REPLACE("Hello", 2, 3, "i") 返回 "Hi"'
  },
  {
    name: 'FIND',
    type: 'number',
    handler: (findText: any, withinText: any, start: any = 1) => {
      const str = String(withinText || '');
      const search = String(findText || '');
      const s = Math.max(0, Number(start) - 1);
      const result = str.indexOf(search, s);
      return result === -1 ? -1 : result + 1;
    },
    desc: '在文本中查找特定文本的位置',
    usage: 'FIND(查找文本, 在文本中, 起始位置)',
    example: 'FIND("l", "Hello") 返回 3'
  }
]
/**
 * @desc 进行公式计算的方法
 */
export const FORMULA_Number: FormulaItem[] = [
  // ========== 数学函数 ==========
  {
    name: 'ABS',
    type: 'number',
    handler: (num: any) => {
      const n = Number(num);
      return isNaN(n) ? '' : Math.abs(n);
    },
    desc: '返回数字的绝对值',
    usage: 'ABS(数字)',
    example: 'ABS(-5) 返回 5'
  },
  {
    name: 'ROUND',
    type: 'number',
    handler: (num: any, digits: any = 0) => {
      const n = Number(num);
      const d = Number(digits);
      return isNaN(n) || isNaN(d) ? '' : parseFloat(n.toFixed(d));
    },
    desc: '将数字四舍五入到指定的小数位数（修复浮点误差）',
    usage: 'ROUND(数字, 小数位数)',
    example: 'ROUND(3.14159, 2) 返回 3.14'
  },
  {
    name: 'ROUNDUP',
    type: 'number',
    handler: (num: any, digits: any = 0) => {
      const n = Number(num);
      const d = Number(digits);
      if (isNaN(n) || isNaN(d)) return '';
      const factor = Math.pow(10, d);
      return Math.ceil(n * factor) / factor;
    },
    desc: '向上舍入数字',
    usage: 'ROUNDUP(数字, 小数位数)',
    example: 'ROUNDUP(3.141, 2) 返回 3.15'
  },
  {
    name: 'ROUNDDOWN',
    type: 'number',
    handler: (num: any, digits: any = 0) => {
      const n = Number(num);
      const d = Number(digits);
      if (isNaN(n) || isNaN(d)) return '';
      const factor = Math.pow(10, d);
      return Math.floor(n * factor) / factor;
    },
    desc: '向下舍入数字',
    usage: 'ROUNDDOWN(数字, 小数位数)',
    example: 'ROUNDDOWN(3.159, 2) 返回 3.15'
  },
  {
    name: 'CEILING',
    type: 'number',
    handler: (num: any, significance: any = 1) => {
      const n = Number(num);
      const s = Number(significance);
      if (isNaN(n) || isNaN(s) || s === 0) return '';
      return Math.ceil(n / s) * s;
    },
    desc: '将数字向上舍入到指定基数的倍数',
    usage: 'CEILING(数字, 基数)',
    example: 'CEILING(4.3, 0.5) 返回 4.5'
  },
  {
    name: 'FLOOR',
    type: 'number',
    handler: (num: any, significance: any = 1) => {
      const n = Number(num);
      const s = Number(significance);
      if (isNaN(n) || isNaN(s) || s === 0) return '';
      return Math.floor(n / s) * s;
    },
    desc: '将数字向下舍入到指定基数的倍数',
    usage: 'FLOOR(数字, 基数)',
    example: 'FLOOR(4.7, 0.5) 返回 4.5'
  },
  {
    name: 'MOD',
    type: 'number',
    handler: (num: any, divisor: any) => {
      const n = Number(num);
      const d = Number(divisor);
      if (isNaN(n) || isNaN(d) || d === 0) return '';
      return ((n % d) + d) % d; // 支持负数取模
    },
    desc: '返回两数相除的余数（支持负数）',
    usage: 'MOD(被除数, 除数)',
    example: 'MOD(10, 3) 返回 1'
  },
  {
    name: 'POWER',
    type: 'number',
    handler: (base: any, exponent: any) => {
      const b = Number(base);
      const e = Number(exponent);
      return isNaN(b) || isNaN(e) ? '' : Math.pow(b, e);
    },
    desc: '返回数字的乘幂',
    usage: 'POWER(底数, 指数)',
    example: 'POWER(2, 3) 返回 8'
  },
  {
    name: 'SQRT',
    type: 'number',
    handler: (num: any) => {
      const n = Number(num);
      return isNaN(n) || n < 0 ? '' : Math.sqrt(n);
    },
    desc: '返回数字的平方根（负数返回空）',
    usage: 'SQRT(数字)',
    example: 'SQRT(9) 返回 3'
  },
  {
    name: 'EXP',
    type: 'number',
    handler: (num: any) => {
      const n = Number(num);
      return isNaN(n) ? '' : Math.exp(n);
    },
    desc: '返回e的指定次幂',
    usage: 'EXP(指数)',
    example: 'EXP(1) 返回 2.718'
  },
  {
    name: 'LN',
    type: 'number',
    handler: (num: any) => {
      const n = Number(num);
      return isNaN(n) || n <= 0 ? '' : Math.log(n);
    },
    desc: '返回数字的自然对数（<=0 返回空）',
    usage: 'LN(数字)',
    example: 'LN(10) 返回 2.302'
  },
  {
    name: 'LOG',
    type: 'number',
    handler: (num: any, base: any = 10) => {
      const n = Number(num);
      const b = Number(base);
      if (isNaN(n) || n <= 0 || isNaN(b) || b <= 0 || b === 1) return '';
      return Math.log(n) / Math.log(b);
    },
    desc: '返回数字的指定底数的对数',
    usage: 'LOG(数字, 底数)',
    example: 'LOG(100, 10) 返回 2'
  },
  {
    name: 'RAND',
    type: 'number',
    handler: () => Math.random(),
    desc: '返回0到1之间的随机数',
    usage: 'RAND()',
    example: 'RAND() 返回 0.423'
  },
  {
    name: 'RANDBETWEEN',
    type: 'number',
    handler: (min: any, max: any) => {
      const minVal = Number(min);
      const maxVal = Number(max);
      if (isNaN(minVal) || isNaN(maxVal) || minVal > maxVal) return '';
      return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    },
    desc: '返回指定范围内的随机整数',
    usage: 'RANDBETWEEN(最小值, 最大值)',
    example: 'RANDBETWEEN(1, 100) 返回 42'
  },

  // ========== 统计函数 ==========
  {
    name: 'SUM',
    type: 'number',
    handler: (...nums: any[]) => {
      const numbers = nums
        .map(num => {
          const n = Number(num);
          return isNaN(n) ? 0 : n;
        });
      const result = preciseSum(...numbers);
      return isNaN(result) ? '' : result;
    },
    desc: '计算参数的总和（修复浮点精度问题）',
    usage: 'SUM(数字1, 数字2, ...)',
    example: 'SUM(0.1, 0.2) 返回 0.3'
  },
  {
    name: 'AVERAGE',
    type: 'number',
    handler: (...nums: any[]) => {
      const numbers = nums
        .map(num => {
          const n = Number(num);
          return isNaN(n) ? 0 : n;
        })
        .filter(num => !isNaN(num)); // 过滤 NaN
      if (numbers?.length === 0) return '';
      const result = preciseAverage(...numbers);
      return isNaN(result) ? '' : result;
    },
    desc: '计算参数的算术平均值（修复浮点精度）',
    usage: 'AVERAGE(数字1, 数字2, ...)',
    example: 'AVERAGE(0.1, 0.2) 返回 0.15'
  },
  {
    name: 'MAX',
    type: 'number',
    handler: (...nums: any[]) => {
      const numbers = nums
        .map(num => Number(num))
        .filter(num => !isNaN(num));
      return numbers?.length ? Math.max(...numbers) : '';
    },
    desc: '返回参数中的最大值',
    usage: 'MAX(数字1, 数字2, ...)',
    example: 'MAX(1, 5, 3) 返回 5'
  },
  {
    name: 'MIN',
    type: 'number',
    handler: (...nums: any[]) => {
      const numbers = nums
        .map(num => Number(num))
        .filter(num => !isNaN(num));
      return numbers?.length ? Math.min(...numbers) : '';
    },
    desc: '返回参数中的最小值',
    usage: 'MIN(数字1, 数字2, ...)',
    example: 'MIN(1, 5, 3) 返回 1'
  },
  {
    name: 'COUNT',
    type: 'number',
    handler: (...nums: any[]) => {
      return nums.filter(num => !isNaN(Number(num)))?.length;
    },
    desc: '计算参数中数字的个数',
    usage: 'COUNT(值1, 值2, ...)',
    example: 'COUNT(1, "a", 3) 返回 2'
  },
  {
    name: 'COUNTIF',
    type: 'number',
    handler: (range: any[], criteria: any) => {
      if (!Array.isArray(range)) return 0;
      return range.filter(item => {
        if (typeof criteria === 'string') {
          if (criteria.startsWith('>')) return Number(item) > Number(criteria.slice(1));
          if (criteria.startsWith('<')) return Number(item) < Number(criteria.slice(1));
          if (criteria.startsWith('>=')) return Number(item) >= Number(criteria.slice(2));
          if (criteria.startsWith('<=')) return Number(item) <= Number(criteria.slice(2));
          if (criteria.startsWith('<>')) return Number(item) !== Number(criteria.slice(2));
        }
        return item == criteria; // 兼容 == 判断
      })?.length;
    },
    desc: '计算满足条件的单元格数量（支持 >, <, >=, <=, <>）',
    usage: 'COUNTIF(范围, 条件)',
    example: 'COUNTIF([1,2,3,4], ">2") 返回 2'
  }
];


