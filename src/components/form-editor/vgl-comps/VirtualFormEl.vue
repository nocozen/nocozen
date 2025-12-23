<template>
  <NFlex vertical :class="cptGridItemClass" :size="0">
    <div>
      <GridItemMenu @onMenuClick="onMenuClick" :types="menuTypes" v-if="props.i == currSelectCompId"
        class="absolute px-1.5 h-6 shadow-md z-100 right-0">
      </GridItemMenu>
      <NFlex align="center" :size="0" class="h-8.5 bg-gray-200/50">
        <!-- <SvgIcon v-if="showLink" :icon="QbIcon.Link" class="mr-1 text-base text-gray" /> -->
        <span class="mx-1.5">{{ cptCompConfig?.title }}</span>
      </NFlex>
      <NFlex class="bg-white/30 mx-1 px-2 my-1.5 h-7 border-1 rounded-sm" align="center">
        <span class="flex-1"></span>
        <SvgIcon :icon="FormElTypeIcon[type]" />
      </NFlex>
    </div>
  </NFlex>
</template>

<script setup lang="ts">
import { FormElType, FormElTypeIcon, FormElTypeCn } from '@/enum';
import { useModuleInject } from '../useModuleInject';
import { computed, ref, watch } from 'vue';

interface Props {
  nodeUid: number | undefined,
  i: string,
  type: FormElType,
}

const props = withDefaults(defineProps<Props>(), {
  type: FormElType.FeText
});

const { currSelectCompId, compConfigs, deleteComp } = useModuleInject();
const menuTypes = ref(['delete']);
const compConfig = ref()

// relative 定位的容器中 absolute可以定位子元素并且可以使用right；
let formItemClass = 'relative min-w-24 max-w-48 h-full border-1 hover:border-blue hover:border-dashed duration-300';
let formItemClassEditActive = 'relative min-w-24 max-w-48 h-full border-1 border-dashed border-blue duration-300';

const cptGridItemClass = computed(() => {
  return props.i == currSelectCompId?.value ? formItemClassEditActive : formItemClass
})

const cptCompConfig = computed(() => {
  let config = compConfigs?.find((item: any) => item.i == props.i);
  return config
})

const cptSelected = computed(() => {
  if (props.i == currSelectCompId?.value) {
    return true;
  } else {
    return false;
  }
})

const onMenuClick = (type: string) => {
  if ('delete' == type) {
    deleteComp && props.nodeUid && deleteComp(props.nodeUid, props.i)
  } else if ('edit' == type) {
    // 打开编辑窗口
    // openChartEditor(props.i);
  } else if ('hidden' == type) {
    // props.updateHiddenitems && props.updateHiddenitems(props.i)
  }
}

</script>

<style lang="scss" scoped>
.ngi:hover {
  .gi-menu {
    visibility: visible;
  }
}

.gi-wrap:hover {
  .gi-menu {
    visibility: visible;
  }
}
</style>
