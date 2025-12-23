<template>
  <ModalDialog ref="refDialog" @onCompleteClick="onCompleteClick" title="轮播图配置" key="carouselDialog" modalClass="w-100"
    footer :buttons="['complete']">
    <NFlex class="w-full h-60 p-4">
      <FileUpload :gfsIds="gfsIds" @delete="deleteImage" @uploadCompleted="uploadCompleted" type="image"
        listType="wb-card" title="上传图片"></FileUpload>
    </NFlex>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useModuleInject } from "@/components/form-editor/useModuleInject";

let gfsIds = [] as any;
const refDialog = ref();
const chartId = ref();
const compConfig = ref<Meta.ChartComp>();

const { compConfigs, updateCompConfig } = useModuleInject();

const onCompleteClick = () => {
  refDialog.value.show(false);
}

const deleteImage = async (gfsId: string) => {
  if (compConfig.value && updateCompConfig) {
    compConfig.value.images = compConfig.value.images?.filter((v: any) => v != gfsId);
    updateCompConfig(compConfig.value as Meta.CompConfig);
  }
}
const uploadCompleted = async (gfsId: string) => {
  if (compConfig.value && updateCompConfig ) {
    if (Array.isArray(compConfig.value?.images)) {
      compConfig.value?.images.push(gfsId);
    } else {
      compConfig.value.images = [gfsId];
    }
    updateCompConfig(compConfig.value as Meta.CompConfig);
  }
}

const open = (i: string) => {
  chartId.value = i;
  compConfig.value = compConfigs?.find((item: any) => item.i == i);
  gfsIds = compConfig.value?.images;
  refDialog.value.show(true);
}

defineExpose({
  open
})
</script>