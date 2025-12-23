<template>
  <NFlex class="w-full h-full">
    <div ref="divRef" class="group w-full h-full">
      <NFloatButton v-if="layoutConfig?.isEditable" @click="onEditorClick" class="invisible group-hover:visible z-10"
        :right="20" :bottom="10" :height="30" :width="30">
        <SvgIcon icon="material-symbols--toolbar-outline" />
      </NFloatButton>
      <div class="aie-container">
        <div v-show="showToolbar" class="aie-container-header"></div>
        <SmoothScrollbar class="h-full">
          <div class="aie-container-main"></div>
        </SmoothScrollbar>
        <div class="aie-container-footer hidden"></div>
      </div>
    </div>
  </NFlex>
</template>


<script setup lang="ts">
import { AiEditor } from "aieditor";
import "aieditor/dist/style.css"
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useModuleInject } from "@/components/form-editor/useModuleInject";
import { useThemeStore } from '@/store/modules/theme';

interface Props {
  i: string,
}

const props = withDefaults(defineProps<Props>(), {
});

const { compConfigs, layoutConfig, updateCompConfig } = useModuleInject();
const themeStore = useThemeStore();

const divRef = ref();
let aiEditor: AiEditor | null = null;
const showToolbar = ref(false);
const compConfig = ref();
const richEidt = ref(false);

// 不要即监听又修改，导致循环，监听computed属性可能导致监听循环
watch(
  () => [props.i, compConfigs], // 依赖数组
  ([newI, newConfigs]) => {
    if (newConfigs && Array.isArray(newConfigs)) {
      const comp = newConfigs.find((item: Meta.CompBase) => item.i === newI);
      if (comp) {
        compConfig.value = comp; // 更新当前配置
        compConfig.value.hiddenMenu = false
      }
    }
  },
  { immediate: true, deep: true } // immediate 确保初始化执行
);

const onEditorClick = () => {
  showToolbar.value = !showToolbar.value;
  compConfig.value.hiddenMenu = showToolbar.value;
  if (showToolbar.value) {
    richEidt.value = false;
  } else {
    richEidt.value = true;
  }
}

const onEditorBlur = (editor: any) => {
  // 需要双向操作保存文本值
  compConfig.value.rich = editor.getJson();
  updateCompConfig && updateCompConfig(compConfig.value as Meta.CompConfig);
}

onMounted(async () => {
  // 需要双向操作保存文本值
  aiEditor = new AiEditor({
    theme: themeStore.darkMode ? "dark" : "light",
    element: divRef.value as Element,
    content: compConfig.value?.rich,
    toolbarSize: 'small',
    placeholder: "点击输入内容...",
    toolbarKeys: ["font-size", "bold", "italic", "underline", "link",
      "font-color", "align", "line-height", "image",
    ],
    textSelectionBubbleMenu: {
      enable: false,
      items: ["Bold", "Italic", "Underline", "Strike", "code", "font-size"],
    },
    editable: layoutConfig!.value.isEditable,
    onBlur: (aiEditor) => {
      onEditorBlur(aiEditor)
    }
  })

})

watch(
  () => themeStore.darkMode,
  (newValue, oldValue) => {
    aiEditor && aiEditor.changeTheme(newValue ? "dark" : "light")
  },
  { immediate: true, deep: true }
);

onUnmounted(() => {
  aiEditor && aiEditor.destroy();
})
</script>

<style lang="scss" scoped>
:deep(.aie-content p) {
  margin: 0;
}
:deep(.aie-container) {
  border: none;
}
</style>
