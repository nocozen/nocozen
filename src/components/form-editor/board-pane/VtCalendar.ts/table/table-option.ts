import type { ListTableConstructorOptions, TYPES } from '@visactor/vtable';
import { themes } from '@visactor/vtable';
import type { DateRecord, DateRecordKeys } from '../date-util';
import { defaultDayTitles, getWeekdays, getToday, getMonthString, getWeekdayString } from '../date-util';
import { calendarCustomLayout } from '../custom/custom-layout';
import { isValid, merge } from '@visactor/vutils';
import { addDays, isSameDay, lastDayOfMonth } from 'date-fns';

export function createTableOption(
  dayTitles: string[],
  week: DateRecordKeys[],
  currentDate: Date | undefined,
  config: { tableOptions?: ListTableConstructorOptions; containerWidth: number; containerHeight: number }
) {
  const titles = dayTitles || getWeekdays();
  const columns = titles.map((item: string, index: number) => {
    return {
      field: week[index],
      title: item,
      // width: columnWidth ?? 140,
      fieldFormat: (record: DateRecord) => {
        if (currentDate && isSameDay(addDays(getSundayDate(record) as any, index), currentDate)) {
          return getToday() + `  ${record[week[index]]}`;
        } else if (record[week[index]] === 1) {
          const monthIndex = week[index] === 'Sun' ? record.month : record.month + 1;
          const mouthStr = getMonthString(monthIndex);
          return `${mouthStr}  ${record[week[index]]}`;
        }
        return record[week[index]];
      },
      customLayout: (config.tableOptions as any)?.customLayout ?? calendarCustomLayout
    };
  });

  // const rowHeight = Math.floor(
  //   (config.containerHeight -
  //     ((config.tableOptions?.title?.textStyle?.fontSize ?? 14) +
  //       (config.tableOptions?.title?.subtextStyle?.fontSize ?? 14) + 1) -
  //     ((config.tableOptions?.defaultHeaderRowHeight as number) ?? 40)) / 5
  // ); // height - title - header
  const rowHeight = Math.floor(
    (config.containerHeight -
      ((config.tableOptions?.title?.textStyle?.fontSize ?? 14) +
        (config.tableOptions?.title?.subtextStyle?.fontSize ?? 14) + 1) -
      ((config.tableOptions?.defaultHeaderRowHeight as number) ?? 40)) / 5
  );
  const option: TYPES.ListTableConstructorOptions = {
    ...(config.tableOptions ?? {}),
    columns,
    defaultRowHeight: rowHeight ?? 120,
    defaultHeaderRowHeight: config.tableOptions?.defaultHeaderRowHeight ?? 40,
    widthMode: 'adaptive',
    columnResizeMode: 'none',
    theme: themes.DEFAULT.extends(
      merge(
        {
          headerStyle: {
            textAlign: 'center'
          },
          bodyStyle: {
            bgColor: (args: any) => {
              const { col, row, dataValue, table } = args;
              const record = table.getCellRawRecord(col, row);
              if (
                currentDate &&
                isSameDay(addDays(getSundayDate(record) as any, col), currentDate)
              ) {
                return '#5389ff';
              }
              return '#fff';
            },
            textAlign: 'right',
            textBaseline: 'top',
            color: (args: any) => {
              const { col, row, dataValue, table } = args;
              const record = table.getCellRawRecord(col, row);
              if (
                currentDate &&
                isSameDay(addDays(getSundayDate(record) as any, col), currentDate)
              ) {
                return '#FFF';
              }
              return '#000';
            }
          }
        },
        config.tableOptions?.theme
      )
    ),
    title: undefined,
    // title: currentDate
    //   ? {
    //       ...(config.tableOptions?.title ?? {}),

    //       orient: 'top',
    //       // text: 'Thu, Aug 22',
    //       text: `${getWeekdayString(currentDate.getDay())}, ${getMonthString(
    //         currentDate.getMonth()
    //       )} ${currentDate.getDate()}`,
    //       subtext: currentDate.getFullYear()
    //     }
    //   : undefined,
    enableLineBreak: true,
    customCellStyle: [
      // {
      //   id: 'current-month',
      //   style: {
      //     color: '#000'
      //   }
      // }
    ]
  };

  return option;
}

function getSundayDate(record: DateRecord) {
  if (isValid(record.Sun)) {
    return new Date(record.year, record.month, record.Sun);
  }

  // last day of month
  const lastDay = lastDayOfMonth(new Date(record.year, record.month, 1));
  if (isValid(record.Mon)) {
    // delete 1 day
    return addDays(lastDay, -0);
  }
  if (isValid(record.Tue)) {
    // delete 2 day
    return addDays(lastDay, -1);
  }
  if (isValid(record.Wed)) {
    // delete 3 day
    return addDays(lastDay, -2);
  }
  if (isValid(record.Thu)) {
    // delete 4 day
    return addDays(lastDay, -3);
  }
  if (isValid(record.Fri)) {
    // delete 5 day
    return addDays(lastDay, -4);
  }
  if (isValid(record.Sat)) {
    // delete 6 day
    return addDays(lastDay, -5);
  }
}
