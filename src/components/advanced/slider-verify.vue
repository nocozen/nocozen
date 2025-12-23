<template>
  <div class="slider-wrapper">
    <div
      ref="sliderContainer"
      :class="['slider-container', `slider-container-${size}`]"
      :style="{ width: sliderWidth, backgroundColor: sliderColor }"
    >
      <div
        class="slider-fill"
        :style="{ width: sliderPosition + 'px', backgroundColor: fillColor }"
      ></div>
      <div :class="['slider-tips', { success: verifyPass }]">
        {{ verifyTips }}
      </div>
      <div
        class="slider-thumb"
        :style="{ left: `${sliderPosition}px`, ...sliderThumbStyle }"
        @mousedown="startDrag"
      >
        <img
          v-if="!verifyPass"
          :src="icons[0]"
          class="slider-icon"
          :style="{
            width: fontsizeMap[size] + 'px',
            height: fontsizeMap[size] + 'px',
          }"
        />
        <img
          v-if="verifyPass"
          :src="icons[1]"
          class="slider-icon"
          :style="{
            width: fontsizeMap[size] + 'px',
            height: fontsizeMap[size] + 'px',
          }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import IconDoubleRight from "../../assets/icons/double-right.svg";
import IconCheck from "../../assets/icons/check.svg";

/**
 * 接收传过来的值
 *
 * @param size 定义滑块容器尺寸大小 可选值为 'large' | 'middle' | 'small' | 'mini'
 * @param sliderTip 定义滑块默认文字
 * @param successTip 定义滑块成功提示
 * @param sliderColor 定义滑块填充颜色
 * @param fillColor 定义滑块拖动后的填充颜色
 * @param icons 定义滑块图标
 */
interface Props {
  size?: "mini" | "small" | "medium" | "large";
  width?: string | number;
  sliderTip?: string;
  successTip?: string;
  fillColor?: string;
  sliderColor?: string;
  icons?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  size: "medium",
  sliderTip: "请按住滑块拖动",
  successTip: "验证通过",
  fillColor: "#79ce8e",
  sliderColor: "#f2f2f2",
  icons: () => [IconDoubleRight, IconCheck],
});
const emit = defineEmits<{
  (e: "onSuccess", status: boolean): void;
  (e: "onFail", status: boolean): void;
  (e: "onDrag"): void;
  (e: "onDragEnd"): void;
}>();

const sliderWidth = computed(() => {
  if (props.width) {
    if (typeof props.width === "number") {
      return `${props.width}px`;
    }
    return props.width;
  }
  return "100%";
});

const verifyPass = defineModel({ default: false, type: Boolean });
const sliderContainer = ref();
const sliderThumbStyle = ref({
  borderRadius: "4px 0 0 4px",
});
const verifyTips = ref(props.sliderTip);
const sliderPosition = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const currentX = ref(0);

const sizeMap = {
  mini: 24,
  small: 28,
  medium: 32,
  large: 36,
};
const fontsizeMap = {
  mini: 12,
  small: 13,
  medium: 14,
  large: 14,
};

const onDrag = (event: MouseEvent) => {
  if (isDragging.value) {
    emit("onDrag");
    const x = event.clientX - startX.value;
    const newPosition = currentX.value + x;

    if (sliderContainer.value) {
      const containerRect = sliderContainer.value.getBoundingClientRect();
      // 滑块宽度
      const sliderWidth = sizeMap[props.size];
      const maxPosition = containerRect.width - sliderWidth;
      const minPosition = 0;

      if (newPosition >= sliderWidth) {
        sliderThumbStyle.value = { borderRadius: "4px" };
      } else {
        sliderThumbStyle.value = { borderRadius: "4px 0 0 4px" };
      }

      if (sliderPosition.value >= maxPosition) {
        sliderPosition.value = maxPosition;
        // 验证成功逻辑
        verifyPass.value = true;
        isDragging.value = false;
        verifyTips.value = props.successTip;
        emit("onSuccess", true);
      } else {
        // 验证失败逻辑
        verifyPass.value = false;
        sliderPosition.value = 0;
        emit("onFail", false);
      }

      sliderPosition.value = Math.max(
        minPosition,
        Math.min(maxPosition, newPosition)
      );
    }
  }
};

const endDrag = () => {
  isDragging.value = false;
  emit("onDragEnd");
  const containerRect = sliderContainer.value.getBoundingClientRect();
  if (sliderContainer.value) {
    const sliderWidth = sizeMap[props.size];
    if (sliderPosition.value < containerRect.width - sliderWidth) {
      sliderPosition.value = 0;
    }
  }
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", endDrag);
};

const startDrag = (event: MouseEvent) => {
  if (verifyPass.value) return;
  isDragging.value = true;
  startX.value = event.clientX;
  currentX.value = sliderPosition.value;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);
};

const onReset = () => {
  sliderPosition.value = 0;
  verifyPass.value = false;
  verifyTips.value = props.sliderTip;
};

onMounted(() => {
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", endDrag);
});

defineExpose({
  onReset,
  modelValue: verifyPass.value,
  sliderContainer,
});

defineOptions({
  name: "SliderVerify",
});
</script>

<style scoped>
@keyframes shine {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.slider-wrapper {
  width: 100%;
}

.slider-container-mini {
  height: 24px;
  .slider-thumb {
    width: 24px;
    height: 24px;
  }
}

.slider-container-small {
  height: 28px;
  .slider-thumb {
    width: 28px;
    height: 28px;
  }
}

.slider-container-medium {
  height: 32px;
  .slider-thumb {
    width: 32px;
    height: 32px;
  }
}

.slider-container-large {
  height: 36px;
  .slider-thumb {
    width: 36px;
    height: 36px;
  }
}

.slider-container {
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.slider-fill {
  border-radius: 4px 0 0 4px;
  position: absolute;
  left: 0;
  height: 100%;
  z-index: 2;
}
.success {
  -webkit-text-fill-color: #fff;
  -webkit-font-smoothing: auto;
}
.slider-tips {
  font-size: 12px;
  position: absolute;
  display: flex;
  justify-content: center;
  z-index: 3;
  user-select: none;
  color: transparent;
  background: radial-gradient(circle at center, #fffc, #f000) -200% 50% / 200% 100%
      no-repeat,
    #000;
  animation: 2s linear 0s infinite normal none running shine;
  background-clip: text;
}
.slider-thumb {
  text-align: center;
  background-color: #fff;
  position: absolute;
  cursor: move;
  z-index: 9;
  box-shadow: 0 0 transparent, 0 0 transparent, 0 4px 6px -1px #0000001a,
    0 2px 4px -2px #0000001a;
  .slider-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    -moz-user-drag: none;
    -webkit-user-drag: none;
  }
}
</style>
