const ellipsis = "…";
// const hanziWidth = 100;   // 默认 10px字体大小，其它字号需要按比例转换；
// const fontHeight = 128;


// todo: 字号大小修改最后再处理，因为涉及到刻度偏移量等问题===========


/** 按10px生成的结果，需要调用时再按比例转换: 例如12px(size /10 * 12) */
export function clipper(text: string, clipWidth: number, fontSize: string, ) {
  if (clipWidth == Infinity) return "";
  let size = parseInt(fontSize);
  let hzWidth = size * 10;
  // 顺序添加text中的字符直到超出clipWidth前停止
  let newText = '';
  let currClipWidth = clipWidth * 10;
  let maxWidth = 0;
  let ellipsisSpace = hzWidth + 8.2 * size;
  for (let i = 0; i < text.length; i++) {
    if (maxWidth < currClipWidth && (currClipWidth - maxWidth) > ellipsisSpace ) {
      newText = newText + text[i];
      if (text[i] in defaultWidthMap) {
        maxWidth = maxWidth + (defaultWidthMap[text[i]] * size / 10)
      } else {
        maxWidth = maxWidth + hzWidth;
      }
    } else {
      newText = newText + ellipsis;
      break;
    }
  }

  return newText;
}

/** 按10px生成的结果，需要调用时再按比例转换: 例如12px(size /10 * 12) */
export function getTextWidth(text: string, fontSize?: string) {
  let textWidth = 0;
  let size = parseInt(fontSize ? fontSize : '12px');
  let hzWidth = size * 10;

  for (let i = 0; i < text.length; i++) {
    if (text[i] in defaultWidthMap) {
      textWidth = textWidth + (defaultWidthMap[text[i]] * size / 10)
    } else {
      textWidth = textWidth + hzWidth;
    }
  }
  return textWidth / 10;

}

/** 按10px生成的结果，需要调用时再按比例转换: 例如12px(size /10 * 12) */
export function getMaxTextWidth(data: Array<any>, fieldIndex: number | string, fontSize: string) {
  // 由于数字小数位过长导致的边距过宽问题不处理，应在查询获取数据时做格式转换
  let maxWidth = 0;
  for (let i = 0; i < data.length; i++) {
    const width = getTextWidth(String(data[i][fieldIndex]), fontSize);
    if (width > maxWidth) {
      maxWidth = width;
    }
  }
  return Math.ceil(maxWidth)
}

/**
 *  .selectAll('.tick text')
    .nodes().forEach((textElement: SVGTextElement) => {
      const textWidth = textElement.getBBox().width;    // 相对defaultWidthMap中值有偏差，可再优化defaultWidthMap
      textElement.textContent && (textElement.textContent = clipper(textElement.textContent, x.bandwidth()))
    })
 */
/** 10px字体的大小，不同字号需要调用后再转换；todo: 目前拿到的宽度不是十分精确，可在优化，需要在精确获取下字符宽度 */
const defaultWidthMap: any = {
  a: 56,
  b: 63,
  c: 57,
  d: 63,
  e: 58,
  f: 37,
  g: 62,
  h: 60,
  i: 26,
  j: 29,
  k: 55,
  l: 26,
  m: 88,
  n: 60,
  o: 60,
  p: 62,
  q: 62,
  r: 39,
  s: 54,
  t: 38,
  u: 60,
  v: 55,
  w: 79,
  x: 54,
  y: 55,
  z: 55,
  A: 69,
  B: 67,
  C: 73,
  D: 74,
  E: 61,
  F: 58,
  G: 76,
  H: 75,
  I: 28,
  J: 55,
  K: 67,
  L: 58,
  M: 89,
  N: 75,
  O: 78,
  P: 65,
  Q: 78,
  R: 67,
  S: 65,
  T: 65,
  U: 75,
  V: 69,
  W: 98,
  X: 69,
  Y: 67,
  Z: 67,
  0: 64,
  1: 48,
  2: 62,
  3: 64,
  4: 66,
  5: 63,
  6: 65,
  7: 58,
  8: 65,
  9: 65,
  " ": 29,
  "!": 32,
  "@": 103,
  "#": 65,
  "$": 59,
  "%": 90,
  "^": 74,
  "&": 88,
  "*": 46,
  '"': 49,
  "'": 31,
  "(": 39,
  ")": 39,
  ",": 31,
  "-": 45,
  "_": 47,
  ".": 31,
  "/": 32,
  ":": 31,
  ";": 31,
  "?": 52,
  "‘": 31,
  "’": 31,
  "“": 47,
  "”": 47,
  "…": 82
};