
import { request } from '../request';
import Uid from '@/utils/uid';
import { MemberCheckerType, ApproveType, TaskOpt, NodeTypes, FlowStauts, FormOpt, CanditionType, BaseComparOpt, MathOpt, StringOpt } from '@/enum';
import { fetchGetAccsByDept, fetchGetAccsByRole, fetchGetAccounts, fetchGetParentDept, fetchGetUserInfo, fetchGetAdminGroupsBy } from './auth';
import { unique } from 'radashi'

// 1.启动流程，创建流程实例
// 2.获取待办
// 3.处理待办：审核提交、退回。。。
// 4.获取已办理
// 5.获取抄送
// 6.获取可用流程定义列表；

// 基础参数赋值后在此处理流程流转；
// 1.启动：activeNodes == [] ; 激活开始后的节点，允许多个；激活节点的同时生成任务，
// 同一个节点的任务执行完成后如何流转取决与所属节点类型，并发节点独立执行；
// 连线(节点进入的前置)、节点有条件(节点离开的后置)的要判断条件；
// 2.审批：activeNodes != [] ;
// 任务完成=>找任务所属节点，根据节点配置确定后续动作，1.继续执行其它任务，2.节点替换为后节点，生成新节点任务；
// 判断开始节点连线条件，满足条件的节点激活；
// 找到所有连线，过滤条件满足的连线，然后以此找到激活节点；


// 启动流程，创建流程实例
async function createFlowIns(doc: Meta.FlowInstance) {
  const collName = 'flowInstance';  // todo: 最终提供服务端专门接口，临时用insertBusiData
  if (collName && doc) {
    const option = {
      collection: collName,
      docs: [doc]
    }
    return request<Fetch.InsertResult>('/initFlowInstance', {
      method: "POST",
      body: option
    })
  } else {
    return { msg: '参数值缺失' }
  }
}


function checkLinkCandition(type: CanditionType, canditions: Array<Meta.Candition>, formData: any) {
  const isCandition = (CanditionType.Candition == type);    // 条件配置类型：条件 / else
  // 满足任一条件返回true，否则false
  const result = canditions.find((c: Meta.Candition) => {
    if (c.fieldName) {
      const value = formData[c.fieldName];
      // console.log(c.comparison, c.value, value)
      switch (c.comparison) {
        case BaseComparOpt.Null:
          return isCandition ? value == null : !(value == null);
        case BaseComparOpt.NotNull:
          return isCandition ? value != null : !(value != null);
        case BaseComparOpt.Equal:
          return isCandition ? value == c.value : !(value == null);
        case BaseComparOpt.NotEqual:
          return isCandition ? value != c.value : !(value != null);

        case MathOpt.GreaterThan:
          return isCandition ? value > c.value : !(value > c.value);
        case MathOpt.GreaterThanOrEqual:
          return isCandition ? value >= c.value : !(value >= c.value);
        case MathOpt.LessThan:
          return isCandition ? value < c.value : !(value < c.value);
        case MathOpt.LessThanOrEqual:
          return isCandition ? value <= c.value : !(value <= c.value);

        case StringOpt.EqualAny:
          return isCandition ? value.split(",").includes(c.value) : !value.split(",").includes(c.value);
        case StringOpt.NotEqualAny:
          return isCandition ? !value.split(",").includes(c.value) : value.split(",").includes(c.value);
        case StringOpt.Includes:
          return isCandition ? value.includes(c.value) : !value.includes(c.value);
        case StringOpt.NotIncludes:
          return isCandition ? !value.includes(c.value) : value.includes(c.value);
      }
    }
  })
  return result ? true : false;
}

async function getTaskExecutors(candidates: Array<Meta.Tag> | undefined, flowIns: Meta.FlowInstance) {

  // 部门、角色：查找对应的账户；
  // member：不用查找；
  // 动态指定的人员查找。。。
  const executors = [] as any;
  if (!candidates) return [];
  for (const c of candidates) {
    // console.log(c.type, c.dynamicType)
    if (c.type == MemberCheckerType.Dept) {
      const result = await fetchGetAccsByDept(c.value);
      if ('ok' == result.msg && result.data?.length > 0) {
        executors.push(...result.data.map((d: any) => ({ _id: d.acc_id, name: d.name })));  // 注意：d.acc_id 不是d._id
      }
    } else if (c.type == MemberCheckerType.Role) {
      const result = await fetchGetAccsByRole(c.value);
      if ('ok' == result.msg && result.data?.length > 0) {
        executors.push(...result.data.map((d: Meta.Base) => ({ _id: d._id, name: d.name })));
      }
    } else if (c.type == MemberCheckerType.Member) {
      executors.push({ _id: c.value, name: c.label })
    } else if (c.type == MemberCheckerType.Dynamic) {
      // 流程发起人 flowIns.createBy ；
      if (c.value == 'createBy') {
        executors.push({ _id: flowIns.createBy!._id, name: flowIns.createBy!.name })
      } else {
        // 不支持嵌套表格中的字段；
        // 字段值：formData[c.value]；两种：成员、部门；判断来源：dynamicType
        if (MemberCheckerType.Member == c.dynamicType) {
          const compValue = flowIns.formData[c.value];
          if (Array.isArray(compValue)) {   // 多选、单选
            executors.concat(compValue);
          } else {
            executors.push(compValue);
          }
        } else if (MemberCheckerType.Dept == c.dynamicType) {
          const compValue = flowIns.formData[c.value];
          // todo: 后续可考虑：基于部门查询所有子部门用户的方法；基于 $graphLookup 获取所有子部门，然后再查部门的所有用户；
          // 默认部门都不包含子部门;
          if (Array.isArray(compValue)) {   // 多选、单选
            const deptIds = compValue.map((c: Meta.Base) => c._id);
            if (deptIds?.length > 0) {
              const result = await fetchGetAccounts({ accExtFilter: { 'dept._id': { $in: deptIds } } })
              if ('ok' == result.msg && result.data[0]?.length > 0) {
                executors.concat(result.data[0].map((d: any) => ({ _id: d._id, name: d.name })));
              }
            }
          } else {
            const result = await fetchGetAccounts({ accExtFilter: { 'dept._id': compValue._id } })
            if ('ok' == result.msg && result.data[0]?.length > 0) {
              executors.concat(result.data[0].map((d: any) => ({ _id: d._id, name: d.name })));
            }
          }
        }
      }
    } else if (c.type == MemberCheckerType.DynamicHead) {
      // 流程发起人、字段获取值 => 部门各级主管
      if (MemberCheckerType.CreateBy == c.dynamicType) {
        const [fieldName, level] = c.value.split("-");
        // 根据creatorId找所属部门，所属有多个时取选择结果；同时要找到所有上级部门，根据level层级找部门主管
        // 增加一个AccountEn查询方法，查找账户所属部门；及查找该部门所有上级部门，然后获取部门主管信息；
        if (flowIns.creatorDeptId) {
          const result = await fetchGetParentDept(flowIns.creatorDeptId);
          if ('ok' == result.msg && result.data?.length > 0) {
            const deptResult = result.data.find((d: any) => d.level == level);
            // console.log(deptResult)
            let managers = deptResult?.manager;
            managers && executors.push(...managers);
          }
        }
      } else if (MemberCheckerType.Member == c.dynamicType) {
        // 查询createBy所属部门(多个时提供选择其中一个)及主管，然后获取所有上级部门及所有主管，如果不存在则不处理；
        // 顺序审批时：如果未指定负责人，则自动获取createBy所属部门及上级部门主管，且结合审批终点配置；指定负责人则按上述规则；
        // 默认部门都不包含子部门
        const [fieldName, level] = c.value.split("-");
        const compValue = flowIns.formData[fieldName];  //
        if (Array.isArray(compValue)) {   // 多选、单选
          // 根据账户id【compValue._id】找所属部门，所属有多个时取选择结果；同时要找到所有上级部门，根据level层级找部门主管
          // 【暂时不做支持】如果特别需要，可以通过添加多个【成员单选】组件间接实现；已屏蔽多选组件；
        } else {
          // 根据账户id【compValue._id】找所属部门，所属有多个时取选择结果；同时要找到所有上级部门，根据level层级找部门主管
          const [fieldName, level] = c.value.split("-");
          const creatorId = flowIns.formData[fieldName]._id;
          const result = await fetchGetUserInfo(creatorId);
          if ('ok' == result.msg && result.data?.length == 2) {
            const depts = result.data[0].dept;  // 可能多个
            for (const d of depts) {
              const resultDepts = await fetchGetParentDept(d._id!);
              if ('ok' == resultDepts.msg && resultDepts.data?.length > 0) {
                let managers = resultDepts.data.find((d: any) => d.level == level).manager;
                // console.log(resultDepts.data, level, managers)
                executors.push(...managers);
              }
            }
          }
        }
      } else if (MemberCheckerType.Dept == c.dynamicType) {    // 部门选择 对应的多级主管？
        const [fieldName, level] = c.value.split("-");
        const compValue = flowIns.formData[fieldName];  //
        if (Array.isArray(compValue)) {   // 多选、单选
          // 【暂时不做支持】如果特别需要，可以通过添加多个【成员单选】组件间接实现；
        } else {
          // 根据部门id获取所有上级部门，根据level层级找部门主管；已屏蔽多选组件；
          const result = await fetchGetParentDept(compValue._id);
          if ('ok' == result.msg && result.data?.length > 0) {
            let managers = result.data.find((d: any) => d.level == level).manager;
            executors.push(...managers);
          }
        }
      }
    }
  }
  return executors;
}

async function getTaskExecutorsBy(actNode: Meta.ActiveNode, flowIns: Meta.FlowInstance) {
  let exectors = [] as any;
  if (actNode.approveType == ApproveType.LevelBySign) {
    // 根据流程发起人的所属部门及终止审批节点配置生成
    if (flowIns.creatorDeptId) {
      const endDeptLevel = actNode.orderSignEnd ? parseInt(actNode.orderSignEnd) : 1;
      const result = await fetchGetParentDept(flowIns.creatorDeptId);
      if ('ok' == result.msg && result.data?.length > 0) {
        const limitIndex = result.data?.length - endDeptLevel + 1;
        if (limitIndex > 0) {
          const approveDepts = result.data.slice(0, limitIndex);
          exectors = approveDepts.flatMap((d: Meta.Dept) => d.manager);
        }
      }
    }
  } else if (actNode.approveType == ApproveType.JointSign || actNode.approveType == ApproveType.VoteSign) {
    exectors = await getTaskExecutors(actNode.candidates, flowIns);
    // 会签、票签去重
    unique(exectors, (e: Meta.Base) => e._id);
  } else {
    exectors = await getTaskExecutors(actNode.candidates, flowIns);
  }
  return exectors;
}
// 【逐级：激活1】【顺序会签：激活1】/【或签: 都激活】【并行会签：都激活】【票签：都激活】
function getTaskStatus(approveType: string, order: number) {
  if ([ApproveType.JointSign, ApproveType.OrSign, ApproveType.VoteSign].includes(approveType as ApproveType)) {
    return TaskOpt.Todo;
  } else {
    if (1 == order) {
      return TaskOpt.Todo;
    } else {
      return TaskOpt.NotActive;
    }
  }
}

async function createActiveTasks(actNode: Meta.ActiveNode, flowIns: Meta.FlowInstance) {
  // 判断节点类型
  actNode.taskAssignCount = 0;     // 分派任务数量，非【任一】审批时指定负责人的数量；
  actNode.taskExecCount = 0;       // 分派任务已执行数，和taskAssign相等时进入下一节点；
  actNode.taskActOrder = 1;        // 指定序号的任务 顺序序号和taskAssign相等时进入下一节点
  // const exectors = await getTaskExecutors(actNode.candidates, flowIns);
  let exectors = await getTaskExecutorsBy(actNode, flowIns);;
  if (exectors?.length == 0) {
    // 如果找不到执行人，指派给创建人；需要创建人审批或指派来完成流程；
    // todo: 后续扩展可配置指定给谁；
    const result = await fetchGetAdminGroupsBy({ type: 'creator' });
    if (result.msg == 'ok' && result.data?.length > 0) {
      exectors = [result.data[0].member[0]];    // 假设有多个创建人，只指派一个创建人，避免生成会签任务；
      actNode.execStatus = 'error',
        actNode.execMsg = '审批节点未找到执行人，系统指派给创建人；'
    }
  }
  // console.log(exectors)

  const tasks = exectors.map((et: Meta.Base, index: number) => {
    const task: Meta.FlowTask = {
      uid: Uid.NextNumber(),
      nodeUid: actNode.uid,
      approveType: actNode.approveType ? actNode.approveType : ApproveType.OrSign,
      execOrder: index + 1,
      status: getTaskStatus(actNode.approveType as string, index + 1),
      executor: et,
      createAt: new Date(),
      updateAt: new Date()
    }
    return task;
  })
  actNode.taskAssignCount = tasks.length;
  return tasks;
}

async function updateFlowIns(flowIns: Meta.FlowInstance, formOpt: FormOpt, currNode: Meta.ActiveNode) {
  // flowIns基础属性有更新可在fetchExecutTask中执行；
  const option: Fetch.UpdateOption = {
    filter: { _id: flowIns._id },
    update: {
      $set: {
        status: flowIns.status,
      },
      $addToSet: {
        activeNodes: { $each: flowIns.activeNodes },    // 新增激活节点，完成节点标记complate == true;
        activeTasks: { $each: flowIns.activeTasks },
        activeCCopy: { $each: flowIns.activeCCopy },
      },
    },
    collection: flowIns.collName,
    formData: flowIns.status == FlowStauts.Complete ? flowIns.formData : null
  }
  return await request<Fetch.UpdateResult>('/updateFlowInstance', {
    method: "POST",
    body: option
  })
}

// todo: 操作意见：所有更新任务的操作都增加【操作意见|意见附件 / 手写签名】字段；
// 或签任务更新
async function updateOrSignTask(flowIns: Meta.FlowInstance, taskOpt: TaskOpt, currNode: Meta.ActiveNode) {
  // 满足前置条件后：当前任务都已经执行完成；
  // 判断依据：1.启动实例：激活节点为[]；2.当前节点：所有人员均已完成任务；
  const currTask = flowIns.activeTasks[0];    // 当前实例只过滤了【我的任务】
  // 1.更新表单数据；2.更新任务状态；3.todo: 依据【approveType】更新任务执行标记，计数+1
  const option: Fetch.UpdateOption = {
    filter: { _id: flowIns._id },
    update: {
      $set:
      {
        status: flowIns.status,
        formData: flowIns.formData,
        'activeTasks.$[currTask].executor._id': currTask.executor._id,
        'activeTasks.$[currTask].executor.name': currTask.executor.name,
        'activeTasks.$[currTask].status': taskOpt,
        'activeTasks.$[currTask].opinion': currTask.opinion,    // 审批意见
        'activeNodes.$[currNode].complete': true,
        updateAt: new Date(),
      },
      $inc: {
        'activeNodes.$[currNode].taskExecCount': 1
      },
    },
    options: {
      arrayFilters: [
        { "currTask.nodeUid": currTask.nodeUid },
        { "currNode.uid": currNode.uid }
      ]
    }
  }
  return await request<Fetch.UpdateResult>('/updateFlowInstance', {
    method: "POST",
    body: option
  })
}

// 顺序会签任务更新
async function updateOrderSignTask(flowIns: Meta.FlowInstance, taskOpt: TaskOpt, currNode: Meta.ActiveNode) {
  // 满足前置条件后：当前任务都已经执行完成；
  // 判断依据：1.启动实例：激活节点为[]；2.当前节点：所有人员均已完成任务；
  const currTask = flowIns.activeTasks[0];  // 当前实例只过滤了【我的任务】
  // 1.更新表单数据；2.更新任务状态；3.todo: 依据【approveType】更新任务执行标记，计数+1
  // 最后执行的任务不再更新下一个，需要触发节点流转；
  const complete = (currNode.taskAssignCount == currTask.execOrder);  // 节点任务是否结束
  const option: Fetch.UpdateOption = {
    filter: { _id: flowIns._id },
    update:
    {
      $set:
      {
        status: flowIns.status,
        formData: flowIns.formData,
        'activeTasks.$[currTask].status': taskOpt,
        'activeTasks.$[nextTask].status': TaskOpt.Todo,
        'activeTasks.$[currTask].opinion': currTask.opinion,    // 审批意见
        'activeNodes.$[currNode].taskActOrder': currTask.execOrder + 1,
        'activeNodes.$[currNode].complete': complete,
        updateAt: new Date(),
      },
      $inc: { 'activeNodes.$[currNode].taskExecCount': 1 },
    },
    options: {
      arrayFilters: [
        { "currTask.uid": currTask.uid },
        { "nextTask.execOrder": currTask.execOrder + 1 },
        { "currNode.uid": currNode.uid }
      ]
    }
  }
  return await request<Fetch.UpdateResult>('/updateFlowInstance', {
    method: "POST",
    body: option
  })
}

// 并行会签
async function updateJointSignTask(flowIns: Meta.FlowInstance, taskOpt: TaskOpt, currNode: Meta.ActiveNode) {
  // 满足前置条件后：当前任务都已经执行完成；
  // 判断依据：1.启动实例：激活节点为[]；2.当前节点：所有人员均已完成任务；
  const currTask = flowIns.activeTasks[0];    // 当前实例只过滤了【我的任务】
  // 1.更新表单数据；2.更新任务状态；3.todo: 依据【approveType】更新任务执行标记，计数+1
  const complete = (currNode?.taskExecCount == currNode?.taskAssignCount - 1);  // 节点任务是否结束
  // console.log(currNode?.taskExecCount, currNode?.taskAssignCount - 1)
  const option: Fetch.UpdateOption = {
    filter: { _id: flowIns._id },
    update: {
      $set:
      {
        status: flowIns.status,
        formData: flowIns.formData,
        'activeTasks.$[currTask].status': taskOpt,
        'activeTasks.$[currTask].opinion': currTask.opinion,    // 审批意见
        'activeNodes.$[currNode].complete': complete,
        updateAt: new Date(),
      },
      $inc: { 'activeNodes.$[currNode].taskExecCount': 1 },
    },
    options: {
      arrayFilters: [
        { "currTask.uid": currTask.uid },
        { "currNode.uid": currNode.uid }
      ]
    }
  }
  return await request<Fetch.UpdateResult>('/updateFlowInstance', {
    method: "POST",
    body: option
  })
}

// 票签
async function updateVoteSignTask(flowIns: Meta.FlowInstance, taskOpt: TaskOpt, currNode: Meta.ActiveNode) {
  // 满足前置条件后：当前任务都已经执行完成；
  // 判断依据：1.启动实例：激活节点为[]；2.当前节点：所有人员均已完成任务；
  const currTask = flowIns.activeTasks[0];    // 当前实例只过滤了【我的任务】
  // 1.更新表单数据；2.更新任务状态；3.todo: 依据【approveType】更新任务执行标记，计数+1
  const complete = (currNode?.taskExecCount == currNode?.taskAssignCount - 1);  // 节点任务是否结束
  const option: Fetch.UpdateOption = {
    filter: { _id: flowIns._id },
    update: {
      $set:
      {
        status: flowIns.status,
        formData: flowIns.formData,
        'activeTasks.$[currTask].status': taskOpt,
        'activeNodes.$[currNode].complete': complete,
        updateAt: new Date(),
      },
      $inc: { 'activeNodes.$[currNode].taskExecCount': 1 },
    },
    options: {
      arrayFilters: [
        { "currTask.uid": currTask.uid },
        { "currNode.uid": currNode.uid }
      ]
    }
  }
  return await request<Fetch.UpdateResult>('/updateFlowInstance', {
    method: "POST",
    body: option
  })
}

// 【批准】；// 【退回】、【转交】、【否决】、
// 该方法主要为了满足：支持多人审批，流转条件必须是满足多人操作结果判断后才可以；
export async function fetchExecutTask(flowIns: Meta.FlowInstance, taskOpt: TaskOpt) {
  // 满足前置条件后：当前任务都已经执行完成；
  // 判断依据：1.启动实例：激活节点为[]；2.当前节点：所有人员均已完成任务；
  // 判断任务类型：
  let result = {} as any;
  const currTask = flowIns.activeTasks[0];
  const currNode = flowIns.activeNodes.find(node => node.uid == currTask.nodeUid);  // 当前任务对应的节点
  let updateResult = {} as any;
  let executResult = {} as any;
  // 1.任一/或签：更新所有任务，更新所有任务执行人为当前用户，流转下一节点；// todo: 分配任务历史记录是否保留？增加分派任务人？
  if (ApproveType.OrSign == currTask.approveType) {
    updateResult = await updateOrSignTask(flowIns, taskOpt, currNode!);
    result = updateResult;
    if ('ok' == updateResult.msg) {
      executResult = await fetchExecutFlowNext(flowIns, FormOpt.Approve);
      result = executResult;
    }
  } else if (ApproveType.OrderSign == currTask.approveType) {
    // 2.顺序：更新当前任务，并激活下一个任务，如果是最后一个流转下一节点；
    // 逐级审批==顺序审批；逐级审批成员配置时列出所有主管部门选择终止部门，然后生成部门清单或成员清单；
    updateResult = await updateOrderSignTask(flowIns, taskOpt, currNode!);
    result = updateResult;
    if ('ok' == updateResult.msg && currNode?.taskAssignCount == currTask.execOrder) {    // 最后一个顺序任务执行完成
      executResult = await fetchExecutFlowNext(flowIns, FormOpt.Approve);
      result = executResult;
    }
  } else if (ApproveType.JointSign == currTask.approveType) {
    // 3.并行会签：是否所有审批已执行；
    updateResult = await updateJointSignTask(flowIns, taskOpt, currNode!);
    result = updateResult;
    if ('ok' == updateResult.msg && currNode && (currNode.taskExecCount == currNode.taskAssignCount - 1)) {    // 最后一个顺序任务执行完成
      executResult = await fetchExecutFlowNext(flowIns, FormOpt.Approve);
      result = executResult;
    }
  } else if (ApproveType.VoteSign == currTask.approveType) {
    // 需要基于配置判断完成比例是否满足，和会签类似
    // updateResult = await updateVoteSignTask(flowIns, taskOpt, currNode!);
    // result = updateResult;
    // if ('ok' == updateResult.msg && currNode && ((currNode.taskExecCount + 1) / currNode.taskAssignCount) == [比例] ) {    // 最后一个顺序任务执行完成
    //   executResult = await fetchExecutFlowNext(flowIns, FormOpt.Approve);
    //   result = executResult;
    // }
  }
  return result;
}

async function createCCopyTask(carbonCopy: Array<Meta.Tag>, node: Meta.FlowNode, flowIns: Meta.FlowInstance) {
  const exectors = await getTaskExecutors(carbonCopy, flowIns);
  return exectors.map((et: Meta.Base, index: number) => ({
    uid: Uid.NextNumber(),
    nodeUid: node.uid,
    fieldPerm: node.fieldPerm || [],
    isRead: false,
    executor: et,
    createAt: new Date(),
    updateAt: new Date()
  }))
}

// 【Start: 启动】；// 【撤回】、【撤销】、【作废/中断结束】
export async function fetchExecutFlowNext(flowIns: Meta.FlowInstance, formOpt: FormOpt) {
  const links = flowIns.flowDef.links;
  const nodes = flowIns.flowDef.nodes;
  const currTask = flowIns.activeTasks[0];    // 当前任务
  const formData = flowIns.formData;

  let currNode = {} as any;
  // 启动流程：activeNodes == [] || activeNodes[只有start节点]
  if (FormOpt.Start == formOpt) {
    currNode = nodes[0]
  } else if (FormOpt.Approve == formOpt) {
    currNode = flowIns.activeNodes.find(node => node.uid == currTask.nodeUid);  // 当前任务对应的节点
  }

  // 当前激活节点的所有【抄送节点】连线；
  // 当前激活节点的所有【审批节点】连线；
  let actLinks = [] as any;
  actLinks = links.filter((link: Meta.FlowLink) => link.sourceId == currNode.uid &&
    nodes.find((n: Meta.FlowNode) => n.uid == link.targetId)?.type != NodeTypes.Send);
  let newNodes: Array<Meta.ActiveNode> = [] as any;    // 下一个新激活节点；
  let newTasks: Array<Meta.FlowTask> = [] as any;      // 下一组新激活任务；

  async function createNextNodeTask(actNode: Meta.FlowNode) {
    let newNode: Meta.ActiveNode = {
      ...actNode,
      taskAssignCount: 0,
      taskExecCount: 0,
      taskActOrder: 0,
      complete: false,
      createAt: new Date(),
      updateAt: new Date(),

      execStatus: 'normal',
      execMsg: '执行正常'
    };
    // 激活任务：找到当前节点的所有候选人账号，生成任务实例；
    actNode.type != NodeTypes.End && (newTasks = await createActiveTasks(newNode, flowIns));
    newNodes.push(newNode);
  }

  // 生成抄送任务
  async function setFlowInsActiveCCopy() {
    // 添加【抄送任务】
    // 1、当前审批节点附带的抄送任务
    if (currNode.carbonCopy) {
      const activeCCopy = await createCCopyTask(currNode.carbonCopy, currNode, flowIns);
      flowIns.activeCCopy = activeCCopy;
    }
    // 2、查找处理发送节点
    const ccLinks = links.filter((link: Meta.FlowLink) => link.sourceId == currNode.uid &&
      nodes.find((n: Meta.FlowNode) => n.uid == link.targetId)?.type == NodeTypes.Send);
    for (const link of ccLinks) {
      // 当前先省略连线逻辑，直接生成发送任务；
      const targetNode = nodes.find((n: Meta.FlowNode) => n.uid == link.targetId);
      if (targetNode?.carbonCopy) {
        const activeCCopy = await createCCopyTask(targetNode.carbonCopy, targetNode, flowIns);
        flowIns.activeCCopy.push(...activeCCopy);
        // 发送通知去重
        flowIns.activeCCopy = unique([...flowIns.activeCCopy], item => item?.executor?._id)
      }
    };
  }

  // 此处只有【审批节点】，抄送节点不在此处理；
  // 根据当前激活节点找到下一个节点，并生成激活任务；
  if (actLinks?.length == 1) {
    const actNode = nodes.find((node: Meta.FlowNode) => node.uid == actLinks[0].targetId);
    actNode && await createNextNodeTask(actNode);
  } else if (actLinks?.length > 1) {
    // 无条件并行；
    // 有条件执行校验；else排除所有条件；
    let allConditions = [...actLinks.map((link: Meta.FlowLink) => link.canditions)];   // else排除所有条件；
    for (const link of actLinks) {
      if (link.sourceId == currNode.uid) {
        // 此处只有审批节点，抄送节点不在此处理
        const actNode = nodes.find((node: Meta.FlowNode) => node.uid == link.targetId);
        // 判断条件类型
        if (link.canditions) {
          if (link.canditions?.length == 0) {    // 无条件直接激活下节点
            actNode && await createNextNodeTask(actNode)
          } else if (link.canditions == CanditionType.Else) {  // else排除所有条件；
            const checkResult = checkLinkCandition(CanditionType.Else, allConditions, formData);
            if (checkResult) {
              actNode && await createNextNodeTask(actNode)
            }
          } else if (link.canditions?.length > 0) {  // 判断条件是否通过；
            const checkResult = checkLinkCandition(CanditionType.Candition, link.canditions, formData)
            // console.log(link, checkResult)
            if (checkResult) {
              actNode && await createNextNodeTask(actNode)
            }
          }
        }
      }
    }
  }

  // 活动节点：删除旧节点，添加新节点；结束节点也适用
  // 初始化：push新节点；审批/结束：删除当前旧节点currNode，push新节点(需要去重)；
  flowIns.activeNodes = newNodes;
  // 所有情况：push新任务;
  flowIns.activeTasks = newTasks;
  await setFlowInsActiveCCopy();

  // 如果都是【结束节点】流程结束; 节点已流转(不再删除)：node.complete == true
  // todo: 节点并发流程控制：当前节点任务完成后并不向后流转，要等下一个节点所有输入连线对应的上一级节点的任务全部执行完成后再流转
  // todo: 因此，此处的【activeNodes】要取数据库中所有的激活几点的状态，全部结束才结束；否则会先完成的单分支流程短路其它分支；
  const filterNodes = flowIns.activeNodes.filter(node => node?.type == NodeTypes.Approve && node?.complete == false);
  if (filterNodes?.length == 0) {
    flowIns.status = FlowStauts.Complete;
  }
  let execResult = {
    msg: 'ok',
    data: flowIns,
  }

  // 更新数据表：插入、更新；
  let flowResult = {} as any;
  if (FormOpt.Start == formOpt) {
    flowResult = await createFlowIns(flowIns);
  } else if (FormOpt.Approve == formOpt) {
    // 更新实例,
    // activeNodes 删除当前旧节点currNode，push新节点(需要去重)
    // activeTasks push新任务
    flowResult = await updateFlowIns(flowIns, formOpt, currNode);
  }
  if ('ok' != flowResult.msg) {
    execResult.msg = flowResult.msg;
  }
  return execResult;
}

export async function fetchAllTasks(app_id: string, page: number = 1, pageSize: number = 100, sort: any = {}) {
  return await fetchTasksBy({ type: 'app', app_id: app_id }, page, pageSize, sort)
}
// 流程任务查询
export async function fetchTodoTasks(app_id: string | undefined, page: number = 1, pageSize: number = 100, sort: any = {}) {
  let filter: TaskFilter = { type: 'todo' };
  app_id && (filter['app_id'] = app_id);
  return await fetchTasksBy(filter, page, pageSize, sort)
}
export async function fetchStartedTasks(app_id: string | undefined, status: string, page: number = 1, pageSize: number = 100, sort: any = {}) {
  let filter: TaskFilter = { type: 'started' };
  app_id && (filter['app_id'] = app_id);
  status && (filter['status'] = status);
  return await fetchTasksBy(filter, page, pageSize, sort)
}
export async function fetchHandledTasks(app_id: string | undefined, status: string, page: number = 1, pageSize: number = 100, sort: any = {}) {
  let filter: TaskFilter = { type: 'handled' };
  app_id && (filter['app_id'] = app_id);
  status && (filter['status'] = status);
  return await fetchTasksBy(filter, page, pageSize, sort)
}
export async function fetchTasksCCopy(app_id: string | undefined, isRead: boolean, page: number = 1, pageSize: number = 100, sort: any = {}) {
  let filter: TaskFilter = { type: 'received' };
  app_id && (filter['app_id'] = app_id);
  isRead != undefined && (filter['isRead'] = isRead);
  return await fetchTasksBy(filter, page, pageSize, sort)
}

interface TaskFilter {
  type?: 'app' | 'todo' | 'started' | 'handled' | 'received',
  app_id?: string,    // 未定义时查询企业内
  status?: string,
  isRead?: boolean,
  accountId?: string,    // 可服务端处理；
}

// 待办：FlowInstance.activeTasks[].executor == account  .status == 'todo' | 'sendBack';
// 过滤：超时、催办、回退；由于待办任务比较少，在客户端过滤，不再重新查询；
// 已发起: FlowInstance.createBy == account
// 已办理: FlowInstance.hisTasks[].executor == account  .status == 'approve' | 'sendBack' | 'transfer' | 'reject'
// 抄送: FlowInstance.activeCCopy[].executor == account
export async function fetchTasksBy(taskfilter: TaskFilter, page: number = 1, pageSize: number = 100, sort: any = {}) {

  const findOption: Fetch.FindOption = {
    "filterType": taskfilter.type,
    "filter": taskfilter,
    "page": page,
    "size": pageSize,
    "sort": sort
  }
  // console.log(findOption)
  return await request<Fetch.FindResult>('/findAllFlowTasks', {
    method: "POST",
    body: findOption
  })
}

// 获取所有启用的流程
export async function fetchAllFlowEnabled(filter: Partial<Meta.FlowInstance>) {
  return await request<Fetch.FindResult>('/findAllFlowEnabled', {
    method: "POST",
    body: { filter }
  });
}

export async function updateFlowCCopy(flowInsId: string, accId: string) {
  // flowIns基础属性有更新可在fetchExecutTask中执行；
  const option: Fetch.UpdateOption = {
    filter: { _id: flowInsId },
    update: {
      $set: {
        'activeCCopy.$[ccopy].isRead': true,
      },
    },
    options: { "arrayFilters": [{ "ccopy.executor._id": accId }] }
  }
  return await request<Fetch.UpdateResult>('/updateFlowInstance', {
    method: "POST",
    body: option
  })
}

