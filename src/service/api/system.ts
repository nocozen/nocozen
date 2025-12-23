import { BoardElType } from '@/enum';
import { request } from '../request';
import { getListSufIds } from '@/utils/dataHelper';
import { reOrderListBySufId } from '@/utils/dataHelper';
import Uid from '@/utils/uid';


type ModuleConfigSubOption = Partial<Pick<Meta.ModuleConfig, 'layouts' | 'compConfigs' | 'flowDefs'>>;
type moduleConfigOption = { formConfig?: any, vglConfig?: any, ext?: any, publish?: any }
type delConfigOption = { layouts?: { uid: any }, compConfigs?: { i?: string, nodeUid?: any }, flowDefs?: { uid: any } }


async function updateModuleConfig(option: Fetch.UpdateOption) {
  return await request<Fetch.UpdateResult>('/updateModuleConfig', {
    method: "POST",
    body: option
  })
}

// 获取模块配置
export async function fetchGetAllModuleConfig(filter: Partial<Meta.ModuleConfig>) {
  const filterOption: Fetch.FindOption = {
    filter: filter
  }
  return await request<Fetch.FindResult>('/getAllModuleConfig', {
    method: "POST",
    body: filterOption
  });
}

// 获取模块配置
export async function fetchGetModuleConfig(moduleConfig_id: string) {
  if (!moduleConfig_id) return { msg: 'moduleConfig_id不能为空', data: [] }
  const filterOption: Fetch.FindOption = {
    filter: { moduleConfig_id }
  }
  return await request<Fetch.FindResult>('/getModuleConfig', {
    method: "POST",
    body: filterOption
  });
}

export async function fetchGetModuleConfigByNodeId(_id: string) {
  if (!_id) return { msg: '_id不能为空', data: [] }
  const filterOption: Fetch.FindOption = {
    filter: { _id }
  }
  return await request<Fetch.FindResult>('/getModuleConfig', {
    method: "POST",
    body: filterOption
  });
}

export async function fetchDeleteModuleComp(module_id: string, delOption: delConfigOption) {
  // moduleConfig基于【_id】完整提交的字段: formConfig, vglConfig, ext, publish, layout
  if (!module_id) return { msg: '模块id未定义' }
  const moduleOption: Fetch.UpdateOption = {
    filter: { _id: module_id },
    pull: delOption
  }
  return await updateModuleConfig(moduleOption)
}

// 新增、修改DataSync
export async function fetchUpdateModuleDataSync(id: string, config: Meta.DataSync) {
  const moduleOption: Fetch.UpdateOption = {} as any;
  config['version'] = Uid.NextNumber();   // 版本号每次修改都要更新；
  if (config.uid) {
    moduleOption['filter'] = { _id: id, 'dataSync.uid': config.uid };
    moduleOption['update'] = { 'dataSync.$': config };
  } else {
    config['uid'] = Uid.NextNumber();
    moduleOption['filter'] = { _id: id };
    moduleOption['addToSet'] = { dataSync: config };
  }
  return await updateModuleConfig(moduleOption)
}

export async function fetchSetModuleDataSyncEnable(id: string, uid: number, enable: boolean) {
  const moduleOption: Fetch.UpdateOption = {} as any;
  moduleOption['filter'] = { _id: id, 'dataSync.uid': uid };
  moduleOption['update'] = { 'dataSync.$.enable': enable };
  return await updateModuleConfig(moduleOption)
}

// 删除DataSync
export async function fetchDeleteModuleDataSync(id: string, uid: number) {
  const moduleOption: Fetch.UpdateOption = {} as any;
  moduleOption['filter'] = { _id: id };
  moduleOption['pull'] = { dataSync: { uid: uid } };
  return await updateModuleConfig(moduleOption)
}

export async function fetchUpdateModuleConfig(id: string, option: moduleConfigOption) {
  // moduleConfig基于【_id】完整提交的字段: formConfig, vglConfig, ext, publish, layout
  if (!id) return { msg: '模块id未定义' }
  const moduleOption: Fetch.UpdateOption = {
    filter: { _id: id },
    update: option
  }
  return await updateModuleConfig(moduleOption)
}

export async function fetchUpdateNestModuleConfig(id: string, updateOption: ModuleConfigSubOption) {
  // 基于子项uid更新：moduleConfig.comp.field, flow.ver
  // 检查updateOption必须且只有一个属性；
  const countKey = Object.keys(updateOption);
  const values = Object.values(updateOption)
  if (!id || countKey?.length != 1 || values[0]?.length == 0) return { msg: '参数错误!' };

  let update = {} as any;
  let moduleOption: Fetch.UpdateOption = {} as any;
  if ('layouts' == countKey[0]) {
    if (!updateOption.layouts) return { msg: '参数错误!' };
    update = { "layouts.$.layout": updateOption.layouts[0].layout, "layouts.$.hiddenItems": updateOption.layouts[0].hiddenItems };
    moduleOption = {
      filter: { _id: id, "layouts.uid": updateOption.layouts[0].uid },
      update: update
    }
  } else if ('compConfigs' == countKey[0]) {
    if (!updateOption.compConfigs) return { msg: '参数错误!' };
    const noUpdate = ['i', 'fieldName']
    const config = updateOption.compConfigs[0];
    const configKeys = Object.keys(config).filter((key: string) => !noUpdate.includes(key));
    update = {} as any;
    configKeys?.forEach((key: string) => {
      'fieldValue' != key && (update[`compConfigs.$.${key}`] = config[key]);
    })
    moduleOption = {
      filter: { _id: id, "compConfigs.i": updateOption.compConfigs[0].i },
      update: update
    }
  } else if ('flowDefs' == countKey[0]) {
    if (!updateOption.flowDefs) return { msg: '参数错误!' };
    update = {
      "flowDefs.$.enable": updateOption.flowDefs[0].enable,
      "flowDefs.$.links": updateOption.flowDefs[0].links,
      "flowDefs.$.nodes": updateOption.flowDefs[0].nodes,
    };
    moduleOption = {
      filter: { _id: id, "flowDefs.uid": updateOption.flowDefs[0].uid },
      update: update
    }
  }

  return await updateModuleConfig(moduleOption)
}


export async function fetchAddNestModuleConfig(id: string, updateOption: ModuleConfigSubOption) {
  // 通过初始化时机来实现添加初始化对象：布局在打开编辑窗口初始化ModuleConfig时实现；嵌套布局在添加嵌套组件时实现；
  // 基于子项uid更新：moduleConfig.comp.field, flow.ver
  const countKey = Object.keys(updateOption);
  if (!id || countKey?.length != 1) return { msg: '参数错误!' };

  let moduleOption: Fetch.UpdateOption = {} as any;
  if ('layouts' == countKey[0]) {
    if (!updateOption.layouts) return { msg: '参数错误!' };
    moduleOption = {
      filter: { _id: id, "layouts.uid": { $ne: updateOption.layouts[0].uid } },
      push: { layouts: updateOption.layouts[0] }
    }
  } else if ('compConfigs' == countKey[0]) {
    if (!updateOption.compConfigs) return { msg: '参数错误!' };
    // 不解构去除响应会使用ref对象导致fieldValue提交前被修改，无法修改为null
    const config = { ...updateOption.compConfigs[0] };
    config.type != BoardElType.BiChart && (config['fieldValue'] = null);
    moduleOption = {
      filter: { _id: id, "compConfigs.i": { $ne: config.i } },
      addToSet: { compConfigs: config }
    }
  }
  return await updateModuleConfig(moduleOption)
}


export async function fetchUpdateModuleOrder(sufUpdateOptions: Array<Meta.Node>) {
  if (sufUpdateOptions && sufUpdateOptions?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: sufUpdateOptions
    }
    return await request<Fetch.UpdateResult>('/updateModuleOrder', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'getListSufIds error' }
  }
}

export async function fetchEditModuleNode(module: Meta.ModuleNode) {
  const moduleOption: Fetch.UpdateOption = {
    update: module
  }
  return await request<Fetch.UpdateResult>('/editModuleNode', {
    method: "POST",
    body: moduleOption
  })
}

export async function fetchUpdateModuleImports(ids: Array<string>, app_id: string) {
  const moduleOption: Fetch.UpdateOption = {
    filter: {
      _id: ids as any
    },
    addToSet: {
      imports: app_id
    }
  }
  return await request<Fetch.UpdateResult>('/updateModuleNode', {
    method: "POST",
    body: moduleOption
  })
}

export async function fetchDeleteModuleImports(id: string, app_id: string) {
  const moduleOption: Fetch.UpdateOption = {
    filter: {
      _id: id
    },
    pull: {
      imports: app_id
    }
  }
  return await request<Fetch.UpdateResult>('/updateModuleNode', {
    method: "POST",
    body: moduleOption
  })
}

export async function fetchMarkModuleDelete(options: Array<Meta.Order>) {
  if (options && options?.length > 0) {
    const moduleOption: Fetch.UpdateOption = {
      update: options
    }
    return await request<Fetch.UpdateResult>('/markModuleDelete', {
      method: "POST",
      body: moduleOption
    })
  } else {
    return { msg: 'options error' }
  }
}


export async function fetchGetAppModules(
  filter: {
    _id?: any,
    app_id?: any,
    parent_id?: string,
    type?: 'form' | 'flow' | 'board' | Array<'form' | 'flow' | 'board'>,
    imports?: any
  }) {
  const filterOption: Fetch.FindOption = {
    filter: filter
  }
  return await request<Fetch.FindResult>('/getAppModules', {
    method: "POST",
    body: filterOption
  });
}

export async function fetchInsertModuleNode(node: Meta.ModuleNode, moduleConfig?: Meta.ModuleConfig) {
  const nodeOption: Fetch.InsertOption = {
    docs: [node, moduleConfig]
  }
  return await request<Fetch.InsertResult>('/insertModuleNode', {
    method: "POST",
    body: nodeOption
  })

}

export async function fetchInsertAppNode(app: Meta.AppNode) {
  const appOption: Fetch.InsertOption = {
    docs: [app]
  }
  return await request<Fetch.InsertResult>('/insertAppNode', {
    method: "POST",
    body: appOption
  })

}

export async function fetchFindAppNode(filter: Partial<Meta.AppNode>) {
  return await request<Fetch.FindResult>('/findAppNode', {
    method: "POST",
    body: { filter }
  });
}

export async function fetchGetAppList() {
  return await request<Fetch.FindResult>('/getAppList', {
    method: "POST"
  });
}

// 系统管理可以添加应用；应用管理只可以在应用中添加模块；
export async function getUserAppPerm(userAuth: Meta.UserAuth) {
  let apps = [] as any;
  const result = await fetchGetAppList();
  if (result.msg == 'ok') {
    apps = reOrderListBySufId(result.data);

    // 超级管理员可见所有；系统管理员
    if (['creator', 'super'].includes(userAuth.groupRole)) {
      // 全部
      apps?.forEach((app: any) => {
        app['groupRole'] = userAuth.groupRole;
        const appPerm = userAuth.permGroupCount.find((appCount: any) => appCount._id == app._id);
        if (appPerm) {
          app['app_perm'] = appPerm.module;
          app['module_ids'] = appPerm.module_ids;
        }
      });
    } else {
      if (['system', 'app'].includes(userAuth.groupRole)) {
        // 有管理权限的应用添加标记；合并有访问权限的应用；
        apps = apps.filter((app: any) => {
          const appPerm = userAuth.permGroupCount.find((appCount: any) => appCount._id == app._id);
          if (userAuth.agAppPerm.includes(app._id)) {
            app['groupRole'] = userAuth.groupRole;
            app['app_perm'] = appPerm.module;
            app['module_ids'] = appPerm.module_ids;
            return app;
          }
          if (appPerm) {
            app['app_perm'] = appPerm.module;
            app['module_ids'] = appPerm.module_ids;
            return app;
          }
        })
      } else {
        // 普通用户
        apps = apps.filter((app: any) => {
          const appPerm = userAuth.permGroupCount.find((appCount: any) => appCount._id == app._id);
          if (appPerm) {
            app['app_perm'] = appPerm.module;
            app['module_ids'] = appPerm.module_ids;
            return app;
          }
        })
      }

    }
  }
  return apps;
}

export async function getUserModulePerm(userAuth: any, appId: string, moduleId: string) {
  let module = userAuth.permGroupCount.find((appCount: any) => appCount._id == appId)?.module?.find((m: any) => m.module_id == moduleId);
  let modulePerm = { ...module } as any;
  // 超级管理员可见所有；系统管理员
  if (['creator', 'super'].includes(userAuth.groupRole)) {
    // 全部
    modulePerm['groupRole'] = userAuth.groupRole;
  } else {
    if (['system', 'app'].includes(userAuth.groupRole)) {
      // 有管理权限的应用添加标记
      if (userAuth.agAppPerm.includes(appId)) {
        modulePerm['groupRole'] = userAuth.groupRole;
      }
    }
  }
  return modulePerm;
}


export async function fetchUpdateAppOrder(appList: Array<any>, from: number, to: number) {
  let sufUpdateOptions: Array<Meta.Order> = await getListSufIds(appList, from, to)
  if (sufUpdateOptions && sufUpdateOptions?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: sufUpdateOptions
    }
    return await request<Fetch.UpdateResult>('/updateAppOrder', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'getListSufIds error' }
  }
}

export async function fetchMarkAppDelete(options: Array<Meta.Order>) {
  if (options && options?.length > 0) {
    const appOption: Fetch.UpdateOption = {
      update: options
    }
    return await request<Fetch.UpdateResult>('/markAppDelete', {
      method: "POST",
      body: appOption
    })
  } else {
    return { msg: 'options error' }
  }
}

export async function fetchUpdateAppHome(app_id: string, home_id: string | null) {
  const appOption: Fetch.UpdateOption = {
    update: {
      _id: app_id,
      home_id: home_id
    }
  }
  return await request<Fetch.UpdateResult>('/updateAppHome', {
    method: "POST",
    body: appOption
  })
}

export async function fetchUpdateApp(app: Meta.AppNode) {
  const appOption: Fetch.UpdateOption = {
    update: app
  }
  return await request<Fetch.UpdateResult>('/editAppNode', {
    method: "POST",
    body: appOption
  })
}

export async function fetchResetSequence(compId: string) {
  if (!compId) {
    return { msg: '参数不能为空'}
  }
  return await request<Fetch.UpdateResult>('/resetSequence', {
    method: "POST",
    body: { compId }
  })
}

export async function fetchGetCurrSequence(compId: string) {
  if (!compId) {
    return { msg: '参数不能为空', data: []}
  }
  return await request<Fetch.FindResult>('/getCurrSequence', {
    method: "POST",
    body: { compId }
  })
}
