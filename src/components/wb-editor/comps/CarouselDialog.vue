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
const currComp = ref();
const { updateWbLayout } = useModuleInject();

const onCompleteClick = () => {
  refDialog.value.show(false);
}

const deleteImage = async (gfsId: string) => {
  currComp.value.value = currComp.value.value.filter((v: any) => v != gfsId);
  updateWbLayout();
}
const uploadCompleted = async (gfsId: string) => {
  // const result = await fetchUpdateAccount(accountEn.value.acc_id, { avatar: id });
  if (Array.isArray(currComp.value.value)) {
    currComp.value.value.push(gfsId);
  } else {
    currComp.value.value = [gfsId];
  }
  updateWbLayout();
}

const show = (comp: Meta.LayoutComp) => {
  currComp.value = comp;
  gfsIds = toRaw(comp.value);
  refDialog.value.show(true);
}

defineExpose({
  show
})
</script>