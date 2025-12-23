
import * as d3 from 'd3';
import { clipper, getMaxTextWidth, getTextWidth } from './utils/text'
import { ChartType } from '@/enum';
import { ColorGroups } from '@/enum/biMeta';
import { createLegend, createTooltip, findMaxInDataset } from './utils/shared';
import * as _ from 'lodash-es';


export async function createRectCoord(chartContainer: any, options: any, config: Meta.ChartComp, isEditable: boolean) {
  d3.select(chartContainer).select('svg').remove();
  if (options.dataset?.length == 0) return;
  const tickWidth = 6;
  const measMaxs = [] as any;   // 度量轴每层标签最大值
  const measMins = [] as any;   // 度量轴每层最小值
  const dimMaxWidths = [] as any;    // 维度轴每层标签最大宽度
  const dimLevelHeights = [] as any; // 维度轴每层高度，标准行高 defMultiAxisSpace，旋转标签后需要调整；
  let measLabelMaxWidth = tickWidth // 所有度量中轴标签最大长度 (刻度值取整数)
  const maxDimLevel = options.dataHeader[0].split(options.axis.dimSplit)?.length;
  const maxMeasNumber = options.dataHeader.length - 1;
  const measMaxTicksNumber = 6;      // todo: 根据最小宽度限制计算生成
  let colors = d3.scaleOrdinal(ColorGroups.Default).domain(config.metrics!.map((d: any) => d.label));

  options.dataHeader?.forEach((d: any, i: number) => {
    if (i == 0) {
      if ([ChartType.Bar, ChartType.Line, ChartType.Area, ChartType.Scatter, ChartType.GroupBar, ChartType.StackBar].includes(options.chart.shape)) {
        let level = 0
        while (level < maxDimLevel) {
          dimLevelHeights.push(options.axis.defMultiAxisSpace);
          level++
        }
      }

    } else {
      const max = Number(d3.max(options.dataset, (d: any) => d[i]));
      const min = Number(d3.min(options.dataset, (d: any) => d[i]));
      measMaxs.push(max);
      measMins.push(min);
      const newLabelMax = getTextWidth(Math.round(max).toString(), options.svg.fontSize) + tickWidth;    // todo: getYLabelMaxWidth
      newLabelMax > measLabelMaxWidth && (measLabelMaxWidth = newLabelMax);
    }
  })

  let groupSet = d3.group(options.dataset, (d: any) => d[0]);

  // 需要等dimLevelHeights重新赋值
  const dimAllBottomMargin = options.svg.height - options.svg.margin.bottom - d3.sum(dimLevelHeights);

  let xDomain = [] as any;
  let domainDimList = options.dataHeader[0].split("|");
  if ([ChartType.Bar, ChartType.Line, ChartType.Area, ChartType.Scatter, ChartType.GroupBar, ChartType.StackBar].includes(options.chart.shape)) {
    xDomain = options.dataset.map((d: any) => d[0])
    domainDimList?.forEach((_: any, index: number) =>
      dimMaxWidths.push(Number(d3.max(xDomain, (d: any) => getTextWidth(d.split("|")[index], options.svg.fontSize))) + tickWidth * 2 + 4)
    )
  }

  let measAxisList = [] as any;

  const svg = d3
    .select(chartContainer)
    .append('svg')
    .attr('height', options.svg.height)
    .attr('width', options.svg.width)
    .style('font-size', options.svg.fontSize)
    .style('user-select', 'none')

  let tooltip = createTooltip(chartContainer, options.svg.fontSize);
  let legendData = config.metrics?.map((m: Meta.ChartMetric) => [m.label]) || [];
  createLegend(chartContainer, options, svg, legendData, colors, tooltip, config)

  const xAxisBase = createAllDimAxis(
    chartContainer,
    options,
    xDomain,
    svg,
    tooltip,
    measLabelMaxWidth,
    dimAllBottomMargin,
    dimMaxWidths,
    maxDimLevel,
    isEditable
  )

  // 只有指定分层才有多层
  let measAxisNum = 1;
  if ([ChartType.Bar, ChartType.Line, ChartType.Area, ChartType.Scatter].includes(options.chart.shape)) {
    measAxisNum = maxMeasNumber;
  }
  for (let measIndex = 0; measIndex < measAxisNum; measIndex++) {
    measAxisList[measIndex] = creatreMeasAxis(
      measIndex,
      measMaxs,
      measMins,
      groupSet,
      options,
      svg,
      measLabelMaxWidth,
      measMaxTicksNumber,
      dimMaxWidths,
      measAxisNum,
      dimAllBottomMargin
    );
    createChart(chartContainer, config, groupSet, measIndex, options, svg, tooltip, colors, measLabelMaxWidth, xAxisBase, measAxisList[measIndex])
  }

  // =======全局样式==============
  svg.selectAll('text').style('font-size', options.svg.fontSize);
  svg.selectAll('.domain').style('stroke', options.svg.lineColor).style("opacity", 0.4);
  svg.selectAll('.tick line').style('stroke', options.svg.lineColor).style("opacity", 0.4);
}


function createAllDimAxis(
  chartContainer: any,
  options: any,
  xDomain: any,
  svg: any,
  tooltip: any,
  measLabelMaxWidth: number,
  dimAllBottomMargin: number,
  dimMaxWidths: Array<number>,
  maxDimLevel: number,
  isEditable: boolean
) {
  let dimRange = null;
  let dimAxisTranslate = `translate(${measLabelMaxWidth},${dimAllBottomMargin})`
  if (options.axis.invertAxis) {
    dimRange = [options.svg.margin.top + measLabelMaxWidth, options.svg.height - options.svg.margin.bottom];
    dimAxisTranslate = `translate(${d3.sum(dimMaxWidths) + options.svg.margin.left},${-measLabelMaxWidth} )`;
  } else {
    dimRange = [options.svg.margin.left, options.svg.width - options.svg.margin.right - measLabelMaxWidth];
    dimAxisTranslate = `translate(${measLabelMaxWidth},${dimAllBottomMargin})`
  }

  let xAxisBase = d3.scaleBand().domain(xDomain).range(dimRange).padding(options.axis.dimPadding);

  createBaseDimAxis(chartContainer, options, xAxisBase, dimAxisTranslate, svg, tooltip, isEditable)
  // 循环生成多级x轴，todo: 分组、堆叠等情况暂时不支持，刻度线生成逻辑变了
  if ([ChartType.Bar, ChartType.Line, ChartType.Area, ChartType.Scatter, ChartType.GroupBar, ChartType.StackBar].includes(options.chart.shape)) {
    for (let level = 2; level <= maxDimLevel; level++) {
      createMultiDimAxis(
        options.axis.dimPadding,
        dimMaxWidths,
        maxDimLevel,
        level,
        options,
        svg,
        measLabelMaxWidth,
        dimRange,
        xAxisBase,
        options.axis.dimSplit
      )
    }
  }
  return xAxisBase;
}

function createBaseDimAxis(
  chartContainer: any,
  options: any,
  xAxisBase: any,
  dimAxisTranslate: any,
  svg: any,
  tooltip: any,
  isEditable: boolean
) {
  // 基础x轴

  let callXAxis = options.axis.invertAxis ? d3.axisLeft(xAxisBase) : d3.axisBottom(xAxisBase);

  svg
    .append('g')
    .attr('transform', dimAxisTranslate)
    .call(callXAxis.tickSizeOuter(0)
      .tickFormat((d: any) => {
        return d.split(options.axis.dimSplit).at(-1)
      })
    )
    .selectAll('.tick text')
    .attr('title', '')
    .on('mousemove', function (this: SVGAElement, event: MouseEvent, d: any) {
      const textElement = d3.select(this).node(); // 获取当前的文本元素
      if (!textElement) return; // 确保元素存在
      // 获取文本元素和容器的位置
      const textBbox = textElement.getBoundingClientRect();
      const containerBbox = chartContainer.getBoundingClientRect();
      // 计算 tooltip 相对于容器的位置；图表非编辑时由于外部容器存在变换布局影响需要减去容器偏移；
      // 不需要再区分编辑、非编辑状态，因为chart组件添加了position: absolute;统一了容器布局类型；
      const tooltipX = textBbox.left + 20 - containerBbox.left; // 相对于容器的左侧位置
      const tooltipY = textBbox.top + 18 - containerBbox.top; // 相对于容器的顶部位置减去偏移
      // 设置 tooltip 的样式，使其相对于容器定位
      tooltip
        .style('display', null)
        .text(textElement.getAttribute('title') || d) // 如果没有 title 属性，则显示刻度值
        .style('top', tooltipY + 'px') // 使用容器的顶部位置加上相对偏移
        .style('left', tooltipX + 'px'); // 使用容器的左侧位置加上相对偏移

    })
    .on('mouseout', function () {
      tooltip.style('display', 'none')
    })
    .each(function (this: SVGAElement) {   // 首选方案，使用d3-selection
      const textElement = d3.select(this); // 使用d3.select来更方便地操作当前元素
      const fullText = textElement.text(); // 获取当前元素的完整文本  textElement.attr('title')
      let clippedText = fullText;
      if (!options.axis.invertAxis) {   // todo: y轴为维度轴时允许options中定义标签最大宽度
        clippedText = clipper(fullText, Math.floor(xAxisBase.bandwidth()), options.svg.fontSize); // 截断文本
      }
      textElement.text(clippedText);  // 设置截断后的文本
      textElement.attr('title', fullText);  // 添加或更新title属性，包含完整文本
    })

  return xAxisBase;
}

function creatreMeasAxis(
  measIndex: number,
  measMaxs: Array<number>,
  measMins: Array<number>,
  groupSet: any,
  options: any,
  svg: any,
  measLabelMaxWidth: number,
  measMaxTicksNumber: number,
  dimMaxWidths: Array<number>,
  maxMeasNumber: number,
  dimAllBottomMargin: number
) {
  let rangeStart = null;
  let rangeEnd = null;
  const minGridGap = options.axis.measTickInterval;   // y轴刻度线间隔
  let measTicks = measMaxTicksNumber;
  if (options.axis.invertAxis) {
    const start = d3.sum(dimMaxWidths) + options.svg.margin.left;
    const end = options.svg.width - options.svg.margin.right;
    const levelWidth = Math.floor((end - start) / maxMeasNumber);    // scaling=1时如果层间对不齐是因为：domain最大值不是整数，而刻度是取的整数
    rangeStart = start + levelWidth * measIndex;
    rangeEnd = end - levelWidth * (maxMeasNumber - measIndex - 1);
    measTicks = Math.floor(levelWidth / minGridGap)
  } else {
    const start = dimAllBottomMargin;
    const end = options.svg.margin.top;
    const levelHeight = Math.floor((start - end) / maxMeasNumber);   // scaling=1时如果层间对不齐是因为：domain最大值不是整数，而刻度是取的整数
    rangeStart = start - levelHeight * measIndex;
    rangeEnd = end + levelHeight * (maxMeasNumber - measIndex - 1);
    measTicks = Math.floor(levelHeight / minGridGap)
  }
  // y轴
  const scaling = 1.1;
  let domainMeasMaxs = measMaxs[measIndex] * scaling;
  let domainMeasMins = measMins[measIndex] > 0 ? 0 : measMins[measIndex] * scaling;
  if (options.chart.shape == ChartType.StackBar) {
    const maxStackValue = d3.max(groupSet, (d: any) => {
      let sum = 0
      sum = d[1][0].slice(1).reduce((acc: number, curr: number) => acc + curr, 0);
      return sum;
    }) || 100;
    domainMeasMaxs = maxStackValue * scaling;
  } else if (options.chart.shape == ChartType.GroupBar) {
    domainMeasMaxs = findMaxInDataset(options.dataset) * scaling;
  }
  // scaling=1时如果层间对不齐是因为：domain最大值不是整数，而刻度是取的整数；
  const y = d3
    .scaleLinear()
    .domain([domainMeasMins, domainMeasMaxs])
    .range([rangeStart, rangeEnd])
    .nice(measTicks);

  let callYAxis = null;
  let measTranslate = null;
  if (options.axis.invertAxis) {
    callYAxis = d3.axisBottom(y)
      .tickSize(options.svg.margin.top + options.svg.margin.bottom + measLabelMaxWidth - options.svg.height)
      .ticks(measTicks);
    measTranslate = `translate(0, ${options.svg.height - options.svg.margin.bottom - measLabelMaxWidth})`;
  } else {
    callYAxis = d3.axisLeft(y)
      .tickSize(options.svg.margin.left + options.svg.margin.right + measLabelMaxWidth - options.svg.width)
      .ticks(measTicks)

    measTranslate = `translate(${measLabelMaxWidth + options.svg.margin.left}, 0)`
  }
  const yticks = svg
    .append('g')
    .attr('stroke-width', 0)
    .attr('transform', () => {
      return measTranslate
    })
    .call(callYAxis)

  yticks.selectAll('.tick text')
    .each(function (this: SVGTextElement, d: any, i: number, nodes: HTMLElement[]) {
      const text = d3.select(this);
      let offset = 0; // 偏移量
      if (options.axis.invertAxis) {
        text.style("text-anchor", "start");
        // text.attr('transform', `translate(0,0) rotate(90)`);
        if (i === 0) {
          offset = 6;
        } else if (i === nodes.length - 1 && measIndex != measMaxs.length - 1) {
          offset = -8;
        }
        text.attr('transform', `translate(${offset}, 0)  rotate(90)`);
      } else {
        if (i === 0) {
          offset = -6;
        } else if (i === nodes.length - 1 && measIndex != measMaxs.length - 1) {
          offset = 8;
        }
        text.attr('transform', `translate(0,${offset})`);
      }

    })

  yticks
    .selectAll('.tick text') // 选择刻度标签，而不是刻度线
    .attr('dx', function (this: SVGTextElement, d: any, i: number, nodes: HTMLElement[]) {
      if (options.axis.invertAxis) {
        return 2;   // 标签向下偏移2
      } else {
        return '0' // 将刻度标签向左偏移-6
      }
    })
    // 不设置默认dy就是3，一旦修改dy没有返回值也会改为0，因为必须要设置options.axis.invertAxis时纠偏，所以要再次恢复默认值；
    .attr('dy', function (this: SVGTextElement, d: any, i: number, nodes: HTMLElement[]) {
      if (options.axis.invertAxis) {
        return 1;
      } else {
        return 3;
      }
    })


  yticks
    .selectAll('.tick line')
    .attr('stroke-width', (d: number, i: number, nodes: HTMLElement[]) => {
      if ((d == 0 && measIndex == 0)) {  // || (i === nodes.length - 1 && measIndex != measMaxs.length - 1)
        return 0;
      } else {
        return 1;
      }
    })
    .each(function (this: SVGTextElement, d: any, i: number, nodes: any) {
      const text = d3.select(this);
      if (i === 0 && measIndex != 0) {
        text.attr('stroke', options.svg.lineColor);
      } else {
        text.attr('stroke-dasharray', ('3, 3'));
      }
    })

  return y;
}

function createChart(
  chartContainer: any,
  config: Meta.ChartComp,
  groupSet: any,
  measIndex: number,
  options: any,
  svg: any,
  tooltip: any,
  colors: any,
  measLabelMaxWidth: number,
  xAxis: any,
  yAxis: any) {
  const shape = options.chart.shape

  let dimGroupTranslate = null;
  let attrX0 = null;
  let attrY0 = null;
  let attrWidth0 = null;
  let attrHeight0 = null;
  let attrX1 = null as any;
  let attrY1 = null as any;
  let attrWidth1 = null;
  let attrHeight1 = null;
  let groupData = null;
  let line = null;
  let area = null;

  let lineDimGroupTranslate = null;
  let gLabelY = null as any;
  const invert = options.axis.invertAxis;

  const getColor = (index: number) => {
    return config.metrics!.length > 0 ? config.metrics![index] && colors(config.metrics![index].label) : colors(0);
  }


  if (invert) {
    // 不要再合并，总有些差异！！！！！！！！！！！！！！！！！！
    if (ChartType.Bar == shape) {
      dimGroupTranslate = `translate(0,-${measLabelMaxWidth})`;
      attrX0 = yAxis(0);
      attrY0 = (d: any) => xAxis(d[0]);
      attrWidth0 = 0;
      attrHeight0 = xAxis.bandwidth();
      attrX1 = (d: any) => {
        const value = d[measIndex + 1];
        return value >= 0 ? yAxis(0) : yAxis(value); // 负值：从 value 开始向右画到 0
      };
      attrY1 = (d: any) => xAxis(d[0]);
      attrWidth1 = (d: any) => Math.abs(yAxis(0) - yAxis(d[measIndex + 1]));
      attrHeight1 = xAxis.bandwidth();
    } else if (shape == ChartType.StackBar) {
      dimGroupTranslate = (d: any) => `translate(0,-${measLabelMaxWidth})`;
      groupData = (d: any) => {
        // 堆叠时：给数组中对象添加【前顶点值】
        const stackList = d[1][0];
        let preValue = 0;
        let newStackList = [] as any;
        let metricLength = config.metrics!.length;
        metricLength == 0 && (metricLength = 1)
        for (let i = 0; i < metricLength; i++) {
          const currValue = stackList[i + 1];
          // 新数组结构：[ name, currValue, preValue, currYTop]
          newStackList.push([stackList[0], currValue, preValue, currValue + preValue]);  // 堆叠：y(当前顶点值=当前值+前顶点值)
          preValue = stackList[i + 1] + preValue;   // 下次循环使用
        }
        return newStackList
      }
      attrX0 = yAxis(0);
      attrY0 = (d: any) => xAxis(d[0]);
      attrWidth0 = 0;
      attrHeight0 = xAxis.bandwidth();
      attrX1 = (d: any, i: number) => {
        const currValue = d[1];
        const preValue = d[2];
        const base = yAxis(preValue);
        return currValue >= 0 ? base : yAxis(preValue + currValue); // 负值：从底部开始
      };
      attrY1 = (d: any) => xAxis(d[0]);
      attrWidth1 = (d: any) => (Math.abs(yAxis(d[2]) - yAxis(d[3])));
      attrHeight1 = xAxis.bandwidth();
      gLabelY = (d: any) => yAxis(d[2]) + 4;
    } else if (shape == ChartType.GroupBar) {
      dimGroupTranslate = `translate(0,-${measLabelMaxWidth})`;
      groupData = (d: any) => {
        return d[1].flatMap((d1: any) => {
          const [dim, ...children] = d1;
          return children.map((v: any) => [dim, v]);
        });
      }
      // 分组子轴
      let metricSet = config.metrics!.map((d: any, i: number) => i.toString());
      metricSet?.length == 0 && (metricSet = ['0']);
      const groupX = d3.scaleBand()
        .domain(new Set(metricSet))
        .rangeRound([0, xAxis.bandwidth()])
        .padding(options.axis.dimPadding / 2);
      attrX0 = yAxis(0);
      attrY0 = (d: any) => xAxis(d[0]);
      attrWidth0 = 0;
      attrHeight0 = groupX.bandwidth();
      attrX1 = (d: any) => {
        const value = d[measIndex + 1];
        return value >= 0 ? yAxis(0) : yAxis(value);
      };
      attrY1 = (d: any, i: number) => xAxis(d[0]) + groupX(i.toString());
      attrWidth1 = (d: any) => (Math.abs(yAxis(0) - yAxis(d[measIndex + 1])));
      attrHeight1 = groupX.bandwidth();
      gLabelY = (value: any) => xAxis(value) + 15;
    } else if (ChartType.Line == shape || ChartType.Area == shape) {
      lineDimGroupTranslate = `translate(0,-${measLabelMaxWidth - xAxis.bandwidth() / 2})`;
      // 绘制折线图
      line = d3.line()
        .x(d => yAxis(d[measIndex + 1])!)
        .y(d => xAxis(d[0])!);
    } else if (ChartType.Scatter == shape) {
      dimGroupTranslate = `translate(0, ${measLabelMaxWidth - xAxis.bandwidth() / 2})`;
      attrX0 = (d: any) => yAxis(0);
      attrY0 = (d: any) => xAxis(d[0]);
      attrX1 = (d: any) => yAxis(d[measIndex + 1]) || yAxis(0);
      attrY1 = (d: any) => xAxis(d[0]);
    }
    // 需要复用折线图，所以不能被排除
    if (ChartType.Area == shape) {
      dimGroupTranslate = `translate(0,-${measLabelMaxWidth - xAxis.bandwidth() / 2})`;
      area = d3.area()
        .y(d => xAxis(d[0]))          // 原x值 → 新y值（使用分类比例尺）
        .x0(yAxis(0))            // 基线 → y轴的0点
        .x1(d => yAxis(d[measIndex + 1])); // 原y值 → 新x值
    }
  } else {
    // 不要再合并，总有些差异！！！！！！！！！！！！！！！！！！
    if (ChartType.Bar == shape) {
      dimGroupTranslate = `translate(${measLabelMaxWidth},0)`;
      attrX0 = (d: any) => xAxis(d[0]);
      attrY0 = yAxis(0);
      attrWidth0 = xAxis.bandwidth();
      attrHeight0 = 0;
      attrX1 = (d: any) => xAxis(d[0]);
      attrY1 = (d: any) => yAxis(d[measIndex + 1]);
      attrWidth1 = xAxis.bandwidth();

      attrHeight1 = (d: any) => {
        return Math.abs(yAxis(0) - yAxis(d[measIndex + 1]))
      };
    } else if (shape == ChartType.StackBar) {
      dimGroupTranslate = (d: any) => `translate(${measLabelMaxWidth + xAxis(d[0])},0)`;
      groupData = (d: any) => {
        // 堆叠时：给数组中对象添加【前顶点值】
        const stackList = d[1][0];
        let preValue = 0;
        let newStackList = [] as any;
        let metricLength = config.metrics!.length;
        metricLength == 0 && (metricLength = 1)
        for (let i = 0; i < metricLength; i++) {
          const currValue = stackList[i + 1];
          // 新数组结构：[ name, currValue, preValue, currYTop]
          newStackList.push([stackList[0], currValue, preValue, currValue + preValue]);  // 堆叠：y(当前顶点值=当前值+前顶点值)
          preValue = stackList[i + 1] + preValue;   // 下次循环使用
        }
        return newStackList
      }
      attrX0 = 0;
      attrY0 = yAxis(0);
      attrWidth0 = xAxis.bandwidth();
      attrHeight0 = 0;
      attrX1 = 0;
      attrY1 = (d: any) => yAxis(d[3]);
      attrWidth1 = xAxis.bandwidth();
      attrHeight1 = (d: any) => Math.abs(yAxis(d[2]) - yAxis(d[3]));
      gLabelY = (d: any) => yAxis(d[3]) + 15;
    } else if (shape == ChartType.GroupBar) {
      dimGroupTranslate = `translate(${measLabelMaxWidth},0)`;
      groupData = (d: any) => {
        return d[1].flatMap((d1: any) => {
          const [dim, ...children] = d1;
          return children.map((v: any) => [dim, v]);
        });
      }
      // 分组子轴
      let metricSet = config.metrics!.map((d: any, i: number) => i.toString());
      metricSet?.length == 0 && (metricSet = ['0']);
      const groupX = d3.scaleBand()
        .domain(new Set(metricSet))
        .rangeRound([0, xAxis.bandwidth()])
        .padding(options.axis.dimPadding / 2);
      attrX0 = (d: any) => xAxis(d[0]);
      attrY0 = yAxis(0);
      attrWidth0 = groupX.bandwidth();
      attrHeight0 = 0;
      attrX1 = (d: any, i: number) => xAxis(d[0]) + groupX(i.toString());
      attrY1 = (d: any) => yAxis(d[measIndex + 1]);
      attrWidth1 = groupX.bandwidth();
      attrHeight1 = (d: any) => (Math.abs(yAxis(0) - yAxis(d[measIndex + 1])));
      gLabelY = (value: any) => yAxis(value) + 15;
    } else if (ChartType.Line == shape || ChartType.Area == shape) {
      lineDimGroupTranslate = (d: any) => `translate(${measLabelMaxWidth + xAxis.bandwidth() / 2},0)`;
      // 绘制折线图
      line = d3.line()
        .x(d => xAxis(d[0])!)
        .y(d => yAxis(d[measIndex + 1])!);
      // 标签定位等需要用，不要随便删除，反转轴后可以不要
      attrX0 = (d: any) => xAxis(d[0]);
      attrY0 = yAxis(0);
      attrWidth0 = xAxis.bandwidth();
      attrHeight0 = 0;
      attrX1 = (d: any) => xAxis(d[0]);
      attrY1 = (d: any) => yAxis(d[measIndex + 1]);
      attrWidth1 = xAxis.bandwidth();
      attrHeight1 = (d: any) => Math.abs(yAxis(0) - yAxis(d[measIndex + 1]));
    } else if (ChartType.Scatter == shape) {
      dimGroupTranslate = `translate(${measLabelMaxWidth + xAxis.bandwidth() / 2},0)`;
      // 标签定位等需要用，不要随便删除，反转轴后可以不要
      attrX0 = (d: any) => xAxis(d[0]);
      attrY0 = yAxis(0);
      attrWidth0 = xAxis.bandwidth();
      attrHeight0 = 0;
      attrX1 = (d: any) => xAxis(d[0]);
      attrY1 = (d: any) => yAxis(d[measIndex + 1]);
      attrWidth1 = xAxis.bandwidth();
      attrHeight1 = (d: any) => Math.abs(yAxis(0) - yAxis(d[measIndex + 1]));
    }
    // 需要复用折线图，所以不能被排除
    if (ChartType.Area == shape) {
      dimGroupTranslate = `translate(${measLabelMaxWidth + xAxis.bandwidth() / 2},0)`;
      area = d3.area()
        .x(d => xAxis(d[0]))          // x值（分类）
        .y0(yAxis(0))            // 基线
        .y1(d => yAxis(d[measIndex + 1])); // y值
    }
  }

  // 画出柱状图
  let chart = null;
  if (shape == ChartType.Bar) {
    chart = svg.append('g').selectAll()
      .data(options.dataset)
      .join('rect').attr('transform', dimGroupTranslate)
      .attr('fill', getColor(measIndex))
  } else if ([ChartType.StackBar, ChartType.GroupBar].includes(shape)) {
    chart = svg.append("g").selectAll()
      .data(groupSet)
      .join("g").attr("transform", dimGroupTranslate)
      .selectAll()
      .data(groupData)
      .join("rect")
      .attr("fill", (d: any, i: number) => getColor(i))
  } else if (shape == ChartType.Line || shape == ChartType.Area) {
    chart = svg.append('path')
      .attr('transform', lineDimGroupTranslate)
      .datum(options.dataset)
      .attr('fill', 'none')
      .attr('stroke', getColor(measIndex))
      .attr('stroke-width', 1.5)
      .attr('d', line); // 初始路径，可以是占位符

    // 计算路径的总长度（在路径数据设置之后立即进行）
    const totalLength = chart.node()?.getTotalLength() ?? 0;
    // 设置初始的stroke-dasharray和stroke-dashoffset
    chart.attr('stroke-dasharray', `${totalLength} ${totalLength}`) // 实线段和间隙长度相同，但间隙不可见
      .attr('stroke-dashoffset', totalLength); // 初始时，整个路径都被偏移掉，因此不可见

    // 启动动画
    chart.transition()
      .duration(options.chart.duration) // 动画持续时间
      .ease(d3.easeLinear) // 可选：设置动画缓动函数
      .attr('stroke-dashoffset', 0); // 动画结束时，偏移量为0，路径完全可见

  } else if (shape == ChartType.Scatter) {
    // 绘制散点
    chart = svg.append('g').selectAll()
      .data(options.dataset)
      .join("circle")
      .attr('transform', dimGroupTranslate)
      // .attr('stroke', d3.hsl(colors(config.metrics![measIndex].label)! as any).darker(0.6) as any)
      .attr('fill', getColor(measIndex))
      .attr("cx", attrX0) // 使用xScale将数据中的x值映射到画布上的cx位置
      .attr("cy", attrY0) // 使用yScale将数据中的y值映射到画布上的cy位置
      .attr("r", 5); // 设置圆的半径

    chart
      .transition()
      .duration(options.chart.duration)
      .attr("cx", attrX1) // 使用xScale将数据中的x值映射到画布上的cx位置
      .attr("cy", attrY1) // 使用yScale将数据中的y值映射到画布上的cy位置
  }

  // 需要复用折线图，所以不能被排除
  if (shape == ChartType.Area) {
    const gradientId = `areaGradient-${measIndex}`;
    // svg.select(`#${gradientId}`).remove();
    svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%') // 从顶部开始
      .attr('x2', '0%')
      .attr('y2', '100%') // 到底部结束
      .selectAll('stop')
      .data([
        { offset: '0%', color: getColor(measIndex) }, // 顶部不透明
        { offset: '100%', color: 'rgba(255, 255, 255, 0)' } // 底部透明
      ])
      .enter()
      .append('stop')
      .attr('offset', (d: any) => d.offset)
      .attr('stop-color', (d: any) => d.color);
    // 初始化面积图路径为0
    chart = svg.append('path')
      .attr('transform', dimGroupTranslate)
      .attr('fill', `url(#${gradientId})`) // 使用渐变填充
      // 移除 stroke 和 stroke-width
      .attr('class', 'area')
      .attr('d', area!(options.dataset.map(function (d: any) { return [d[0], ...new Array(d.length - 1).fill(0)] })));


    // 使用transition()方法逐步增加值（仅针对面积图，折线不需要）
    chart
      .transition()
      .duration(options.chart.duration)
      .attr('d', area!(options.dataset)); // 这里的 area! 假设是一个已定义的面积生成器函数

  }

  // 图形鼠标事件
  chart
    .on('mousemove', function (this: SVGAElement, event: any, d: any) {
      // opacity 是 chart-label 标签组属性，所以选择标签无效
      svg.selectAll(".chart-label").transition().duration(100).style("opacity", 0.6);
    })
    .on('mouseout', function () {
      // opacity 是 chart-label 标签组属性，所以选择标签无效
      svg.selectAll(".chart-label").transition().duration(100).style("opacity", 0);
    })

  // 共用动画效果
  if ([ChartType.Bar, ChartType.StackBar, ChartType.GroupBar].includes(shape)) {
    chart
      .attr('x', attrX0)
      .attr('y', attrY0)
      .attr('height', attrHeight0)
      .attr('width', attrWidth0)
      .transition()
      .duration(options.chart.duration)
      .attr('x', attrX1)
      .attr('y', attrY1)
      .attr('width', attrWidth1)
      .attr('height', attrHeight1)
  }

  // 添加形状标签
  if (ChartType.GroupBar == shape) {
    svg.append("g")
      .attr("class", "chart-label") // 添加类名方便后续选择
      .style("opacity", 0)
      .selectAll()
      .data(groupSet)
      .join("g").attr("transform", dimGroupTranslate)
      .selectAll()
      .data(groupData)
      .join("text")
      .each(function (this: SVGAElement, data: any, index: number) {
        d3.select(this.parentNode as any)  // 选择当前柱子的父级<g>
          .append("text")
          .join("text")
          .attr("text-anchor", invert ? "start" : "middle")
          .attr("x", (d: any, i: number) => invert ? attrX1(data, index) + 4 : attrX1(data, index) + attrWidth1 / 2)
          .attr("y", (d: any) => invert ? attrY1(data, index) + attrHeight1 / 2 + 4 : gLabelY(d[1][0][index + 1]))
          .text(data[measIndex + 1])  // 显示数值
          .attr("fill", "black")
          .style("font-size", "12px")
          .style("pointer-events", "none");
      });
  } else if (ChartType.StackBar == shape) {
    svg.append("g")
      .attr("class", "chart-label") // 添加类名方便后续选择
      .style("opacity", 0)
      .selectAll()
      .data(groupSet)
      .join("g").attr("transform", dimGroupTranslate)
      .selectAll()
      .data(groupData)
      .join("text")
      .each(function (this: SVGAElement, data: any, index: number) {
        d3.select(this.parentNode as any)  // 选择当前柱子的父级<g>
          .append("text")
          .join("text")
          .attr("text-anchor", invert ? "start" : "middle")
          .attr("x", invert ? gLabelY(data) : attrWidth1 / 2)
          .attr("y", invert ? attrY1(data) + attrHeight1 / 2 + 4 : gLabelY(data))
          .text(data[measIndex + 1])  // 显示数值，使用的是上层的data
          .attr("fill", "black")
          .style("font-size", "12px")
          .style("pointer-events", "none");
      });
  } else {
    const isBar = [ChartType.Bar, ChartType.GroupBar, ChartType.StackBar].includes(shape);
    // 创建图形上的标签 todo:代码待完善
    const labels = svg
      .append("g")
      .attr("class", "chart-label") // 添加类名方便后续选择
      .attr("text-anchor", (isBar && invert) ? "start" : "middle")
      .style("opacity", 0)
      .selectAll("text")
      .data(options.dataset)
      .join("text")
      .attr("x", (d: any, i: number) => {
        if (isBar && invert) {
          // attrX1 声明为 as any后此处不会再报错误，否则需要下面一行处理
          const attrX1Value = typeof attrX1 === 'function' ? attrX1(d, i) : attrX1;
          return attrX1Value + 4
        } else {
          // attrX1 声明为 as any后此处不会再报错误，否则需要下面一行处理
          const attrX1Value = typeof attrX1 === 'function' ? attrX1(d, i) : attrX1;
          return Math.round(attrX1Value + measLabelMaxWidth + attrWidth0 / 2)
        }
      })
      .attr("y", (d: any) => {
        if (isBar && invert) {
          return attrY1(d) - 7
        } else {
          if ((attrY1(d) - attrY0) > -20) {
            return attrY1(d) - 4
          } else {
            return attrY1(d) + 16
          }
        }
      })
      .text((d: any) => {
        return d[measIndex + 1]
      })
      .attr("fill", (d: any) => {
        return 'black'
      })
      .style("pointer-events", "none");
  }

}

function createMultiDimAxis(
  dimPadding: number,
  dimMaxWidths: Array<number>,
  maxDimLevel: number,
  currlevel: number,
  options: any,
  svg: any,
  measLabelMaxWidth: number,
  dimRange: Array<number>,
  xAxis: any,
  dimSplit: string
) {
  // 添加分组【x轴】
  const arrTickInfo = getDimAxisTicksData(options.dataset, currlevel, dimSplit);

  const xMulti = d3
    .scaleBand()
    .domain(arrTickInfo)
    .range(dimRange)
    .padding(dimPadding)

  const xLine = d3
    .scaleBand()
    .domain(arrTickInfo)
    .range(dimRange)
    .padding(dimPadding)

  let dimTextOffset = options.axis.invertAxis ? -4 : 6;
  let callAxis = null;
  let callAxisLine = null;
  let textAxisTranslate = null;
  let lineAxisTranslate = null;
  let splitLineTranslate = null;
  // x轴分组分割线
  const tkValues = arrTickInfo.filter(d => { if (d.split(options.axis.dimSplit).at(-1) == 'true') return d });
  if (options.axis.invertAxis) {
    // 当前层级起始 X 坐标（轴线位置 = 当前层左边缘）
    const axisX = d3.sum(dimMaxWidths.slice(0, dimMaxWidths.length - currlevel)) + options.svg.margin.left;
    // === 关键：标签向右偏移一个层级的宽度 ===
    const labelX = d3.sum(dimMaxWidths.slice(0, dimMaxWidths.length - currlevel + 1)) + options.svg.margin.left; // 向右偏移当前层宽度 → 到达当前层右边缘
    // === 刻度线长度逻辑不变 ===
    let tickSize;
    if (currlevel === 2) {
      tickSize = dimMaxWidths[dimMaxWidths.length - 2] + (dimMaxWidths[dimMaxWidths.length - 1] || 0); // w2 + w1
    } else {
      tickSize = dimMaxWidths[dimMaxWidths.length - currlevel]; // w_k
    }
    // 设置标签轴平移：标签整体向右移动
    textAxisTranslate = `translate(${labelX},${-measLabelMaxWidth})`;
    // 创建标签轴
    callAxis = d3.axisLeft(xMulti).tickFormat(d => String(d)).tickSize(0);
    callAxisLine = d3.axisRight(xLine).tickValues(tkValues.slice(1)).tickSize(tickSize).tickFormat(() => '');
    // 刻度线轴平移（保持在轴线位置，不变）
    lineAxisTranslate = `translate(${axisX},${-measLabelMaxWidth})`;
    splitLineTranslate = `translate(0,${-Math.round((xAxis.bandwidth() * (1 + dimPadding)) / 2)})`;
  } else {
    let axisSplitTranslateX = options.svg.height - options.axis.defMultiAxisSpace * (maxDimLevel - currlevel) - options.svg.margin.bottom
    textAxisTranslate = `translate(${measLabelMaxWidth},${axisSplitTranslateX - options.axis.defMultiAxisSpace})`;
    callAxis = d3.axisBottom(xMulti).tickFormat(function (d) {
      // return d.startsWith('null') ? '' : d.split(options.axis.dimSplit)[0]
      return d
    }).tickSize(0)
    const tickSize = currlevel == 2 ? options.axis.defMultiAxisSpace * 2 : options.axis.defMultiAxisSpace;
    callAxisLine = d3.axisTop(xLine).tickValues(tkValues.slice(1)).tickSize(tickSize).tickFormat(() => "")    // 隐藏标签
    lineAxisTranslate = `translate(${measLabelMaxWidth},${axisSplitTranslateX})`;
    splitLineTranslate = `translate(${-Math.round((xAxis.bandwidth() * (1 + dimPadding) / 2))}, 0)`;
  }
  svg
    .append('g')
    .attr('class', '.axis-line')
    .attr('stroke-width', currlevel > 2 ? 0 : 1)
    .attr('transform', textAxisTranslate)
    .call(callAxis)
    .selectAll('.tick text')
    .attr('transform', `translate(0,${dimTextOffset})`)
    .attr('dx', (d: any) => {
      if (!options.axis.invertAxis && d.split(options.axis.dimSplit)[1].startsWith('true')) {
        return Math.round((options.svg.width - options.svg.margin.left - options.svg.margin.right) / (xMulti.domain().length * 2)) || 0
      }
      return -4 // 设置dx导致覆盖默认配置，所以需要自定义设置
    })
    .attr('dy', (d: any) => {
      if (options.axis.invertAxis && d.split(options.axis.dimSplit)[1].startsWith('true')) {
        let dyOffset = 8;
        if (d.split(options.axis.dimSplit)[1].startsWith('true')) {
          dyOffset = xAxis.bandwidth() - 8;
          // console.log(d, dyOffset)
        }
        // const dyOffset = Math.round((options.svg.height - options.svg.margin.top - options.svg.margin.bottom) / (xMulti.domain().length * 2));
        return dyOffset;
      }
      return 8 // 设置dy导致覆盖默认配置，所以需要自定义设置
    })
    .text((d: any) => {
      let text = d.split(options.axis.dimSplit)[0]
      return text.startsWith('null') ? '' : text
    })

  svg
    .append('g')
    .attr('class', '.axis-line')
    .attr('stroke-width', 1)
    .attr('transform', lineAxisTranslate)
    .call(callAxisLine)
    .selectAll('.tick line')
    .attr('stroke', options.svg.lineColor)
    .attr('transform', splitLineTranslate)
}

/** 生成多级类目轴数据：标签名称(不显示:null)、是否偏移、是否显示刻度 */
export function getDimAxisTicksData(dataset: Array<any>, level: number, dimSplit: string) {
  let tempLabel = "";
  let counter = 0;
  let axisData = [] as Array<string>;

  for (let i = 0; i <= dataset.length; i++) {
    let label = ''
    i == dataset?.length || (label = dataset[i][0].split(dimSplit).at(-level))
    axisData.push(`null${dimSplit}false${i}${dimSplit}false`);    // ${i} 为了实现刻度标签字符串数组不重复
    if (tempLabel == "") {
      // 初始化
      tempLabel = label;
      counter++;
      continue;
    }
    if (tempLabel != label) {
      // 标签重复结束，修改标签标记，先判断奇数偶数，
      let isOffset = counter % 2 == 0
      let centerIndex = isOffset ? counter / 2 + 1 : Math.round(counter / 2);
      axisData.splice(~centerIndex, 1, `${tempLabel}${dimSplit}${isOffset}${i}${dimSplit}false`) // 显示标签
      let tick = axisData.at(~counter); // 找到刻度位置
      tick = tick?.slice(0, -5) + "true";
      axisData.splice(~counter, 1, tick)

      tempLabel = label;
      counter = 1;
    } else {
      counter++;
    }
  }
  axisData.pop(); // 删除最后一个辅助空元素
  // console.log(axisData)
  return axisData;
}

