// src/utils/request/alova.ts
import { createAlova } from 'alova';
import fetchAdapter from 'alova/fetch';
import VueHook from 'alova/vue';
import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import { encryptPack, decryptPack } from '@/utils/crypto-msgpack';
import { isEmpty } from 'radashi';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
const msgEncryptMetaType = 'application/qbpack';
const msgJsonMetaType = 'application/json'

export const alovaInstance = createAlova({
  baseURL,
  timeout: 20000,
  requestAdapter: fetchAdapter(),
  statesHook: VueHook,

  async beforeRequest(method) {
    const headers = new Headers(method.config.headers || {});

    // 先判断是否为文件上传请求，如果是，跳过加密和 content-type 覆盖
    const isFileUpload = method.meta?.upload ||
      method.data instanceof FormData ||
      (method.data instanceof Blob && method.data.type.startsWith('multipart/'));

    const token = localStg.get('token') || method.config.params?.token;
    if (token) {
      headers.set('Authorization', token);
    }
    headers.set('Cache-Control', 'no-cache');

    if (isFileUpload) {
      // 文件上传：保留原始 Content-Type（由浏览器自动设置）
      // 不要设置 content-type，不要加密
      // 只设置 Authorization 和 Cache-Control
      // 重要：不要覆盖 content-type
      // 直接赋值 headers
      method.config.headers = Object.fromEntries(headers.entries());
      return; // 提前返回，不执行后续加密逻辑
    }

    // 检查是否跳过加密
    if (method.meta?.ignoreEncrypt) {
      headers.set('content-type', msgJsonMetaType);
    } else {
      headers.set('content-type', msgEncryptMetaType);
    }
    method.config.headers = Object.fromEntries(headers.entries());
    // 加密请求体
    if (!method.meta?.ignoreEncrypt && !isEmpty(method.data)) {
      try {
        const encrypted = await encryptPack(method.data, token);
        // 使用alova后，Uint8Array会被再次序列化，Blob可能是原生支持可以不被序列化；
        method.data = new Blob([encrypted as unknown as BlobPart], {
          type: msgEncryptMetaType // 设置 MIME 类型
        });
      } catch (e) {
        console.error('请求加密错误:', e);
        throw new Error('请求加密失败');
      }
    } else {
      // console.log(msgPackMetaType)
    }
  },

  responded: {
    async onSuccess(response, method) {
      const contentType = response.headers.get('content-type') || '';

      // 处理加密响应
      if (contentType.includes(msgEncryptMetaType)) {
        try {
          // 直接使用 response.arrayBuffer() 获取二进制数据
          const buffer = await response.arrayBuffer();

          // 解密 MessagePack
          const token = localStg.get('token') || undefined;
          return await decryptPack(new Uint8Array(buffer), token);
        } catch (e) {
          console.error('响应解密错误:', e);
          throw new Error('响应解密失败');
        }
      }

      // 处理二进制响应（图片、文件等）
      if (contentType.includes('image/') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/pdf') ||
        contentType.includes('video/') ||
        contentType.includes('audio/')) {
        return response.blob();
      }

      // 处理文本和 JSON 响应
      const text = await response.text();

      // 如果是空响应
      if (!text) {
        return null as any;
      }

      // 如果是非 JSON 内容，直接返回文本
      if (!contentType.includes(msgJsonMetaType)) {
        return text as any;
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.warn('[Alova] JSON 解析失败，返回原始文本:', e);
        return text as any;
      }
    },
    async onError(error, method) {
      console.error('[Alova] 请求失败:', error);

      // 处理 401 未授权错误
      if (error.response?.status === 401) {
        const authStore = useAuthStore();
        await authStore.resetStore();
      }

      throw error;
    },
    onComplete() {
      // console.log('[Alova] 请求完成');
    }
  }
});

// 定义请求配置类型
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  [key: string]: any;
}

// 兼容 request API（支持加密）
export const request = async <T = any>(
  url: string,
  config?: RequestConfig
): Promise<T> => {
  const methodType = (config?.method || 'GET').toUpperCase();
  const fullUrl = url

  let promise;
  switch (methodType) {
    case 'GET':
      promise = alovaInstance.Get<T>(fullUrl, {
        ...config,
        ...(config?.body && { data: config.body })
      });
      break;
    case 'POST':
      promise = alovaInstance.Post<T>(fullUrl, config?.body, config);
      break;
    case 'PUT':
      promise = alovaInstance.Put<T>(fullUrl, config?.body, config);
      break;
    case 'DELETE':
      promise = alovaInstance.Delete<T>(fullUrl, config);
      break;
    case 'PATCH':
      promise = alovaInstance.Patch<T>(fullUrl, config?.body, config);
      break;
    default:
      throw new Error(`不支持的方法: ${methodType}`);
  }

  return promise.send();
};


