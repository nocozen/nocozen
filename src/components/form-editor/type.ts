
interface BaseConfig {
  i: number,
  type: string,
}

interface InputConfig extends BaseConfig {
  title: string,
  placeHolder: string,
  format: string,
  defValue: any,
}

interface UpdateFlowDef {
  (flowDefUpdate: Meta.FlowDefinition): void;
}

interface UpdateLayoutEvent {  
  (layoutNode: Meta.LayoutNode): void;  
} 

interface UpdateWbEvent {  
  (): void;  
}

interface UpdateCompConfig {  
  (configUpdate: Meta.CompConfig): void;  // configUpdate : 包含所有需要更新的属性和值
} 

interface UpdateVglConfig {  
  (configUpdate: Partial<Meta.FormLayoutConfig>): void; 
}

interface DeleteComp {  
  (uid: number, i: string): void; 
} 

interface SelectedCompIdEvent {
  (i: string): void;  
}

interface ModuleFormEvent {
  (e?: string): void;
}



export { 
  type UpdateVglConfig,
  type UpdateWbEvent,
  type UpdateFlowDef,
  type DeleteComp,
  type ModuleFormEvent,
  type UpdateCompConfig,
  type InputConfig, 
  type BaseConfig, 
  type SelectedCompIdEvent, 
  type UpdateLayoutEvent, 
}