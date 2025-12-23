import * as d3 from 'd3';
import { createLegend, createTooltip } from './utils/shared';
import { ColorGroups } from '@/enum/biMeta';

function getMaxFromNestedArray(data: (string | number)[][]): number {
  const numbers = data.flatMap(subArray =>
    subArray.filter(element => typeof element === 'number') as number[]
  );
  return numbers?.length > 0 ? Math.max(...numbers) : 0;
}

// 智能取整函数
function niceRound(value: number) {
  const order = Math.pow(10, Math.floor(Math.log10(value)));
  const rounded = Math.ceil(value / order) * order;
  return rounded === value ? rounded + order : rounded;
}

export function createRadarChart(chartContainer: HTMLElement, options: any, config: Meta.ChartComp) {
  // 清除旧图表
  d3.select(chartContainer).select('svg').remove();
  if (options.dataset?.length == 0) return;
  
  const data = options.dataset;
  // 颜色比例尺
  const colors = d3.scaleOrdinal(ColorGroups.Default).domain(data.map((d: any) => d[0]));
  // 1. 数据准备（取第一条数据的维度作为雷达图轴线）
  const dimensions = config.metrics || [] // Object.keys(data[0].stats);
  const numTicks = dimensions?.length;
  const maxValue = niceRound(getMaxFromNestedArray(options.dataset)); // 固定最大值

  // 2. 图表尺寸配置
  const padding = 26;
  const svgWidth = options.svg.width;
  const svgHeight = options.svg.height;
  const centerX = svgWidth / 2;
  const centerY = (svgHeight - 20) / 2;
  const radius = Math.min(centerX, centerY) - padding;

  // 3. 比例尺
  const angleScale = d3.scaleLinear()
    .domain([0, numTicks])
    .range([0, Math.PI * 2]);

  const valueScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, radius]);

  // 4. 创建SVG
  const svg = d3.select(chartContainer)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

  svg
    .style("opacity", 0)
    .transition()
    .duration(options.chart.duration + 100)
    .style("opacity", 1);
    
  // 5. 绘制雷达图背景（同心圆+轴线）
  // 5.1 同心圆
  const levels = 5;
  for (let level = 1; level <= levels; level++) {
    const levelRadius = radius * level / levels;
    svg.append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", levelRadius)
      .attr("fill", "none")
      .attr("stroke", "#eee")
      .attr("stroke-width", 1)

    // 层级标签
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY - levelRadius + 12)
      .text(Math.round(maxValue * level / levels))
      .style("font-size", "10px")
      .style("text-anchor", "middle");
  }

  // 5.2 轴线
  const axes = svg.append("g").attr("class", "axes");
  dimensions?.forEach((dim, i) => {
    const angle = angleScale(i);
    const x = centerX + radius * Math.sin(angle);
    const y = centerY - radius * Math.cos(angle);

    // 轴线
    axes.append("line")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", "#999")
      .attr("stroke-width", 1);
    axes.append("text")
      .attr("x", centerX + (radius + 15) * Math.sin(angle))
      .attr("y", centerY - (radius + 15) * Math.cos(angle))
      .text(dim.label)
      .style("font-size", "12px")
      .style("text-anchor", function () {
        // 标准化角度到0-2π范围
        const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        // 定义关键角度阈值
        const RIGHT_START = Math.PI / 6;       // 30°
        const RIGHT_END = 5 * Math.PI / 6;     // 150°
        const LEFT_START = 7 * Math.PI / 6;    // 210°
        const LEFT_END = 11 * Math.PI / 6;     // 330°

        if (normalizedAngle <= RIGHT_START || normalizedAngle >= LEFT_END) {
          return "middle";  // 顶部区域
        } else if (normalizedAngle >= RIGHT_END && normalizedAngle <= LEFT_START) {
          return "middle";  // 底部区域
        } else if (normalizedAngle > RIGHT_START && normalizedAngle < RIGHT_END) {
          return "start";   // 右侧区域
        } else {
          return "end";     // 左侧区域
        }
      })
      .attr("dx", function () {
        const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // 更精细的水平偏移调整
        if (normalizedAngle > Math.PI / 6 && normalizedAngle < 5 * Math.PI / 6) {
          return "-0.8em";  // 右侧文本右移
        } else if (normalizedAngle > 7 * Math.PI / 6 && normalizedAngle < 11 * Math.PI / 6) {
          return "0.8em"; // 左侧文本左移
        }
        return "0";
      })
      .attr("dy", function () {
        const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // 更精细的垂直偏移调整
        if (normalizedAngle > Math.PI / 2 && normalizedAngle < 3 * Math.PI / 2) {
          return "-0.2em";  // 底部文本下移
        }
        return "0.8em";    // 顶部文本上移
      });
  });


  // 7. 绘制数据多边形
  data?.forEach((item: any, i: number) => {
    const values = item.slice(1) // dimensions.map(d => item.stats[d]);

    // 生成路径点
    const points = dimensions.map((_, i) => {
      const angle = angleScale(i);
      return [
        centerX + valueScale(values[i]) * Math.sin(angle),
        centerY - valueScale(values[i]) * Math.cos(angle)
      ];
    });

    // 绘制多边形
    svg.append("polygon")
      .attr("points", points.join(" "))
      .attr("fill", colors(item[0]))
      .attr("fill-opacity", 0.2)
      .attr("stroke", colors(item[0]))
      .attr("stroke-width", 2);

    // 绘制数据点
    points?.forEach(([x, y], i) => {
      svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", colors(item[0]));

      // 数值标签
      // svg.append("text")
      //   .attr("x", x + 8 * Math.sin(angleScale(i)))
      //   .attr("y", y - 8 * Math.cos(angleScale(i)))
      //   .text(values[i])
      //   .style("font-size", "10px")
      //   .style("text-anchor", "middle");
    });
  });

  // 8. 添加图例
  let tooltip = createTooltip(chartContainer, options.svg.fontSize);
  const legendData = data.map((m: Array<any>) => [m[0]]) || [];
  createLegend(chartContainer, options, svg, legendData, colors, tooltip, config)

}