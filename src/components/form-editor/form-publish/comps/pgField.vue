<template>
  <NFlex class="h-fit w-full">
    <SmoothScrollbar>
      <NTable size="small">
        <thead>
          <tr>
            <th class="w-31 max-w-31">字段</th>
            <th>只读</th>
            <th>编辑</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="w-31 max-w-31">全选</td>
            <td>
              <NCheckbox size="small" />
            </td>
            <td >
              <NCheckbox size="small" />
            </td>
          </tr>
          <!-- <tr>
            <td>胜多负少</td>
            <td>
              <NCheckbox size="small" />
            </td>
            <td>
              <NCheckbox size="small" />
            </td>
          </tr> -->
        </tbody>
      </NTable>
    </SmoothScrollbar>
  </NFlex>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  permGroup: Meta.ModulePermGroup
}

const props = withDefaults(defineProps<Props>(), {
})

const currPg = ref<Meta.ModulePermGroup>({} as any);

const init = () => {
  currPg.value = props.permGroup;
}

init();

// 从顶层provider中inject组件配置中的字段元数据

</script>