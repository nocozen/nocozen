<template>
  <NFlex ref="container" class="w-full h-full">
    <NFlex class="w-full h-full" :size="0">
      <div ref="flowSvg" class="bg-gray-200/50"></div>
      <NodeAddMenu v-if="showMenu" @addNode="addNode"
        :style="{ top: popPostion.top + 'px', left: popPostion.left + 'px' }">
      </NodeAddMenu>
    </NFlex>
  </NFlex>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as d3 from 'd3';
import { NodeTypes, NodeNames, NodeIconColors, IconsPathD } from '../shared';
import Uid from '@/utils/uid';
import { getTextWidth } from '@/components/q3/utils/text';
import { useModuleInject } from '../../useModuleInject';
import { ApproveType, FlowStauts } from '@/enum';
import { useResizeObserver } from '@vueuse/core';
import { debounce } from 'radashi';

interface Props {
  readonly: boolean,
  flowIns?: Meta.FlowInstance
  // fowDef: Meta.FlowDefinition,
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const container = ref();
let svgWidth = 10;
let svgHeight = 10;

const debounceHandle = debounce({ delay: 300 }, entries => {
  const entry = entries[0].contentRect;
  svgWidth = entry.width;
  svgHeight = entry.height;
  updateSvgSize(svgWidth, svgHeight);
})
useResizeObserver(container, debounceHandle)

const flowSvg = ref();
const defBorderColor = "rgb(220 226 234)";
const hoverColor = "rgb(87, 151, 255)";
const completeColor = "rgb(0, 184, 153)"
const defFillColor = "rgb(117, 191, 255)";
const lineColor = "rgb(176 183 205)"
const flowMove = ref(false);
const svgTopOffset = 88; // svg画布离屏幕顶部距离(顶部工具栏高度)
let nodeWidth = 160;
let nodeHeight = [40, 70];
let nodeModeIndex: 0 | 1 = 0;   // = 1 备用，todo: 开始、结束节点高度不变需要处理；
let headerLength = 20;
let minMargin = 20;
let lineWidth = 2;    // 必须偶数！！！
const arrowWidth = 10;
const arrowHeight = 10;
let svg = null as any;
const showMenu = ref(false)
const tempLinkId = 0;
let hasTempLink = false;


const mapPosition: { [key: string]: string } = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
}

const enum ElType {
  Link = 'link',
  Node = 'node'
}

const { flowDefs, currSelectFlowEl, updateFlowDef } = useModuleInject();
let flowMoveRect = { x: 0, y: 0, width: svgWidth, height: svgHeight };
let dragSource = { nodeId: null, position: null };  // 源和目标相同时无动作，不同时添加连接线；
let popPostion = ref({ top: 100, left: 10 })
let selectedElement: { elType: ElType, uid: number | string, nodeType?: string } = null as any;
// var data: Meta.FlowDefinition = props.fowDef;
let data: Meta.FlowDefinition = {} as any;
let refData = {} as any;


const updateSelected = (selectedEl: any) => {
  selectedElement = selectedEl;
  if (currSelectFlowEl) {
    if (!selectedEl) {
      currSelectFlowEl.value = null;
    } else {
      currSelectFlowEl.value = { defUid: data.uid, elUid: selectedEl.uid, elType: selectedEl.elType, nodeType: selectedEl.nodeType };
    }
  };
  // emit('updateSelected', selectedElement);
}

const updateFlow = async () => {
  if (props.readonly) return;
  // 更新指定版本的流程定义
  // 同步本地对象，提交更新后的本地对象；
  updateFlowDef && updateFlowDef(refData);
}

const initFlowDef = (flowUid: number) => {
  refData = flowDefs?.find((flow: any) => flow.uid == flowUid);
  if (refData) {
    data.uid = refData.uid;
    data.verId = refData.verId;
    data.enable = refData.enable;
    data.nodes = refData.nodes.map((node: Meta.FlowNode) => ({
      uid: node.uid,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y
    }));
    data.links = refData.links.map((link: Meta.FlowLink) => ({
      uid: link.uid,
      name: link.name,
      sourceId: link.sourceId,
      sourcePos: link.sourcePos,
      targetId: link.targetId,
      targetPos: link.targetPos
    }))
  }
  // if (def) {
  //   data = {
  //     uid: def.uid,
  //     verId: def.verId,
  //     enable: def.enable,
  //     links: [ ...def.links ],
  //     nodes: [ ...def.nodes ]
  //   }
  // }

}

// 删除节点或连线
const onDeleteClick = async () => {
  if (!selectedElement || props.readonly) return;

  // 删除连接线
  if (selectedElement.elType == ElType.Link) {
    data.links = data.links.filter((link: Meta.FlowLinkExt) => link.uid != selectedElement.uid);
    // 同步本地对象
    refData.links = refData.links.filter((link: Meta.FlowLinkExt) => link.uid != selectedElement.uid);
  } else {
    if (selectedElement.nodeType && [NodeTypes.Start, NodeTypes.End].includes(selectedElement.nodeType as NodeTypes)) {
      window.$message?.warning(`${NodeNames[selectedElement.nodeType]}不能删除！`)
      return
    }
    // 删除节点
    const index = data.nodes.findIndex((node: Meta.FlowNode) => node.uid == selectedElement.uid);
    if (index != -1) {
      data.nodes.splice(data.nodes.findIndex((node: Meta.FlowNode) => node.uid == selectedElement.uid), 1);
      data.links = data.links.filter((link: Meta.FlowLinkExt) => link.sourceId != selectedElement.uid && link.targetId != selectedElement.uid);
      // 同步本地对象
      refData.nodes.splice(refData.nodes.findIndex((node: Meta.FlowNode) => node.uid == selectedElement.uid), 1);
      refData.links = refData.links.filter((link: Meta.FlowLinkExt) => link.sourceId != selectedElement.uid && link.targetId != selectedElement.uid);
    }
  }
  drawFlow();
  await updateFlow();
}

// 添加节点和连线
const addNode = async (nodeType: string) => {
  resetSelected()
  showMenu.value = false;
  // 修改节点数据：添加节点和节点的连接线；节点位置：横向或纵向间隔100排布，如果有节点占位则插入最右边或最下边
  // 有占位判断：正向100像素正位置开始，区域内是否有节点坐标
  // (例如bottom: tY < sY + addNodeRepel +  且 tY > sY - addNodeRepel - nodeHeight 所有节点X最大值+addNodeSpace为起点 )，
  // 添加节点
  pushNode(nodeType);
  drawFlow();    // todo: 需要重构代码通过update来更新而不是重绘
  await updateFlow();
}

// 添加节点和连线push操作
const pushNode = (nodeType: string) => {
  if (!dragSource.nodeId || !dragSource.position) return;
  // 互斥距离：点击添加时(试图添加矩形范围重叠在源矩形10像素范围内)自动偏移；
  // top: 向上半高、向左半宽；bottom：向下半高、向左半宽；left：向左全宽；right：无；
  const targetCoord = { x: Math.round(popPostion.value.left), y: Math.round(popPostion.value.top - svgTopOffset - nodeHeight[nodeModeIndex] / 2) }
  const targetId = Uid.NextNumber();
  const targetPos = mapPosition[dragSource.position];
  data.nodes.push({ uid: targetId, name: NodeNames[nodeType], type: nodeType as NodeTypes, x: targetCoord.x, y: targetCoord.y, hasLink: true });
  const id = Uid.NextNumber();
  data.links.push({ uid: id, sourceId: dragSource.nodeId, sourcePos: dragSource.position, targetId: targetId, targetPos: targetPos, name: '' });

  // 同步本地对象,初始化扩展属性
  refData.nodes.push({
    uid: targetId,
    name: NodeNames[nodeType],
    type: nodeType as NodeTypes,
    x: targetCoord.x,
    y: targetCoord.y,
    hasLink: true,
    // 扩展属性
    approveType: ApproveType.OrSign,
    candidates: [],
    orderSignEnd: '1',
    carbonCopy: [],
    fieldPerm: [],
    nodeOpt: {
      sendBack: false,
      addSign: false,
      transfer: false,
      cancel: false,
      reject: false,
    },
    opinion: undefined,
    sign: undefined
  });
  refData.links.push({
    uid: id, sourceId:
      dragSource.nodeId,
    sourcePos: dragSource.position,
    targetId: targetId,
    targetPos: targetPos,
    name: '',
    // 扩展属性
    canditions: []
  });
}

// 添加连接线, 正式：normal；临时：temp
const pushLink = async (type: string, sourceId: number, sourcePos: string, targetId: number, targetPos: string) => {
  let id = tempLinkId
  // type == 'normal' && (id = sourceId + sourcePos + targetId + targetPos)
  type == 'normal' && (id = Uid.NextNumber());
  if (!data.links.some((link: Meta.FlowLinkExt) => link.uid == id)) {
    data.links.push({ uid: id, sourceId, sourcePos, targetId, targetPos, name: '' })
  }

}

// 无参数：临时；有参数删除指定；
const removeLink = (uid?: number) => {
  let id = tempLinkId
  uid && (id = uid)
  data.links = data.links.filter((d: any) => d.uid != id)
}

// 修改temp为正式id
const transTempLinkId = () => {
  let tempLink = data.links.find((link: Meta.FlowLinkExt) => link.uid == tempLinkId);
  if (!tempLink) return;
  let uid = null;
  // uid = tempNode.sourceId + tempNode.sourcePos + tempNode.targetId + tempNode.targetPos;
  uid = Uid.NextNumber();
  // 不允许重复连接
  let sameIdNodeIndex = data.links.findIndex((link: Meta.FlowLinkExt) => link.uid != tempLinkId && link.sourceId == tempLink.sourceId && link.targetId == tempLink.targetId);
  // 不允许重复连接
  if (sameIdNodeIndex != -1) {
    // 存在重复连线，不添加新连线，修改旧连线，删除tempLink
    data.links[sameIdNodeIndex].sourcePos = tempLink.sourcePos;
    data.links[sameIdNodeIndex].targetPos = tempLink.targetPos;
    const tempLinkIndex = data.links.findIndex((link: Meta.FlowLinkExt) => link.uid == tempLinkId);
    data.links.splice(tempLinkIndex, 1);

    // 同步本地对象；修改属性
    const currLinkIndex = refData.links.findIndex((link: Meta.FlowLinkExt) => link.sourceId == tempLink.sourceId && link.targetId == tempLink.targetId);
    refData.links[currLinkIndex].sourcePos = tempLink.sourcePos;
    refData.links[currLinkIndex].targetPos = tempLink.targetPos;
  } else {
    // 不存在重复连线，临时线转正
    tempLink.uid = uid; // 先修改再删除，否则数组对象引用会错误

    // 同步本地对象；插入
    refData.links.push({
      ...tempLink,
      canditions: []
    })
  }


}

// 流程图整体移出可视区域时取消移动
const updateFlowRect = () => {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  // 坐标值小于0所有节点坐标都反向偏移相同量；图形超出画布左边和下边自动增加画布最小尺寸；
  data.nodes?.forEach((node: Meta.FlowNode, index: number) => {
    if (index == 0) {
      minX = node.x;
      minY = node.y;
      maxX = node.x + nodeWidth;
      maxY = node.y + nodeHeight[nodeModeIndex];
    }
    node.x < minX && (minX = node.x);
    node.y < minY && (minY = node.y);
    maxX < node.x && (maxX = node.x + nodeWidth);
    maxY < node.y && (maxY = node.y + nodeHeight[nodeModeIndex]);
  })
  flowMoveRect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

}

// const pushNode = (nodeType: string) => {
//   if (!dragSource.nodeId || !dragSource.position) return;
//   // 互斥距离：点击添加时(试图添加矩形范围重叠在源矩形10像素范围内)自动偏移；
//   // top: 向上半高、向左半宽；bottom：向下半高、向左半宽；left：向左全宽；right：无；
//   const targetCoord = { x: Math.round(popPostion.value.left), y: Math.round(popPostion.value.top - svgTopOffset - nodeHeight[nodeModeIndex] / 2) }
//   const targetId = Uid.NextNumber();
//   const targetPos = mapPosition[dragSource.position];
//   data.nodes.push({ uid: targetId, name: NodeNames[nodeType], type: nodeType as NodeTypes, x: targetCoord.x, y: targetCoord.y, hasLink: true });
//   // const id = dragSource.nodeId + dragSource.position + targetId + targetPos;
//   const id = Uid.NextNumber();
//   data.links.push({ uid: id, sourceId: dragSource.nodeId, sourcePos: dragSource.position, targetId: targetId, targetPos: targetPos, name: '测试' });
//   drawFlow(svg);
//   // updateFlowRect();
//   // drawFlowRect(svg);

// }

// 生成连接线标签坐标

const createLinkTitleCoord = (points: Array<any> | undefined, titleWidth: number) => {
  if (!points) return undefined;
  // 标签放置在第二节线段上,左右或上下居中位置;
  // 计算点数分情况处理，
  // 3,5个点: 取中间点两边的线段长度比较，中间点在较长的线段上；
  // 2,4,6个点：取中间两个点的中间坐标
  let midCoord = [] as any;
  const length = points?.length;
  if (length % 2 === 0) {
    const start = points[length / 2 - 1];
    const end = points[length / 2];
    midCoord = [Math.round((start[0] + end[0]) / 2), Math.round((start[1] + end[1]) / 2)]
  } else {
    const midIndex = (length - 1) / 2;
    // 判断前后两条线哪个长，H: 中间点X坐标移动到中点；V: 中间点Y坐标移动到中点
    midCoord = points[midIndex];
    const preCoord = points[midIndex - 1];
    const afterCoord = points[midIndex + 1];
    let preIsH = (midCoord[0] == preCoord[0] ? false : true);
    let preIsLonger = null;
    if (preIsH) {
      preIsLonger = Math.abs(midCoord[0] - preCoord[0]) > Math.abs(midCoord[1] - afterCoord[1])
    } else {
      preIsLonger = Math.abs(midCoord[1] - preCoord[1]) > Math.abs(midCoord[0] - afterCoord[0])
    }
    if (preIsLonger) {
      if (preIsH) {
        midCoord[0] = Math.round((midCoord[0] + preCoord[0]) / 2)
      } else {
        midCoord[1] = Math.round((midCoord[1] + preCoord[1]) / 2)
      }
    } else {
      if (!preIsH) {
        midCoord[0] = Math.round((midCoord[0] + afterCoord[0]) / 2)
      } else {
        midCoord[1] = Math.round((midCoord[1] + afterCoord[1]) / 2)
      }
    }
  }
  return { x: Math.round(midCoord[0] - titleWidth / 2), y: midCoord[1] + 4 };
}

// 生成连接点数据
const updateLinkData = (data: any) => {
  const nodesById = {} as any;
  // 创建一个以id为键的nodes映射，以便快速查找
  data.nodes?.forEach((node: Meta.FlowNode) => {
    node.hasLink = false;
    nodesById[node.uid] = node;
  });
  // 遍历links数组，为每个链接添加源节点和目标节点的x, y坐标
  data.links?.forEach((link: Meta.FlowLinkExt) => {
    let sourceNode = nodesById[link.sourceId];
    let targetNode = nodesById[link.targetId];
    if (sourceNode && targetNode) {
      sourceNode.hasLink = true;
      targetNode.hasLink = true;
      link.sX = sourceNode.x;
      link.sY = sourceNode.y;
      link.tX = targetNode.x;
      link.tY = targetNode.y;
      link.titleWidth = link.name ? getTextWidth(link.name) : 0
      link.coord = transLinkCoord(link)
      link.pathD = createLinePathD(link.coord)
      link.points = [] as any;
      link.polygonPoints = createPolygonByPath(link.pathD, link.points)
      link.arrowPoints = createArrowPoints(link.coord.tX, link.coord.tY, link.coord.tPos);
      link.titlePos = createLinkTitleCoord(link.points, link.titleWidth)
    }
  });
  // return linkData;
}

/**
 * d属性值中的指令可以是以下几种：
 * M: 移动到指定的坐标位置
 * L: 画直线到指定的坐标位置
 * H: 画水平线
 * V: 画垂直线
 * Z: 关闭路径
 * C: 三次贝塞尔曲线
 * S: 平滑三次贝塞尔曲线
 * Q: 二次贝塞尔曲线
 * T: 平滑二次贝塞尔曲线
 * A: 圆弧线
 */
const transLinkCoord = (link: Meta.FlowLinkExt) => {
  let sX = link.sX ? link.sX : 0;
  let sY = link.sY ? link.sY : 0;
  let tX = link.tX ? link.tX : 0;
  let tY = link.tY ? link.tY : 0;
  switch (link.sourcePos) {
    case 'top':
      sX += nodeWidth / 2;
      // sY = link.sY;
      break;
    case 'bottom':
      sX += nodeWidth / 2;
      sY += nodeHeight[nodeModeIndex];
      break;
    case 'left':
      // sX = link.sX;
      sY += nodeHeight[nodeModeIndex] / 2;
      break;
    case 'right':
      sX += nodeWidth;
      sY += nodeHeight[nodeModeIndex] / 2;
      break;
  }
  switch (link.targetPos) {
    case 'top':
      tX += nodeWidth / 2;
      // tY = link.tY;
      break;
    case 'bottom':
      tX += nodeWidth / 2;
      tY += nodeHeight[nodeModeIndex];
      break;
    case 'left':
      // tX = link.tX;
      tY += nodeHeight[nodeModeIndex] / 2;
      break;
    case 'right':
      tX += nodeWidth;
      tY += nodeHeight[nodeModeIndex] / 2;
      break;
  }
  const sPos = link.sourcePos
  const tPos = link.targetPos
  return { sX, sY, tX, tY, sPos, tPos };
}

// 创建连接线path数据；暂时保留不要删除!!!!
const createLinePathD = (linkCoord: any) => {
  const { sX, sY, tX, tY, sPos, tPos } = linkCoord
  let pathD = '';
  let pW = tX - sX;
  let pH = tY - sY;

  switch (sPos) {
    case 'top':
      if (tPos == 'top') {
        if (tY < sY) {
          pathD = `V${sY + pH - headerLength}`
        } else {
          pathD += `V${sY - headerLength} `
          if (pW < 0 && pW > -nodeWidth / 2 - minMargin * 2) {
            pathD += `H${sX - nodeWidth / 2 - minMargin} V${sY + pH / 2 + headerLength}`
          } else if (pW >= 0 && pW < nodeWidth / 2 + minMargin * 2) {
            pathD += `H${sX + nodeWidth / 2 + minMargin} V${sY + pH / 2 + headerLength}`
          }
        }
        pathD = pathD + ` H${tX} V${tY}`
      } else if (tPos == 'bottom') {
        if (tY < sY + nodeHeight[nodeModeIndex]) {
          if (pH > - headerLength * 2) {
            if (Math.abs(pW) < nodeWidth + minMargin * 2) {
              const offset = pW > 0 ? minMargin : -minMargin
              pathD += `V${sY - nodeHeight[nodeModeIndex] - minMargin + pH} H${tX + pW / 2 + offset} V${tY + headerLength}`
            } else {
              pathD += `V${sY - headerLength} H${sX + pW / 2} V${tY + headerLength}`
            }
          } else {
            pathD += `V${sY - headerLength}`
          }
          pathD += `H${tX} V${tY}`
        } else {
          pathD += `V${sY - headerLength} `
          let hOffset = 0;
          if (pW < 0 && pW > -nodeWidth - minMargin * 2) {
            hOffset = pW - nodeWidth / 2 - minMargin
          } else if (pW >= 0 && pW < nodeWidth + minMargin * 2) {
            hOffset = pW + nodeWidth / 2 + minMargin
          } else {
            hOffset = pW > 0 ? nodeWidth / 2 + minMargin : - nodeWidth / 2 - minMargin
          }
          pathD += `H${sX + hOffset} V${tY + headerLength} H${tX} V${tY}`
        }

      } else if (tPos == 'right') {
        if (tY < sY - headerLength) {   // todo: 节点距离太近遮挡情况暂时不处理
          if (pW > 0) {
            pathD = `V${sY - headerLength + pH / 2 + nodeHeight[nodeModeIndex] / 2} H${tX + headerLength}`
          } else {
            pathD = ''
          }
        } else {
          pathD = `V${sY - headerLength} H${tX + headerLength}`
        }
        pathD += `V${tY} H${tX}`
      } else {    // left  todo: 节点距离太近遮挡情况暂时不处理
        if (tY < sY - headerLength) {
          if (pW > 0) {
            pathD = ''
          } else {
            pathD = `V${sY - headerLength + pH / 2 + nodeHeight[nodeModeIndex] / 2} H${tX - headerLength}`
          }
        } else {
          pathD = `V${sY - headerLength} H${tX - headerLength}`
        }
        pathD += `V${tY} H${tX}`
      }
      break;
    case 'bottom':
      if (tPos == 'top') {
        if (sY < tY) {
          pathD = `V${sY + pH / 2} H${sX + pW} V${tY}`
        } else {
          pathD = `V${sY + headerLength} H${sX + pW / 2} V${sY - 20 + pH} H${sX + pW}  V${tY}`
        }
      } else if (tPos == 'bottom') {
        if (sY < tY) {
          if (pW < 0 && pW > -nodeWidth / 2 - headerLength) {    // 下节点向右过中线不超节点宽度
            pathD = `V${sY + (pH - nodeHeight[nodeModeIndex]) / 2} H${sX + pW + nodeWidth / 2 + headerLength} V${sY + pH + headerLength} H${tX} V${tY}`
          } else if (pW >= 0 && pW < nodeWidth / 2 + headerLength) {   // 下节点向左过中线不超节点宽度
            pathD = `V${sY + (pH - nodeHeight[nodeModeIndex]) / 2} H${sX + pW - nodeWidth / 2 - headerLength} V${sY + pH + headerLength} H${tX} V${tY}`
          } else {
            pathD = `V${sY + pH + headerLength} H${sX + pW} V${tY}`
          }
        } else {
          pathD = `V${sY + headerLength} H${sX + pW} V${tY}`
        }
      } else if (tPos == 'right') {
        if (tY < sY + headerLength) {   // todo: 节点距离太近遮挡情况暂时不处理
          if (pW > 0) {
            pathD = `V${sY + headerLength} H${tX + headerLength}`
          } else {
            pathD = `V${sY + headerLength} H${tX - pW / 2}`
          }
        } else {
          if (pW > 0) {
            pathD = `V${sY + headerLength} H${tX + headerLength}`
          } else {
            pathD = ''
          }
        }
        pathD += `V${tY} H${tX}`
      } else {    // left  todo: 节点距离太近遮挡情况暂时不处理
        if (tY < sY + headerLength) {   // todo: 节点距离太近遮挡情况暂时不处理
          if (pW > 0) {
            pathD = `V${sY + headerLength} H${tX - headerLength}`
          } else {
            pathD = `V${sY + headerLength} H${tX - headerLength}`
          }
        } else {
          if (pW < 0) {
            pathD = `V${sY + headerLength} H${tX - headerLength}`
          } else {
            pathD = ''
          }
        }
        pathD += `V${tY} H${tX}`
      }
      break;
    case 'left':
      if (tPos == 'top') {
        if (pW > 0) {
          if (tY > sY) {
            pathD = `H${sX - headerLength} V${sY + pH / 2}`
          } else {
            pathD = `H${sX - headerLength} V${tY - headerLength}`
          }
        } else {
          if (tY > sY) {
            pathD = ''
          } else {
            pathD = `H${sX + (pW + nodeWidth / 2) / 2} V${tY - headerLength}`
          }
        }
        pathD += `H${tX} V${tY}`
      } else if (tPos == 'bottom') {
        if (pW > 0) {
          if (tY > sY) {
            pathD = `H${sX - headerLength} V${tY + headerLength}`
          } else {
            pathD = `H${sX - headerLength} V${sY + pH / 2}`
          }
        } else {
          if (tY > sY) {
            const offset = (pW + nodeWidth / 2) / 2 > -headerLength ? -headerLength : (pW + nodeWidth / 2) / 2
            pathD = `H${sX + offset} V${tY + headerLength}`
          } else {
            pathD = ''
          }
        }
        pathD += `H${tX} V${tY}`
      } else if (tPos == 'right') {
        if (pW > 0) {
          if (tY > sY) {
            pathD = `H${sX - headerLength} V${sY + pH / 2} H${tX + headerLength}`
          } else {
            pathD = `H${sX - headerLength} V${tY - nodeHeight[nodeModeIndex] / 2 - minMargin} H${tX + headerLength}`
          }
        } else {
          pathD = `H${sX + pW / 2}`
        }
        pathD += ` V${tY} H${tX}`
      } else {    // left  todo: 节点距离太近遮挡情况暂时不处理
        if (pW > 0) {
          pathD = `H${sX - headerLength}`
        } else {
          pathD = `H${tX - headerLength}`
        }
        pathD += ` V${tY} H${tX} V${tY}`
      }
      break;
    case 'right':
      if (tPos == 'top') {
        if (pW < 0) {
          if (tY > sY) {
            pathD = `H${sX + headerLength} V${sY + pH / 2}`
          } else {
            pathD = `H${sX + headerLength} V${tY - headerLength}`
          }
        } else {
          if (tY > sY) {
            pathD = ''
          } else {
            pathD = `H${sX + pW / 2} V${tY - headerLength}`
          }
        }
        pathD += `H${tX} V${tY}`
      } else if (tPos == 'bottom') {
        if (pW < 0) {
          if (tY > sY) {
            pathD = `H${sX + headerLength} V${tY + headerLength}`
          } else {
            pathD = `H${sX + headerLength} V${sY + pH / 2}`
          }
        } else {
          if (tY > sY) {
            const offset = pW / 2 > -headerLength ? headerLength : pW / 2
            pathD = `H${sX + offset} V${tY + headerLength}`
          } else {
            pathD = ''
          }
        }
        pathD += `H${tX} V${tY}`
      } else if (tPos == 'right') {
        if (pW < 0) {
          pathD = `H${sX + headerLength}`
        } else {
          pathD = `H${tX + headerLength}`
        }
        pathD += ` V${tY} H${tX} V${tY}`
      } else {    // left  todo: 节点距离太近遮挡情况暂时不处理
        if (pW < 0) {
          if (tY > sY) {
            pathD = `H${sX + headerLength} V${sY + pH / 2} H${tX - headerLength}`
          } else {
            pathD = `H${sX + headerLength} V${tY - nodeHeight[nodeModeIndex] / 2 - minMargin} H${tX - headerLength}`
          }
        } else {
          pathD = `H${sX + pW / 2}`
        }
        pathD += ` V${tY} H${tX}`
      }
      break;
  }
  pathD = `M${sX},${sY} ${pathD}`
  return pathD;
}

const transPathDToList = (pathD: string) => {
  return Array.from(pathD.matchAll(/([MVH])([^MVH]*?(?=[MVH]|$))/g), match => match[0].trimEnd())
}

// 依据连接线path d属性生成polygon points属性,作为连接线选区
const createPolygonByPath = (pathD: string, refPoints?: Array<any>) => {
  // 先转换成坐标点集合
  // const dList = Array.from(pathD.matchAll(/([MVH])([^MVH]*?(?=[MVH]|$))/g), match => match[0].trimEnd());
  const dList = transPathDToList(pathD)
  // 遍历节点,依据上一个节点完成当前节点坐标
  let zl = 0;   // zone边框偏移量
  let points = [] as any;
  let pointsL = [] as any;
  let pointsR = [] as any;
  let currentX: number = 0;
  let currentY: number = 0;
  let startCoord = dList[0].slice(1)
  // 遍历每个命令
  dList?.forEach((cmd: string, i: number) => {
    // 沿着路径方向,从路径正向左侧开始,右侧结束;
    switch (cmd[0]) {
      case 'M': // 移动到
        [currentX, currentY] = startCoord.split(",").map(Number)
        points.push([currentX, currentY]);
        if (dList[i + 1].startsWith("V")) {
          if (parseInt(dList[i + 1].slice(1)) < currentY) {
            pointsL.push([currentX - zl, currentY])    // 垂直 向上 pointsL 在左侧, pointsR 在右侧
            pointsR.push([currentX + zl, currentY])
          } else {
            pointsL.push([currentX + zl, currentY])   //  垂直 向下  pointsR 在左侧 pointsL 在右侧,
            pointsR.push([currentX - zl, currentY])
          }
        } else {      // "H"
          if (parseInt(dList[i + 1].slice(1)) < currentX) { // 向左
            pointsL.push([currentX, currentY + zl])   // -上移 +下移 水平 向左 pointsL 在下, pointsR 在上
            pointsR.push([currentX, currentY - zl])
          } else {                                          // 向右
            pointsL.push([currentX, currentY - zl])   // 水平 向右 pointsL 在上, pointsR 在下
            pointsR.push([currentX, currentY + zl])
          }
        }
        break;
      case 'V': // 垂直移动到
        const dV = cmd.slice(1)
        currentY = parseInt(dV);
        points.push([currentX, currentY]);
        if (dList?.length == i + 1) {
          pointsL.push([pointsL.at(-1)[0], currentY])
          pointsR.push([pointsR.at(-1)[0], currentY])
        } else {
          let preY = (i == 1 ? points.at(-2)[1] : points.at(-3)[1]);
          if (preY < currentY) {   // 垂直 向下 pointsL 在左侧, pointsR 在右侧
            if (parseInt(dList[i + 1].slice(1)) < currentX) {   // 向下 向左
              pointsL.push([pointsL.at(-1)[0], currentY + zl])
              pointsR.push([pointsR.at(-1)[0], currentY - zl])
            } else if (parseInt(dList[i + 1].slice(1)) > currentX) { // 向下 向右
              pointsL.push([pointsL.at(-1)[0], currentY - zl])
              pointsR.push([pointsR.at(-1)[0], currentY + zl])
            } else {
              pointsL.push([pointsL.at(-1)[0], currentY])
              pointsR.push([pointsR.at(-1)[0], currentY])
            }
          } else if (preY > currentY) {                                            //  垂直 向下  pointsL 在右侧, pointsR 在左侧
            if (parseInt(dList[i + 1].slice(1)) < currentX) {   // 向上 向左 -向上移 +向下移
              pointsL.push([pointsL.at(-1)[0], currentY + zl])
              pointsR.push([pointsR.at(-1)[0], currentY - zl])
            } else if (parseInt(dList[i + 1].slice(1)) > currentX) {  // 向上 向右
              pointsL.push([pointsL.at(-1)[0], currentY - zl])
              pointsR.push([pointsR.at(-1)[0], currentY + zl])
            } else {
              pointsL.push([pointsL.at(-1)[0], currentY])
              pointsR.push([pointsR.at(-1)[0], currentY])
            }
          }
        }
        break;
      case 'H': // 水平移动到
        currentX = parseInt(cmd.slice(1));
        points.push([currentX, currentY]);
        if (dList?.length == i + 1) {
          pointsL.push([currentX, pointsL.at(-1)[1]])
          pointsR.push([currentX, pointsR.at(-1)[1]])
        } else {
          let preX = (i == 1 ? points.at(-2)[0] : points.at(-3)[0]);
          if (preX > currentX) {   // 水平 向左 pointsL 在下, pointsR 在上
            if (parseInt(dList[i + 1].slice(1)) > currentY) { // 向左 向下
              pointsL.push([currentX + zl, pointsL.at(-1)[1]])    // x -左移 +右移
              pointsR.push([currentX - zl, pointsR.at(-1)[1]])
            } else if (parseInt(dList[i + 1].slice(1)) < currentY) {  // 向左 向上
              pointsL.push([currentX - zl, pointsL.at(-1)[1]])
              pointsR.push([currentX + zl, pointsR.at(-1)[1]])
            } else {
              pointsL.push([currentX, pointsL.at(-1)[1]])
              pointsR.push([currentX, pointsR.at(-1)[1]])
            }

          } else if (preX < currentX) {                                              // 水平 向右 pointsL 在上, pointsR 在下
            if (parseInt(dList[i + 1].slice(1)) > currentY) { //  向右 向下
              pointsL.push([currentX + zl, pointsL.at(-1)[1]])
              pointsR.push([currentX - zl, pointsR.at(-1)[1]])
            } else if (parseInt(dList[i + 1].slice(1)) < currentY) {  //  向右 向上
              pointsL.push([currentX - zl, pointsL.at(-1)[1]])
              pointsR.push([currentX + zl, pointsR.at(-1)[1]])
            } else {
              pointsL.push([currentX, pointsL.at(-1)[1]])
              pointsR.push([currentX, pointsR.at(-1)[1]])
            }
          }
          break;
        };
    }
  })
  let revRb = pointsR.reverse()
  let result = [...pointsL, ...revRb].join(" ");
  refPoints?.push(...points);
  return result
}

// 重置节点选中状态
const resetSelected = () => {
  if (props.readonly) return;
  // selectedElement = null as any;
  updateSelected(null);
  svg.selectAll("rect.node-rect").style('stroke', defBorderColor).classed('selected', false);
  svg.selectAll(".drag-link").style("display", "none");
  svg.selectAll(".drag-arrow").style("display", "none");
  svg.selectAll(".link-line-zone").classed("selected", false).attr("stroke", lineColor);
  svg.selectAll(".link-arrow").classed("selected", false).attr("stroke", lineColor).attr('fill', lineColor);
  closePopMenu();
  setLinkState(svg, 'hidden');
}

// 设置连接点的显示状态：选中、悬停、隐藏
const setLinkState = (node: any, state: string) => {
  if (state == 'selected') {
    node.selectAll(".link-circle").attr("r", 6).attr("fill", "white").style('opacity', 0.4);
    node.selectAll(".link-circle-bg").style('opacity', 1);
    node.selectAll(".link-icon").style('opacity', 1);
  } else if (state == 'hover') {
    node.selectAll(".link-circle").attr("r", 4).attr("fill", "white").style('opacity', 1);
  } else if (state == 'hidden') {
    node.selectAll(".link-circle").attr("r", 4).attr("fill", "white").style('opacity', 0);
    node.selectAll(".link-circle-bg").style('opacity', 0);
    node.selectAll(".link-icon").style('opacity', 0);
  }
}

// 移动流程图
const onFlowMoveClick = (flowMove: boolean) => {
  flowMove = !flowMove;
  if (flowMove) {
    svg.select(".flow-rect").style('display', null)
    svg.select(".flow-move").style('display', null)
  } else {
    svg.select(".flow-rect").style('display', "none")
    svg.select(".flow-move").style('display', "none")
  }
}

// 显示添加节点浮动菜单
const showPopMenu = (top: number, left: number) => {
  if (props.readonly) return;
  popPostion.value = { top: top, left: left };
  showMenu.value = true;
}

// 关闭添加节点浮动菜单
const closePopMenu = () => {
  showMenu.value = false;
  // popMenu.style("display", "none")
}

const reSetSvg = () => {
  d3.select(flowSvg.value).selectAll("svg").remove();
}

const initSvg = () => {
  if (props.readonly) {
    flowMove.value = true;
  } else {
    flowMove.value = false;
  }
  currSelectFlowEl && (currSelectFlowEl.value = null);
  // console.log(props.readonly)
  // 创建SVG容器
  svg = d3.select(flowSvg.value)
    .append("svg")
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .on("click", function (e: any) {
      // closest: dom 向上遍历 'rect'，null说明非子元素是rect本身，但是点击circle不能取消选中
      // if (e.target.closest('rect') == null) {
      if (e.target.tagName == 'svg') {
        resetSelected()
      }
    })

  // 删除键盘事件监听；todo: 后续再完善合理的解决方案；
  // svg元素无法获取焦点，不能准确判定当前keydown事件触发时焦点位置，暂时不支持按键删除；
  // d3.select('body').on('keydown', function (e: any) {
  //   if (e.key === 'Delete' || e.keyCode === 46) {
  //     onDeleteClick();
  //   }
  // })
}

const updateSvgSize = (newWidth: number, newHeight: number) => {
  svgWidth = newWidth;
  svgHeight = newHeight;
  if (svg) {
    svg.attr('width', newWidth).attr('height', newHeight);
    drawFlow();
  }
}

// 生成箭头Point属性
const createArrowPoints = (tX: number, tY: number, tPos: string) => {
  let p = null;
  if (tPos == 'top') {
    p = `${tX},${tY} ${tX - arrowWidth / 2},${tY - arrowHeight} ${tX + arrowWidth / 2},${tY - arrowHeight}`;
  } else if (tPos == 'bottom') {
    p = `${tX},${tY} ${tX - arrowWidth / 2},${tY + arrowHeight} ${tX + arrowWidth / 2},${tY + arrowHeight}`;
  } else if (tPos == 'left') {
    p = `${tX},${tY} ${tX - arrowWidth},${tY - arrowHeight / 2} ${tX - arrowWidth},${tY + arrowHeight / 2}`;
  } else if (tPos == 'right') {
    p = `${tX},${tY} ${tX + arrowWidth},${tY - arrowHeight / 2} ${tX + arrowWidth},${tY + arrowHeight / 2}`;
  }
  return p;
}

const drawFlowRect = (svg: any) => {
  let start = { x: 0, y: 0 }
  let offset = { x: 0, y: 0 }
  // 移动流程图用的rect拖拽事件
  const flowDrag = () => d3.drag()
    .on('start', function (e: any) {
      start = { x: e.x, y: e.y }
    })
    .on('drag', function (e: any) {
      d3.select(this).style("cursor", "move")
      offset.x = e.x - start.x;
      offset.y = e.y - start.y;
      svg.selectAll('.node') // 假设你的节点类名为.node
        .attr('transform', function (node: Meta.FlowNode) {
          return `translate(${node.x + offset.x}, ${node.y + offset.y})`;
        });
      svg.selectAll('.link-group') // 假设你的节点类名为.node
        .attr('transform', function (this: SVGElement) {
          return `translate(${offset.x}, ${offset.y})`;
        });
    })
    .on('end', function (e: any) {
      svg.selectAll('.link-group') // 假设你的节点类名为.node
        .attr('transform', 'translate(0,0)')

      // 移动所有节点坐标并重新绘制
      data.nodes?.forEach((node: Meta.FlowNode) => {
        node.x = node.x + offset.x;
        node.y = node.y + offset.y;
      })
      offset = { x: 0, y: 0 };
      updateFlowRect();

      // 不允许整个移出svg边界；todo: 实现有问题修改再使用；
      // if (flowMoveRect.x + offset.x > -flowMoveRect.width &&
      //   flowMoveRect.y + offset.y > -flowMoveRect.height &&
      //   flowMoveRect.x + offset.x < svgWidth &&
      //   flowMoveRect.y + offset.y < svgHeight
      // ) {
      //   // 移动所有节点坐标并重新绘制
      //   data.nodes?.forEach((node: Meta.FlowNode) => {
      //     node.x = node.x + offset.x;
      //     node.y = node.y + offset.y;
      //   })
      //   offset = { x: 0, y: 0 };
      //   updateFlowRect();
      // }
      drawFlow();    // 更新或复位动作；
    })
  svg.select(".flow-move").remove()
  svg
    .append('rect')
    .attr("class", "flow-move")
    .attr("rx", 4) // 圆角的x半径
    .attr("ry", 4) // 圆角的y半径
    .style('fill', hoverColor)
    // .style('stroke', defBorderColor)
    // .style('filter', 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.1))')
    .attr("x", 0)
    .attr("y", 0)
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .style("cursor", "move")
    .style("fill-opacity", 0.2)
    .style('display', flowMove.value ? null : 'none')
    .call(flowDrag())


}

// 绘制节点之间的连接线
const drawLine = () => {
  updateLinkData(data);
  // 为每条链接创建一个g分组，并添加path和polygon
  svg.selectAll(".link-group")
    .data(data.links, (d: any) => d.uid)
    .join(
      (enter: any) => {
        const g = enter.insert("g", ".node")
          .attr("class", "link-group")

        g.append("polygon")
          .attr("class", "link-line-zone")
          .attr("stroke-linejoin", "bevel")
          .attr("stroke", lineColor)
          .attr("stroke-width", 2)
          .attr('fill', lineColor)
          .style("opacity", 1)
          .attr("points", (d: any) => d.polygonPoints)
          .on("click", function (this: SVGElement, e: any, d: any) {
            if (props.readonly) return;
            resetSelected();
            const pnode = this.parentNode as SVGElement
            d3.select(pnode).selectAll(".link-line-zone").classed("selected", true);
            d3.select(pnode).selectAll(".link-arrow").classed("selected", true);
            d3.select(pnode).selectAll(".link-line-zone").attr("stroke", hoverColor);
            d3.select(pnode).selectAll(".link-arrow").attr("stroke", hoverColor).attr('fill', hoverColor);
            updateSelected({ elType: ElType.Link, uid: d.uid });
          })
          .on("mouseenter", function (this: SVGElement, e: any, d: any) {
            if (props.readonly) return;
            const pnode = this.parentNode as SVGElement
            d3.select(pnode).selectAll(".link-line-zone").attr("stroke", hoverColor);
            d3.select(pnode).selectAll(".link-arrow").attr("stroke", hoverColor).attr('fill', hoverColor);
          })
          .on("mouseout", function (this: SVGElement, e: any, d: any) {
            if (props.readonly) return;
            const pnode = this.parentNode as SVGElement
            const selected = d3.select(pnode).selectAll(".link-line-zone").classed("selected");
            if (!selected) {
              d3.select(pnode).selectAll(".link-line-zone").attr("stroke", lineColor);
              d3.select(pnode).selectAll(".link-arrow").attr("stroke", lineColor).attr('fill', lineColor);
            }
          })

        g.append("polygon")
          .attr('class', 'link-arrow')
          .attr("stroke-width", 2)
          .attr("stroke-linejoin", "round")
          .attr('stroke', lineColor)
          .attr('fill', lineColor)
          .attr('points', (d: any) => d.arrowPoints)
          .on("click", function (this: SVGElement, e: any, d: any) {
            if (props.readonly) return;
            const pnode = this.parentNode as SVGElement
            resetSelected();
            d3.select(pnode).selectAll(".link-line-zone").attr("stroke", hoverColor);
            d3.select(pnode).selectAll(".link-arrow").attr("stroke", hoverColor).attr('fill', hoverColor);
            d3.select(pnode).selectAll(".link-line-zone").classed("selected", true);
            d3.select(pnode).selectAll(".link-arrow").classed("selected", true);
            // selectedElement = { elType: ElType.Link, uid: d.uid };
            updateSelected({ elType: ElType.Link, uid: d.uid })
          })
          .on("mouseenter", function (this: SVGElement, e: any, d: any) {
            if (props.readonly) return;
            const pnode = this.parentNode as SVGElement
            d3.select(pnode).selectAll(".link-line-zone").attr("stroke", hoverColor);
            d3.select(pnode).selectAll(".link-arrow").attr("stroke", hoverColor).attr('fill', hoverColor);
          })
          .on("mouseout", function (this: SVGElement, e: any, d: any) {
            if (props.readonly) return;
            const pnode = this.parentNode as SVGElement
            const selected = d3.select(pnode).selectAll(".link-line-zone").classed("selected");
            if (!selected) {
              d3.select(pnode).selectAll(".link-line-zone").attr("stroke", lineColor);
              d3.select(pnode).selectAll(".link-arrow").attr("stroke", lineColor).attr('fill', lineColor);
            }
          });

        g.append("rect")
          .attr('class', 'link-title-bg')
          .attr("rx", 4) // 圆角的x半径
          .attr("ry", 4) // 圆角的y半径
          .attr('x', (d: any) => d.titlePos.x - 6)
          .attr('y', (d: any) => d.titlePos.y - 14)
          .attr("width", (d: any) => d.name ? d.titleWidth + 14 : 0)
          .attr("height", 20)
          .style('fill', 'white')

        g.append("text")    // 连接线标签文本
          .attr('class', 'link-title')
          .attr('x', (d: any) => d.titlePos.x)
          .attr('y', (d: any) => d.titlePos.y)
          .attr('text-anchor', 'start') // 文本居中
          .style('font-size', '12px')
          .text((d: any) => d.name ? d.name : '');
      },
      (update: any) => {
        update.select(".link-line-zone") // 选择已存在的path元素
          .attr("points", (d: any) => d.polygonPoints)

        // 在这里更新箭头
        update.select(".link-arrow")
          .attr("points", (d: any) => d.arrowPoints);

        update.select(".link-title-bg")
          .attr('x', (d: any) => d.titlePos.x - 6)
          .attr('y', (d: any) => d.titlePos.y - 14)
          .attr("width", (d: any) => d.name ? d.titleWidth + 14 : 0)
          .attr("height", 20)

        update.select(".link-title")
          .text((d: any) => d.name ? d.name : '')
          .attr('x', (d: any) => d.titlePos.x)
          .attr('y', (d: any) => d.titlePos.y)

      },
      (exit: any) => {
        exit.remove()
      }
    );
}

// 绘制临时连接线
const updatePreLine = (sourceId: number, sourcePos: string, targetId: number, targetPos: string) => {
  if (!sourceId && !sourcePos && !targetId && !targetPos) return
  removeLink()
  // 添加临时连接线;
  pushLink('temp', sourceId, sourcePos, targetId, targetPos);
  hasTempLink = true;
  // 更新连接线数据
  drawLine(); // 绘制连接线
}

// 删除临时连接线
const removePreLine = () => {
  removeLink();
  hasTempLink = false;
  drawLine();
}

// 添加连线完成；temp 转为正式id
const transPreLine = async () => {
  transTempLinkId();
  // drawLine();
  drawFlow();
  await updateFlow();
}

/**
 * 绘制流程图
 *
  */
const drawFlow = () => {
  drawLine();

  const nodeDrag = () => {
    return d3.drag()
      .on('start', function (e, d: any) {
        d3.select(this).selectAll('.node-rect').style("cursor", "move")
        // 可以在这里设置拖拽开始时的状态
        d.offset = { x: e.x - d.x, y: e.y - d.y }
      })
      .on('drag', function (e, d: any) {
        // 更新当前点
        d.x = e.x - d.offset.x;
        d.y = e.y - d.offset.y;
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
        // 绘制折线和箭头
        drawLine();
      })
      .on('end', function (e, d: any) {
        d3.select(this).select('.node-rect').style("cursor", "pointer")
        // 可以在这里设置拖拽结束时的状态
        // 同步本地对象；
        refData.nodes.find((node: Meta.FlowNode) => {
          if (node.uid == d.uid) {
            node.x = d.x;
            node.y = d.y;
            return d;
          }
        })
        updateFlow();
      })
      .filter(function (e: any, d: any) {
        // 返回true表示此元素可以响应拖拽事件，返回false则不响应
        return e.target.tagName === "rect";
      })
  }

  // 指定箭头方向
  const mapDirects = (position: string, sx: number, sy: number, ex: number, ey: number) => {
    let arrowDirct = '';
    let pX = ex - sx;
    let pY = ey - sy;
    if (pY > 0 && (position == 'top' || position == 'bottom')) {
      arrowDirct = 'top'
    } else if (pY < 0 && (position == 'top' || position == 'bottom')) {
      arrowDirct = 'bottom'
    } else if (pX > 0 && (position == 'left' || position == 'right')) {
      arrowDirct = 'left'
    } else if (pX < 0 && (position == 'left' || position == 'right')) {
      arrowDirct = 'right'
    }
    return arrowDirct;
  }

  // 绘制拖拽连接线,!!!!修改下[不走回头路],同时解决连线选区拐角部分不正确的问题,以及连线标签不在线上问题;!!!!
  const createDragLineD = (position: string, sx: number, sy: number, ex: number, ey: number) => {
    let pathD = '';
    let pX = ex - sx;
    let pY = ey - sy;
    switch (position) {
      case 'top':
        if (pY > 0) {
          pathD = `V${sy - headerLength}`
        } else {
          pathD = `V${sy + pY / 2}`
        }
        pathD += ` H${ex} V${ey}`
        break;
      case 'bottom':
        if (pY > 0) {
          pathD = `V${sy + pY / 2}`
        } else {
          pathD = `V${sy + headerLength}`
        }
        pathD += ` H${ex} V${ey}`
        break;
      case 'right':
        if (pX > 0) {
          pathD = `H${sx + pX / 2}`
        } else {
          pathD = `H${sx + headerLength}`
        }
        pathD += ` V${ey} H${ex}`
        break;
      case 'left':
        if (pX > 0) {
          pathD = `H${sx - headerLength}`
        } else {
          pathD = `H${sx + pX / 2}`
        }
        pathD += ` V${ey} H${ex}`
        break;
    }

    pathD = `M${sx},${sy} ` + pathD;
    return pathD;
  }

  // 获取拖拽目标节点信息
  const getDragTarget = (sourceNodeId: any, sx: number, sy: number, ex: number, ey: number) => {
    // 遍历节点查找可吸附的节点和位置,排除开始节点；
    let dragTarget = {} as any;    // id、position
    const inPadding = 40;
    const x = ex + sx;
    const y = ey + sy;
    const result = data.nodes.some((node: Meta.FlowNode) => {
      if (node.uid != sourceNodeId && node.type != NodeTypes.Start) {
        // x 区域：x-10 ~ x+W+10 ; y 区域：y-10 ~ y+H+10
        const xOuter = [node.x - 10, node.x + nodeWidth + 10]
        const yOuter = [node.y - 10, node.y + nodeHeight[nodeModeIndex] + 10]
        if (x > xOuter[0] && x < xOuter[1] && y > yOuter[0] && y < yOuter[1]) {
          dragTarget['uid'] = node.uid;
          const xInner = [node.x + inPadding, node.x + nodeWidth - inPadding]
          const yCenter = node.y + nodeHeight[nodeModeIndex] / 2;
          // 确定在可吸附区域后，确定吸附位置：左、右；上、下;
          if (x < xInner[0] && y > node.y && y < node.y + nodeHeight[nodeModeIndex]) {
            // 左边区域
            dragTarget['position'] = 'left';
            return true;
          } else if (x > xInner[1] && y > node.y && y < node.y + nodeHeight[nodeModeIndex]) {
            // 右边区域
            dragTarget['position'] = 'right';
            return true;
          } else if (y < yCenter) {
            dragTarget['position'] = 'top'
            return true;
          } else {
            dragTarget['position'] = 'bottom'
            return true;
          }
        }
      }
      return false;
    })
    return result && dragTarget;
  }

  const circleDrag = () => {
    return d3.drag()
      .on('start', function (e: any, d: any) {
        svg.style("cursor", "grabbing");
        // 更新节点坐标数据
        const node = data.nodes.find((n: any) => n.uid == d.nodeId);
        d.nx = node?.x;
        d.ny = node?.y;
        // 可以在这里设置拖拽开始时的状态
        d.start = { x: d.cx, y: d.cy }
        // 记录源节点信息；
        dragSource.nodeId = d.nodeId;
        dragSource.position = d.position;
      })
      .on('drag', function (e, d: any) {
        // if (Math.abs(e.x - d.start.x) > 3) {
        const parentNode = this.parentNode as Element;
        const pParentNode = parentNode.parentNode as Element
        // 坐标位置在rect周围10像素范围吸附；上下、左右(上下中间)四个区；
        const targetNode = getDragTarget(d.nodeId, d.nx, d.ny, e.x, e.y); // 开始节点不允许进入也画临时线
        if (!targetNode) {  // 未进入吸附区域画临时线；
          d.targetNode = targetNode;  // 移除后end事件中控制菜单显示
          if (hasTempLink) removePreLine();

          d3.select(pParentNode)    // drag事件中不可以用ppNode = d3.select(pParentNode);
            .select(".drag-link")
            .style("display", null)
            .attr("points", createPolygonByPath(createDragLineD(d.position, d.start.x, d.start.y, e.x, e.y)))
          // .attr("d", createDragLineD(d.position, d.start.x, d.start.y, e.x, e.y));

          const pos = mapDirects(d.position, d.start.x, d.start.y, e.x, e.y)
          d3.select(pParentNode).select(".drag-arrow")
            .style("display", null)
            .attr('points', function () {
              return createArrowPoints(e.x, e.y, pos);
            })
        } else {  // 进入目标节点吸附区后停止画临时线；
          d3.select(pParentNode).select(".drag-link").style("display", "none");
          d3.select(pParentNode).select(".drag-arrow").style("display", "none");
          // 绘制临时连接线
          d.targetNode = targetNode;   // 进入后end事件中控制菜单显示
          updatePreLine(d.nodeId, d.position, targetNode.uid, targetNode.position);
        }
        // }
      })
      .on('end', function (e, d: any) {
        const parentNode = this.parentNode as Element;
        const pParentNode = parentNode.parentNode as Element
        const ppNode = d3.select(pParentNode);
        svg.style("cursor", "default");
        // if (Math.abs(e.x - d.start.x) > 3) {
        const selected = ppNode.select(".node-rect").classed("selected");
        // 区分是否为添加节点状态
        if (d.targetNode) {   // 进入吸附区域
          transPreLine()    // 临时连接线转换为正是连接线
          resetSelected()
        } else {    // 未进入吸附区域
          if (selected) {
            showPopMenu(e.y + d.ny + svgTopOffset, e.x + d.nx);
          } else {
            ppNode.select(".drag-link").style("display", "none");
            ppNode.select(".drag-arrow").style("display", "none");
          }
          removePreLine()
        }
        // }

      })
  }

  // 绘制节点添加节点、连线连接点操作按钮
  const drawAddCircle = (flowNodes: any) => {
    if (props.readonly) return;
    // 节点连接点底层circle，填充颜色; // 过滤[NodeTypes.Send, NodeTypes.End]
    flowNodes.filter((d: any) => ![NodeTypes.Send, NodeTypes.End].includes(d.type))
      .append("g").selectAll(".link-circle-bg")
      .data((() => [
        { cx: nodeWidth / 2, cy: 0, position: 'top' }, // 上
        { cx: nodeWidth / 2, cy: nodeHeight[nodeModeIndex], position: 'bottom' }, // 下
        { cx: 0, cy: nodeHeight[nodeModeIndex] / 2, position: 'left' }, // 左
        { cx: nodeWidth, cy: nodeHeight[nodeModeIndex] / 2, position: 'right' } // 右
      ]))
      .enter()
      .append("circle")
      .attr("class", "link-circle-bg")
      .attr("position", (d: any) => d.position)
      .attr("cx", (d: any) => d.cx)
      .attr("cy", (d: any) => d.cy)
      .attr("r", 6)
      .attr("fill", hoverColor)
      .attr("stroke", hoverColor)
      .attr("stroke-width", 1)
      .style("opacity", 0)
    // .style("transition", 'opacity 0.1s ease')

    // 添加连接点中的【+】 todo: 需要再优化代码，屏蔽【+】对鼠标事件的影响
    const lineLength = 4
    // 节点连接点内部加号; // 过滤[NodeTypes.Send, NodeTypes.End]
    flowNodes.filter((d: any) => ![NodeTypes.Send, NodeTypes.End].includes(d.type))
      .append("g").selectAll(".link-icon")
      .data((() => [
        {
          x1: nodeWidth / 2 - lineLength, y1: 0,
          x2: nodeWidth / 2 + lineLength, y2: 0
        }, // 上
        {
          x1: nodeWidth / 2, y1: -lineLength,
          x2: nodeWidth / 2, y2: lineLength
        }, // 上
        {
          x1: nodeWidth / 2 - lineLength, y1: nodeHeight[nodeModeIndex],
          x2: nodeWidth / 2 + lineLength, y2: nodeHeight[nodeModeIndex]
        }, // 下
        {
          x1: nodeWidth / 2, y1: nodeHeight[nodeModeIndex] - lineLength,
          x2: nodeWidth / 2, y2: nodeHeight[nodeModeIndex] + lineLength
        }, // 下
        {
          x1: -lineLength, y1: nodeHeight[nodeModeIndex] / 2,
          x2: lineLength, y2: nodeHeight[nodeModeIndex] / 2
        }, // 左
        {
          x1: 0, y1: nodeHeight[nodeModeIndex] / 2 - lineLength,
          x2: 0, y2: nodeHeight[nodeModeIndex] / 2 + lineLength
        }, // 左
        {
          x1: nodeWidth - lineLength, y1: nodeHeight[nodeModeIndex] / 2,
          x2: nodeWidth + lineLength, y2: nodeHeight[nodeModeIndex] / 2
        }, // 右
        {
          x1: nodeWidth, y1: nodeHeight[nodeModeIndex] / 2 - lineLength,
          x2: nodeWidth, y2: nodeHeight[nodeModeIndex] / 2 + lineLength
        } // 右
      ]))
      .enter()
      .append("line")
      .attr("class", "link-icon")
      .attr("stroke", 'white')
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .attr("x1", (d: any) => d.x1)
      .attr("y1", (d: any) => d.y1)
      .attr("x2", (d: any) => d.x2)
      .attr("y2", (d: any) => d.y2)

    // 节点连接点; // 过滤[NodeTypes.Send, NodeTypes.End]
    flowNodes.filter((d: any) => ![NodeTypes.Send, NodeTypes.End].includes(d.type))
      .append("g").selectAll(".link-circle")
      .data(((d: any) => [
        { nodeId: d.uid, cx: nodeWidth / 2, cy: 0, position: 'top' }, // 上
        { nodeId: d.uid, cx: nodeWidth / 2, cy: nodeHeight[nodeModeIndex], position: 'bottom' }, // 下
        { nodeId: d.uid, cx: 0, cy: nodeHeight[nodeModeIndex] / 2, position: 'left' }, // 左
        { nodeId: d.uid, cx: nodeWidth, cy: nodeHeight[nodeModeIndex] / 2, position: 'right' } // 右
      ]))
      .enter()
      .append("circle")
      .attr("class", "link-circle")
      .attr("position", (d: any) => d.position)
      .attr("cx", (d: any) => d.cx)
      .attr("cy", (d: any) => d.cy)
      .attr("r", 4)
      .attr("fill", "white")
      .attr("stroke", hoverColor)
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .style("transition", 'opacity 0.3s ease')
      .style("cursor", "pointer")
      .call(circleDrag())
      .on("click", function (this: SVGAElement, e: any, d: any) {
        // e.stopPropagation()
        const parentNode = this.parentNode as Element;
        const pParentNode = parentNode.parentNode as Element
        const ppNode = d3.select(pParentNode);
        const selected = ppNode.select(".node-rect").classed("selected")
        if (selected) {
          showPopMenu(e.y, e.x)
        } else {
          resetSelected()
        }
      })
      .on("mouseenter", function (this: SVGAElement, e: any) {
        // const parentNode = this.parentNode as Element;
        d3.select(this).attr("r", 6).attr("fill", defFillColor)
      })
      .on("mouseout", function (this: SVGAElement, e: any, d: any) {
        d3.select(this).attr("r", 6).attr("fill", "white")
      })
  }

  // ================绘制流程图核心块========================================
  // 绘制节点，可拖拽、添加标题、操作按钮/菜单
  svg.selectAll(".node")
    .data(data.nodes, (d: any) => d.uid)
    .join(
      (enter: any) => {
        const flowNodes = enter.append("g")
          .attr("class", "node")
          .attr("nodeId", (d: any) => d.uid)
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`) // 初始位置
          .call(nodeDrag())
          .on("mouseover", function (this: SVGAElement, e: any, d: any) {
            if (props.readonly) return;
            if (e.target.tagName == 'rect' && d.type != NodeTypes.End) {
              // 当鼠标悬停在矩形上时，显示所有圆圈
              if (!d3.select(this).selectAll(".node-rect").classed("selected")) {
                setLinkState(d3.select(this), 'hover')
              }
            }
          })
          .on("mouseout", function (this: SVGAElement, e: any) {
            if (props.readonly) return;
            if (['svg', 'path', 'polygon'].includes(e.relatedTarget.tagName)) {
              // 当鼠标移出矩形时，隐藏所有圆圈
              if (!d3.select(this).selectAll(".node-rect").classed("selected")) {
                setLinkState(d3.select(this), 'hidden')
              }
            }
          });

        // 画临时线
        flowNodes
          .append('polygon')
          .attr("class", "drag-link")
          .attr("stroke-linejoin", "bevel")
          .attr("stroke", lineColor)
          .attr("stroke-width", lineWidth)
          .attr('fill', lineColor)
          .style("display", "none");

        // 画临时线箭头
        flowNodes.append("polygon")
          .attr('class', 'drag-arrow')
          .attr("stroke-width", 2)
          .attr("stroke-linejoin", "round")
          .attr('stroke', lineColor)
          .attr('fill', lineColor)
          .style("display", "none");

        // 流程节点
        flowNodes
          .append('rect')
          .attr("class", "node-rect-bg")
          .attr("rx", (d: any) => [NodeTypes.Start, NodeTypes.End].includes(d.type) ? 20 : 4) // 圆角的x半径
          .attr("ry", (d: any) => [NodeTypes.Start, NodeTypes.End].includes(d.type) ? 20 : 4) // 圆角的y半径
          .style('fill', 'white')
          .style('stroke', defBorderColor)
          .attr('width', nodeWidth)
          .attr('height', nodeHeight[nodeModeIndex])
          .style('filter', 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))')

        // 节点文本
        flowNodes
          .append('text')
          .attr("class", "node-text")
          .attr('x', 34) // 矩形中心x位置
          .attr('y', 25)     // 稍微高于矩形顶部
          .attr('text-anchor', 'start') // 文本居中
          .text((d: any) => d.name);

        // 节点类型图标
        flowNodes.append("path")
          .attr("d", (d: any) => IconsPathD[d.type][1]) // 假设的path数据
          .attr("fill", (d: any) => NodeIconColors[d.type])
          .attr("width", 18)
          .attr("height", 18)
          .attr("transform", (d: any) => `translate(10,11) scale(${IconsPathD[d.type][0]})`)

        // 节点未连接图标
        flowNodes.append("path")
          .attr("class", "link-state")
          .attr("nodeId", (d: any) => d.uid)
          .attr("d", IconsPathD['unlink'][1]) // 假设的path数据
          .attr("fill", 'rgb(251 146 60)')
          // .style('stroke', 'rgb(251 146 60)')
          // .style('stroke-linecap', 'round')
          // .style('stroke-linejoin', 'round')
          // .style('stroke-width', '2')
          .attr("width", 12)
          .attr("height", 12)
          .attr("transform", `translate(134,20) rotate(-45) scale(${IconsPathD['unlink'][0]})`)
          .style("opacity", (d: any) => d.hasLink ? 0 : 1)

        // 流程节点
        flowNodes
          .append('rect')
          .attr("class", "node-rect")
          .attr("rx", (d: any) => [NodeTypes.Start, NodeTypes.End].includes(d.type) ? 20 : 4) // 圆角的x半径
          .attr("ry", (d: any) => [NodeTypes.Start, NodeTypes.End].includes(d.type) ? 20 : 4) // 圆角的y半径
          .style('fill', 'none')
          // .style('stroke', defBorderColor)
          .attr('width', nodeWidth)
          .attr('height', nodeHeight[nodeModeIndex])
          .attr("nodeId", function (this: SVGRectElement, d: any) {
            if (props.readonly && props.flowIns) {
              const currNode = props.flowIns?.activeNodes.find((n: Meta.ActiveNode) => n.uid == d.uid);
              if (currNode) {
                if (currNode.complete) {  // 完成节点
                  d3.select(this).style('stroke', completeColor);
                  d3.select(this).classed("selected", true);
                } else {    // 当前执行节点
                  d3.select(this).style('stroke', hoverColor);
                  d3.select(this).classed("selected", true);
                }
              } else {
                if (d.type == NodeTypes.Start) {  // 开始节点
                  d3.select(this).style('stroke', completeColor);
                  d3.select(this).classed("selected", true);
                }
              }
              // 无论激活节点是否包括结束节点，只要流程标记结束就加亮结束节点；
              if (props.flowIns?.status == FlowStauts.Complete && d.type == NodeTypes.End) {
                d3.select(this).style('stroke', completeColor);
                d3.select(this).classed("selected", true);
              }
            }
            return d.uid
          })
          .style("cursor", "pointer")
          .style("fill-opacity", 0)
          .on("click", function (this: SVGRectElement, e: any, d: any) {
            if (props.readonly) return;
            // 重置所有选中样式
            resetSelected();
            // 设置当前选中样式
            const parentNode = this.parentNode as Element;
            const pnode = d3.select(parentNode);
            // selectedElement = { elType: ElType.Node, uid: d.uid, nodeType: d.type };
            updateSelected({ elType: ElType.Node, uid: d.uid, nodeType: d.type });
            d.type != NodeTypes.End && setLinkState(pnode, 'selected');
            d3.select(this).style('stroke', hoverColor);
            d3.select(this).classed("selected", true);
          })

        // 绘制添加节点、连线操作点
        drawAddCircle(flowNodes);

      },
      (update: any) => {
        update.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        update.select(".link-state").style("opacity", (d: any) => d.hasLink ? 0 : 1);
        update.select(".node-text").text((d: any) => d.name);
      },
      (exit: any) => exit.remove()
    )

  drawFlowRect(svg);
}
// =============================绘制流程图结束==================================

// watch(
//   () => props.readonly,
//   (newValue, oldValue) => {
//     console.log(newValue)
//     nextTick(() => {
//       initSvg()
//       drawFlow();
//     })

//   },
//   { immediate: true, deep: true }
// );

defineExpose({
  reSetSvg,
  initFlowDef,
  initSvg,
  drawFlow,
  updateSvgSize,
  resetSelected,
  onFlowMoveClick,
  onDeleteClick
})

</script>

<style lang="scss" scoped></style>
