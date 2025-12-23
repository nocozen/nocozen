<template>
  <div class="embed-container">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">
      <slot name="loading">
        <p>正在加载页面...</p>
      </slot>
    </div>

    <!-- 错误状态（可扩展） -->
    <!-- <div v-if="error" class="error">加载失败</div> -->

    <!-- iframe 主体 -->
    <iframe
      ref="iframeRef"
      :src="src"
      frameborder="0"
      :allowfullscreen="allowFullscreen"
      :sandbox="sandboxAttr"
      @load="handleLoad"
      loading="lazy"
      class="embed-iframe"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  // 必填：要嵌入的 URL
  src: {
    type: String,
    required: true
  },
  // 可选：是否允许全屏
  allowFullscreen: {
    type: Boolean,
    default: false
  },
  // 可选：额外的 sandbox 权限
  sandbox: {
    type: Array,
    default: () => ['allow-scripts', 'allow-same-origin']
  }
})

// 控制 iframe 加载状态
const isLoading = ref(true)
const iframeRef = ref(null)

// 构建 sandbox 属性字符串
const sandboxAttr = computed(() => {
  return props.sandbox.join(' ')
})

// 处理 iframe 加载完成
const handleLoad = () => {
  isLoading.value = false
}

// 监听 src 变化重新加载
watch(() => props.src, () => {
  isLoading.value = true
})
</script>

<style scoped>
.embed-container {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.embed-iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #fff;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
}
</style>
