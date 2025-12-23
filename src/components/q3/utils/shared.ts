import * as d3 from 'd3';
import { clipper } from './text';
import { getTextWidth } from './text';
import * as _ from 'lodash-es';
import { ChartType } from '@/enum';


export function findMaxInDataset(dataset: Array<[string, ...number[]]> = []): number {
  // 1. 展平二维数组为一维数组
  const flattened = _.flatten(dataset);

  // 2. 过滤出所有数字元素（不包括字符串形式的数字）
  const numbers = _.filter(flattened, (item): item is number => typeof item === 'number');

  // 3. 如果没有数字，返回NaN，否则返回最大值
  return numbers.length ? _.max(numbers) as number : 0;
}

export function createTooltip(chartContainer: any, fontSize: string) {
  // 先清除所有现有的 chart-label
  d3.select(chartContainer).selectAll('.chart-label').remove();

  return d3
    .select(chartContainer)
    .append('div')
    .attr('class', 'chart-label shadow-md rounded absolute opacity-80 bg-white px-2 py-1')
    .style('font-size', fontSize)
    .style('display', 'none')
    .style("pointer-events", "none");
}

export function findLongestFirstColumn(data: Array<[string, ...number[]]> = []): number {
  return Math.max(...[...new Set(data.map(d => d[0]))].map(text => getTextWidth(text)), 0);
}

export function getLongestString(legend: string[][]) {
  return _.maxBy(_.flatten(legend), 'length') || '';
}

export function createLegend(chartContainer: any, options: any, svg: any, legend: Array<Array<any>>, colors: any, tooltip: any, config: Meta.ChartComp) {
  if (!options.legend.show) return;

  const maxTextWidth = getTextWidth(getLongestString(legend));
  // 图例配置 - 添加动画配置
  const legendConfig = {
    itemWidth: maxTextWidth < 70 ? maxTextWidth : 80,          // 每个图例项的宽度
    itemHeight: 20,         // 图例高度
    itemSpacing: 15,        // 图例项间距
    buttonSize: 20,         // 按钮大小
    buttonPadding: 15,       // 按钮内边距
    colorBlockSize: 12,     // 颜色方块尺寸
    textOffset: 18,         // 文本偏移量
    leftMargin: 20,         // 左侧整体边距
    buttonOpacity: 0.7,     // 按钮默认透明度
    buttonOpacityHover: 1,  // 按钮悬停透明度
    buttonOpacityDisabled: 0.3, // 按钮禁用状态透明度
    animationDuration: 300  // 新增：动画持续时间(毫秒)
  };

  // 计算按钮和内容区域位置
  const leftButtonX = - 10;
  const contentStartX = leftButtonX + legendConfig.buttonPadding;
  const contentWidth = options.svg.width - 2 * (legendConfig.leftMargin);
  const minSize = Math.min(options.svg.width, options.svg.height);
  const legendGroupWidth = (legendConfig.itemWidth + legendConfig.itemSpacing + 10) * legend.length;
  // 计算每页可显示的图例数量
  const itemsPerPage = Math.max(1, Math.floor(contentWidth / (legendConfig.itemWidth + legendConfig.itemSpacing + 10)));
  let currentPage = 0;
  const totalPages = Math.ceil(legend.length / itemsPerPage);
  const currItemsLength = totalPages == 1 ? legend.length : itemsPerPage
  const legendPageWidth = (legendConfig.itemWidth + legendConfig.itemSpacing + 10) * currItemsLength
  const legendGroupPadding = (options.svg.width - legendPageWidth) / 2
  const rightButtonX = legendPageWidth + 4;
  // 处理分组、堆叠时的图例
  const shape = options.chart.shape;

  // 创建图例主容器
  const legendGroup = svg.append("g").attr("class", "legend-container")
  if (shape == ChartType.Pie) {
    // 饼图图例定位 - 真正实现动态居中
    const legendX = - legendPageWidth / 2; // 在viewBox坐标系中居中
    const legendY = minSize / 2 + 10; // 饼图下方间距    
    legendGroup.attr("transform", `translate(${legendX}, ${legendY})`);
  } else if (shape == ChartType.Radar) {
    // 雷达图图例定位 - 实现完美居中
    const padding = 11;
    const centerX = options.svg.width / 2;
    const centerY = (options.svg.height - 20) / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const legendX = centerX - legendPageWidth / 2;  // 基于雷达图中心点计算
    const legendY = centerY + radius + padding;           // 雷达图半径下方20px
    legendGroup.attr("transform", `translate(${legendX}, ${legendY})`);
  } else {
    legendGroup.attr("transform", `translate(${legendGroupPadding}, ${options.svg.height - 30})`);
  }

  // 创建可滚动内容容器
  const legendContent = legendGroup.append("g")
    .attr("transform", `translate(0, 0)`);



  // let legendLength = config.metrics?.length || 0;
  // let legendData = config.metrics?.map((m: Meta.ChartMetric) => [m.label]) || [];


  // 当前显示的图例项引用
  let currentLegendItems: d3.Selection<SVGGElement, unknown, null, undefined>;


  // 绘制图例项（添加动画效果）
  function drawLegendItems() {
    // 计算当前页的起始和结束索引
    const startIdx = currentPage * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, legend.length);
    const pageData = legend.slice(startIdx, endIdx);

    // 更新或创建图例项
    currentLegendItems = legendContent.selectAll(".legend-item")
      .data(pageData, (d: any) => d[0]); // 使用数据项作为key

    // 移除不再需要的图例项（带淡出动画）
    currentLegendItems.exit()
      .transition()
      .duration(legendConfig.animationDuration)
      .style("opacity", 0)
      .remove();

    // 添加新图例项（初始透明）
    const newItems = currentLegendItems.enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(${i * (legendConfig.itemWidth + legendConfig.itemSpacing + 10)}, 0)`)
      .style("opacity", 0);

    // 颜色方块
    newItems.append("rect")
      .attr("width", legendConfig.colorBlockSize)
      .attr("height", legendConfig.colorBlockSize)
      .attr("y", (legendConfig.itemHeight - legendConfig.colorBlockSize) / 2)
      .style("fill", (d: any) => colors(d[0]));

    // 文本
    newItems.each(function (d: any) {
      const fullText = d[0].split(options.axis.dimSplit).join('');
      const displayText = clipper(fullText, legendConfig.itemWidth + 10, options.svg.fontSize);
      const textElement = d3.select(this).append("text")
        .attr("x", legendConfig.textOffset)
        .attr("y", legendConfig.itemHeight / 2)
        .attr("dy", "0.35em")
        .style("font-size", `12px`)
        .text(displayText || '全部')
        .attr('title', fullText || '全部')
        .on('mousemove', function (this: any, event: MouseEvent, d: any) {
          const textElement = d3.select(this).node(); // 获取当前的文本元素
          if (!textElement) return; // 确保元素存在
          // 获取文本元素和容器的位置
          const textBbox = textElement.getBoundingClientRect();
          const containerBbox = chartContainer.getBoundingClientRect();
          // 计算 tooltip 相对于容器的位置；图表非编辑时由于外部容器存在变换布局影响需要减去容器偏移；
          // 不需要再区分编辑、非编辑状态，因为chart组件添加了position: absolute;统一了容器布局类型；
          // const tooltipX = textBbox.left + 20 - (isEditable || containerBbox.left); // 相对于容器的左侧位置
          // const tooltipY = textBbox.top + 18 - (isEditable || containerBbox.top); // 相对于容器的顶部位置减去偏移
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

      // textElement.append("title").text(fullText); // 与tooltip效果一样，但是样式不可修改；
    });

    // 合并新旧元素并应用动画
    currentLegendItems = newItems.merge(currentLegendItems)
      .transition()
      .duration(legendConfig.animationDuration)
      .style("opacity", 1)
      .attr("transform", (d, i) => `translate(${i * (legendConfig.itemWidth + legendConfig.itemSpacing + 10)}, 0)`) as any;
  }

  // 初始绘制（无动画）
  drawLegendItems();

  if (totalPages > 1) {
    // 创建左滚动按钮（保持原有样式不变）
    const leftButton = legendGroup.append("g")
      .attr("class", "legend-scroll-button")
      .attr("transform", `translate(${leftButtonX}, ${legendConfig.itemHeight / 2})`)
      .style("cursor", "pointer")
      .style("opacity", currentPage > 0 ? legendConfig.buttonOpacity : legendConfig.buttonOpacityDisabled)
      .on("mouseover", function (this: any) {
        if (currentPage > 0) d3.select(this).style("opacity", legendConfig.buttonOpacityHover);
      })
      .on("mouseout", function (this: any) {
        d3.select(this).style("opacity", currentPage > 0 ? legendConfig.buttonOpacity : legendConfig.buttonOpacityDisabled);
      })
      .on("click", function () {
        if (currentPage > 0) {
          currentPage--;
          drawLegendItems();
          updateButtonStates();
        }
      });

    // leftButton.append("rect")
    //   .attr("width", legendConfig.buttonSize)
    //   .attr("height", legendConfig.buttonSize)
    //   .attr("rx", 4)
    //   .attr("x", -legendConfig.buttonSize / 2)
    //   .attr("y", -legendConfig.buttonSize / 2)
    //   .style("fill", "#f5f5f5")
    //   .style("stroke", "#ddd");

    leftButton.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text("◀")
      .style("font-size", "14px")   // todo: 样式无效

    // 创建右滚动按钮（保持原有样式不变）
    const rightButton = legendGroup.append("g")
      .attr("class", "legend-scroll-button")
      .attr("transform", `translate(${rightButtonX}, ${legendConfig.itemHeight / 2})`)
      .style("cursor", "pointer")
      .style("opacity", currentPage < totalPages - 1 ? legendConfig.buttonOpacity : legendConfig.buttonOpacityDisabled)
      .on("mouseover", function (this: any) {
        if (currentPage < totalPages - 1) d3.select(this).style("opacity", legendConfig.buttonOpacityHover);
      })
      .on("mouseout", function (this: any) {
        d3.select(this).style("opacity", currentPage < totalPages - 1 ? legendConfig.buttonOpacity : legendConfig.buttonOpacityDisabled);
      })
      .on("click", function () {
        if (currentPage < totalPages - 1) {
          currentPage++;
          drawLegendItems();
          updateButtonStates();
        }
      });

    // rightButton.append("rect")
    //   .attr("width", 16)
    //   .attr("height", 16)
    //   .attr("rx", 4)
    //   .attr("x", -8)
    //   .attr("y", -8)
    //   .style("fill", "blue")
    //   .style("stroke", "#ddd");

    rightButton.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(">")
      .text("▶")
      .style("font-size", "14px")   // todo: 样式无效

    // 更新按钮状态（保持不变）
    function updateButtonStates() {
      leftButton
        .style("opacity", currentPage > 0 ? legendConfig.buttonOpacity : legendConfig.buttonOpacityDisabled)
        .style("cursor", currentPage > 0 ? "pointer" : "default");

      rightButton
        .style("opacity", currentPage < totalPages - 1 ? legendConfig.buttonOpacity : legendConfig.buttonOpacityDisabled)
        .style("cursor", currentPage < totalPages - 1 ? "pointer" : "default");
    }
    updateButtonStates();
  }
}
