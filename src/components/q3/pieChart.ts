import * as d3 from 'd3';
import { createLegend, createTooltip } from './utils/shared';
import { AggNameMap, ColorGroups } from '@/enum/biMeta';

type OutputData = {
  name: string;
  children?: OutputData[];
  value?: number; // 用于指标的汇总值
};

function transformData(
  dataset: any[][],
  metrics: any[]
): OutputData {
  const root: OutputData = { name: "全部", children: [] };

  dataset?.forEach((row) => {
    const regionParts = row[0].split("|"); // 拆分区域层级
    const metricValues = row.slice(1).map(Number); // 提取指标值并转换为数字

    let currentLevel = root.children || (root.children = []);
    let lastRegionNode: OutputData | undefined;

    // 构建区域层级结构
    regionParts?.forEach((part: string, index: number) => {
      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        node = { name: part, children: [] };
        currentLevel.push(node);
      }

      // 如果是最后一层（如城市），保存引用以便后续添加指标
      if (index === regionParts.length - 1) {
        lastRegionNode = node;
      }

      currentLevel = node.children || (node.children = []);
    });

    // 将指标值添加到最后一层节点（如城市）
    if (lastRegionNode) {
      if (metrics?.length <= 1) {
        // 只有一个指标时，直接设置 value
        lastRegionNode.value = (lastRegionNode.value || 0) + metricValues[0];
      } else {
        metrics?.forEach((header, metricIndex) => {
          let metricNode = lastRegionNode!.children?.find((n) => n.name === header.label);
          if (!metricNode) {
            metricNode = { name: header.label, value: 0 };
            lastRegionNode!.children?.push(metricNode);
          }
          metricNode.value = (metricNode.value || 0) + metricValues[metricIndex];
        });
      }
    }
  });

  return root;
}

export function createPieChart(chartContainer: any, options: any, config: Meta.ChartComp) {
  // 清除之前的图表
  d3.select(chartContainer).select('svg').remove();
  if (options.dataset?.length == 0) return;

  let maxDepth = config.dims?.length || 0;
  const dimsLength = config.dims?.length || 0;
  let onlyOneValue = false;
  config.metrics!.length > 1 && (maxDepth = maxDepth + 1);
  let data = transformData(options.dataset, config.metrics!);
  if (data.children?.length == 1 && data.children[0].name == '') {
    if (config.metrics!.length > 1) {
      data = data.children[0];
    } else {
      onlyOneValue = true;
    }
  }
  // const data = transformData(dataset, dataHeader);

  // 图表尺寸
  const width = options.svg.width;
  const height = options.svg.height;
  const marginBottom = 40;
  const minSize = Math.min(width, height);
  const radius = minSize / (2 * maxDepth + 3);
  const fontSize = options.svg.fontSize;

  // 颜色比例尺 - 为每个顶级地区分配颜色
  const regionColors = d3.scaleOrdinal(ColorGroups.Default)
    .domain(data.children!.map(d => d.name));
  const legendData = data.children!.map(d => [d.name]);

  // 计算层次布局
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const partition = d3.partition()
    .size([2 * Math.PI, hierarchy.height + 1]);

  const root = partition(hierarchy as any);
  root.each((d: any) => d.current = d);

  // 圆弧生成器
  const arc = d3.arc()
    .startAngle((d: any) => d.x0)
    .endAngle((d: any) => d.x1)
    .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius((d: any) => d.y0 * radius)
    .innerRadius((d: any) => {
      // 关键修改：判断层级决定是否留白
      return maxDepth === 1 ? 0 : d.y0 * radius * (dimsLength == 0 ? 0.8 : 1);
    })
    .outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1) * (dimsLength == 0 ? 0.6 : 1));

  // 创建 SVG 容器
  const svg = d3.select(chartContainer)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr("viewBox", [-minSize / 2, -minSize / 2, minSize, minSize + marginBottom])
    .style("font", fontSize);
  let tooltip = createTooltip(chartContainer, options.svg.fontSize);
  !onlyOneValue && createLegend(chartContainer, options, svg, legendData, regionColors, tooltip, config);

  // 绘制路径
  const path = svg.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", (d, i) => {
      // 找到当前节点所属的顶级地区
      let node: any = d;
      while (node.depth > 1) node = node.parent!;

      // 根据深度调整颜色亮度
      const baseColor = regionColors(node.data.name);
      const lightness = config.metrics!.length == 1 ? 0 : (d.depth - 1) * 0.4 * (dimsLength == 0 ? i : 1); // 深度越大颜色越浅
      return d3.color(baseColor)?.brighter(lightness).toString() || baseColor;
    })
    .attr("fill-opacity", 1) //(d: any) => arcVisible(d.current) ? (d.children ? 1 : 0) : 0)
    .attr("stroke", "#f5f6f8")
    .attr("stroke-width", 0.5)
    .attr("pointer-events", (d: any) => arcVisible(d.current) ? "auto" : "none")
    // .attr("d", (d: any) => arc(d.current));
    .attr("opacity", 0)
    .transition()
    .delay((d, i) => i * 20) // 每个扇形延迟100ms
    // .duration(20)
    .attr("opacity", 1)
    .attrTween("d", function (d: any) {
      const interpolate = d3.interpolate(
        { startAngle: d.current.startAngle, endAngle: d.current.startAngle },
        d.current
      );
      return (t: number) => arc(interpolate(t)) as any;
    });

  // 格式化数值
  const format = d3.format(",.0f");

  // 路径上的文本标签
  // 修改标签创建部分
  const label = svg.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", (d: any) => d.data.value !== undefined ? "-0.6em" : "0.35em") // 整体垂直偏移调整
    .attr("transform", (d: any) => labelTransform(d.current))
    .style("opacity", 0) // 初始不可见
    .each(function (d: any, i: number) {
      const text = d3.select(this);
      if (!onlyOneValue && !labelVisible(d)) return;
      let onlyOneName = ''
      if (onlyOneValue) {
        onlyOneName = AggNameMap.get(config.metrics![0].aggType as any) as string || '求和'
      }
      // 添加名称行
      text.append("tspan")
        .attr("x", 0)
        .attr("dy", "-0.2em") // 第一行偏移
        .style("opacity", 0.8)
        .style("font-size", onlyOneValue ? '14px' : fontSize)
        .style("font-weight", onlyOneValue ? "bold" : "normal")
        .text(onlyOneValue ? onlyOneName : d.data.name);

      // 如果有值，添加值行
      if (d.data.value !== undefined) {
        text.append("tspan")
          .attr("x", 0)
          .attr("dy", "1.2em") // 第二行相对于第一行的偏移
          .style("opacity", 0.8)
          .style("font-size", onlyOneValue ? '18px' : fontSize)
          .style("font-weight", onlyOneValue ? "bold" : "normal")
          .text(format(d.data.value));
      }
    })
    // 整个文本组的过渡
    .transition()
    .delay((d, i) => i * 20) // 与路径动画协调
    // .duration(20)
    .style("opacity", 1);
  // 判断弧是否可见
  function arcVisible(d: any) {
    return d.depth <= maxDepth && d.y1 > d.y0 && d.x1 > d.x0;
  }

  // 判断标签是否可见
  function labelVisible(d: any) {
    const minAngle = (d.x1 - d.x0) * 180 / Math.PI > 10; // 至少10度
    return d.depth <= maxDepth && minAngle;
  }

  // 标签的变换（位置计算）
  function labelTransform(d: any) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    if (onlyOneValue) {
      return `translate(0,-10)`;
    }
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }


}

