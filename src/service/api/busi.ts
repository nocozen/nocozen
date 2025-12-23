import { request } from '../request';
import { z } from "zod";
import { AggType, DateFmString, DateFmType, DateType, SortType } from "@/enum/biMeta";
import { BiType, FormElType } from '@/enum';
import * as _ from 'lodash-es'

function checkNecesParms(parms: Array<string>) {
  for (let p of parms) {
    if (!z.string().min(1).safeParse(p).success) {
      return false;
    }
  }
  return true;
}

export async function fetchDelteBusiData(collName: string, _id: string) {
  const option: Fetch.DeleteOption = {
    collection: collName,
    filter: { _id }
  }
  return await request<Fetch.DeleteResult>('/deleteBusiData', {
    method: "POST",
    body: option
  });
}

export async function fetchUpdateBusiData(collName: string, data: any) {
  const option: Fetch.UpdateOption = {
    collection: collName,
    update: data
  }
  return await request<Fetch.UpdateResult>('/updateBusiData', {
    method: "POST",
    body: option
  })
}

// 草稿：'draft' ，待审：'todo' ，已确认：'confirmed'， 作废：'cancel'
export async function fetchFindBusiData(collName: string | undefined, filter: any, pageNumber: number = 1, pageSize: number = 1, sort: any = {}) {
  if (collName && pageNumber) {
    const findOption: Fetch.FindOption = {
      collection: collName,
      filter: filter ? filter : {},
      page: pageNumber,
      size: pageSize,
      sort: sort
    }
    // console.log(findOption)
    return request<Fetch.FindResult>('/findBusiData', {
      method: "POST",
      body: findOption
    })
  } else {
    return { data: [], msg: '参数值缺失' }
  }
}

export async function fetchBusiData(collName: string | undefined, filter: any, sort: any = {}) {
  if (collName) {
    const findOption: Fetch.FindOption = {
      collection: collName,
      filter: filter ? filter : {},
      sort: sort,
      datatype: 'object'
    }
    return request<Fetch.FindResult>('/findBusiData', {
      method: "POST",
      body: findOption
    })
  } else {
    return { data: [], msg: '参数值缺失' }
  }
}

// 导出数据
export async function fetchFindAllBusiData(collName: string | undefined, filter: any) {
  if (collName) {
    const findOption: Fetch.FindOption = {
      collection: collName,
      filter: filter ? filter : {},
      projection: {
        _id: 0,
        en_id: 0,
        createAt: 0,
        updateAt: 0,
        createBy: 0,
        complatedState: 0
      },
      datatype: 'array'
    }
    return request<Fetch.FindResult>('/findBusiData', {
      method: "POST",
      body: findOption
    })
  } else {
    return { data: [], msg: '参数值缺失' }
  }
}

export async function fetchBulkWrite(collName: string, docs: Array<any>, meta: Array<Fetch.BulkMeta>) {
  if (collName && docs?.length > 0 && meta?.length > 0) {
    const option: Fetch.BulkUpsertOption = {
      collection: collName,
      docs: docs,
      meta: meta
    }
    return request<Fetch.InsertResult>('/bulkWrite', {
      method: "POST",
      body: option
    })
  } else {
    return { msg: '参数值缺失', data: {} } as Fetch.InsertResult
  }
}


// 附件系统字段：MetaBase
export async function fetchInsertBusiData(collName: string, doc: Meta.BiDoc) {
  if (collName && doc) {
    const option = {
      collection: collName,
      docs: [doc]
    }
    return request<Fetch.InsertResult>('/insertBusiData', {
      method: "POST",
      body: option
    })
  } else {
    return { msg: '参数值缺失', data: {} } as Fetch.InsertResult
  }

}


function getProject(meas: Array<any>, hasPush: boolean) {
  let project: any = {};
  let prjPrifix = "$";
  hasPush && (prjPrifix = "$统计结果.");
  project["_id"] = prjPrifix + "_id";
  // y轴未添加时初始化展示处理
  if (meas?.length == 0) {
    project["记录数"] = prjPrifix + "记录数";
  }
  for (let f of meas) {
    let fname = prjPrifix + f.key;
    if (f.biType == BiType.Date || f.biType == BiType.Text) {
      project[f.key] = fname;
    } else if (f.biType == BiType.Number) {
      project[f.key] = {
        $cond: [
          { $eq: [{ $type: fname }, "decimal"] },
          { $round: [{ $toDouble: fname }, 2] },
          { $round: [fname, 2] }
        ]
      }
    }
  }
  return project;
}

function getLastKey<T extends object>(obj: T) {
  return _.last(_.keys(obj));
}

function getGroupValue(aggType: string, value: string) {
  if (AggType.Count == aggType) {
    return { [`$sum`]: 1 }
  } else if (AggType.Median == aggType) {
    return {
      [`$${aggType}`]: {
        "input": '$' + value,
        "method": "approximate"
      }
    }
  } else {
    return { [`$${aggType}`]: '$' + value }
  }
}

function getGroupKey(d: Meta.ChartDim, groupValue: string) {
  if (d.dateType == DateType.Quarter) {
    return { $concat: [{ $toString: { $ceil: { $divide: [{ $month: groupValue }, 3] } } }, DateFmString.get(d.dateFmType + d.dateType)] };
  } else if (d.dateType == DateType.YearQuarter) {
    const fmArr = DateFmString.get(d.dateFmType + d.dateType)?.split("%");
    return { $concat: [{ $toString: { $year: groupValue } }, fmArr![0], { $toString: { $ceil: { $divide: [{ $month: groupValue }, 3] } } }, fmArr![1]] };
  } else if (d.dateType == DateType.WeekDay) {
    if (d.dateFmType == DateFmType.Default) {
      return {
        $let: {
          vars: { dayOfWeekNames: ["一", "二", "三", "四", "五", "六", "日"] },
          in: { $arrayElemAt: ["$$dayOfWeekNames", { $subtract: [{ $dayOfWeek: groupValue }, 1] }] }
        }
      };
    } else if (d.dateFmType == DateFmType.Detail) {
      return {
        $let: {
          vars: { dayOfWeekNames: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"] },
          in: { $arrayElemAt: ["$$dayOfWeekNames", { $subtract: [{ $dayOfWeek: groupValue }, 1] }] }
        }
      };
    } else {
      return { $dayOfWeek: groupValue };
    }
  } else {
    // 待优化：如果是日期不需要转换：const dateExpr = d.isStringField ? { $toDate: groupValue } : groupValue;
    return { $dateToString: { format: DateFmString.get(d.dateFmType + d.dateType), date: { "$toDate": groupValue } } };
  }
}

// 2025-10-19 qyk: 处理对象、数组维度；各种空值统一为"未定义";
function mapAggPip(dims: Array<any>, meas: Array<any>, preMatch: any, sufMath: any) {
  let project: any = {};
  let pipline = [] as any;
  let groups = [] as any;
  let unwinds = [] as any;
  let sort = {} as any;

  // ✅ 【保持原样】其他辅助函数不变
  const getObjectField = (field: string, dim?: Meta.ChartDim) => {
    const base = '$' + field;
    const subField = 'name';
    return `${base}.${subField}`;
  };

  const isObjectValue = (type: string) => {
    return [FormElType.FeRadioGroup, FormElType.FeSelect, FormElType.FeDeptSelect, FormElType.FeUserSelect].includes(type as FormElType)
  }

  const isArrayValue = (type: string) => {
    return [FormElType.FeCheckboxGroup, FormElType.FeMulSelect, FormElType.FeMulDeptSelect, FormElType.FeMulUserSelect].includes(type as FormElType)
  }

  // ✅ 【修改】简化空值处理函数，使用 $cond 数组格式
  const handleNullOrEmpty = (fieldPath: string, dim: Meta.ChartDim): any => {
    const fieldName = dim.key;
    const namePath = `$${fieldName}.name`;

    return {
      $cond: [
        // 第一层：检查字段本身是否为空
        {
          $or: [
            { $eq: [fieldPath, null] },
            { $eq: [fieldPath, ""] },
            { $not: { $ifNull: [fieldPath, false] } },
            {
              $and: [
                { $eq: [{ $type: fieldPath }, "array"] },
                { $eq: [{ $size: { $ifNull: [fieldPath, []] } }, 0] }
              ]
            },
            {
              $and: [
                { $eq: [{ $type: fieldPath }, "object"] },
                { $eq: [{ $size: { $objectToArray: { $ifNull: [fieldPath, {}] } } }, 0] }
              ]
            }
          ]
        },
        "未定义",
        // 第二层：如果是对象/数组类型，检查 .name 字段
        {
          $cond: [
            { $or: [isObjectValue(dim.fieldType), isArrayValue(dim.fieldType)] },
            {
              $cond: [
                {
                  $or: [
                    { $eq: [namePath, null] },
                    { $eq: [namePath, ""] },
                    { $not: { $ifNull: [namePath, false] } },
                    {
                      $and: [
                        { $eq: [{ $type: namePath }, "string"] },
                        { $eq: [{ $trim: { input: namePath } }, ""] }
                      ]
                    }
                  ]
                },
                "未定义",
                namePath
              ]
            },
            // 普通字段直接返回
            fieldPath
          ]
        }
      ]
    };
  };

  // ✅ 【关键修改】修复字段处理逻辑，保留完整路径
  const processFieldName = (field: string, useForDisplay: boolean = false, isDimension: boolean = false) => {
    if (useForDisplay && !isDimension) {
      // 仅对指标字段进行显示名处理，维度字段保持完整路径
      const parts = field.split('.');
      return parts[parts.length - 1];
    } else {
      // 维度字段保持完整路径，确保多级维度正确
      return '$' + field;
    }
  };

  const needsUnwind = (dim: Meta.ChartDim) => {
    return isArrayValue(dim.fieldType);
  };

  const addUnwindStages = (fields: Array<any>) => {
    return fields
      .filter((field: any) => needsUnwind(field))
      .map((field: any) => ({ $unwind: `$${field.key}` }));
  };

  const optimizeUnwindStages = () => {
    const arrayFields = dims
      .filter((dim: any) => isArrayValue(dim.fieldType))
      .map((dim: any) => dim.key);

    const arrayFieldsArray = Array.from(new Set(arrayFields));

    if (arrayFieldsArray.length <= 1) {
      return arrayFieldsArray.map(field => ({ $unwind: `$${field}` }));
    }

    const mainArrayField = arrayFieldsArray[0];
    const otherArrayFields = arrayFieldsArray.slice(1);

    const stages = [
      { $unwind: `$${mainArrayField}` }
    ] as any;

    otherArrayFields.forEach(arrayField => {
      stages.push({
        $lookup: {
          from: '$$CURRENT',
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$rootId'] } } },
            { $unwind: `$${arrayField}` },
            { $project: { [arrayField]: 1 } }
          ],
          as: `lookup_${arrayField}`,
          let: { rootId: '$_id' }
        }
      });
      stages.push({
        $unwind: {
          path: `$lookup_${arrayField}`,
          preserveNullAndEmptyArrays: true
        }
      });
      stages.push({
        $addFields: {
          [arrayField]: `$lookup_${arrayField}.${arrayField}`
        }
      });
    });

    return stages;
  };

  const transformSufMathFields = (sufMath: any) => {
    if (!sufMath || Object.keys(sufMath).length === 0) return sufMath;
    let sufMathStr = JSON.stringify(sufMath);
    meas.forEach(m => {
      const originalField = m.key;
      const displayField = processFieldName(m.key, true, false); // 指标字段使用显示名
      if (originalField !== displayField) {
        sufMathStr = sufMathStr.replace(
          new RegExp(`"${originalField}"`, 'g'),
          `"${displayField}"`
        );
      }
    });
    return JSON.parse(sufMathStr);
  };

  const transformedSufMath = transformSufMathFields(sufMath);

  const preUnwinds = dims.some((d: any) => isArrayValue(d.fieldType))
    ? optimizeUnwindStages()
    : addUnwindStages(dims);

  // ✅ 【关键修改】修复预处理阶段 - 为维度字段创建临时字段，但不覆盖原始字段
  const preProcessStages = [];
  if (dims.length > 0) {
    const addFieldsStage: any = {};

    dims.forEach(dim => {
      // 创建临时处理字段，格式为 dimKey_processed，避免覆盖原始维度字段
      const processedKey = `${dim.key}_processed`;
      addFieldsStage[processedKey] = handleNullOrEmpty('$' + dim.key, dim);
    });

    if (Object.keys(addFieldsStage).length > 0) {
      preProcessStages.push({ $addFields: addFieldsStage });
    }
  }

  // ✅ 【关键修改】修复分组逻辑 - 使用原始维度字段路径
  dims?.forEach((d: Meta.ChartDim, index: number) => {
    let mPrefix = "";
    let dPrefix = "";
    if (index == 0) {
      dPrefix = "_id.";
    } else {
      for (let i = 0; i < index; i++) {
        // 使用原始维度字段名构建前缀
        dPrefix = dPrefix + dims[i].key + '_data.';
        mPrefix = mPrefix + dims[i].key + '_data.';
      }
    }
    if (index != (dims?.length - 1)) {
      mPrefix = mPrefix + d.key;
    }

    // ✅ 【关键修改】使用原始维度字段进行排序
    if (d.key == d.sortField) {
      sort[dPrefix + d.key] = d.sortType == SortType.ASC ? 1 : -1;
    } else {
      sort[mPrefix + d.sortField] = d.sortType == SortType.ASC ? 1 : -1;
      sort[dPrefix + d.key] = 1;
    }

    let group = {} as any;
    let group_id = {} as any;

    for (let i = 0; i < dims?.length - index; i++) {
      let dimPrifix = index == 0 ? "$" : "$_id.";

      if (dims[i].biType == BiType.Date) {
        // 日期拆分类型分组：年月、日、季度、星期、周次...
        group_id[dims[i].key] = getGroupKey(dims[i], dimPrifix + dims[i].key);
      } else {
        // ✅ 【关键修改】使用预处理后的字段进行分组，确保空值处理生效
        if (index === 0) {
          // 第一层分组使用预处理字段
          group_id[dims[i].key] = `$${dims[i].key}_processed`;
        } else {
          // 多层分组使用上一层的分组结果
          group_id[dims[i].key] = '$_id.' + dims[i].key;
        }
      }
    }

    group['_id'] = group_id;

    // ✅ 【修复】第一层分组逻辑
    if (index == 0) {
      project['_id'] = {} as any;
      for (let i = 0; i < dims?.length; i++) {
        // 投影时使用原始维度字段名
        project._id[dims[i].key] = "$_id." + dims[i].key;
      }

      meas?.forEach((m: Meta.ChartMetric) => {
        // 指标字段使用显示名处理
        const displayKey = processFieldName(m.key, true, false);
        group[displayKey] = getGroupValue(m.aggType, m.key);
        project[displayKey] = `$${displayKey}`;
      })
      groups.push(group);
    } else {
      // ✅ 【保持原样】多层分组逻辑
      const { _id, ...metrics } = groups.at(-1);
      const dataPrefix = getLastKey(group_id) + '_data';
      let push = { [getLastKey(_id) as string]: '$_id.' + getLastKey(_id) } as any;

      _.keys(metrics)?.forEach((k: string, i: number) => {
        push[k] = '$' + k;
      });
      group[dataPrefix] = { $push: push };

      if (index > 1) {
        meas?.forEach((m: Meta.ChartMetric) => {
          const displayKey = processFieldName(m.key, true, false);
          group[getLastKey(group_id) + displayKey] = getGroupValue(m.aggType, getLastKey(_id) + displayKey);
        })
      } else {
        meas?.forEach((m: Meta.ChartMetric) => {
          const displayKey = processFieldName(m.key, true, false);
          group[getLastKey(group_id) + displayKey] = getGroupValue(m.aggType, displayKey);
        })
      }

      groups.push(group);
      unwinds?.forEach((u: any) => {
        u['$unwind'] = `$${dataPrefix}.` + u['$unwind'].replace("$", "");
      })
      unwinds.unshift({ $unwind: `$${dataPrefix}` });

      // 处理project
      project._id[_.keys(project._id)[0]].startsWith('$_id.') ||
        (project._id[_.keys(project._id)[0]] = '$_id.' + project._id[_.keys(project._id)[0]]);
      if (index > 0) {
        for (let i = 1; i < index + 1; i++) {
          const keys = Object.keys(project._id);
          const key = keys[keys?.length - i];
          project._id[key] = `$${dataPrefix}.` + project._id[key].replace("$", "").replace("_id.", "");
        }
      }
      _.keys(project)?.forEach((p: any) => {
        if ('_id' != p) {
          project[p] = `$${dataPrefix}.` + project[p].replace("$", "");
        }
      })
    }
  });

  sort = _.keys(sort)?.length == 0 ? {} : { "$sort": sort };

  if (dims?.length == 0) {
    // 无维度情况处理
    let group: any = { "_id": null };
    meas?.forEach((m: any) => {
      const displayKey = processFieldName(m.key, true, false);
      group[displayKey] = getGroupValue(m.aggType, m.key);
    });
    let lastGroupKeys = Object.keys(group);
    project = getProject(meas, lastGroupKeys.includes("统计结果"));
    pipline.push(
      ...preUnwinds,
      { $match: preMatch },
      ...preProcessStages,
      { $group: group },
      { $match: transformedSufMath },
      { "$project": project }
    );
  } else {
    pipline.push(
      ...preUnwinds,
      { $match: preMatch },
      ...preProcessStages,
      ...groups.map((g: any) => ({ '$group': g })),
      { $match: transformedSufMath },
      ...unwinds,
      sort,
      { "$project": project }
    );
  }

  // 数字格式处理
  meas?.forEach((m: Meta.ChartMetric) => {
    const displayKey = processFieldName(m.key, true, false);
    if (project[displayKey]) {
      project[displayKey] = {
        $cond: [
          { $eq: [{ $type: project[displayKey] }, "decimal"] },
          { $round: [{ $toDouble: project[displayKey] }, 2] },
          { $round: [project[displayKey], 2] }
        ]
      };
    }
  });

  return pipline;
}

export async function fetchAggGroup(collname: string, dims: Array<any>, meas: Array<any>, preMatch: any, sufMath: any, dataType = "array") {
  let findResult: Fetch.FindResult = {
    data: [] as any,
    count: -1,
    msg: "参数校验失败！"
  }
  if (!checkNecesParms([collname])) return findResult;
  if (meas.length == 0) return findResult;
  let pipline = null;
  pipline = mapAggPip(dims, meas, preMatch, sufMath);
  // console.log(JSON.stringify(pipline))
  // console.log(dims)
  // 必须用数组结果集处理啊方式不同；
  const findOption: any = {
    "collection": collname,
    "pipline": pipline,
    "datatype": dataType
  }
  return request<Fetch.FindResult>('/agg', {
    method: "POST",
    body: findOption
  });
}

// 根据 getGroupKey 逻辑生成 MongoDB 聚合表达式
function generateDateExpression(d: any, groupValue: string) {
  if (d.dateType == DateType.Quarter) {
    return {
      $concat: [
        { $toString: { $ceil: { $divide: [{ $month: { $toDate: groupValue } }, 3] } } },
        DateFmString.get(d.dateFmType + d.dateType)
      ]
    };
  } else if (d.dateType == DateType.YearQuarter) {
    const fmArr = DateFmString.get(d.dateFmType + d.dateType)?.split("%");
    return {
      $concat: [
        { $toString: { $year: { $toDate: groupValue } } },
        fmArr![0],
        { $toString: { $ceil: { $divide: [{ $month: { $toDate: groupValue } }, 3] } } },
        fmArr![1]
      ]
    };
  } else if (d.dateType == DateType.WeekDay) {
    if (d.dateFmType == DateFmType.Default) {
      return {
        $let: {
          vars: { dayOfWeekNames: ["一", "二", "三", "四", "五", "六", "日"] },
          in: {
            $arrayElemAt: [
              "$$dayOfWeekNames",
              { $subtract: [{ $dayOfWeek: { $toDate: groupValue } }, 1] }
            ]
          }
        }
      };
    } else if (d.dateFmType == DateFmType.Detail) {
      return {
        $let: {
          vars: { dayOfWeekNames: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"] },
          in: {
            $arrayElemAt: [
              "$$dayOfWeekNames",
              { $subtract: [{ $dayOfWeek: { $toDate: groupValue } }, 1] }
            ]
          }
        }
      };
    } else {
      return { $dayOfWeek: { $toDate: groupValue } };
    }
  } else {
    // 其他日期类型使用 $dateToString
    return {
      $dateToString: {
        format: DateFmString.get(d.dateFmType + d.dateType),
        date: { $toDate: groupValue }
      }
    };
  }
}

export async function fetchAggDetail(collname: string, match: any, dims: Array<any>) {
  let findResult: Fetch.FindResult = {
    data: [] as any,
    count: -1,
    msg: "参数校验失败！"
  }
  if (!checkNecesParms([collname])) return findResult;

  let pipline = [] as any;

  // 1. 先添加匹配条件（只有当match不为空且有效时）
  if (match && match.$match && Object.keys(match.$match).length > 0) {
    pipline.push(match);
  } else if (match && Object.keys(match).length > 0) {
    // 如果match直接是匹配条件对象，而不是{$match: {...}}格式
    pipline.push({ $match: match });
  }

  // 2. 对日期字段进行格式化转换，同时保留所有字段
  const dateFields = dims?.filter(d => d.type === BiType.Date);
  // 数字类型格式化：todo: 暂时客户端处理；后续在调整；
  // const numberFields = dims?.filter(d => d.type === BiType.Number);
  // console.log(dims);

  if (dateFields?.length > 0) {
    const setStage: any = { $set: {} };
    dateFields.forEach(d => {
      setStage.$set[d.key] = generateDateExpression(d, `$${d.key}`);
    });
    pipline.push(setStage);
  }

  // 3. 添加排序阶段（基于dims中的sortField和sortType）
  const sortFields = dims?.filter(d => d.sortField && d.sortType);
  if (sortFields?.length > 0) {
    const sortStage: any = { $sort: {} };
    sortFields.forEach(d => {
      // 确定排序方向：1为升序，-1为降序
      const sortOrder = d.sortType.toLowerCase() === 'desc' ? -1 : 1;
      sortStage.$sort[d.sortField] = sortOrder;
    });
    pipline.push(sortStage);
  }

  // 确保管道不为空，如果为空添加一个空匹配阶段
  if (pipline.length === 0) {
    pipline.push({ $match: {} });
  }

  // console.log("生成的聚合管道:", JSON.stringify(pipline));

  const findOption: any = {
    "collection": collname,
    "pipline": pipline,
    "datatype": 'default'
  }

  return request<Fetch.FindResult>('/agg', {
    method: "POST",
    body: findOption
  });
}

export async function fetchGetDistinct(collName: string, fieldName: string, filter?: any) {
  if (!collName || !fieldName) return { msg: '集合名和字段名参数不能为空', data: [] }
  const filterOption: Fetch.DistinctOption = {
    "collection": collName,
    "field": fieldName,
    "filter": filter ? filter : {},
  }
  return await request<Fetch.FindResult>('/dist', {
    method: "POST",
    body: filterOption
  });
}
