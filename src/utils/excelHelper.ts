import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';


// 【注意】开发环境http报错，生产https环境不会报错
export async function exportObjectsToExcel(data: any[], fileName: string = '数据导出') {
  const fullFileName = `${fileName}_${new Date().toLocaleDateString()}.xlsx`
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '仟伯软件零代码搭建平台';
  workbook.created = new Date();

  // 添加工作表
  const worksheet = workbook.addWorksheet(fileName);
  // 添加表头
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // 设置表头样式
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // 添加数据行
  data?.forEach((item) => {
    const rowData = headers.map(header => item[header]);
    worksheet.addRow(rowData);
  });

  // 自动调整列宽
  worksheet.columns?.forEach((column: any) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell: any) => {
      const columnLength = cell.value ? cell.value.toString()?.length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2; // 添加一些额外的空间
  });
  // 生成Excel文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fullFileName);
}

// 【注意】开发环境http报错，生产https环境不会报错
export async function exportArrayToExcel(data: any[], fileName: string = '数据导出') {
  const currDate = dayjs(new Date()).format('YYYYMMDD');
  const fullFileName = `${fileName}_${currDate}.xlsx`
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '仟伯软件零代码搭建平台';
  workbook.created = new Date();

  // 添加工作表
  const worksheet = workbook.addWorksheet(fileName);

  // 添加数据行
  data?.forEach((item) => {
    worksheet.addRow(item);
  });

  // 设置表头样式
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // 自动调整列宽
  worksheet.columns?.forEach((column: any) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell: any) => {
      const columnLength = cell.value ? cell.value.toString()?.length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2; // 添加一些额外的空间
  });

  // 生成Excel文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fullFileName);
}

