<template>
  <NFlex :size="0" :vertical="layoutConfig!.labelPlace == 'top'" class="w-full">
    <span v-if="compConfig.showTitle" class="font-semibold pr-2" :style="cptLabelWidth">{{ compConfig.title }}</span>
    <NFlex :size="0" :style="cptUploadSize" align="start" justify="start">
      <smooth-scrollbar v-if="compConfig.viewPerm">
        <FileUpload ref="refFileUpload" type="image" listType="comp-card" :meta-id="metaId"
          :show-trigger="!readonly && compConfig.editPerm">
          <NFlex vertical align="center" class="pt-4">
            <SvgIcon icon="mdi:plus" />
            <NPopover trigger="click" placement="bottom">
              <template #trigger>
                <NButton size="small" class="p-0 w-7" @click.stop text>
                  <SvgIcon icon="mdi:qrcode" />
                </NButton>
              </template>
              <NFlex>
                <NImage :src="qrcodeURL" :preview-disabled="true" />
              </NFlex>
            </NPopover>
          </NFlex>
        </FileUpload>
      </smooth-scrollbar>
      <NFlex v-else class="border-1 rounded-sm" :style="{ width: cardHeight, height: cardHeight }" align="center"
        justify="center">
        <SvgIcon icon="mingcute--lock-line" />
      </NFlex>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { getShowLink } from './shared';
import { useQRCode } from '@/hooks/common/qrcode';
import Uid from '@/utils/uid';
import { buildMbinputUrl } from '@/utils/urlHelper';

interface Props {
  inst?: any,
  i: string,
  readonly: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const { layoutNodes, layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as Meta.CompConfig);
const showLink = ref(false);
const defCardHeight = '80px';
const cardHeight = ref(defCardHeight);
const defHeight = 80;
const height = ref(defHeight);
const { qrcodeURL, generate } = useQRCode();
const refFileUpload = ref();
const metaId = ref();
const mid = Uid.NextNumber().toString();

const cptLabelWidth = computed(() => {
  if (layoutConfig?.value.labelPlace == 'top') {
    return { width: 'auto', 'margin-left': '1px' };
  }
  if (layoutConfig?.value.labelWidthType == 'auto') {
    return { width: 'auto' };
  } else {
    const width = layoutConfig?.value.labelWidth || 100
    return { width: width + 'px' };
  }
})

const cptUploadSize = computed(() => {
  if (layoutConfig?.value.labelPlace == 'top') {
    return { width: '100%' };
  }
  if (layoutConfig?.value.labelWidthType == 'auto') {
    return { width: 'auto' };
  } else {
    const width = layoutConfig?.value.labelWidth || 100
    return { width: `calc(100% - ${width}px)`, height: height.value + 'px' };
  }
})

const cptCompLayout = computed(() => {
  let h = layoutNodes?.find((node: any) => node.uid == compConfig.value.nodeUid)?.layout.find((item: any) => item.i == props.i)?.h;
  return h ? h : 4;
})

watch(
  () => cptCompLayout,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue) {
      height.value = newValue.value * layoutConfig!.value.rowHeight - 10;
    }
  },
  { immediate: true, deep: true }
);


const init = async () => {
  if (props.readonly || compConfig.value.editPerm === false) return;
  // 生成手机上传二维码
  // metaId.value = mid;
  const websiteUrl = buildMbinputUrl('/mbinput', { type: 'i', mid: compConfig.value.fieldValue })
  console.log(websiteUrl)
  generate(websiteUrl);
}

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  async ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        if (comp.fieldValue) {
          metaId.value = comp.fieldValue;
        } else {
          props.readonly || (comp.fieldValue = mid);
        }
        compConfig.value = comp as any;
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

// 如果需要响应 compConfig 的内部变化（如编辑配置），可以单独监听
watch(
  () => compConfig.value,
  async (newConfig) => {
    if (newConfig) {
      await init();
    }
  },
  { deep: true } // 深度监听配置内部变化
);

// API 请求函数（示例）
const fetchImage = async (): Promise<void> => {
  try {
    refFileUpload.value && await refFileUpload.value.updateFileList();
    // 或者使用时间戳防止缓存
    // imageUrl.value = `https://your-api.com/image.jpg?t=${Date.now()}`
  } catch (error) {
    console.error('定时刷新失败:', error)
    // 可设置默认图
  }
}

// 定时器句柄
let interval: number | null = null

const startInterval = () => {
  interval = window.setInterval(fetchImage, 3000);
}

onMounted(async () => {
  init();
  refFileUpload.value && await refFileUpload.value.initFileList();
  if (!props.readonly) {
    startInterval();
  }
});

// 组件挂载后启动定时刷新
watch(() => props.readonly, (newVal) => {
  if (newVal && interval !== null) {
    clearInterval(interval);
    interval = null;
  } else if (!newVal && interval === null) {
    init();
    fetchImage();
    startInterval();
  }
});
// 组件卸载前清除定时器，防止内存泄漏
onBeforeUnmount(() => {
  if (interval !== null) {
    clearInterval(interval);
  }
});
</script>

<style lang="scss" scoped></style>
