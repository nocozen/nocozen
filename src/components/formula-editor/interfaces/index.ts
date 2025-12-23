export interface VariableItem {
  label: string
  value: string
  type: string
  desc?: string
  inputValue?: any
  [key: string]: any
}

export interface FormulaItem {
  name: string
  type: string
  handler: (...arg: any[]) => any
  desc?: string
  usage?: string
  example?: string
  [key: string]: any
}
