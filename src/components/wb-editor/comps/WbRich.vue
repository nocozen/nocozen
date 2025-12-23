<template>
  <div ref="divRef" class="group">
    <NFloatButton v-if="isEditable" @click="onEditorClick" class="invisible group-hover:visible z-3" :right="10" :bottom="30"
      :height="30" :width="30">
      <SvgIcon icon="material-symbols--toolbar-outline" />
    </NFloatButton>
    <div class="aie-container rounded-md" >
      <div v-show="showToolbar" class="aie-container-header"></div>
      <SmoothScrollbar class="h-full">
        <div class="aie-container-main "></div>
      </SmoothScrollbar>
      <div class="aie-container-footer hidden"></div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { AiEditor } from "aieditor";
import "aieditor/dist/style.css"
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useModuleInject } from "@/components/form-editor/useModuleInject";
import { useThemeStore } from '@/store/modules/theme';

interface Props {
  comp: Meta.LayoutComp,
  isEditable?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutNodes, updateWbLayout, layoutConfig } = useModuleInject();
const themeStore = useThemeStore();

const divRef = ref();
let aiEditor: AiEditor | null = null;
const showToolbar = ref(false);

const onEditorClick = () => {
  showToolbar.value = !showToolbar.value;
  if (showToolbar.value) {
    layoutConfig!.value.isEditable = false;
  } else {
    layoutConfig!.value.isEditable = true;
  }
}

const onEditorBlur = (editor: any) => {
  // 需要双向操作保存文本值，所以不能直接使用props.comp
  const currComp = layoutNodes![0].layout.find((n: Meta.LayoutComp) => n.i == props.comp.i) as Meta.LayoutComp;
  currComp.value = editor.getJson();
  updateWbLayout();
}

onMounted(() => {
  // 需要双向操作保存文本值，所以不能直接使用props.comp
  const currComp = layoutNodes![0].layout.find((n: Meta.LayoutComp) => n.i == props.comp.i) as Meta.LayoutComp;

  aiEditor = new AiEditor({
    theme: themeStore.darkMode ? "dark" : "light",
    element: divRef.value as Element,
    content: currComp.value,
    placeholder: "点击输入内容...",
    toolbarKeys: ["font-size", "bold", "italic", "underline", "link",
      "font-color", "align", "line-height", "image",
    ],
    textSelectionBubbleMenu: {
      enable: false,
      items: ["Bold", "Italic", "Underline", "Strike", "code", "font-size"],
    },
    editable: props.isEditable,
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

</style>
