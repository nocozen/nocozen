import { ref } from 'vue';
import { Byte, Encoder }  from '@nuintun/qrcode';

export function useQRCode() {
  const qrcodeURL = ref('');

  /**
   * 生成二维码
   * @param url 要编码的网址
   * @param options 配置项（纠错级别）
   */
  const generate = (url: string, options: { level?: 'L' | 'M' | 'Q' | 'H' } = {}) => {
    const { level = 'L' } = options;
    const encoder = new Encoder({ level });
    const qrcode = encoder.encode(new Byte(url));
    qrcodeURL.value = qrcode.toDataURL();
  };

  return { qrcodeURL, generate };
}