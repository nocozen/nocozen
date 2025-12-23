import * as d3 from 'd3';
import { ColorGroups } from '@/enum/biMeta';

export function createFunnelChart(chartContainer: HTMLElement, options: any) {
  // 1. 清除旧图表并设置尺寸
  d3.select(chartContainer).select('svg').remove();
  if (options.dataset?.length == 0) return;

  const colors = d3.scaleOrdinal(ColorGroups.Default);
  const data = options.dataset.flatMap((item: any) => ({
    dim: item[0].split(options.axis.dimSplit).join(''),
    value: item.slice(1).reduce((acc: number, curr: number) => acc + curr, 0)
  }));

  const width = options.svg.width;
  const height = options.svg.height;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 2. 创建SVG画布
  const svg = d3.select(chartContainer)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  svg
    .style("opacity", 0)
    .transition()
    .duration(options.chart.duration + 100)
    .style("opacity", 1);
  // 3. 计算比例尺
  const maxValue = d3.max(data, (d: any) => d.value) || 1;
  const widthScale = d3.scaleLinear()
    .domain([0, maxValue] as any)
    .range([0, innerWidth / 2]); // 漏斗最大宽度为画布一半

  // 4. 计算每个阶段的位置参数
  const stageHeight = innerHeight / data.length;
  const funnelPaths = data.map((d: any, i: number) => {
    const currentWidth = widthScale(d.value);
    const nextWidth = i < data.length - 1 ? widthScale(data[i + 1].value) : 0;

    return {
      path: `
        M ${innerWidth / 2 - currentWidth}, ${i * stageHeight}
        L ${innerWidth / 2 + currentWidth}, ${i * stageHeight}
        L ${innerWidth / 2 + nextWidth}, ${(i + 1) * stageHeight}
        L ${innerWidth / 2 - nextWidth}, ${(i + 1) * stageHeight}
        Z
      `,
      value: d.value,
      dim: d.dim,
      color: colors(i.toString()) || d3.interpolateBlues(i / data.length) // 默认使用蓝色渐变
    };
  });

  // 5. 绘制漏斗路径
  const funnel = svg.append('g')
    .selectAll('path')
    .data(funnelPaths)
    .join('path')
    .attr('d', (d: any) => d.path)
    .attr('fill', (d: any) => d.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('opacity', 0.8)
    .on('mouseover', function () {
      d3.select(this).attr('opacity', 1);
    })
    .on('mouseout', function () {
      d3.select(this).attr('opacity', 0.8);
    });

  // 6. 添加阶段标签
  svg.append('g')
    .selectAll('text')
    .data(funnelPaths)
    .join('text')
    .attr('x', innerWidth / 2)
    .attr('y', (d, i) => i * stageHeight + stageHeight / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text((d: any) => d.dim ? `${d.dim}: ${d.value}` : d.value)
    .style('font-size', '12px')
    .style('fill', '#333');

}