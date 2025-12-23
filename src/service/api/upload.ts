import { isEmpty } from 'radashi';
import { request as nRequest } from '../request';

const enum ImagePath {
  BoardBg = "board-bg",
  CompTitleBg = "comp-title-bg",
  CompBg = "comp-bg",
  ImageSrc = "image-src"
}

export async function fetchRemoveFile(id: string) {
  return await nRequest('/removeFile/' + id, {
    method: "POST",
    meta: { ignoreEncrypt: true } // ✅ 跳过加密，提升文件上传下载相关性能
  })
}

export async function fetchGetFileMeta(filter: Partial<{ metaId: string, gfsId: string }>, token?: string) {
  // 校验逻辑
  if (isEmpty(filter)) {
    return {
      data: null,
      msg: '过滤条件不能为空'
    }
  }
  return await nRequest('/getFileMeta', {
    method: "POST",
    body: filter,
    params: {
      metaId: filter.metaId, // 拼在 URL 后：/getFileMeta?metaId=xxx
      token: token
    },
    meta: { ignoreEncrypt: true } // ✅ 跳过加密，提升文件上传下载相关性能
  })
}

async function getFile(id: string) {
  return await nRequest('/getFile/' + id, {
    method: "POST",
    responseType: 'blob', // 重要：设置响应类型为blob
    meta: { ignoreEncrypt: true } // ✅ 跳过加密
  })
}

export async function fetchUpLoad(files: any) {
  let result: Fetch.UpLoadResult = {
    count: 0,
    msg: "ok"
  }
  return await nRequest<Fetch.UpdateResult>('/upload/image-src', {
    method: "POST",
    body: files,
    meta: {
      upload: true,
      ignoreEncrypt: true
    } // ✅ 跳过加密
  })
}

// 移动段方法
export async function fetchUpLoadFiles(files: any, token?: string) {
  return await nRequest<Fetch.UpdateResult>('/uploadGfs', {
    method: 'POST',
    body: files,
    params: {
      token: token
    },
    meta: { ignoreEncrypt: true } // ✅ 跳过加密
  });
}

// 图片、文件。。。
export async function fetchFileUrl(id: string, contentType?: string) {
  if (!id) return '';
  let url = '';
  try {
    const file = await getFile(id);
    let type = contentType ? contentType : 'image/jpeg';
    const blob = new Blob([file], { type: type });
    url = URL.createObjectURL(blob);
  } catch (e: any) {
    console.log(e)
  }
  return url;
}
