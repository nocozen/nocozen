import { inject, Ref } from 'vue';
import { UpdateVglConfig, UpdateCompConfig,UpdateLayoutEvent,DeleteComp, UpdateFlowDef, UpdateWbEvent } from './type';
import { ProviderName } from '@/enum';

export function useModuleInject() {
  const layoutNodes = inject<Array<Meta.LayoutNode> | undefined>(ProviderName.LayoutsProvide, undefined);
  const compConfigs = inject<Array<Meta.CompBase> | undefined>(ProviderName.CompConfigsProvide, undefined);
  const formConfig = inject<Ref<Meta.FormConfig> | undefined>(ProviderName.FormConfigProvider, undefined);
  const vglConfig = inject<Ref<Partial<Meta.FormLayoutConfig>> | undefined>(ProviderName.VglProvide, undefined);
  const defVglConfig = inject<Ref<Meta.FormLayoutConfig> | undefined>(ProviderName.DefVglProvide, undefined);
  const layoutConfig = inject<Ref<Meta.FormLayoutConfig> | undefined>(ProviderName.LayoutConfigProvide, undefined);

  const updateVglConfig = inject<UpdateVglConfig | undefined>(ProviderName.UpdateVglConfigProvide, undefined);
  const updateCompConfig = inject<UpdateCompConfig | undefined>(ProviderName.UpdateCompConfigsProvide, undefined);
  const updateLayout: UpdateLayoutEvent | undefined = inject<UpdateLayoutEvent | undefined>(ProviderName.UpdateLayoutsProvider, undefined)!;
  const updateWbLayout: UpdateWbEvent | undefined = inject< UpdateWbEvent | undefined>(ProviderName.UpdateLayoutsProvider, undefined)!;
  const deleteComp = inject<DeleteComp | undefined>(ProviderName.DeleteCompProvide, undefined);
  const openChartEditor = inject<any>(ProviderName.OpenChartEditorProvide, undefined);
  const flowDefs = inject<Array<Meta.FlowDefinition> | undefined>(ProviderName.FlowDefsPorvide, undefined);

  const currSelectCompId = inject<Ref<string> | undefined>(ProviderName.CurrSelectCompIdProvide, undefined);
  const currSelectFlowEl = inject<Ref<any> | null>(ProviderName.CurrSelectFlowElPovide, null);
  const updateFlowDef = inject<UpdateFlowDef | undefined>(ProviderName.UpdateFlowDefProvide, undefined);

  const currModuleNode = inject<Ref<Meta.ModuleNode> | undefined>(ProviderName.CurrModuleNodeProvide, undefined);
  return {
    updateVglConfig,
    defVglConfig,
    vglConfig,
    updateWbLayout,
    currModuleNode,
    updateFlowDef,
    currSelectFlowEl,
    flowDefs,
    openChartEditor,
    layoutNodes,
    formConfig,
    compConfigs,
    layoutConfig,
    currSelectCompId,
    updateLayout,
    updateCompConfig,
    deleteComp
  }
}
