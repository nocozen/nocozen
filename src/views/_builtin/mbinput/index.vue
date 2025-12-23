<template>
  <NFlex v-if="'i' == type" :size="0" :vertical="true" class="w-full">
    <FileUpload type="image" listType="comp-card" :meta-id="metaId" :token="metaId">
      上传
    </FileUpload>
  </NFlex>
  <NFlex v-else-if="'f' == type" :size="0" :vertical="true" class="w-full h-full">
    <FileUpload type="image" :meta-id="metaId" :token="metaId" listType="img-list" :height="200">
    </FileUpload>
  </NFlex>
  <NFlex v-else-if="'s' == type" vertical class="bg-white">
    <NFlex class="p-4">
      <canvas ref="refCanvas" class="border-1 w-full h-50"></canvas>
    </NFlex>
    <NFlex justify="space-between" class="fixed bottom-0 left-0 right-0 m-4 bg-white">
      <NButton @pointerdown="onClearClick">重写</NButton>
      <NButton @pointerdown="onSaveClick" type="info" :loading="loading">保存</NButton>
    </NFlex>
  </NFlex>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router';
import SignaturePad from 'signature_pad';
import { useFileUpload } from '@/hooks/business/upload';

const fileList = ref([] as any);
const router = useRoute();
const refCanvas = ref();
let signaturePad: any;
const isNotNull = ref(false);
const metaId = ref(router.query.mid?.toString());
const type = ref(router.query.type?.toString());
const loading = ref(false);

const {
  upLoadFile,
} = useFileUpload({
  metaId: metaId.value,
  token: metaId.value,
});

onMounted(() => {
  const canvasElement = refCanvas.value;
  if (!canvasElement) return;
  // 确保 canvas 已经渲染
  if (canvasElement) {
    signaturePad = new SignaturePad(canvasElement, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: "black"
    });

    // 调整画布大小以适应其容器
    adjustCanvasSize();
    window.addEventListener('resize', adjustCanvasSize);
  }
});

// console.log(type.value, metaId.value)
const adjustCanvasSize = () => {
  const canvasElement = refCanvas.value;

  if (signaturePad && canvasElement) {
    let ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvasElement.width = canvasElement.offsetWidth * ratio;
    canvasElement.height = canvasElement.offsetHeight * ratio;
    signaturePad.clear(); // 清除签名以便重新绘制
    canvasElement.getContext('2d').scale(ratio, ratio);
  }
};


const onClearClick = () => {
  if (signaturePad) {
    signaturePad.clear();
  }
};

const uploadSignature = async () => {
  if (!signaturePad || signaturePad.isEmpty()) {
    window.$message?.warning('请先签名');
    return;
  }
  loading.value = true;

  try {
    // 1. 获取签名图片 dataURL（PNG 格式）
    const dataURL = signaturePad.toDataURL('image/png'); // base64
    // 2. 将 dataURL 转为 Blob
    const blob = await (await fetch(dataURL)).blob();
    // 3. 创建 File 对象
    const fileName = `signature_${Date.now()}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    // 4. 构造 UploadCustomRequestOptions
    const uploadOptions = {
      file: {
        file, // 真实 File 对象
        id: `signature_${Date.now()}`,
        name: fileName,
        type: 'image/png',
        status: 'ready',
      },
      onProgress: (progress: { percent: number }) => {
        console.log('上传进度:', progress.percent + '%');
      },
      onSuccess: (response: any) => {
        console.log('上传成功', response);
      },
      onError: (err: any) => {
        console.error('上传失败', err);
        window.$message?.error('签名上传失败', err);
      },
    };

    // 5. 复用你已有的 upLoadFile 方法！
    if (metaId.value) {
      const result = await upLoadFile(uploadOptions as any); // 类型兼容，可忽略
      if (result) {
        window.$message?.success('提交成功');
      } else {
        window.$message?.error('提交失败');
      }
    } else {
      window.$message?.error('metaId不能为空');
    }
    // 6. 可选：清空签名
    signaturePad.clear();
  } catch (error: any) {
    console.error('签名处理失败', error);
    window.$message?.error('签名处理失败:' + error);
  } finally {
    loading.value = false;
  }
};


const onSaveClick = async () => {
  if (signaturePad.isEmpty()) {
    window.$message?.warning("请先书写签名");
  } else {
    await uploadSignature()
  }
};



</script>