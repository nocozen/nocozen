import * as d3 from 'd3';
import { ColorGroups } from '@/enum/biMeta';
import { getTextWidth } from './utils/text';
import { createTooltip } from './utils/shared';


interface BubbleNode {
  dim: string;
  metricName: string | undefined;
  value: number;
}

export function createBubbleChart(chartContainer: HTMLElement, options: any, config: Meta.ChartComp, isEditable: boolean) {
  // 1. 清除旧图表并设置尺寸
  d3.select(chartContainer).select('svg').remove();
  if (options.dataset?.length == 0) return;

  let tooltip = createTooltip(chartContainer, options.svg.fontSize);
  // 将数据集转换为 BubbleNode 数组
  const data: BubbleNode[] = options.dataset.flatMap((item: any) => {
    const combinations: BubbleNode[] = [];
    const name = item[0];
    // 从第二个元素开始遍历，因为第一个元素是 name
    for (let i = 1; i < item?.length; i++) {
      let metricName = "";
      if (options.dataHeader?.length > 2) {
        const label = config.metrics?.find((m: Meta.ChartMetric) => m.key == options.dataHeader[i])?.label;
        label && (metricName = label + ":");
      }
      combinations.push({
        dim: name.split(options.axis.dimSplit).join(''),
        metricName: metricName,
        value: item[i]
      });
    }

    return combinations;
  });

  // 颜色比例尺（使用 d3.schemeSet3）
  const baseColors = d3.scaleOrdinal<string, number>()
    .domain(d3.range(data.length) as any) // 使用数据索引作为域
    .range(ColorGroups.Default as any);


  const width = options.svg.width;
  const height = options.svg.height;
  const padding = 20;

  // 2. 创建SVG画布
  const svg = d3.select(chartContainer)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height]);
  svg
    .style("opacity", 0)
    .transition()
    .duration(options.chart.duration + 200)
    .style("opacity", 1);

  // 4. 半径比例尺（将值映射到半径范围）
  // const maxRadius = Math.min(width, height) / 10;  // 经验值
  const maxRadius = Math.min(width, height) / (1.3 + Math.log(data.length));
  const radiusScale = d3.scaleLinear<number, number>()
    .domain([d3.min(data, d => d.value)!, d3.max(data, d => d.value)!])
    .range([2, maxRadius]); // 最小半径为 10，最大半径为 100

  // 5. 力学模拟配置
  const simulation = d3.forceSimulation(data as any)
    .force('charge', d3.forceManyBody().strength(-10)) // 减小排斥力
    .force('collision', d3.forceCollide().radius((d: any) => radiusScale(d.value) + 0)) // 碰撞检测
    .force('center', d3.forceCenter(width / 2, height / 2)) // 中心引力
    .force('x', d3.forceX(width / 2).strength(0.5)) // 增强X轴方向的中心引力
    .force('y', d3.forceY(height / 2).strength(0.5)) // 增强Y轴方向的中心引力

  // 6. 定义defs以存储渐变
  const defs = svg.append('defs');

  // 7. 绘制气泡
  const bubbles = svg.append('g')
    .selectAll('g')
    .data(data)
    .join('g')
    .attr('transform', (d: any) => `translate(${d.x},${d.y})`) // 初始位置（将在力学模拟中更新）
    .each(function (d, i) {
      const radius = radiusScale(d.value);

      // 为每个气泡创建一个径向渐变
      const gradientId = `bubble-gradient-${i}`;
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', 0.25) // 偏左
        .attr('cy', 0.25) // 偏上
        .attr('r', 0.5)
        .attr('gradientUnits', 'objectBoundingBox'); // 使用对象边界框单位

      // 添加渐变停止点
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.hsl(baseColors(i.toString())! as any).brighter(0.6) as any) // 高光颜色
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', baseColors(i.toString())!) // 基础颜色
        .attr('stop-opacity', 0.6);

      // 绘制气泡（使用渐变填充）
      d3.select(this).append('circle')
        .attr('r', radius)
        .attr('fill', `url(#${gradientId})`) // 使用径向渐变填充
        // .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .on("mousemove", function (event: MouseEvent, d: any) {
          // 显示tooltip
          const currElement = d3.select(this).node(); // 获取当前的文本元素
          if (!currElement) return; // 确保元素存在
          // 获取文本元素和容器的位置
          const textBbox = currElement.getBoundingClientRect();
          const containerBbox = chartContainer.getBoundingClientRect();
          // 计算 tooltip 相对于容器的位置；图表非编辑时由于外部容器存在变换布局影响需要减去容器偏移；
          // 不需要再区分编辑、非编辑状态，因为chart组件添加了position: absolute;统一了容器布局类型；
          const tooltipX = textBbox.left + 6 - containerBbox.left; // 相对于容器的左侧位置
          const tooltipY = textBbox.top + radius - 10 - containerBbox.top; // 相对于容器的顶部位置减去偏移
          tooltip
            .style('display', null)
            .html(`
              <div>${d.dim}</div>
              <div>${d.metricName! + d.value}</div>
            `)
            .style('top', tooltipY + 'px') // 使用容器的顶部位置加上相对偏移
            .style('left', tooltipX + 'px') // 使用容器的左侧位置加上相对偏移
            .transition().duration(100)

          // 高亮当前气泡（可选）
          d3.select(this).selectAll("text")
            .attr("fill", "white");
        })
        .on("mouseout", function () {
          tooltip.style('display', 'none')
          // 隐藏tooltip
          // tooltip.transition()
          //   .duration(500)
          //   .style("opacity", 0);

          // // 恢复文本颜色（可选）
          // d3.select(this).selectAll("text")
          //   .attr("fill", "#333");
        })
    })
    .call(drag(simulation as any) as any); // 启用拖拽


  // 8. 添加标签（标题和数据值）并居中显示
  const labels = svg.append('g')
    .selectAll('g')
    .data(data)
    .join('g')
    .attr('transform', (d: any) => `translate(${d.x},${d.y})`) // 将每个标签组移动到气泡的中心
    .each(function (d) {
      const group = d3.select(this);
      const radius = radiusScale(d.value);
      const fontSize = Math.max(12, radius * 0.2); // 确保字体大小不小于12px
      const maxTextLength = Math.max(getTextWidth(d.metricName! + d.value), getTextWidth(d.dim))
      const textWidth = maxTextLength + 2; // 估算文本宽度
      const textHeight = fontSize * 1.5; // 估算文本高度

      if (radius * 2 >= textWidth && radius * 2 >= textHeight * 2) { // 确保高度上有足够的空间放置两行文本
        // 添加标题文本（在水平中线上方 1px）
        group.append('text')
          .text(d.dim)
          .attr('font-size', fontSize + 'px')
          .attr('fill', '#333')
          .style('text-anchor', 'middle')
          .attr('dy', -fontSize * 0.5 + 4) // 垂直居中偏上 1px
          .style('pointer-events', 'none');

        // 添加数据值文本（在水平中线下方 1px）
        group.append('text')
          .text(d.metricName! + d.value)
          .attr('font-size', fontSize + 'px')
          .attr('fill', '#333')
          .style('text-anchor', 'middle')
          .attr('dy', fontSize * 0.5 + 4) // 垂直居中偏下 1px，并加上 3px 的间距
          .style('pointer-events', 'none');
      }
    })


  // 9. 力学模拟更新
  simulation.on('tick', () => {
    bubbles
      .attr('transform', (d: any) => `translate(${d.x!},${d.y!})`); // 更新气泡位置

    labels
      .attr('transform', (d: any) => `translate(${d.x!},${d.y!})`); // 更新标签组的位置
  });

  // 10. 拖拽行为
  function drag(simulation: any) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag<SVGGElement, BubbleNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }
}