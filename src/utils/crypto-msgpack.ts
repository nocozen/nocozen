// crypto-msgpack.ts
import { encode, decode } from '@msgpack/msgpack';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { utf8ToBytes, hexToBytes } from '@noble/ciphers/utils.js';
import { isEmpty } from 'radashi';

// 预计算默认key
const SHARED_KEY = hexToBytes('fa686bfdffd3758f6377abbc23bf3d9bdc1a0dda4a6e7f8dbdd579fa1ff6d7e1');

// 加密函数
export async function encryptPack(data: any, token?: string): Promise<Uint8Array> {
  const key = token ? getKeyFromToken(token) : SHARED_KEY;
  const nonce = randomBytes(24);
  const packed = encode(data);
  const encrypted = xchacha20poly1305(key, nonce).encrypt(packed);

  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce, 0);
  result.set(encrypted, nonce.length);
  return result;
}

// 解密函数
export async function decryptPack(encryptedData: Uint8Array, token?: string): Promise<any> {
  if (isEmpty(encryptedData)) return null;
  const key = token ? getKeyFromToken(token) : SHARED_KEY;
  const nonce = encryptedData.slice(0, 24);
  const ciphertext = encryptedData.slice(24);
  let decrypted;
  decrypted = xchacha20poly1305(key, nonce).decrypt(ciphertext);
  return decode(decrypted);
}

// 辅助函数
function getKeyFromToken(token: string): Uint8Array {
  const hexPart = token.replace(/[^0-9a-fA-F]/g, "").slice(0, 64);
  const finalHex = hexPart.padEnd(64, "0");
  const key = hexToBytes(finalHex);
  if (key.length !== 32) throw new Error("Key must be 32 bytes (256-bit)");
  return key;
}