import dayjs from "dayjs";
import { mapEntries } from "radashi";
import { FormElType, FormatType } from "@/enum";
import { DateType, DateFmString, DateFmType } from "@/enum/biMeta";


// 生成更新有序节点顺序Order对象集合
export async function getListSufIds(orderList: Array<any>, oldIndex: number, newIndex: number) {
  // oldIndex>0 修改之前节点的suf_id；newIndex>0 修改之前节点的suf_id；
  // 修改当前节点的suf_id为newIndex+1的id(newIndex+1<length)
  let oldPreApp = null;
  let newPreApp = null;
  let currApp = orderList[newIndex];
  if (oldIndex > 0) {
    if (newIndex > oldIndex) {
      oldPreApp = orderList[oldIndex - 1];
      oldPreApp.suf_id = orderList[oldIndex]._id;
    } else {
      oldPreApp = orderList[oldIndex];
      if (oldIndex == orderList?.length - 1) {
        oldPreApp.suf_id = null;
      } else {
        oldPreApp.suf_id = orderList[oldIndex + 1]._id;
      }
    }
  }
  if (newIndex > 0) {
    newPreApp = orderList[newIndex - 1];
    newPreApp.suf_id = currApp._id;
  }
  if (newIndex == orderList?.length - 1) {
    currApp.suf_id = null;
  } else {
    currApp.suf_id = orderList[newIndex + 1]._id;
  }
  let sufUpdateOptions = [] as any;
  oldPreApp && sufUpdateOptions.push({ _id: oldPreApp._id, suf_id: oldPreApp.suf_id });
  newPreApp && sufUpdateOptions.push({ _id: newPreApp._id, suf_id: newPreApp.suf_id });
  currApp && sufUpdateOptions.push({ _id: currApp._id, suf_id: currApp.suf_id });
  return sufUpdateOptions;
}
/**
 * 
 * 数组重新基于suf_id排序；
 * 
 */
export function reOrderListBySufId(list: Array<Meta.Order>) {
  const tempList = [] as any;

  if (list?.length > 0) {
    // 需要依据pre_id排序
    let lastId = null as any;
    let tempNode = null;
    let tempMap: Map<any, any> = new Map();
    list?.forEach((d: any) => {
      if (d.suf_id) {
        tempMap.set(d.suf_id, d)
      } else {
        lastId = d._id;
        tempList.push(d);
      }
    })
    const buildSortArray = (nodeId: string) => {
      tempNode = tempMap.get(nodeId);
      if (tempNode) {
        tempList.push(tempNode);
        buildSortArray(tempNode._id)
      }
    }
    lastId && buildSortArray(lastId);
    tempList.reverse();
  }

  return tempList;
}

/**
 * 
 * 树节点基于suf_id重新排序
 * @returns 
 * 
 */
export function reOrderTreeBySufId(list: Array<Meta.Order>, idField?: string, sufField?: string, typeField?: string) {
  const idKey = idField ? idField : '_id';
  const sufKey = sufField ? sufField : 'suf_id';
  const typeKey = typeField ? typeField : 'moduleType'
  const tempList = [] as any;

  if (list?.length > 0) {
    // 需要依据suf_id排序
    let lastId = null as any;
    let tempNode = null;
    let tempMap: Map<any, any> = new Map();
    list?.forEach((d: any) => {
      let node = d;
      if (Array.isArray(d.children) && d.children?.length > 0) {
        node.children = reOrderTreeBySufId(node.children, idKey, sufKey, typeKey);
      } else if ('group' != d[typeKey]) {
        const { children, ...newD } = d;
        node = newD;
      }
      if (node[sufKey]) {
        tempMap.set(node[sufKey], node)
      } else {
        lastId = node[idKey];
        tempList.push(node);

      }
    })
    const buildSortArray = (nodeId: string) => {
      tempNode = tempMap.get(nodeId);
      if (tempNode) {
        tempList.push(tempNode);
        buildSortArray(tempNode[idKey])
      }
    }
    lastId && buildSortArray(lastId);
    tempList.reverse();
  }

  return tempList;
}


function getAllChildIds(node: any, idKey?: string): Set<string> {
  const result = new Set<string>();
  const key = idKey ? idKey : '_id'
  function traverse(n: any) {
    if (!n.children || n.children?.length === 0) {
      return;
    }
    n.children.forEach((child: any) => {
      result.add(child[key]);
      traverse(child);
    });
  }
  traverse(node);
  return result;
}


/** 依据key查找树节点 */
export function findTreeNode(nodes: Array<any>, targetKey: string): any | null {
  for (const node of nodes) {
    if (node.key === targetKey) {
      return node; // 找到匹配项，立即返回
    }
    if (node.children) {
      const foundInChildren = findTreeNode(node.children, targetKey);
      if (foundInChildren) {
        return foundInChildren; // 如果在子节点中找到了匹配项，返回它
      }
    }
  }
  return null; // 没有找到匹配项，返回 null
};

export function filterEmptyPaths(nodes: Array<any>): Array<any> {
  return nodes.map(node => {
    if (node.type == 'group') {
      if (node.children && node.children?.length > 0) {
        const filteredChildren = filterEmptyPaths(node.children);
        if (filteredChildren?.length > 0) {
          // 如果子节点不为空，则保留该节点
          return { ...node, children: filteredChildren };
        } else {
          return null;    // 如果子节点为空，则过滤掉该节点
        }
      } else {
        return null;    // 如果子节点为空，则过滤掉该节点
      }
    } else {
      if ('board' != node.type) {
        return node;
      } else {
        return null;    // 排除报表类型
      }
    }
  }).filter(node => node !== null);   // 过滤掉空节点
}

export function filterBoardChart(node: any): any | null {
  // 如果是叶子节点
  if (!node.children || node.children?.length === 0) {
    // 只保留有图表的叶子节点
    if (['app', 'form', 'flow', 'board', 'group'].includes(node.type)) {
      return null;
    } else {
      return node;
    }
  }

  let filteredChildren = [];
  if (node.children && node.children?.length > 0) {
    // 递归过滤子节点
    filteredChildren = node.children
      .map((child: any) => filterBoardChart(child))
      .filter((child: any) => child !== null);
  }
  // 如果过滤后的子节点不为空，则保留当前节点
  if (filteredChildren?.length > 0) {
    return {
      ...node,
      children: filteredChildren,
    };
  }

  // 如果当前节点没有符合条件的子节点，则返回 null
  return null;
}

export function filterModuleType(node: any, filterType: Array<'form' | 'flow' | 'board'>): any | null {
  // 如果是叶子节点
  if (!node.children || node.children?.length === 0) {
    // 只保留需要过滤出的叶子节点类型
    if (filterType.includes(node.moduleType)) {
      return node;
    } else {
      return null;
    }
  }

  let filteredChildren = [];
  if (node.children && node.children?.length > 0) {
    // 递归过滤子节点
    filteredChildren = node.children
      .map((child: any) => filterModuleType(child, filterType))
      .filter((child: any) => child !== null);
  }
  // 如果过滤后的子节点不为空，则保留当前节点
  if (filteredChildren?.length > 0) {
    return {
      ...node,
      children: filteredChildren,
    };
  }

  // 如果当前节点没有符合条件的子节点，则返回 null
  return null;
}

export function filterMenuTree(node: any, filter: any): any | null {
  // 如果是叶子节点
  if (!node.children || node.children?.length === 0) {
    // 只保留有权限组的叶子节点
    if (['app', 'form', 'flow', 'board', 'group'].includes(node.type)) {
      return null;
    } else {
      for (const [key, value] of Object.entries(filter)) {
        if (node.option[key] && node.option[key]?.length > 0) {
          if (Array.isArray(value)) {
            // 部门要包含所有子部门，filter中要包含prentids
            let result = node.option[key].findIndex((n: any) => value.includes(n._id));
            if (result != -1) {
              return node; // 返回当前节点，因为它符合条件
            }
          }
        }
      }
      return null; // 如果没有找到符合条件的 result，返回 null
    }
  }

  let filteredChildren = [];
  if (node.children && node.children?.length > 0) {
    // 递归过滤子节点
    filteredChildren = node.children
      .map((child: any) => filterMenuTree(child, filter))
      .filter((child: any) => child !== null);
  }
  // 如果过滤后的子节点不为空，则保留当前节点
  if (filteredChildren?.length > 0) {
    return {
      ...node,
      children: filteredChildren,
    };
  }

  // 如果当前节点没有符合条件的子节点，则返回 null
  return null;
}

export function filterModuleId(node: any, ids: Array<string>): any | null {
  // 如果是叶子节点
  if (!node.children || node.children?.length === 0) {
    // 只保留需要过滤出的叶子节点类型
    if (ids.includes(node._id)) {
      return node;
    } else {
      return null;
    }
  }

  let filteredChildren = [];
  if (node.children && node.children?.length > 0) {
    // 递归过滤子节点
    filteredChildren = node.children
      .map((child: any) => filterModuleId(child, ids))
      .filter((child: any) => child !== null);
  }
  // 如果过滤后的子节点不为空，则保留当前节点
  if (filteredChildren?.length > 0) {
    return {
      ...node,
      children: filteredChildren,
    };
  }

  // 如果当前节点没有符合条件的子节点，则返回 null
  return null;
}


function formatNumber(value: number, config: Meta.CompConfig): string {
  const { decimalPlaces, formatType } = config;
  // 根据类型决定基础格式化
  let formatted: string;

  switch (formatType) {
    case FormatType.PerNumber:
      // 百分数：value * 100，然后按 decimalPlaces 格式化，并加 %
      const percentValue = value * 100;
      formatted = decimalPlaces !== null
        ? percentValue.toFixed(decimalPlaces)
        : String(percentValue);
      return `${formatted}%`;

    case FormatType.ThsNumber:
      // 千分符：使用 toLocaleString 添加千分位分隔符
      formatted = decimalPlaces !== null
        ? value.toFixed(decimalPlaces)
        : String(value);
      return Number(formatted).toLocaleString('en-US');

    case FormatType.Number:
    default:
      // 普通数字：直接按 decimalPlaces 格式化
      return decimalPlaces !== null
        ? value.toFixed(decimalPlaces)
        : String(value);
  }
}

// todo: 数据预处理[日期已经在服务端处理，后续todo: 都服务端处理]
export function mapVTableData(
  data: Record<string, any>[],
  compConfigs: Meta.CompConfig[] | undefined
): Record<string, any>[] {
  const configMap = new Map<string, Meta.CompConfig>(
    compConfigs?.map((item) => [item.i, item])
  );

  return data.map((record) => {
    // ✅ 4. 防御性编程：确保 record 是对象
    if (!record || typeof record !== 'object') {
      console.warn('Invalid record:', record);
      return {};
    }

    const newRecord = mapEntries(record, (key: string, value: any) => {
      const config = configMap.get(key.split('_')[2]);
      let newValue: any = value;
      if (config) {
        // ✅ 5. 更清晰的类型判断和格式化逻辑
        if (Array.isArray(value)) {
          newValue = value.map((v) => (v && typeof v === 'object' ? v.name : v));
        } else if (value && typeof value === 'object') {
          newValue = value.name ?? value;
        } else if (config.type === FormElType.FeNumber) {
          if (typeof value === 'number') {
            newValue = formatNumber(value, config);
            // console.log(newValue, config)
          }
        }
      }
      // ✅ 7. 返回 [key, value] 对
      return [key, newValue];
    });

    return newRecord;
  });
};
