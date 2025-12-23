import { addDays, getDaysInMonth, isAfter, lastDayOfMonth } from 'date-fns';

export function getStartAndEndDate(today: Date, daltaDays: number) {
  const startDate = addDays(today, -daltaDays);
  startDate.setDate(1);
  const endDate = lastDayOfMonth(addDays(today, daltaDays));
  return { startDate, endDate };
}

// 2. 添加全局语言配置
let currentLocale = 'zh'; // 默认中文

// 1. 定义语言包
const locales = {
  en: {
    today: 'Today',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  zh: {
    today: '今天',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  }
} as any;
// export const defaultDayTitles = ['year', 'month', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const defaultDayTitles = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export type DateRecordKeys = 'year' | 'month' | 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
export type DateRecord = Record<DateRecordKeys, number>;

export function getRecords(startDate: Date, endDate: Date) {
  const records: DateRecord[] = [];

  if (isAfter(startDate, endDate)) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthStartDate = new Date(year, month, 1);
    const daysInMonth = getDaysInMonth(monthStartDate);
    let week = monthStartDate.getDay();
    let record: DateRecord;
    if (records.length === 0) {
      if (week === 0) {
        record = { year, month } as DateRecord;
        records.push(record);
      } else if (month === 0) {
        record = { year: year - 1, month: 11 } as DateRecord;
        records.push(record);
      } else {
        record = { year, month: month - 1 } as DateRecord;
        records.push(record);
      }
    } else if (week === 0) {
      record = { year, month } as DateRecord;
      records.push(record);
    } else {
      record = records[records.length - 1];
    }

    for (let day = 1; day <= daysInMonth; day++) {
      if (week === 7) {
        week = 0;
        record = { year, month } as DateRecord;
        records.push(record);
      }
      setDate(record, week, day);
      week += 1;
    }

    month += 1;
    if (month === 12) {
      month = 0;
      year += 1;
    }
  }

  return records;
}

function setDate(record: DateRecord, day: number, date: number) {
  switch (day) {
    case 0:
      record.Sun = date;
      break;
    case 1:
      record.Mon = date;
      break;
    case 2:
      record.Tue = date;
      break;
    case 3:
      record.Wed = date;
      break;
    case 4:
      record.Thu = date;
      break;
    case 5:
      record.Fri = date;
      break;
    case 6:
      record.Sat = date;
      break;
  }
}

export function getMonthString(monthIndex: number) {
  return locales[currentLocale].months[monthIndex % locales[currentLocale].months.length];
}

export function getWeekdayString(weekdayIndex: number) {
  return locales[currentLocale].weekdays[weekdayIndex % locales[currentLocale].weekdays.length];
}

export function getWeekdays() {
  return locales[currentLocale].weekdays
}

export function getToday() {
  return locales[currentLocale].today;
}

