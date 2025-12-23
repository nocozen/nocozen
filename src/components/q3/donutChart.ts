// donut-chart.ts
import * as d3 from 'd3';
import { ColorGroups } from '@/enum/biMeta';


export interface DonutChartOptions {
  width?: number;
  height?: number;
  margin?: number;
  progress?: number;
  color?: string;
  backgroundColor?: string;
  thickness?: number;
  animate?: boolean;
  duration?: number;
  showText?: boolean;
  title: string;
  titleSize: number;
  textColor?: string;
  textSize?: number;
  cornerRadius?: number;
}

export interface DonutChartInstance {
  update: (newProgress: number) => void;
  destroy: () => void;
}
// 至少需要两个指标；
export function createProgressRingChart(chartContainer: HTMLElement, options: any) {
    // 清除现有内容
  d3.select(chartContainer).select('svg').remove();
  if (options.dataset?.length == 0) return;

  const colors = d3.scaleOrdinal(ColorGroups.Default);
  let propress = 1;
  let title = ''
  if (options.dataset[0]?.length == 3) {
    options.dataset[0][2] != 0 && (propress = Math.round(options.dataset[0][1] / options.dataset[0][2] * 100) / 100);
  } else if (options.dataset[0]?.length > 3) {
    const base = options.dataset[0].slice(2).reduce((acc: number, curr: number) => acc + curr, 0);
    base != 0 && (propress = Math.round(options.dataset[0][1] / base * 100) / 100)
  }

  if (options.nest) {
    title = options.dataset[0][0].split(options.axis.dimSplit).at(-1);
  }
  // 合并默认配置和用户配置
  const config: Required<DonutChartOptions> = {
    width: options.svg.width,
    height: options.svg.height,
    margin: 10,
    progress: propress,
    color: colors('0'),
    backgroundColor: '#e0e0e0',
    thickness: 10,
    animate: true,
    duration: 1000,
    showText: true,
    title: title,
    titleSize: 12,
    textColor: '#333',
    textSize: 24,
    cornerRadius: 0,
    // ...options,
  };

  // 创建SVG
  const svg = d3
    .select(chartContainer)
    .append('svg')
    .attr('width', config.width)
    .attr('height', config.height)
    .append('g')
    .attr('transform', `translate(${config.width / 2}, ${config.height / 2})`);

  // 背景环
  const diameter = config.width > config.height ? config.height : config.width;
  const arcBackground = d3
    .arc()
    .innerRadius(diameter / 2 - config.margin - config.thickness)
    .outerRadius(diameter / 2 - config.margin)
    .startAngle(0)
    .endAngle(2 * Math.PI)
    .cornerRadius(config.cornerRadius);

  svg.append('path').attr('d', arcBackground as any).attr('fill', config.backgroundColor);

  // 进度环
  const arc = d3
    .arc()
    .innerRadius(diameter / 2 - config.margin - config.thickness)
    .outerRadius(diameter / 2 - config.margin)
    .startAngle(0)
    .cornerRadius(config.cornerRadius);

  const progressArc = svg.append('path').attr('fill', config.color);

  if (config.animate) {
    progressArc
      .attr('d', arc.endAngle(0) as any)
      .transition()
      .duration(config.duration)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(0, 2 * Math.PI * config.progress);
        return function (t) {
          return arc.endAngle(interpolate(t))(d as any) || '';
        };
      });
  } else {
    progressArc.attr('d', arc.endAngle(2 * Math.PI * config.progress) as any);
  }

  // 中心文本
  let dimText: d3.Selection<SVGTextElement, unknown, null, undefined> | null = null;
  let metricText: d3.Selection<SVGTextElement, unknown, null, undefined> | null = null;
  if (config.showText) {
    dimText = svg
      .append('text')
      .attr('class', 'title-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-1em')
      .style('font-size', `${config.titleSize}px`)
      .style('fill', config.textColor)
      .text(config.title);

    metricText = svg
      .append('text')
      .attr('class', 'progress-text')
      .attr('text-anchor', 'middle')
      .attr('dy', config.title ? '.5em' : '.3em')
      .style('font-size', `${config.textSize}px`)
      .style('fill', config.textColor)
      .text(`${Math.round(config.progress * 100)}%`);
  }


}
