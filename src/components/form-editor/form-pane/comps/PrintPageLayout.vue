<template>
  <div id="print-content">
    <!-- 自定义标题 -->
    <!-- <h1 class="print-title">{{ title }}</h1> -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title: string | undefined,
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
});


</script>

<style scoped>
#print-content {
  width: 100%;
  max-width: 210mm;
  padding-left: 20px !important;
}

@media print {

  /* 隐藏页脚 */
  @page {
    size: A4;
    width: 210mm;
    /* 自动页面大小 */
    margin: 0 auto;
    /* 移除默认的页面边距 */
    /* padding-left: 25mm; */
    padding-top: 10mm;
  }

  /* 隐藏页脚内容 */
  footer {
    display: none !important;
  }

  /* 自定义标题样式 */
  header {
    text-align: center;
    /* 居中 */
    font-weight: bold;
    /* 加粗 */
    font-size: 20px;
    /* 字号20px */
    margin-top: 20px;
    /* 添加一些下边距 */
  }

  /* 确保其他打印样式 */
  /* body {
    display: flex;
    justify-content: center;
  } */


}
</style>