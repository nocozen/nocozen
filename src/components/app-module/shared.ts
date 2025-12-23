import { h } from 'vue';
import { FormElType, MetaField, FormatType } from '@/enum';
import { NTag } from 'naive-ui';
import dayjs from 'dayjs';
import { isEmpty } from 'radashi';
import { getPathByCode } from '@/localdb/divisionHelper';

// 注意：和表单组件绑定的方法有区别，暂时不用合并；和图表表格使用不同的配置；
function formatNumber(value: number, config: Meta.FormComp) {
  if (value === null || value === undefined) return '';
  const { decimalPlaces = 0, formatType } = config;
  let formatResult = Number(value).toFixed(decimalPlaces as any);
  if (formatType == FormatType.ThsNumber) {
    const parts = formatResult.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatResult = parts.join('.');
  }
  if (formatType == FormatType.PerNumber) {
    formatResult += '%';
  }
  return formatResult;
}

export function renderModuleTableComp(row: any, config: Meta.FormComp, nestViewColClick: Function) {
  if (FormElType.NestEditTable == config?.type) {
    return h(
      NTag,
      {
        size: 'small',
        type: 'info',
        // onClick: (e: any) => {
        //   console.log(type), e.stopPropagation()
        // },
      },
      {
        default: () => config?.fieldName in row && row[config?.fieldName]?.length > 0 ? `共${row[config?.fieldName]?.length}条记录` : '无记录'
      }
    );
  } else if (FormElType.NestViewTable == config?.type) {
    // 显示关联配置表单名称，链接类型可打开表单关联过滤结果；
    return h(
      NTag,
      {
        size: 'small',
        type: 'info',
        class: 'cursor-pointer hover:opacity-80',
        onClick: (e: any) => {
          // nestViewColClick(e, row, name);
        },
      },
      {
        default: () => row[config?.fieldName]
      }
    )
  } else if (FormElType.FeDatetime == config?.type) {
    if (config?.formatType == FormatType.Month) {
      return dayjs(row[config?.fieldName]).format('YYYY年MM月');
    } else if (config?.formatType == FormatType.Date) {
      return dayjs(row[config?.fieldName]).format('YYYY年MM月DD日');
    } else {
      return dayjs(row[config?.fieldName]).format('YYYY年MM月DD日 HH:mm:ss');
    }
  } else if ([FormElType.FeSelect, FormElType.FeRadioGroup, FormElType.FeUserSelect, FormElType.FeDeptSelect].includes(config?.type as any)) {
    return config?.fieldName in row && row[config?.fieldName] && row[config?.fieldName].name;
  } else if ([FormElType.FeMulSelect, FormElType.FeCheckboxGroup, FormElType.FeMulUserSelect, FormElType.FeMulDeptSelect].includes(config?.type as any)) {
    let values = Array.isArray(row[config?.fieldName]) ? row[config?.fieldName] : [];
    return h('NScrollbar', { xScrollable: true },
      values.map((v: any) => {
        return h(
          NTag,
          {
            size: 'small',
            type: 'info',
          },
          {
            default: () => v.name
          }
        )
      }))
  } else if (FormElType.FeImage == config?.type) {
    return '图片'
  } else if (FormElType.FeSignature == config?.type) {
    return '签名'
  } else if (FormElType.FeAttachment == config?.type) {
    return '附件'
  } else if (FormElType.FeAddress == config?.type) {
    return getPathByCode(row[config?.fieldName]) || ''
  } else if (FormElType.FeNumber == config?.type) {
    return formatNumber(row[config?.fieldName], config);
  } else {
    return row[config?.fieldName]
  }
}

// 获取表单值
export function getFormData(configs: Array<Meta.FormComp>) {
  // 依据 compConfigs.nodeUid 分组；或过滤；然后处理嵌套；
  const configGroup = {} as any;
  configs?.forEach((config: any) => {
    if (config.nodeUid in configGroup) {
      configGroup[config.nodeUid].push(config);
    } else {
      configGroup[config.nodeUid] = [config]
    }
  })

  let formData = {} as any;
  const formMeta = {} as any;
  // 根据是否存在FeDataSelect判断是否树形数据，树形需添加parent_id，suf_id
  configGroup[0]?.forEach((config: Meta.FormComp) => {
    // 只处理顶层布局；嵌套表单已经赋值给顶层组件不需要再处理；
    // 标签页组件需要处理
    if (FormElType.NestTabPane == config.type) {
      // 组合所有子组件值到当前组件：
      config.nestUid?.forEach((uid: number) => {
        (configGroup[uid] || []).forEach((c: any) => {
          formData[c.fieldName] = c.fieldValue;
          formMeta[c.fieldName] = c.title;
        })
      })
    }

    if (config.type == FormElType.FeDataSelect) {
      formData[MetaField.Parent_id] = config.bindId || null;
    }
    formData[config.fieldName] = config.fieldValue;
    formMeta[config.fieldName] = config.title;
  });
  return { formData, formMeta };
}


