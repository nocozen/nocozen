import dayjs from "dayjs";


export function convertToDate(value: any): Date | null {
  // 如果已经是 Date 对象，直接返回
  if (value instanceof Date) {
    const date = dayjs(value);
    if (!date.isValid()) {
      throw new Error(`无效的日期对象: ${value}`);
    }
    return value;
  }

  // 如果是 null、undefined 或空字符串，返回 null
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // 如果是数字，可能是时间戳
  if (typeof value === 'number') {
    // 检查是否是合理的时间戳范围（1970-2100年）
    if (value < 0 || value > 4102444800000) {
      return null;
    }
    
    // 处理秒级时间戳（10位）和毫秒级时间戳（13位）
    const timestamp = value.toString()?.length === 10 ? value * 1000 : value;
    const date = dayjs(timestamp);
    
    if (!date.isValid()) {
      throw new Error(`无效的时间戳: ${value}`);
    }
    return date.toDate();
  }

  // 如果是字符串
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      return null;
    }

    let date: dayjs.Dayjs | null = null;

    // 1. 尝试解析常见日期格式
    const commonFormats = [
      'YYYY-MM-DD',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ssZ',
      'YYYY/MM/DD',
      'YYYY/MM/DD HH:mm:ss',
      'YYYY.MM.DD',
      'YYYY年MM月DD日',
      'YYYY年MM月DD日 HH时mm分ss秒',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYYMMDD',
      'YYYYMMDDHHmmss'
    ];

    // 尝试使用各种格式解析
    for (const format of commonFormats) {
      date = dayjs(trimmedValue, format, true); // true 表示严格模式
      if (date.isValid()) {
        break;
      }
    }

    // 2. 如果格式解析失败，尝试自动解析
    if (!date || !date.isValid()) {
      date = dayjs(trimmedValue);
    }

    // 3. 如果还是失败，尝试解析时间戳字符串
    if ((!date || !date.isValid()) && /^\d+$/.test(trimmedValue)) {
      const numericValue = parseInt(trimmedValue, 10);
      return convertToDate(numericValue); // 递归调用处理数字
    }

    if (!date || !date.isValid()) {
      throw new Error(`无法解析的日期字符串格式: ${trimmedValue}`);
    }

    return date.toDate();
  }

  // 如果是布尔值或其他类型
  throw new Error(`不支持的类型转换为日期: ${typeof value} - ${value}`);
}
