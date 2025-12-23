import { request } from '../request';
import { getListSufIds } from '@/utils/dataHelper';
import { filterMenuTree, filterEmptyPaths, filterBoardChart, filterModuleType } from '@/utils/dataHelper';
import { arrToMenu, cleanEmptyChildren } from '@/utils/arrayToTree';
import { reOrderTreeBySufId } from '@/utils/dataHelper';
import { fetchGetAllModuleConfig, fetchGetAppList, fetchGetAppModules, fetchFindAppNode } from './system';
import { merge } from 'lodash-es';
import { isEmpty, merge as rsMerge } from 'radashi';

export async function fetchTestMsg() {
  const result = await request('/testmsg', {
    method: "POST",
    body: { _id: 'qqq' }
  });
  return result
}

// 需要当前用户权限过滤
export async function getMyBoardTree() {
}

// 获取所有有权限的菜单
export async function getMyAppList(filter: Partial<Meta.ModulePermGroup>) {
  // 管理组：包含当前app
  // 权限组：当前应用下模块至少有一个；服务端：依据账户、账户所属部门/角色查询权限组；
  const { app_id, ...pgFilter } = filter;
  const appResult = await fetchGetAppList();
  const moduleResult = await fetchGetAppModules({});
  const pgResult = await fetchGetPermGroups({});
  const result = await getPermMenuTree(pgFilter, appResult.data, moduleResult.data, pgResult.data);
  return result;
}

export function getMyAppMenuTree(
  filter: any,
  appData: Array<Meta.Node>,
  moduleData: Array<Meta.Node>,
  pgData: Array<Meta.Node>
) {
  let resultData = [] as any;
  // 应用树：模块集合、权限组集合合并；
  let apps = appData.concat(moduleData, pgData);

  let appTreeData = apps.map((m: any) => {
    // todo: TreeOption之外的属性放到node属性中；
    return {
      key: 'group' == m.type ? m._id : m.moduleConfig_id,
      _id: m._id,
      parentId: m.parent_id,
      suf_id: m.suf_id,
      parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
      moduleType: m.type,   // type: group 是naive使用的属性和值，不要重复；
      routeKey: 'app_module',
      // routePath: getRoutePath(m.type, m._id)
      node: m,
    }
  });
  let tree = arrToMenu(appTreeData);
  let reOrderTree = reOrderTreeBySufId(tree as any);
  return appTreeData;
}

// 获取所有有权限的菜单
export async function getMyMenuTree(filter: Partial<Meta.ModulePermGroup>) {
  const { app_id, ...pgFilter } = filter;
  const appResult = await fetchFindAppNode({});
  const moduleResult = await fetchGetAppModules({ app_id });

  // 服务端增加权限组查询方法：统计当前用户所有模块对应权限组计数：app_id, count;
  // 应用菜单树：合并结果到模块列表中；转树后过滤count==0的模块；
  // 应用列表：如上雷同，
  // 流程中心：可发起流程如上雷同；需要多应用合并；
  const pgResult = await fetchGetPermGroups({ app_id });
  const pgTree = await getMyAppMenuTree(pgFilter, appResult.data, moduleResult.data, pgResult.data);
  const pg = await fetchGetPermGroupCount()
  const appPerm = rsMerge(pg.data, appResult.data, (app: any) => app._id)
  return pgTree;
}

// 所有报表
export async function getAllChartTree() {
  let resultData = [] as any;
  let appData = [] as any;
  let moduleData = [] as any;
  const appResult = await fetchGetAppList();
  const moduleResult = await fetchGetAppModules({});
  'ok' == appResult.msg && (appData = appResult.data);
  'ok' == appResult.msg && (moduleData = moduleResult.data);
  const result = await fetchGetAllModuleConfig({ moduleType: 'board' });
  if ('ok' == result.msg && result.data?.length > 0) {
    // 基于moduleConfig_id做合并
    const boardComp = result.data.map((d: any) => ({ moduleConfig_id: d._id, compConfigs: d.compConfigs }));
    // 属性覆盖存在交叉，所以当前不能直接merge操作得到预期结果；
    const mergeNodes = moduleData.map((node: any) =>
      merge({}, node, boardComp.find(m => m.moduleConfig_id === node.moduleConfig_id))
    );
    const boardCompList = mergeNodes.flatMap((d: any) =>
      d.compConfigs?.map((c: Meta.CompConfig) => ({
        _id: c.i,
        name: c.title,
        type: 'chart',
        parent_id: d._id,
        config: c
      }))
    ).filter((n: any) => { if (n) return n });
    // 获取模块配置集合包含的组件列表，合并应用模块集合；
    let apps = appData.concat(moduleData, boardCompList as any);
    let appTreeData = apps.map((d: any) => {
      // todo: TreeOption之外的属性放到node属性中；
      return {
        key: d._id,
        value: d._id,
        _id: d._id,               // reOrderTreeBySufId 需要
        icon: d.icon,
        iconColor: d.iconColor,
        type: d.type,
        label: d.name,
        name: d.name,
        parentId: d.parent_id,    // 转树形结构需要
        parent_id: d.parent_id,   // 冗余容错避免错误
        manager: d.manager,
        suf_id: d.suf_id,
        parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
        compConfig: 'config' in d ? d.config : null   // 组件配置信息（图表配置）
      }
    });
    let tree = arrToMenu(appTreeData);
    // 如果要实现排序需要全量查询合并后在过滤
    let reOrderTree = reOrderTreeBySufId(tree as any);
    let filterData = reOrderTree
      .map((node: any) => filterBoardChart(node))
      .filter((node: any) => {
        if (node) { return node }
      });
    resultData = filterData // cleanEmptyChildren(tree)
  }
  return resultData;
}

export async function getAllModuleTree(app_id?: string, filterTypes?: any) {
  let resultData = [] as any;
  let appData = [] as any;
  let moduleData = [] as any;
  const appResult = await fetchGetAppList();
  const moduleResult = await fetchGetAppModules({ app_id });
  'ok' == appResult.msg && (appData = appResult.data);
  'ok' == appResult.msg && (moduleData = moduleResult.data);
  // 应用树：模块集合、权限组集合合并；
  let apps = appData.concat(moduleData);

  let appTreeData = apps.map((m: any) => {
    // todo: TreeOption之外的属性放到node属性中；
    return {
      key: m._id,
      label: m.name,
      icon: m.icon,
      iconColor: m.iconColor,
      type: m.type,
      _id: m._id,
      parentId: m.parent_id,
      suf_id: m.suf_id,
      parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
      moduleType: m.type,   // type: group 是naive使用的属性和值，不要重复；
      // routeKey: 'app_module',
      node: m,
    }
  });
  let tree = arrToMenu(appTreeData);
  let reOrderTree = reOrderTreeBySufId(tree as any);
  if (filterTypes) {
    let filterData = reOrderTree
      .map((node: any) => filterModuleType(node, filterTypes))
      .filter((node: any) => {
        if (node) { return node }
      });
    resultData = filterData;
  } else {
    resultData = reOrderTree;
  }
  return resultData;
}

// 获取当前app之外的模块，排除board类型；
export async function getOtherAppModuleTree(app_id: string) {
  let resultData = [] as any;
  let appData = [] as any;
  let moduleData = [] as any;
  const appResult = await fetchGetAppList();
  const moduleResult = await fetchGetAppModules({ app_id: { '$ne': app_id } });
  'ok' == appResult.msg && (appData = appResult.data);
  'ok' == appResult.msg && (moduleData = moduleResult.data);
  // 应用树：模块集合、权限组集合合并；
  let apps = appData.concat(moduleData);

  let appTreeData = apps.map((m: any) => {
    // todo: TreeOption之外的属性放到node属性中；
    return {
      key: m._id,
      label: m.name,
      icon: m.icon,
      iconColor: m.iconColor,
      type: m.type,
      _id: m._id,
      parentId: m.parent_id,
      suf_id: m.suf_id,
      parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
      moduleType: m.type,   // type: group 是naive使用的属性和值，不要重复；
      // routeKey: 'app_module',
      node: m,
    }
  });
  let tree = arrToMenu(appTreeData);
  let reOrderTree = reOrderTreeBySufId(tree as any);
  let filterData = reOrderTree
    .map((node: any) => filterModuleType(node, ['form', 'flow']))
    .filter((node: any) => {
      if (node) { return node }
    });
  resultData = filterData;

  return resultData;
}

export function getPermMenuTree(
  filter: any,
  appData: Array<Meta.Node>,
  moduleData: Array<Meta.Node>,
  pgData: Array<Meta.Node>
) {
  let resultData = [] as any;
  // 应用树：模块集合、权限组集合合并；
  let apps = appData.concat(moduleData, pgData);

  let appTreeData = apps.map((d: any) => {
    // todo: TreeOption之外的属性放到node属性中；
    return {
      key: d._id,
      value: d._id,
      _id: d._id,               // reOrderTreeBySufId 需要
      icon: d.icon,
      iconColor: d.iconColor,
      type: d.type,
      label: d.name,
      name: d.name,
      parentId: d.parent_id,    // 转树形结构需要
      parent_id: d.parent_id,   // 冗余容错避免错误
      manager: d.manager,
      suf_id: d.suf_id,
      parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
      option: d     // 权限组信息
    }
  });
  let tree = arrToMenu(appTreeData);
  let reOrderTree = reOrderTreeBySufId(tree as any);
  if (!isEmpty(filter)) {
    let filterData = reOrderTree
      .map((node: any) => filterMenuTree(node, filter))
      .filter((node: any) => {
        if (!isEmpty(node)) { return node }
      });
    resultData = filterData;
  } else {
    resultData = reOrderTree;
  }

  return resultData.filter((node: any) => {
    if (!isEmpty(node?.children)) { return node }
  });
}

export function getModuleTree(app_id: string, moduleData: Array<Meta.Node>) {
  let treeData = moduleData.map((d: any) => {
    // todo: TreeOption之外的属性放到node属性中；
    return {
      key: d._id,
      value: d._id,
      _id: d._id,               // reOrderTreeBySufId 需要
      icon: d.icon,
      iconColor: d.iconColor,
      type: d.type,
      label: d.name,
      name: d.name,
      parentId: d.parent_id,    // 转树形结构需要
      parent_id: d.parent_id,   // 冗余容错避免错误
      manager: d.manager,
      suf_id: d.suf_id,
      parentIds: [] as any,   // arrToMenu 新增属性保存所有父_id，并传递给menuIcon；
      option: d
    }
  });
  treeData = [{ key: app_id, _id: app_id, parentId: '' } as any, ...treeData]
  let tree = arrToMenu(treeData);
  let reOrderTree = reOrderTreeBySufId(tree[0].children);
  const result = filterEmptyPaths(reOrderTree);

  return result;
}


export async function fetchRegiter(en: Meta.Enterprise, acc: Meta.Account) {
  return request<Fetch.InsertResult>('/register', {
    method: "POST",
    body: {
      en: en,
      acc: acc
    }
  })
}

export async function fetchGetEnInfo() {
  const result = await request<Fetch.FindResult>('/getEnInfo', {
    method: "POST",
  });
  return result
}

export async function fetchUpdateEn(update: Partial<Meta.Enterprise>) {
  return await request<Fetch.UpdateResult>('/updateEn', {
    method: "POST",
    body: { update }
  })
}

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export async function fetchLogin(loginName: string, password: string) {
  const option = {
    "loginNameField": 'loginName',
    "loginName": loginName,
    "loginPwd": password,
  }
  return await request<Fetch.LoginResult>('/login', {
    method: "POST",
    body: option
  });

}

/** 查询当前账户或指定_id */
export async function fetchGetUserInfo(_id?: string) {
  const result = await request<Fetch.FindResult>('/getAccInfo', {
    method: "POST",
    body: { _id }
  });
  return result
}

/** 依据过滤条件查询 */
export async function fetchGetAccInfo(filter: Partial<Meta.Account>) {
  const result = await request<Fetch.FindResult>('/getAccInfo', {
    method: "POST",
    body: { filter }
  });
  return result
}

/**  注意：返回的账户id：acc_id */
export async function fetchGetAccsByDept(deptId: string) {
  let option = {
    filter: { 'dept._id': deptId }
  }
  const result = await request<Fetch.FindResult>('/getAccountsBy', {
    method: "POST",
    body: option
  });
  return result
}

export async function fetchGetAccsByRole(roleId: string) {
  let option = {
    filter: { 'role._id': roleId }
  }
  const result = await request<Fetch.FindResult>('/getAccountsBy', {
    method: "POST",
    body: option
  });
  return result
}

// 综合查询，分页；
type AccExtFilter = Partial<{
  'dept._id': any,
  'role._id': any,
}>;
/** 综合多条件查询 */
export async function fetchGetAccounts(filter: { accFilter?: Meta.Account, accExtFilter?: AccExtFilter }) {
  let option: Fetch.FindOption = {
    filter: {
      accFilter: filter.accFilter,
      accExtFilter: filter.accExtFilter
    },
    sort: {},
    page: 200,
    size: 1
  }
  const result = await request<Fetch.FindResult>('/getAccountsBy', {
    method: "POST",
    body: option
  });
  return result
}

export async function fetchSetDeptManager(_id: string, managers: Meta.Base) {
  const option: Fetch.UpdateOption = {
    filter: { _id },
    update: managers
  }
  return await request<Fetch.UpdateResult>('/setDeptManager', {
    method: "POST",
    body: option
  })
}

export async function fetchUpdateDeptName(_id: string, name: string) {
  const option: Fetch.UpdateOption = {
    filter: { _id },
    update: { name }
  }
  return await request<Fetch.UpdateResult>('/updateDeptName', {
    method: "POST",
    body: option
  })
}

// 根据当前部门_id查询所有上级部门
export async function fetchGetParentDept(_id: string) {
  let option: Fetch.FindOption = {
    filter: { _id },
  }
  const result = await request<Fetch.FindResult>('/getParentDept', {
    method: "POST",
    body: option
  });
  return result
}

export async function fetchGetDept() {
  const result = await request<Fetch.FindResult>('/getDept', {
    method: "POST"
  });
  return result
}

export async function fetchInsertDept(dept: Meta.Dept) {
  const option: Fetch.InsertOption = {
    docs: [dept]
  }
  return await request<Fetch.InsertResult>('/insertDept', {
    method: "POST",
    body: option
  })
}

export async function fetchUpdateDeptOrder(sufUpdateOptions: Array<Meta.Node>) {
  if (sufUpdateOptions && sufUpdateOptions?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: sufUpdateOptions
    }
    return await request<Fetch.UpdateResult>('/updateDeptOrder', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'getListSufIds error' }
  }
}

export async function fetchDeleteDept(options: Array<Meta.Order>) {
  if (options && options?.length > 0) {
    const moduleOption: Fetch.UpdateOption = {
      update: options
    }
    return await request<Fetch.UpdateResult>('/deleteDept', {
      method: "POST",
      body: moduleOption
    })
  } else {
    return { msg: 'options error' }
  }
}

export async function fetchUpdateRoleName(_id: string, name: string) {
  const option: Fetch.UpdateOption = {
    filter: { _id },
    update: { name }
  }
  return await request<Fetch.UpdateResult>('/updateRoleName', {
    method: "POST",
    body: option
  })
}

export async function fetchGetRole() {
  const result = await request<Fetch.FindResult>('/getRole', {
    method: "POST"
  });
  return result
}

export async function fetchInsertRole(role: Meta.Role) {
  const option: Fetch.InsertOption = {
    docs: [role]
  }
  return await request<Fetch.InsertResult>('/insertRole', {
    method: "POST",
    body: option
  })
}

export async function fetchUpdateRoleOrder(sufUpdateOptions: Array<Meta.Node>) {
  if (sufUpdateOptions && sufUpdateOptions?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: sufUpdateOptions
    }
    return await request<Fetch.UpdateResult>('/updateRoleOrder', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'getListSufIds error' }
  }
}

export async function fetchDeleteRole(options: Array<Meta.Order>) {
  if (options && options?.length > 0) {
    const moduleOption: Fetch.UpdateOption = {
      update: options
    }
    return await request<Fetch.UpdateResult>('/deleteRole', {
      method: "POST",
      body: moduleOption
    })
  } else {
    return { msg: 'options error' }
  }
}


// 新增账户
export async function fetchNewAccount(acc: Meta.Account, accEn: Meta.AccountEn) {
  return await request<Fetch.InsertResult>('/newAccount', {
    method: "POST",
    body: {
      acc: acc,
      accEn: accEn
    }
  })
}

// 更新密码
export async function fetchUpdatePwd(id: string | string, oldPwd: string, update: Partial<Meta.Account>) {
  let filter = {
    _id: id,
    oldPwd: oldPwd
  } as any;
  const option: Fetch.UpdateOption = {
    filter: filter,
    update: update
  }
  return await request<Fetch.UpdateResult>('/updateAccount', {
    method: "POST",
    body: option
  })
}

// 更新账户
export async function fetchUpdateAccount(ids: Array<string> | string, update: Partial<Meta.Account>) {
  let filter = { _id: ids } as any;
  const option: Fetch.UpdateOption = {
    filter: filter,
    update: update
  }
  return await request<Fetch.UpdateResult>('/updateAccount', {
    method: "POST",
    body: option
  })
}

export async function fetchUpdateAccountEn(_id: string, update: Partial<Meta.AccountEn>) {
  const option: Fetch.UpdateOption = {
    filter: { _id },
    update: update    // 全量更新整个数组
  }
  return await request<Fetch.UpdateResult>('/updateAccountEn', {
    method: "POST",
    body: option
  })
}

// 新增权限组
export async function fetchNewPermGroup(pg: Meta.ModulePermGroup) {
  const option: Fetch.InsertOption = {
    docs: [pg]
  }
  return await request<Fetch.InsertResult>('/newPermGroup', {
    method: "POST",
    body: option
  })
}


// 获取当前用户的权限组权限，应用-模块-统计
export async function fetchGetPermGroupCount(app_id?: string) {
  return await request<Fetch.FindResult>('/getPermGroupCount', {
    method: "POST",
    body: { app_id }
  });
}

// 获取模块所有权限组
export async function fetchGetPermGroups(
  filter: Partial<Meta.ModulePermGroup |
  { 'accountAuth._id': string, 'deptAuth._id': string, 'roleAuth._id': string }>) {
  const filterOption: Fetch.FindOption = {
    filter: filter
  }
  return await request<Fetch.FindResult>('/getPermGroups', {
    method: "POST",
    body: filterOption
  });
}

// 依据类型删除权限组;parent_id==module_id
export async function fetchDeleteModulePg(options: Array<Meta.Order>) {
  if (options && options?.length > 0) {
    const moduleOption: Fetch.UpdateOption = {
      update: options
    }
    return await request<Fetch.UpdateResult>('/deletePermGroup', {
      method: "POST",
      body: moduleOption
    })
  } else {
    return { msg: 'options error' }
  }
}

// 更新权限组属性
export async function fetchUpdateModulePg(_id: string, update: Partial<Meta.ModulePermGroup>) {
  const option: Fetch.UpdateOption = {
    filter: { _id },
    update: update    // 全量更新整个数组
  }
  // console.log(option)
  return await request<Fetch.UpdateResult>('/updatePermGroup', {
    method: "POST",
    body: option
  })
}

// 调整权限组顺序
export async function fetchUpdateModulePgOrder(pgList: Array<any>, from: number, to: number) {
  let sufUpdateOptions: Array<Meta.Order> = await getListSufIds(pgList, from, to)
  if (sufUpdateOptions && sufUpdateOptions?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: sufUpdateOptions
    }
    return await request<Fetch.UpdateResult>('/updatePgOrder', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'updatePgOrder error' }
  }
}


// 获取所有管理组
export async function fetchGetAdminGroups() {
  return await request<Fetch.FindResult>('/getAdminGroups', {
    method: "POST",
  });
}

export async function fetchGetAdminGroupsBy(filter: any) {
  return await request<Fetch.FindResult>('/getAdminGroups', {
    method: "POST",
    body: { filter }
  });
}

export async function fetchUpdateAdminGroup(_id: string, update: Partial<Meta.AdminGroup>) {
  const option: Fetch.UpdateOption = {
    filter: { _id },
    update: update    // 全量更新整个数组
  }
  return await request<Fetch.UpdateResult>('/updateAdminGroup', {
    method: "POST",
    body: option
  })
}

export async function fetchNewAdminGroup(adGroup: Meta.AdminGroup) {
  const option: Fetch.InsertOption = {
    docs: [adGroup]
  }
  return await request<Fetch.InsertResult>('/newAdminGroup', {
    method: "POST",
    body: option
  })
}

export async function fetchDeleteAdminGroup(options: Array<Meta.Order>) {
  if (options && options?.length > 0) {
    const moduleOption: Fetch.UpdateOption = {
      update: options
    }
    return await request<Fetch.UpdateResult>('/deleteAdminGroup', {
      method: "POST",
      body: moduleOption
    })
  } else {
    return { msg: 'options error' }
  }
}

export async function fetchUpdateAgOrder(agList: Array<any>, from: number, to: number) {
  let sufUpdateOptions: Array<Meta.Order> = await getListSufIds(agList, from, to)
  if (sufUpdateOptions && sufUpdateOptions?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: sufUpdateOptions
    }
    return await request<Fetch.UpdateResult>('/updateAgOrder', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'updateAgOrder error' }
  }
}
