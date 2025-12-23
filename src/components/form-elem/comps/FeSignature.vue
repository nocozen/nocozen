<template>
  <NFlex :size="0" :vertical="layoutConfig!.labelPlace == 'top'" class="w-full">
    <span v-if="compConfig.showTitle" class="font-semibold pr-2" :style="cptLabelWidth">{{ compConfig.title }}</span>
    <NFlex :size="0" :style="cptUploadSize" align="center" justify="start">
      <NFlex class="border-1 rounded-sm" :style="{ width: cardHeight, height: cardHeight }" align="center"
        justify="center">
        <NPopover v-if="compConfig.viewPerm" trigger="click" placement="bottom">
          <template #trigger>
            <NFlex class="w-full h-full" align="center" justify="center">
              <NImage :src="url" :preview-disabled="true">
                <template #error>
                  <NButton size="tiny" text>添加
                    <template #icon>
                      <SvgIcon icon="mdi:sign" />
                    </template>
                  </NButton>
                </template>
              </NImage>
            </NFlex>
          </template>
          <NFlex>
            <NImage :src="qrcodeURL" :preview-disabled="true" />
          </NFlex>
        </NPopover>
        <SvgIcon v-else icon="mingcute--lock-line" />
      </NFlex>
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount} from 'vue';
import { useModuleInject } from '../../form-editor/useModuleInject';
import { useQRCode } from '@/hooks/common/qrcode';
import Uid from '@/utils/uid';
import { buildMbinputUrl } from '@/utils/urlHelper';
import { fetchFileUrl, fetchGetFileMeta } from '@/service/api/upload';

interface Props {
  inst?: any,
  i: string,
  readonly: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});
const { layoutNodes, layoutConfig, compConfigs } = useModuleInject();
const compConfig = ref({} as any);
const showLink = ref(false);
const defCardHeight = '80px';
const cardHeight = ref(defCardHeight);
const defHeight = 80;
const height = ref(defHeight);
const { qrcodeURL, generate } = useQRCode();
const metaId = ref();
const url = ref('/');
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
      height.value = newValue.value * layoutConfig!.value.rowHeight - 20;
    }
  },
  { immediate: true, deep: true }
);


const init = async () => {
  if (props.readonly) {
  } else {  // 生成手机上传二维码
    // metaId.value = mid;
    const websiteUrl = buildMbinputUrl('/mbinput', { type: 's', mid: compConfig.value.fieldValue })
    console.log(websiteUrl)
    generate(websiteUrl);
  }
}

// 监听 props.i 或 compConfigs 的变化；以下代码已避免监听循环；
watch(
  () => [props.i, compConfigs], // 依赖数组
  async ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        url.value = '/';
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
      await fetchSignature();
    }
  },
  { deep: true } // 深度监听配置内部变化
);

const fetchSignature = async () => {
  // metaId 查询
  if (metaId.value) {
    const metaResult = await fetchGetFileMeta({ metaId: metaId.value });
    if ('ok' == metaResult.msg && metaResult.data?.length > 0) {
      const meta = metaResult.data.at(-1);
      url.value = await fetchFileUrl(meta._id, meta.metadata.contentType);
    }
  }
}

// 定时器句柄
let interval: number | null = null
const startInterval = () => {
  interval = window.setInterval(fetchSignature, 3000);
}

onMounted(() => {
  init();
  // fetchSignature();
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
    fetchSignature();
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
