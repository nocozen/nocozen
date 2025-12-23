import { FormElType, BiType } from "@/enum";

export function createEditorFilter(filter: Array<any>) {
  // 先基于现有配置实现简化版；后续封装完整的过滤配置
  let resultFilter = {} as any;
  filter.map((fField: any) => {  // 默认 range 类型
    const f = fField.filter;
    if (f) {
      if (f.fieldType == FormElType.FeNumber && f.filerValue?.length == 2) {
        resultFilter[f.fieldName] = { $gte: f.filerValue[0], $lte: f.filerValue[1] };
      } else if (f.fieldType == FormElType.FeDatetime && f.filerValue?.length == 2) {  // 默认 range 类型
        resultFilter[f.fieldName] = { $gte: f.filerValue[0], $lte: f.filerValue[1] };
      } else if (Array.isArray(f.filerValue)) {   // todo: 下拉列表临时固定多选一种 
        if (f.fieldType == FormElType.FeText || f.fieldType == FormElType.FeTextArea) {
          resultFilter[f.fieldName] = { $in: f.filerValue };
        } else {
          let names = f.filerValue.map((v: any) => v?.name) || []
          resultFilter[`${f.fieldName}.name`] = { $in: names };
        }
      }
    }
  })
  return resultFilter;
}

/**
 * 根据过滤条件和元数据类型映射生成MongoDB查询条件
 * @param {Object} filter - 过滤条件对象
 * @param {Object} meta - 字段元数据类型定义数组，可选
 * @returns {Object} MongoDB查询条件对象
 */
export function mapQuery(filter: any, meta: Array<any> = [], module_id?: string) {
  if (!filter || Object.keys(filter)?.length === 0) {
    return module_id ? { module_id } : {};
  }

  const conditions = [] as any[];
  const specificConditions = [] as any[];

  // 添加app_id条件（如果提供了app_id）
  if (module_id) {
    conditions.push({ module_id });
  }

  // 2. 处理 createBy._id（必须条件）
  if (filter['createBy._id'] !== undefined && filter['createBy._id'] !== '') {
    conditions.push({ 'createBy._id': filter['createBy._id'] });
    delete filter['createBy._id']; // 避免后续重复处理
  }

  // 处理所有字段搜索 (all)
  if (filter.all !== undefined && filter.all !== '') {
    const allValue = filter.all;
    const allFieldCondition = buildAllFieldCondition(allValue, meta, module_id);
    // 确保allFieldCondition有效且不为空
    if (allFieldCondition && Object.keys(allFieldCondition)?.length > 0) {
      conditions.push(allFieldCondition);
    }
    delete filter.all;
  }

  // 处理特定字段条件
  Object.entries(filter).forEach(([field, value]) => {
    if (value !== undefined && value !== '') {
      // 从meta中获取字段类型
      const fieldMeta = meta.find(m => m.key === field);
      const fieldType = fieldMeta ? fieldMeta.type : undefined;
      // console.log(fieldMeta, fieldType)
      if (fieldType) {
        const fieldCondition = buildFieldCondition(field, value, fieldType, module_id);
        // 确保条件有效且不为null
        if (fieldCondition && Object.keys(fieldCondition)?.length > 0) {
          specificConditions.push(fieldCondition);
        }
      }
    }
  });
  // console.log(specificConditions)
  // 合并条件
  return mergeConditions(conditions, specificConditions);
}

/**
 * 构建所有字段搜索条件
 */
function buildAllFieldCondition(value: string, meta: any[] = [], module_id?: string) {
  const conditions = [] as any[];

  // 遍历meta中的所有字段
  meta.forEach((m: any) => {
    if (m.key === 'all' || m.key === 'createBy._id') {
      return; // 跳过当前迭代（相当于 continue）
    }
    const condition = buildFieldCondition(m.key, value, m.type, module_id);
    // 过滤掉无效的条件
    if (condition && Object.keys(condition)?.length > 0) {
      conditions.push(condition);
    }
  });

  // 确保conditions不为空
  return conditions?.length > 0 ? { $or: conditions } : null;
}

/**
 * 构建特定字段搜索条件
 */
function buildFieldCondition(field: string, value: any, fieldType?: any, module_id?: string) {
  if (!value && value !== 0) return null; // 过滤空值
  if (field === 'createBy._id') {
    return;
  }
  const fieldPrefix = module_id ? "formData." : "";
  const fullFieldName = `${fieldPrefix}${field}`;

  switch (fieldType) {
    case FormElType.FeText:
    case FormElType.FeTextArea:
      // 字符串类型
      return { [fullFieldName]: { $regex: value, $options: 'i' } };

    case FormElType.FeDatetime:
    case FormElType.FeNumber:
      // 日期字段、数字字段：转换为字符串匹配
      return {
        $expr: {
          $regexMatch: {
            input: { $toString: `$${fullFieldName}` },
            regex: String(value), // 确保value是字符串
            options: 'i'
          }
        }
      };

    case FormElType.FeSelect:
    case FormElType.FeRadioGroup:
    case FormElType.FeUserSelect:
    case FormElType.FeDeptSelect:
    case FormElType.FeMulSelect:
    case FormElType.FeCheckboxGroup:
    case FormElType.FeMulUserSelect:
    case FormElType.FeMulDeptSelect:
      // 匹配对象、数组中对象的name属性
      return { [`${fullFieldName}.name`]: { $regex: value, $options: 'i' } };

    default:
      // 默认按字符串处理
      return { [fullFieldName]: { $regex: value, $options: 'i' } };
  }
}

function mergeConditions(conditions: any[], specificConditions: any[]) {
  const validMustConditions = conditions.filter(
    cond => cond && typeof cond === 'object' && Object.keys(cond)?.length > 0
  );

  const validOptionalConditions = specificConditions.filter(
    cond => cond && typeof cond === 'object' && Object.keys(cond)?.length > 0
  );

  const finalConditions = [];

  // 1. 必须条件（$and）
  if (validMustConditions?.length > 0) {
    finalConditions.push(
      validMustConditions?.length === 1
        ? validMustConditions[0]
        : { $and: validMustConditions }
    );
  }

  // 2. 可选条件（$or）
  if (validOptionalConditions?.length > 0) {
    finalConditions.push(
      validOptionalConditions?.length === 1
        ? validOptionalConditions[0]
        : { $or: validOptionalConditions }
    );
  }

  // 3. 构建最终查询
  if (finalConditions?.length === 0) {
    return {};
  } else if (finalConditions?.length === 1) {
    return finalConditions[0];
  } else {
    return { $and: finalConditions };
  }
}