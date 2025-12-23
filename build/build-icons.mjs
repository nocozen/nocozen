#!/usr/bin/env node
import { join, resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadCollection } from '@iconify/json';
import { getIcons } from '@iconify/utils';

// 配置
const OUTPUT_DIR = resolve(process.cwd(), 'public/iconify'); // 输出到Web目录
const ICON_SET = 'mdi'; // 只需要MDI图标集

// 从项目中扫描实际使用的图标（示例列表，需替换为你的真实图标）
const usedIcons = [
  'mdi:account',
  'mdi:home',
  'mdi:alert',
  // 动态获取方式见后续说明
];

async function build() {
  // 1. 加载MDI图标集
  const collection = await loadCollection(ICON_SET);
  
  // 2. 提取用到的图标
  const iconNames = usedIcons.map(icon => icon.split(':')[1]);
  const filteredData = getIcons(collection, iconNames);

  // 3. 生成精简集合
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(
    join(OUTPUT_DIR, `${ICON_SET}.json`),
    JSON.stringify({
      prefix: ICON_SET,
      icons: filteredData,
      width: collection.width,
      height: collection.height
    })
  );

  console.log(`✅ 已生成 ${iconNames.length} 个MDI图标到 ${OUTPUT_DIR}`);
}

build().catch(console.error);