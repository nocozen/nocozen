// composables/useVTable.ts
import { ref,Ref, onBeforeUnmount } from 'vue';
import * as VTable from '@visactor/vtable';

export function useVTable(containerRef: Ref<HTMLElement | null>, options: any) {
  const instance = ref<any>(null);

  const create = () => {
    if (!containerRef.value) return;
    instance.value = new VTable.ListTable(containerRef.value, options);
  };

  const destroy = () => {
    if (instance.value) {
      instance.value.release?.();
      instance.value = null;
    }
  };

  // ✅ 自动释放
  onBeforeUnmount(destroy);

  return { instance, create, destroy };
}

// 使用方法：
// const { instance } = useVTable(containerRef, detailOptions.value);