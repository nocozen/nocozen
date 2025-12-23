<template>
  <NFlex :size="0" class="w-full h-full">
    <NFlex v-if="'avatar' == type" align="center">
      <NUpload v-model:file-list="fileList" :custom-request="onUpLoadFile" @remove="onRemove" :action="undefined"
        :auto-upload="false" :default-file-list="fileList" list-type="image" :show-file-list="false">
        <NAvatar class="bg-blue" round object-fit="fill" :size="52" :src="avatar">
          <template #default v-if="!avatar">
            <SvgIcon icon="mdi:account-tie" class="text-4xl" />
          </template>
        </NAvatar>
      </NUpload>
    </NFlex>

    <template v-else-if="'image' == type">
      <NUpload v-if="'comp-card' == listType" v-model:file-list="fileList" :custom-request="onUpLoadFile"
        @remove="onRemove" :action="undefined" :auto-upload="false" :default-file-list="fileList" list-type="image-card"
        :showTrigger="showTrigger" :show-remove-button="showTrigger">
        <slot></slot>
      </NUpload>

      <NUpload v-else-if="'img-list' == listType" abstract v-model:file-list="fileList" :custom-request="onUpLoadFile"
        @remove="onRemove" :action="undefined" :auto-upload="false" :default-file-list="fileList" list-type="image"
        class="[&_.n-upload-trigger]:flex" :showTrigger="showTrigger" :show-remove-button="showTrigger">
        <NFlex vertical class="w-full" v-bind="$attrs">
          <NFlex v-if="showTrigger" class="w-full">
            <NUploadTrigger #="{ handleClick }" abstract>
              <NButton @click="handleClick" size="small" class="w-full flex-1">上传</NButton>
            </NUploadTrigger>
            <slot></slot>
          </NFlex>
          <NFlex class="w-full" :style="{ height: `${height - 50}px` }" :size="0">
            <SmoothScrollbar>
              <NUploadFileList />
            </SmoothScrollbar>
          </NFlex>
        </NFlex>
      </NUpload>

      <NFlex v-else-if="'wb-card' == listType" vertical class="w-full">
        <NUpload abstract :custom-request="onUpLoadFile" :disabled="fileList?.length >= maxSize"
          :showTrigger="showTrigger" :action="undefined" :show-remove-button="showTrigger">
          <NButtonGroup>
            <NUploadTrigger #="{ handleClick }" abstract>
              <NButton @click="handleClick" size="small" class="w-full">
                上传图片<span class="text-blue ml-2">{{ `${fileList?.length}/${maxSize}` }}</span>
              </NButton>
            </NUploadTrigger>
          </NButtonGroup>
        </NUpload>
        <NFlex class="w-full h-45">
          <SmoothScrollbar>
            <NFlex>
              <template v-for="item in fileList" :key="item.id">
                <NFlex v-if="item.url" class="w-44.5 h-20 border-1 rounded-md relative group">
                  <NButton @click="onDelete(item.gfsId)" class="absolute right-1 top-1 invisible group-hover:visible"
                    size="tiny" circle type="info">
                    <SvgIcon :icon="QbIcon.Delete" />
                  </NButton>
                  <NImage class="rounded-md" object-fit="fill" width="178" height="80" :src="item.url" />
                </NFlex>
              </template>
            </NFlex>
          </SmoothScrollbar>
        </NFlex>
      </NFlex>
    </template>
  </NFlex>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, toRef } from 'vue';
import type { UploadCustomRequestOptions } from 'naive-ui';
import { QbIcon } from '@/enum';
import { useFileUpload } from '@/hooks/business/upload';

interface Props {
  type: 'avatar' | 'image' | 'file';
  listType?: 'img-list' | 'comp-card' | 'wb-card';
  title?: string;
  metaId?: string;
  gfsIds?: string[];
  width?: number;
  height?: number;
  maxAdd?: number;
  maxSize?: number;
  cardHeight?: string;
  showTrigger?: boolean;
  token?: string;
}

const props = withDefaults(defineProps<Props>(), {
  metaId: '',
  type: 'file',
  title: '点击上传',
  width: 100,
  height: 100,
  maxAdd: 1,
  maxSize: 10,
  listType: 'img-list',
  cardHeight: '80px',
  showTrigger: true,
});

interface Emits {
  (e: 'uploadCompleted', gfsId: string): void;
  (e: 'delete', gfsId: string): void;
}

const emit = defineEmits<Emits>();

const {
  fileList,
  avatar,
  upLoadFile,
  onRemove,
  onImgDelete,
  initFileList,
  updateFileList,
} = useFileUpload({
  gfsIds: toRef(props, 'gfsIds'),
  metaId: toRef(props, 'metaId'),
  token: toRef(props, 'token'),
});

const onDelete = async (gfsId: string) => {
  const result = await onImgDelete(gfsId);
  if (result) {
    emit('delete', gfsId);
  }
}

const SIZE_LIMITS = {
  avatar: 1 * 1024 * 1024, // 1MB
  image:  1 * 1024 * 1024, // 1MB
  default: 10 * 1024 * 1024 // 10MB（可根据需求调整）
};

const onUpLoadFile = async ({ file, onError, onProgress, onFinish }: any) => {
  // 提前校验文件大小
  const maxSize = SIZE_LIMITS[props.type as keyof typeof SIZE_LIMITS] || SIZE_LIMITS.default;

  if (file.file?.size && file.file.size > maxSize) {
    const errorMsg = props.type === 'file'
      ? `文件大小不能超过 ${maxSize / (1024 * 1024)}MB`
      : `图片大小不能超过 ${maxSize / (1024 * 1024)}MB`;

    window.$message?.error(errorMsg);

    // 必须调用 onError，通知 n-upload 移除或标记失败
    onError(new Error(errorMsg));

    // 返回 null，不继续上传
    return;
  }

  try {
    // ✅ 文件合法，交给核心上传函数处理
    const result = await upLoadFile({
      file,
      onProgress,
      onError,
      onFinish
    });

    if (result) {
      emit('uploadCompleted', result);
    } else {
      // 上传接口返回空结果也算失败
      const errMsg = '文件上传失败：服务端无响应';
      window.$message?.error(errMsg);
      onError(new Error(errMsg)); // ✅ 通知 UI
    }
  } catch (e: any) {
    const errMsg = e.message || '文件上传失败';
    window.$message?.error(errMsg);
    onError(new Error(errMsg)); // ✅ 通知 UI
  }
};

// 监听 metaId 变化，初始化加载
watch(
  () => props.metaId,
  (newVal) => {
    if (newVal) {
      initFileList();
    }
  },
  { immediate: true }
);

// 清理
onUnmounted(() => {
  // 可选：释放 URL.createObjectURL
  fileList.value.forEach((file) => {
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
  });
});

// 暴露给父组件调用刷新
defineExpose({
  initFileList,
  updateFileList
});
</script>

<style lang="scss" scoped>
:deep(.n-upload-file-list.n-upload-file-list--grid) {
  grid-template-columns: repeat(auto-fill, v-bind(cardHeight));
  height: 100%;
  padding: 0;
}

:deep(.n-upload-file.n-upload-file--image-card-type),
:deep(.n-upload-trigger.n-upload-trigger--image-card) {
  width: v-bind(cardHeight);
  height: v-bind(cardHeight);
}

:deep(.n-upload-file-list .n-upload-file) {
  padding: 0;
}
</style>
