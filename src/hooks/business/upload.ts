// @/composables/useFileUpload.ts
import { ref, watch, computed, reactive } from 'vue';
import type { UploadCustomRequestOptions } from 'naive-ui';
import { fetchUpLoadFiles, fetchFileUrl, fetchGetFileMeta, fetchRemoveFile } from '@/service/api/upload';
import { sha256 } from 'js-sha256';

interface FileItem {
  id: string;
  name: string;
  gfsId: string;
  status: 'finished';
  url: string;
}


export function useFileUpload(options: any) {
  const props = reactive(options);
  const metaId = computed(() => props.metaId);
  const gfsIds = computed(() => props.gfsIds);
  const token = computed(() => props.token);
  // const { metaId, gfsIds } = options;
  const fileList = ref<FileItem[]>([]);
  const avatar = ref<string | undefined>();

  // 计算文件哈希
  const calcFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return sha256(uint8Array);
  };

  // 删除单个文件（服务端）
  const onRemove = async (data: { file: { id: string } }) => {
    await fetchRemoveFile(data.file.id).catch(console.error);
  };

  // 删除图片卡片（带反馈）
  const onImgDelete = async (id: string) => {
    const result = await fetchRemoveFile(id);
    if ('ok' === result.msg) {
      const index = fileList.value.findIndex((v) => v.gfsId === id);
      if (index > -1) fileList.value.splice(index, 1);

      // 更新头像（取最后一张）
      avatar.value = fileList.value?.length > 0 ? fileList.value[fileList.value.length - 1]?.url : undefined;
      return true;
    }
    return false;
  };

  // 添加或更新文件（去重）
  const pushFieldList = async (gfsId: string) => {
    try {
      let meta = null;
      const metaResult = await fetchGetFileMeta({ gfsId: gfsId }, token.value);
      if ('ok' == metaResult?.msg && metaResult.data?.length == 1) {
        meta = metaResult.data[0].metadata;
      } else {
        return;
      }

      const existingFile = fileList.value.find((f) => f.gfsId === gfsId || f.id === meta.fileId);
      if (existingFile) {
        existingFile.gfsId ||= gfsId;
        existingFile.status = 'finished';   // todo: 可删除
      } else {
        const url = await fetchFileUrl(gfsId, meta.contentType);
        // window.$message?.success('url: ' + url);
        fileList.value.push({
          id: meta.fileId,
          name: meta.aliasName,
          gfsId: gfsId,
          status: 'finished',
          url: url,
        });
      }
      // console.log(fileList.value)
      // 更新头像
      if (fileList.value?.length > 0) {
        let url = fileList.value[fileList.value.length - 1]?.url;
        if (url) {
          avatar.value = url;
        } else {
          const url = await fetchFileUrl(gfsId, meta.contentType);
          avatar.value = url || ""
        }
      }
    } catch (error) {
      console.error(`获取文件错误: ${gfsId}:` + error);
    }
  };

  // 自定义上传逻辑
  const upLoadFile = async ({ file, onError, onProgress, onFinish }: UploadCustomRequestOptions) => {
    if (!file.file) {
      onError();
      return null;
    };

    const formData = new FormData();
    try {
      const hash = await calcFileHash(file.file);
      formData.append('f1.metaId', metaId.value || '');
      formData.append('f1.checkCode', hash);
      formData.append('f1.fileId', file.id);
      formData.append('f1.aliasName', file.name);
      file.type && formData.append('f1.contentType', file.type);
      formData.append('f1.file', file.file as File);
      const result = await fetchUpLoadFiles(formData, metaId.value);
      if (result?.msg === 'ok' && result.data?._id) {
        // ✅ 上传成功：保存到业务列表
        await pushFieldList(result.data._id);
        // ✅ 通知 NUpload：上传完成
        onFinish();
        return result.data?._id
      } else {
        // ✅ 上传失败：通知 NUpload
        onError();
        return null;
      }
    } catch (err) {
      console.error('文件上传失败:', err);
      // ✅ 捕获异常，通知 NUpload
      onError();
      return null;
    }
  };

  const updateFileList = async () => {
    if (metaId.value) {
      let metaResult = null;
      try {
        metaResult = await fetchGetFileMeta({ metaId: metaId.value, gfsId: gfsIds.value });
      } catch (error) {
        console.error(`获取文件元数据错误: ${metaId.value}:` + error);
      }
      if ('ok' === metaResult?.msg && Array.isArray(metaResult.data)) {
        await Promise.all(metaResult.data.map((f: any) => pushFieldList(f._id)));
      }
    } else if (gfsIds.value && gfsIds.value?.length > 0) {
      await Promise.all(gfsIds.value.map((id: string) => pushFieldList(id)));
    }
  };

  // 初始化加载文件列表
  const initFileList = async () => {
    fileList.value = [];
    await updateFileList();
  };

  // 初始加载
  if (metaId.value || (gfsIds.value && gfsIds.value?.length > 0)) {
    initFileList();
  }

  return {
    // 响应式数据
    fileList,
    avatar,
    upLoadFile,
    onRemove,
    onImgDelete,
    pushFieldList,
    initFileList,
    updateFileList,
    // 可供父组件 emit
    emitUploadCompleted: (id: string) => { },
    emitDelete: (id: string) => { },
  };
}