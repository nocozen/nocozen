import { differenceInDays, lastDayOfMonth } from 'date-fns';
import type { DateRecord } from './date-util';

export function getMonthCustomStyleRange(year: number, month: number, tableStartDate: Date, records: DateRecord[]) {
  const startDate = new Date(year, month, 1); // 该月第一天
  const endDate = lastDayOfMonth(startDate);  // 该月最后一天

  // 检查是否在 records 覆盖范围内
  const maxEndDate = new Date(tableStartDate);
  maxEndDate.setDate(tableStartDate.getDate() + records.length * 7); // 最大覆盖日期

  if (startDate > maxEndDate || endDate < tableStartDate) {
    console.warn('Month out of range');
    return [];
  }

  // 计算该月第一天是星期几 (0=周日, 1=周一...)
  const startDayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const endDayOfWeek = endDate.getDay();

  // 计算在表格中的行号
  const startDataIndex = Math.floor((differenceInDays(startDate, tableStartDate) + 1) / 7);
  const endDataIndex = Math.floor((differenceInDays(endDate, tableStartDate) + 1) / 7);

  // 安全检查
  if (startDataIndex >= records.length || endDataIndex < 0) {
    return [];
  }

  const customCellRanges = [];

  // 第一行：从 startDayOfWeek 到 周末
  customCellRanges.push({
    range: {
      start: { col: startDayOfWeek, row: startDataIndex + 1 },
      end: { col: 6, row: startDataIndex + 1 }
    }
  });

  // 中间整行（如果有）
  if (endDataIndex > startDataIndex + 1) {
    customCellRanges.push({
      range: {
        start: { col: 0, row: startDataIndex + 2 },
        end: { col: 6, row: endDataIndex }
      }
    });
  }

  // 最后一行：从周一到 endDayOfWeek
  if (endDataIndex > startDataIndex) {
    customCellRanges.push({
      range: {
        start: { col: 0, row: endDataIndex + 1 },
        end: { col: endDayOfWeek, row: endDataIndex + 1 }
      }
    });
  }

  return customCellRanges;
}
