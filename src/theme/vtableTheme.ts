/*eslint no-bitwise:0*/

function getBackgroundColor(args: any): string {
  const { row, table } = args;
  // if (row < table.frozenRowCount) {
  //   return "#FFF";
  // }
  const index = row - table.frozenRowCount;
  if (!(index & 1)) {
    return '#F4F8FF';
  }
  return '#FFF';
}

const headerBgColor = '#5389ff';
const headerBorderColor = '#6c99faff';
const headerFontColor = '#FFF';
const lineColor = "#E0E4E9";
const hoverBgColor = 'rgba(217, 230, 255, 0.6)'; // 悬停时背景色，浅蓝透明度叠加
const selectedBgColor = '#dcefff';                // 选中时背景色，浅蓝色
const selectedBorderColor = '#a3c8ff';            // 选中后的边框颜色，稍深的蓝色
/**
 * default theme
 * @name DEFAULT
 * @memberof DEFAULT
 */
export default {
  name: 'QBCUSTOM',
  underlayBackgroundColor: '#FFF',
  // selectionBgColor: '#CCE0FF',
  defaultStyle: {
    borderColor: lineColor,
    color: '#000',
    bgColor: '#FFFFFF'
  },
  headerStyle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: headerFontColor,
    bgColor: headerBgColor,
    borderColor: headerBorderColor,
    hover: {
      //   cellBorderColor: "#003fff",
      cellBgColor: hoverBgColor,
      inlineRowBgColor: '#F3F8FF',
      inlineColumnBgColor: '#F3F8FF'
    }
    // click: {
    //   cellBgColor: '#82b2f5',
    //   // inlineColumnBgColor: "#82b2f5",
    //   cellBorderColor: '#0000ff',
    //   cellBorderLineWidth: 2, // [0, 1, 3, 1],
    // },
  },
  rowHeaderStyle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: headerFontColor,
    bgColor: headerBgColor,
    borderColor: headerBorderColor,
    // click: {
    //   cellBgColor: '#82b2f5',
    //   // inlineColumnBgColor: "#82b2f5",
    //   cellBorderColor: '#0000ff',
    //   cellBorderLineWidth: 2, // [0, 1, 3, 1],
    // },
    hover: {
      //   cellBorderColor: "#003fff",
      cellBgColor: hoverBgColor,
      inlineRowBgColor: '#F3F8FF',
      inlineColumnBgColor: '#F3F8FF'
    }
  },
  cornerHeaderStyle: {
    color: headerFontColor,
    bgColor: headerBgColor,
    borderColor: headerBorderColor,
    fontSize: 14,
    fontWeight: 'bold'
  },
  bodyStyle: {
    fontSize: 14,
    bgColor: getBackgroundColor,
    hover: {
      // cellBorderColor: "#003fff",
      cellBgColor: hoverBgColor,
      inlineRowBgColor: '#F3F8FF',
      inlineColumnBgColor: '#F3F8FF'
      // cellBorderLineWidth:2
    }
    // click: {
    //   cellBgColor: 'rgba(0, 0, 255,0.1)',
    //   cellBorderLineWidth: 2,
    //   inlineColumnBgColor: '#CCE0FF',
    //   inlineRowBgColor: '#CCE0FF',
    //   cellBorderColor: '#0000ff',
    // },
  },
  frameStyle: {
    borderColor: '#EFEFF5',
    borderLineWidth: 0,
    borderLineDash: [],
    cornerRadius: 0,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowColor: 'black'
  },
  columnResize: {
    lineWidth: 1,
    lineColor: '#416EFF',
    bgColor: '#D9E2FF',
    width: 3
  },
  frozenColumnLine: {
    shadow: {
      width: 3,
      startColor: 'rgba(225, 228, 232, 0.6)',
      endColor: 'rgba(225, 228, 232, 0.6)',
      visible: 'always'
    }
  },
  // menuStyle: {
  //   color: '#000',
  //   highlightColor: '#2E68CF',
  //   fontSize: 12,
  //   fontFamily: 'Arial,sans-serif',
  //   highlightFontSize: 12,
  //   highlightFontFamily: 'Arial,sans-serif',
  //   hoverBgColor: '#EEE'
  // },
  selectionStyle: {
    cellBgColor: 'rgba(0, 0, 255,0.1)',
    cellBorderLineWidth: 2,
    cellBorderColor: selectedBorderColor
  },
  tooltipStyle: {
    bgColor: '#FFF',
    color: '#000',
    fontSize: 12,
    fontFamily: 'Arial,sans-serif'
  },
  scrollStyle: {
    scrollRailColor: '#f5f5f5',
    scrollSliderColor: '#bbb',
    visible: 'scrolling',
    width: 6,
    scrollSliderCornerRadius: 2,
  }
} as any;