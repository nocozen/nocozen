import { type FormulaItem } from '../interfaces'

import { FORMULA_Number, FORMULA_Text, FORMULA_Date, FORMULA_Logic, FORMULA_Advanced } from './formulaList'
import { uuid } from './index'

const isStrBrackets = (val: string) => /[\'\"]{1}/.test(val)
const formulas = FORMULA_Number.concat(FORMULA_Text, FORMULA_Date, FORMULA_Logic, FORMULA_Advanced);
// 变量正则
// export const VARIABLE_REG = /\$\{(.*?)\}/g
// ✅ 推荐定义
export const VARIABLE_REG = /\$\{([^}]+)\}/g;

export const extractVariables = (formula: string): string[] => {
  return Array.from(formula.matchAll(VARIABLE_REG), m => m[1]);
};

/**
 * @desc 检查符号是否关闭
 * @param content
 * @returns
 */
export const isCloseBrackets = (content: string) => {
  const brackets = [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ]
  const contentArr = content.split('')
  if (!contentArr?.length) {
    return true
  }
  const bracketObj: { [key: string]: number } = {}
  const bracketLeft: string[] = []
  const bracketRight: string[] = []

  for (let i = 0; i < brackets?.length; i++) {
    const [left, right] = brackets[i]
    bracketObj[left] = i + 1
    bracketObj[right] = -(i + 1)
    bracketLeft.push(left)
    bracketRight.push(right)
  }
  const stack = []
  for (let i = 0; i < contentArr?.length; i++) {
    const item = contentArr[i]
    const current: number | undefined = bracketObj[item]
    if (!current) {
      continue
    }
    // 当这个符号作为字符串是跳过
    if (i > 0 && isStrBrackets(contentArr[i - 1]) && isStrBrackets(contentArr[i + 1])) {
      continue
    }
    if (bracketLeft.includes(item)) {
      stack.push(current)
    } else if (bracketRight.includes(item)) {
      const stackLen = stack?.length
      // 是否对值匹配
      if (stackLen > 0 && stack[stackLen - 1] + current === 0) {
        stack.pop()
      } else {
        stack.push(current)
      }
    }
  }
  return stack?.length === 0
}

/**
 * @desc 函数计算
 * @param formula 公式内容
 * @param variableHandler 变量处理, 用来取变量所在formulaSope中的值 返回示例 ['id']['d'][0] 则取formulaSope['id']['d'][0]的值
 * @param formulaSope 必填，变量处理通过链的方式取出参数
 * @param formulaMaths 非必填，函数处理
 * @returns
 */
export const evalFormula = (
  formula: string,
  variableHandler: (variable: any) => string,
  variableData: Record<string, any>,
  formulaList: FormulaItem[] = formulas
) => {
  const isPass = isCloseBrackets(formula)
  if (!isPass) {
    throw new Error('括号不匹配')
  }
  const formulaMaths: Record<string, (...arg: any[]) => any> = {}
  const nameList: string[] = formulaList.map(item => {
    const { name, handler } = item
    formulaMaths[name] = handler
    return name
  })
  // 函数正则
  // const MATH_REG = new RegExp(`${nameList.join('|')}`, 'g')
  const MATH_REG = new RegExp(nameList.join('|'), 'g'); // VARIABLE_REG 识别'{}',这里不再加 `${}`
  try {
    // 执行一次随机变量才可访问
    // const mock_variable = variableData && variableData[uuid()]
    // const mock_math = formulaMaths && formulaMaths[uuid()]
    // 处理变量
    let evalFormula = formula.replace(VARIABLE_REG, (match, p1) => {
      return 'variableData' + variableHandler(p1)
    })
    // 处理函数
    evalFormula = evalFormula.replace(MATH_REG, match => {
      return `formulaMaths['${match}']`
    })
    const result = eval(evalFormula)
    return result
  } catch (error) {
    throw error
  }
}

interface TestContext {
  variableData: Record<string, any>;
  formulaMaths: Record<string, (...args: any[]) => any>;
}

export const validateFormula = (
  formula: string,
  variableHandler: (variable: any) => string,
  formulaList: FormulaItem[] = formulas,
  customVariableData?: Record<string, any>
): {
  valid: boolean;
  error?: string;
  context?: TestContext;
  sampleResult?: any;
} => {
  // 1. 括号匹配校验
  const isBracketBalanced = isCloseBrackets(formula);
  if (!isBracketBalanced) {
    return { valid: false, error: '括号不匹配' };
  }

  // 2. 构建 formulaMaths 映射
  const formulaMaths: Record<string, (...args: any[]) => any> = {};
  const nameList: string[] = [];

  for (const item of formulaList) {
    if (!item.name || typeof item.handler !== 'function') {
      return { valid: false, error: `函数配置错误：${item.name || '未知'}` };
    }
    formulaMaths[item.name] = item.handler;
    nameList.push(item.name);
  }

  const MATH_REG = new RegExp(nameList.join('|'), 'g');

  // 3. 提取所有变量
  const variableMatches = Array.from(formula.matchAll(VARIABLE_REG));
  const extractedVariables = [...new Set(variableMatches.map(m => m[1]))]; // 去重

  // 4. 构建 variableData：优先使用 customVariableData，缺失的按前缀生成
  const variableData: Record<string, any> = customVariableData ? { ...customVariableData } : {};

  extractedVariables.forEach(varKey => {
    if (variableData[varKey] !== undefined) return;

    // 根据前缀判断类型
    if (varKey.startsWith('_dt_')) {
      // 时间戳：返回当前时间 ± 随机偏移（秒级）
      variableData[varKey] = Math.floor(Date.now() / 1000) + getRandomInt(-86400, 86400);
    } else if (varKey.startsWith('_nb_')) {
      // 数字：生成随机浮点数，保留1~2位小数
      variableData[varKey] = Number((Math.random() * 1000).toFixed(2));
    } else {
      // 默认：文本类型
      variableData[varKey] = `文本_${varKey}`;
    }
  });

  // 5. 校验函数名是否合法
  const usedMaths = Array.from(formula.matchAll(MATH_REG)).map(m => m[0]);
  const unknownMaths = usedMaths.filter(name => !nameList.includes(name));
  if (unknownMaths?.length > 0) {
    return { valid: false, error: `未知函数：${unknownMaths.join(', ')}` };
  }

  // 6. 构建可执行表达式
  let evalFormula = formula;
  try {
    evalFormula = formula.replace(VARIABLE_REG, (match, p1) => {
      return 'variableData' + variableHandler(p1);
    });
    evalFormula = evalFormula.replace(MATH_REG, match => {
      return `formulaMaths['${match}']`;
    });

    // 执行
    const result = eval(evalFormula);

    // 严格结果校验：禁止 NaN 和 Infinity
    if (typeof result === 'number') {
      if (Number.isNaN(result)) {
        throw new Error('计算结果为 NaN, (不可将非数字与数字计算)');
      }
      if (!Number.isFinite(result)) {
        throw new Error(`计算结果为无穷大 (${result})，可能涉及除零或溢出`);
      }
    }

    // ✅ 校验通过
    return {
      valid: true,
      context: { variableData, formulaMaths },
      sampleResult: result,
    };

  } catch (error: any) {
    return {
      valid: false,
      error: `公式校验失败：${error.message}\n表达式: ${evalFormula}`,
    };
  }
};

// 辅助函数：生成区间随机整数
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}