<template>
  <NFlex class="w-full border-1 relative overflow-hidden" :size="0" id="formula-editor">
    <NFlex class="w-full bg-gray-300/50 h-8 px-2" align="center" justify="space-between">
      <NFlex v-if="title">{{ title }} = </NFlex>
      <NFlex>
        <ButtonIcon @click="onDebugClick" title="调试" size="tiny" icon="codicon:debug-line-by-line"></ButtonIcon>
      </NFlex>
    </NFlex>
    <NFlex :size="0" class="w-full" :class="{ hasTitle: title }" :key="`${refreshKey}_${refreshNum}`">
      <Codemirror v-model="formulaValue" class="formula-editor-codemirror"
        :style="{ height: `${height}px`, minHeight: '200px', width: '100%' }" :autofocus="true" :indent-with-tab="true"
        :tab-size="2" :extensions="extensions" :disabled="disabled" :placeholder="placeholder || '请输入...'"
        @ready="handleReady" />
    </NFlex>
    <NFlex class="w-full border-t-1" :size="0">
      <!--变量 variables -->
      <slot name="variable" :insert="insertVariables">
        <NFlex vertical class="w-66" :size="0">
          <NFlex class="w-full border-b-1 h-8" align="center">
            <NInput size="small" :bordered="false" placeholder="搜索">
              <template #prefix>
                <SvgIcon icon="mingcute--search-line" />
              </template>
            </NInput>
          </NFlex>
          <NFlex class="h-57" :size="0">
            <SmoothScrollbar>
              <NList class="w-full" clickable hoverable :show-divider="false">
                <NListItem style="padding: 4px 8px" class="m-1" v-for="item in variables" :key="item.value"
                  @click="insertVariables(item.value)">
                  <NFlex align="center" justify="space-between" :size="0">
                    <span class="variable-item-label">{{ item.label }}</span>
                    <NTag :bordered="false" size="small" :type="InputTypeColor[item.type] as any" v-if="item.type">
                      {{ InputTypeCn[item.type] }}</NTag>
                  </NFlex>
                </NListItem>
              </NList>
            </SmoothScrollbar>
          </NFlex>
        </NFlex>
      </slot>
      <!--数学方法 maths-->
      <slot name="math" :insert="insertMaths">
        <NFlex :size="0">
          <NFlex class="w-46 h-65 border-l-1 border-r-1" :size="0">
            <NFlex vertical class="w-46" :size="0">
              <NFlex class="w-full border-b-1 h-8" align="center" :size="0">
                <NInput size="small" :bordered="false" placeholder="搜索">
                  <template #prefix>
                    <SvgIcon icon="mingcute--search-line" />
                  </template>
                </NInput>
              </NFlex>
              <NFlex class="w-full h-57">
                <SmoothScrollbar class="p-1">
                  <NCollapse :default-expanded-names="[]"
                    style="--n-divider-color:transparent;--n-title-padding: 4px;--n-item-margin:0">
                    <NCollapseItem class="" title="数学函数" name="1">
                      <NButton v-for="item in FORMULA_Number" :key="item.name" @mouseenter="activeMath = item"
                        @click="insertMaths(item.name)" class="w-full justify-start pl-6" quaternary size="small">{{
                          item.name
                        }}
                      </NButton>
                    </NCollapseItem>
                    <NCollapseItem title="文本函数" name="2">
                      <NButton v-for="item in FORMULA_Text" :key="item.name" @mouseenter="activeMath = item"
                        @click="insertMaths(item.name)" class="w-full justify-start pl-6" quaternary size="small">{{
                          item.name
                        }}
                      </NButton>
                    </NCollapseItem>
                    <NCollapseItem title="日期函数" name="3">
                      <NButton v-for="item in FORMULA_Date" :key="item.name" @mouseenter="activeMath = item"
                        @click="insertMaths(item.name)" class="w-full justify-start pl-6" quaternary size="small">{{
                          item.name
                        }}
                      </NButton>
                    </NCollapseItem>
                    <NCollapseItem title="逻辑函数" name="4">
                      <NButton v-for="item in FORMULA_Logic" :key="item.name" @mouseenter="activeMath = item"
                        @click="insertMaths(item.name)" class="w-full justify-start pl-6" quaternary size="small">{{
                          item.name
                        }}
                      </NButton>
                    </NCollapseItem>
                    <NCollapseItem title="高级函数" name="5">
                      <NButton v-for="item in FORMULA_Advanced" :key="item.name" @mouseenter="activeMath = item"
                        @click="insertMaths(item.name)" class="w-full justify-start pl-6" quaternary size="small">{{
                          item.name
                        }}
                      </NButton>
                    </NCollapseItem>
                  </NCollapse>
                </SmoothScrollbar>
              </NFlex>
            </NFlex>
          </NFlex>
          <NFlex class="w-79.5">
            <NFlex class="w-full h-65" :size="0">
              <NFlex vertical class="w-full">
                <NFlex class="w-full border-b-1 h-8 px-4" align="center">
                  <span>{{ activeMath.name }}</span>
                </NFlex>
                <NFlex class="w-full h-57">
                  <SmoothScrollbar class="p-1">
                    <NFlex vertical v-if="activeMath" class="p-2">
                      <p class="" v-if="activeMath.desc">{{ activeMath.desc }}</p>
                      <p class="" v-if="activeMath.usage">用法：{{ activeMath.usage }}</p>
                      <p class="" v-if="activeMath.example">示例：{{ activeMath.example }}</p>
                    </NFlex>
                  </SmoothScrollbar>
                </NFlex>
              </NFlex>
            </NFlex>
          </NFlex>
        </NFlex>
      </slot>
    </NFlex>
    <NDrawer v-model:show="showModal" to="#formula-editor"
      content-style="--n-header-padding: 8px;--n-title-font-size:14px" :trap-focus="false" :block-scroll="false"
      :width="300" placement="right" closable @update:show="onDrawShow">
      <NDrawerContent title="调试面板" closable body-content-style="padding: 0;margin:0">
        <SmoothScrollbar>
          <NFlex vertical class="h-full w-full p-4">
            <template v-for="v in variables">
              <NFormItem class="mb-1" v-if="InputType.Number == v.type" :label="v.label" :show-feedback="false">
                <NInputNumber size="small" v-model:value="formulaForm[v.value]" class="w-full" :show-button="false"
                  clearable />
              </NFormItem>
              <NFormItem class="mb-1" v-else-if="InputType.Timestamp == v.type" :label="v.label" :show-feedback="false">
                <NDatePicker size="small" v-model:value="formulaForm[v.value]" class="w-full" :show-button="false"
                  clearable />
              </NFormItem>
              <NFormItem class="mb-1" v-else :label="v.label" :show-feedback="false">
                <NInput size="small" v-model:value="formulaForm[v.value]" clearable />
              </NFormItem>
            </template>
            <ButtonIcon @click="onExecTest" class="w-full my-4" type="info" level="" size="small"
              icon="mdi:play-circle-outline" title="执行测试" />
            <span class="w-full">执行结果：</span>
            <span class="w-full">{{ debugResult }}</span>
          </NFlex>
        </SmoothScrollbar>
      </NDrawerContent>
    </NDrawer>
  </NFlex>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { InputType, InputTypeColor, InputTypeCn } from '@/enum';
import {
  autocompletion,
  closeBrackets,
  type Completion,
  pickedCompletion
} from '@codemirror/autocomplete';
import { Codemirror } from 'vue-codemirror';
import { shallowRef, ref, computed, watch, type PropType } from 'vue';
import { createMathPlaceholder } from '../utils/placeholder';
import { FORMULA_Number, FORMULA_Text, FORMULA_Date, FORMULA_Logic, FORMULA_Advanced } from '../utils/formulaList';
import { uuid } from '../utils/index';
import { VARIABLE_REG } from '../utils/formula';
import type { FormulaItem, VariableItem } from '../interfaces';
import { evalFormula } from '../utils/formula';
import { NButton, useModal } from 'naive-ui';
import * as _ from 'lodash-es';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  isDark: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  height: {
    type: Number,
    default: 200
  },
  placeholder: {
    type: String,
    default: ''
  },
  // 变量列表
  variables: {
    type: Array as PropType<VariableItem[]>,
    default: () => []
  },
  // 支持的math方法
  // mathList: {
  //   type: Array as PropType<MathItem[]>,
  //   default: () => FORMULA_MATHS
  // },
  formula: {
    type: String,
    default: ''
  }
})

defineSlots<{
  math(props: { insert: (mathName: string) => void }): any
  variable(props: { insert: (varName: string) => void }): any
}>()

const formulas = FORMULA_Number.concat(FORMULA_Text, FORMULA_Date, FORMULA_Logic, FORMULA_Advanced);
const formulaNames = formulas.map((item: FormulaItem) => item.name)
const showModal = ref(false);
const refreshKey = uuid();
const refreshNum = ref(0);
const debugResult = ref('')
// 输出值
const formulaValue = ref('')
// 当前editor值
const editor = shallowRef<EditorView>()
// 当前聚焦的math
const activeMath = ref<FormulaItem>(FORMULA_Number[0]);

const formulaForm = ref<{ [key: string]: any }>({} as any);

const init = () => {
  formulaValue.value = props.formula;
}
init();

const onDrawShow = (show: boolean) => {
  if (!show) {
    props.variables.forEach((v: any) => {
      formulaForm.value[v.value] = null;
    })
  }
}

const getDefValueByType = (type: string) => {
  const defText = '文本';
  const defNumber = 10;
  const defDate = Date.now();
  switch (type) {
    case 'text':
      return defText;
    case 'number':
      return defNumber;
    case 'date':
      return defDate;
    default:
      return null;
  }
}

// 备用
function setFormulaForm(str: string) {
  // 使用带有全局标志 g 的正则表达式匹配所有 ${} 包括的变量名
  const regex = /\$\{([^}]+)\}/g;
  const matches = str.match(regex);
  const variableNames = [] as any;

  // 检查是否有匹配项
  if (matches) {
    // 使用 forEach 方法来处理每个匹配项
    matches.forEach(match => {
      // 使用另一个正则表达式来从匹配项中提取变量名（捕获组的内容）
      const variableNameMatch = match.match(/\{([^}]+)\}/);
      if (variableNameMatch) {
        // 将变量名添加到数组中
        variableNames.push(variableNameMatch[1]);
      }
    });
  }

  return variableNames;
}

// 备用
function getFormulaForm(tempStr: string) {
  // 使用正则表达式匹配 ${} 中的内容
  const regex = /\$\{([^}]+)\}/g;
  let match;
  const variables = [];
  while ((match = regex.exec(tempStr)) !== null) {
    variables.push(match[1]); // match[1] 是捕获组中的内容，即 {} 中的字符串
  }
  return variables;
}

function initFormulaForm(tempStr: string) {
  // 使用正则表达式匹配 ${} 中的内容
  const regex = /\$\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(tempStr)) !== null) {
    formulaForm.value[match[1]] = null
  }
}

const onExecTest = () => {
  let data = {} as any;
  props.variables.forEach((v: any) => {
    data[v.value] = formulaForm.value[v.value];
  })
  try {
    debugResult.value = evalFormula(
      formulaValue.value,
      (text: any) => {
        return `['${text}']`
      },
      data
    )
  } catch (error) {
    console.error('formula error >>>', error)
  }
}

const onDebugClick = () => {
  if (formulaValue.value) {
    initFormulaForm(formulaValue.value);
    // let tempVars = getTemplateVar(formulaValue.value);
    // tempVars.forEach((t: string) => formulaForm.value[t] = null)
    showModal.value = true;
  } else {
    window.$message?.warning("请先编辑公式")
  }
}

const variablesVals = computed(() => {
  return props.variables.map(item => item.value)
})

const MATH_REG = computed(() => {
  return new RegExp(`${formulaNames.join('|')}`, 'g')
})

// 变量高亮
const variablePlaceholder = createMathPlaceholder(
  VARIABLE_REG,
  match => {
    const val = match[1]
    const variable = props.variables.find(item => item.value === val)
    return (variable && variable.label) || '不可用字段'
  },
  'variable'
)

// 函数高亮
const mathsPlaceholder = createMathPlaceholder(
  MATH_REG.value,
  match => {
    return match[0]
  },
  'mathfunc'
)

// 函数的自动提示
const mathsCompletions: Completion[] = formulas.map(item => {
  return {
    label: item.name,
    type: 'keyword',
    apply: (view: EditorView, completion: Completion, from: number, to: number) => {
      view.dispatch({
        changes: {
          from,
          to,
          insert: `${completion.label}()`
        }
      })
      let cursor = editor.value?.state.selection.main.head || 0
      view.dispatch({
        selection: { anchor: cursor - 1 },
        annotations: pickedCompletion.of(completion)
      })
    }
  }
})

/**
 * code自动提示
 * @param context
 */
const autoCompletions = (context: any) => {
  let before = context.matchBefore(/\w+/)
  if (!context.explicit && !before) return null

  return {
    from: before ? before.from : context.pos,
    options: [...mathsCompletions],
    validFor: /^\w*$/
  }
}

// codemirror extensions
const extensions = computed(() => {
  const list = [
    javascript(),
    closeBrackets(),
    autocompletion({ override: [autoCompletions] }),
    variablePlaceholder,
    mathsPlaceholder
  ]
  if (props.isDark) {
    list.push(oneDark)
  }
  return list
})

/**
 * @desc 插入文本
 * @param text
 * @param template
 * @param isFunc 是否是函数
 */
const insertText = (text: string, template: (text: string) => string, isFunc = false) => {
  if (!editor.value) {
    return
  }
  const { from, to } = editor.value.state.selection.main
  const insert = template(text)
  const len = insert?.length
  editor.value.dispatch({
    changes: {
      from,
      to,
      insert
    },
    selection: {
      anchor: from + (isFunc ? len - 1 : len)
    }
  })
  // 聚焦
  editor.value.focus()
}

// 插入变量
const insertVariables = (varName: string) => {
  insertText(varName, text => '${' + text + '}')
}

// 插入math方法
const insertMaths = (mathName: string) => {
  insertText(mathName, name => `${name}()`, true)
}

const handleReady = (payload: {
  view: EditorView
  state: EditorState
  container: HTMLDivElement
}) => {
  editor.value = payload.view
}

const getFormulaValue = () => {
  return formulaValue.value;
}

// 监听变量变化就行刷新
watch(
  () => variablesVals.value,
  () => {
    refreshNum.value++
  },
  {
    deep: true,
    immediate: true
  }
)

defineExpose({
  getFormulaValue,
  insertMaths,
  insertVariables
})

defineOptions({
  name: 'FormulaEditor'
})
</script>

<style lang="scss" scoped>
:deep(.n-collapse .n-collapse-item .n-collapse-item__content-wrapper .n-collapse-item__content-inner) {
  padding-top: 0;
}
</style>
