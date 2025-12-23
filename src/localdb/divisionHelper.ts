import pccd from './division-cn/pccd.json';

function getRegionName(code: string): string | undefined {
  if (code in pccd) {
    return pccd[code as keyof typeof pccd];
  }
  return undefined;
}

/**
 * 根据县区代码获取完整路径（格式：省/市/区）
 * @param districtCode 县/区级行政区划代码（如 '110105'）
 * @returns 格式如 "北京市/北京市/朝阳区"，如果找不到则部分为空字符串
 */
export const getPathByDistrictCode = (districtCode: string): string => {
  // 校验输入
  if (!districtCode || districtCode.length !== 6 || districtCode.endsWith('00')) {
    console.warn('无效的县区代码:', districtCode);
    return '';
  }

  const provinceCode = districtCode.slice(0, 2) + '0000'; // 省级代码
  const cityCode = districtCode.slice(0, 4) + '00';       // 地级市代码
  const districtName = getRegionName(districtCode) || '';
  const provinceName = getRegionName(provinceCode) || '';
  const cityName = getRegionName(cityCode) || '';

  // 判断是否为直辖市（北京、天津、上海、重庆）
  const isDirectCity = ['11', '12', '31', '50'].includes(districtCode.slice(0, 2));

  if (!provinceName) {
    console.warn('未找到省级名称:', provinceCode);
    return `${cityName}/${districtName}`.replace('//', '/'); // 避免重复斜杠
  }

  if (isDirectCity) {
    // 直辖市：省 = 市 = 省名（如 "北京市/北京市/朝阳区"）
    return `${provinceName}/${provinceName}/${districtName}`.replace('//', '/');
  } else {
    // 普通省份：有独立的市名（如 "广东省/广州市/天河区"）
    return `${provinceName}/${cityName}/${districtName}`.replace('//', '/');
  }
};

/**
 * 根据任意行政区划代码获取路径（格式：省/市/区）
 */
export const getPathByCode = (code: string): string => {
  if (!code || code.length !== 6) return '';

  // 如果是区级（非00结尾）
  if (!code.endsWith('00')) {
    return getPathByDistrictCode(code);
  }

  // 如果是市级（xx00结尾，非0000）
  if (code.endsWith('00') && !code.endsWith('0000')) {
    const provinceCode = code.slice(0, 2) + '0000';
    const cityName = getRegionName(code) || '';
    const provinceName = getRegionName(provinceCode) || '';
    return `${provinceName}/${cityName}`.replace('//', '/');
  }

  // 如果是省级（0000结尾）
  if (code.endsWith('0000')) {
    const provinceName = getRegionName(code) || '';
    return provinceName;
  }

  return '';
};