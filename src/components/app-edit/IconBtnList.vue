<template>
  <CardButton v-if="'card' == iconType" @click="onSelectIcon(icon)" style="margin: 1px;"
    :color="appOption.icon == icon ? colord(appOption.iconColor).lighten(0.15).toHex() : appOption.iconColor"
    titlePosition="none" sizeType="md" bgScope="all" v-for="icon in iconList" :icon="`mdi:${icon}`"
    :borderClass="appOption.icon == icon ? 'outline-solid outline-blue-500 outline-2' : ''">
  </CardButton>
  <NButton v-else @click="onSelectIcon(icon)" v-for="icon in iconList" :color="appOption.iconColor" circle class="w-9 h-9"
    :class="appOption.icon == icon ? 'border-solid border-blue-500 border-2' : ''">
    <template #icon>
      <SvgIcon :icon="`mdi:${icon}`" class="text-lg"/>
    </template>
  </NButton>
</template>

<script setup lang="ts">
import { colord } from "@sa/color";

interface Props {
  iconType: string,   // 'card' | 'wrap'
  appOption: Meta.AppNode,
  iconList: Array<string>
}

const props = withDefaults(defineProps<Props>(), {
});

interface Emits {
  (e: 'onSelectIcon', icon: string): void;
}

const emit = defineEmits<Emits>();

const onSelectIcon = (icon: string) => {
  emit('onSelectIcon', icon);
}

</script>

<style lang="scss" scoped>
.bg-all {
  /* 设置背景为线性渐变 */
  /*  background: linear-gradient(to bottom, #5797ff, #5797ff); */
  /* background-image: conic-gradient(from -45deg, #86c2fe, #3578dd); */
  background-image: conic-gradient(from -45deg, #86c2fe, #3578dd);
  /* 你可以添加其他的样式属性，如高度、宽度、内边距等 */
  /* 如果你想让渐变填充整个元素，确保没有背景图片或背景颜色覆盖它 */
  background-size: cover;
  background-repeat: no-repeat;

  &:hover {
    opacity: 0.8;
  }

}

.bg-icon {
  color: transparent;
  background-image: linear-gradient(45deg, blue, red);
  background-clip: text;
  -webkit-background-clip: text
}
</style>