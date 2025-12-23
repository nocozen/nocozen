import { NodeTypes } from "@/enum"


const NodeNames: { [key: string]: string } = {
  [NodeTypes.Start]: '流程发起节点',
  [NodeTypes.End]: '流程结束',
  [NodeTypes.Approve]: '审批节点',
  [NodeTypes.Send]: '抄送节点'
}

// enum 重复
const NodeIcons: { [key: string]: string } = {
  [NodeTypes.Start]: 'fluent--play-circle-24-filled',
  [NodeTypes.End]: 'clarity--power-solid',
  [NodeTypes.Approve]: 'mingcute--seal-fill',
  [NodeTypes.Send]: 'fluent--send-24-filled'
}

const NodeIconColors: { [key: string]: string } = {
  [NodeTypes.Start]: "rgb(34 197 94)",
  [NodeTypes.End]: "gray",
  [NodeTypes.Approve]: "rgb(87, 151, 255)",
  [NodeTypes.Send]: 'rgb(34 197 94)'
}

// 流程节点图标svg path d
const IconsPathD: { [key: string]: Array<any> } = {
  // fluent:play-circle-24-filled
  [NodeTypes.Start]: [0.7, 'M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m8.856-3.845A1.25 1.25 0 0 0 9 9.248v5.504a1.25 1.25 0 0 0 1.856 1.093l5.757-3.189a.75.75 0 0 0 0-1.312z'],
  // clarity:power-solid
  [NodeTypes.End]: [0.5, 'M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2m.06 17.68a1.28 1.28 0 0 1-1.29-1.28V8.65a1.29 1.29 0 0 1 2.58 0v9.75a1.28 1.28 0 0 1-1.29 1.28M18 27.79a9.88 9.88 0 0 1-5.83-17.94a1.4 1.4 0 0 1 1.94.31a1.37 1.37 0 0 1-.31 1.92a7.18 7.18 0 1 0 11.43 5.8a7.07 7.07 0 0 0-3-5.76A1.37 1.37 0 0 1 22 10.2a1.4 1.4 0 0 1 1.94-.29A9.88 9.88 0 0 1 18 27.79'],
  // mingcute:seal-fill
  [NodeTypes.Approve]: [0.7, 'M6 8a6 6 0 1 1 8.4 5.5a.3.3 0 0 0-.139.123L14.36 15H18a3 3 0 0 1 3 3v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 1 3-3h3.64l.099-1.376a.3.3 0 0 0-.14-.124A6 6 0 0 1 6 8'],
  // mingcute:seal-fill
  [NodeTypes.Send]: [0.7, 'm12.815 12.197l-7.532 1.255a.5.5 0 0 0-.386.318L2.3 20.728c-.248.64.421 1.25 1.035.942l18-9a.75.75 0 0 0 0-1.341l-18-9c-.614-.307-1.283.303-1.035.942l2.598 6.958a.5.5 0 0 0 .386.318l7.532 1.255a.2.2 0 0 1 0 .395'],
  // fluent:plug-connected-20-filled
  unlink: [0.7, 'M17.78 3.28a.75.75 0 0 0-1.06-1.06l-2.446 2.445a4.04 4.04 0 0 0-5.128.481l-.3.3a1.49 1.49 0 0 0 0 2.108l3.6 3.6a1.49 1.49 0 0 0 2.107 0l.3-.3a4.04 4.04 0 0 0 .482-5.128zM7.554 8.846a1.49 1.49 0 0 0-2.107 0l-.3.3a4.04 4.04 0 0 0-.481 5.128L2.22 16.72a.75.75 0 1 0 1.06 1.06l2.446-2.446a4.04 4.04 0 0 0 5.128-.48l.3-.3a1.49 1.49 0 0 0 0-2.108z']
}

const NodeTypeList = [
  { type: NodeTypes.Start, canAdd: false, icon: NodeIcons[NodeTypes.Start], iconColor: NodeIconColors[NodeTypes.Start], title: NodeNames[NodeTypes.Start] },
  { type: NodeTypes.End, canAdd: false, icon: NodeIcons[NodeTypes.End], iconColor: NodeIconColors[NodeTypes.End], title: NodeNames[NodeTypes.End] },
  { type: NodeTypes.Approve, canAdd: true, icon: NodeIcons[NodeTypes.Approve], iconColor: NodeIconColors[NodeTypes.Approve], title: NodeNames[NodeTypes.Approve] },
  { type: NodeTypes.Send, canAdd: true, icon: NodeIcons[NodeTypes.Send], iconColor: NodeIconColors[NodeTypes.Send], title: NodeNames[NodeTypes.Send] }
]

export {NodeTypes, NodeNames,NodeIcons,NodeIconColors, IconsPathD, NodeTypeList}