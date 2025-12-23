<template>
  <div
    ref="container"
    class="responsive-datetime"
    :style="{ fontSize: `${fontSize}px` }"
  >
    <!-- 顺序：日期 + 时间 + 星期 -->
    <template v-if="displayMode === 'full'">
      <span class="part date">{{ formattedDate }}</span>
      <!-- 时间部分：固定最小宽度，防止抖动 -->
      <span
        class="part time"
        :style="{ 'min-width': timeWidthEstimate, 'text-align': 'center', display: 'inline-block' }"
      >
        {{ formattedTime }}
      </span>
      <span class="part weekday">{{ formattedWeekday }}</span>
    </template>

    <!-- 日期 + 时间 -->
    <template v-else-if="displayMode === 'time-date'">
      <span class="part date">{{ formattedDate }}</span>
      <span
        class="part time"
        :style="{ 'min-width': timeWidthEstimate, 'text-align': 'center', display: 'inline-block' }"
      >
        {{ formattedTime }}
      </span>
    </template>

    <!-- 仅日期 -->
    <template v-else>
      <span class="part date">{{ formattedDate }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import dayjs from 'dayjs'
import { ColorGroups } from '@/enum/biMeta'

const props = withDefaults(
  defineProps<{
    dateFormat?: string
    timeFormat?: string
    locale?: string // 'zh-CN', 'en-US'
  }>(),
  {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    locale: 'zh-CN'
  }
)

// 当前时间
const now = ref(dayjs())

// DOM 引用
const container = ref<HTMLElement | null>(null)

// 显示模式
const displayMode = ref<'full' | 'time-date' | 'date-only'>('full')

// 字体大小
const fontSize = ref(16)

// 格式化文本
const formattedDate = computed(() => now.value.format(props.dateFormat))
const formattedTime = computed(() => now.value.format(props.timeFormat))

const formattedWeekday = computed(() => {
  const weekdays = {
    'zh-CN': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }[props.locale] || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return weekdays[now.value.day()]
})

// 时间部分固定宽度（以字符数为基础）
const timeCharCount = props.timeFormat.replace(/[^HhMmSs]/g, '').length // 粗略估算
const timeWidthEstimate = computed(() => {
  // 假设每个字符宽度 ≈ 0.6em，可根据字体微调
  return `${timeCharCount * 0.6}em`
})

// 显示文本（用于测量）
const displayText = computed(() => {
  switch (displayMode.value) {
    case 'full':
      return `${formattedDate.value} ${formattedTime.value} ${formattedWeekday.value}`
    case 'time-date':
      return `${formattedDate.value} ${formattedTime.value}`
    case 'date-only':
      return formattedDate.value
  }
})

// 测量文本宽度
const measureTextWidth = (text: string, size: number): number => {
  const tempSpan = document.createElement('span')
  tempSpan.style.fontSize = `${size}px`
  tempSpan.style.fontFamily = 'inherit'
  tempSpan.style.fontWeight = 'bold'
  tempSpan.style.position = 'absolute'
  tempSpan.style.whiteSpace = 'nowrap'
  tempSpan.style.visibility = 'hidden'
  tempSpan.textContent = text
  document.body.appendChild(tempSpan)
  const width = tempSpan.offsetWidth
  document.body.removeChild(tempSpan)
  return width
}

// 调整字体大小
const adjustFontSize = () => {
  if (!container.value) return
  const height = container.value.clientHeight
  const size = Math.max(12, Math.min(48, 16 + Math.floor((height - 26) / 10) * 2))
  fontSize.value = size
}

// 检查溢出
const checkOverflow = () => {
  if (!container.value || !displayText.value) return

  const { clientWidth } = container.value
  const availableWidth = clientWidth - 10

  const text = displayText.value
  const currentWidth = measureTextWidth(text, fontSize.value)

  // 降级逻辑
  if (currentWidth > availableWidth) {
    if (displayMode.value === 'full') {
      displayMode.value = 'time-date'
      requestAnimationFrame(checkOverflow)
      return
    } else if (displayMode.value === 'time-date') {
      displayMode.value = 'date-only'
      return
    }
  }

  // 升级逻辑
  if (displayMode.value === 'date-only') {
    const timeDateText = `${formattedDate.value} ${formattedTime.value}`
    const timeDateWidth = measureTextWidth(timeDateText, fontSize.value)
    if (timeDateWidth <= availableWidth) {
      displayMode.value = 'time-date'
      return
    }
  }

  if (displayMode.value === 'time-date') {
    const fullText = `${formattedDate.value} ${formattedTime.value} ${formattedWeekday.value}`
    const fullWidth = measureTextWidth(fullText, fontSize.value)
    if (fullWidth <= availableWidth) {
      displayMode.value = 'full'
    }
  }
}

// 处理 resize
const handleResize = () => {
  adjustFontSize()
  checkOverflow()
}

// ResizeObserver & Timer
let observer: ResizeObserver | null = null
let timer: number | null = null

onMounted(() => {
  if (!container.value) return
  handleResize()

  observer = new ResizeObserver(() => {
    requestAnimationFrame(handleResize)
  })
  observer.observe(container.value)

  timer = window.setInterval(() => {
    now.value = dayjs()
  }, 1000)
})

onUnmounted(() => {
  if (observer && container.value) {
    observer.unobserve(container.value)
  }
  if (timer) clearInterval(timer)
})

const primaryColor = ColorGroups.Default[0]
</script>

<style lang="scss" scoped>
.responsive-datetime {
  font-family:  sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 1.2;
  font-weight: bold;
  color: v-bind(primaryColor);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  transition: font-size 0.2s ease;
}

.part + .part::before {
  content: ' ';
  margin: 0 6px;
}


</style>
