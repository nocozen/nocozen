import { FieldBindType } from "@/enum";

export function getShowLink(compConfig: Meta.CompConfig) {
  let result = false;
  if (compConfig.listType && compConfig.listType !== FieldBindType.Cascade) {
    return false;
  }
  if (compConfig.cascadeFilters && compConfig.cascadeFilters?.length > 0) {
    result = true;
  }
  if (compConfig.mappedFieldNames && compConfig.mappedFieldNames?.length > 0) {
    result = true;
  }
  return result;
}