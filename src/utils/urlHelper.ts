/**
 * 构建完整的 URL（TypeScript 版本）
 * @param subPath - 子路径（如 "/mbinput"），必须以 "/" 开头
 * @param params - 查询参数（如 { metaId: "232323" }），键值对必须是 `string` 或 `number`
 * @returns 完整 URL（如 "https://192.168.1.1:8000/mbinput?metaId=232323"）
 */
export function buildMbinputUrl(
  subPath: `/${string}`, // 确保 subPath 以 "/" 开头
  params: { type: 'i' | 's' | 'f', mid: string  } // 参数支持 string/number/boolean
): string {
  // 1. 获取当前页面的根 URL（如 "https://192.168.1.1:8000"）
  const { protocol, hostname, port } = window.location;
  const rootUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

  // 2. 创建 URL 对象（如果 subPath 无效，会抛出错误）
  try {
    const url = new URL(subPath, rootUrl);

    // 3. 添加查询参数（自动处理类型转换）
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value)); // 强制转为 string
    });

    // 4. 返回完整 URL
    return url.toString();
  } catch (error) {
    console.error('Invalid URL construction:', error);
    throw new Error(`Failed to build URL with path "${subPath}"`);
  }
}

