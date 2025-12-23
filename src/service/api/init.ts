import { request } from '../request';


export async function fetchInitConfig() {
  return await request<Fetch.FindResult>('/initConfig', {
    method: "POST",
  });
}

// 获取所有配置
export async function fetchGetAllConfig(admin: string, pwd: string) {
  if (!admin || !pwd) return { msg: '不能为空', data: null }
  const option = { admin, pwd }
  return await request<Fetch.FindResult>('/getAllConfig', {
    method: "POST",
    body: option
  });
}

export async function fetchUpdateConfig(key: string, value: string, pwd: string) {
  if (!key) return { msg: '名称不能为空', data: null }
  const option = { key, value, pwd }
  return await request<Fetch.FindResult>('/setConfig', {
    method: "POST",
    body: option
  });
}

