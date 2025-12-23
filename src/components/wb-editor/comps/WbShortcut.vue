<template>
  <NCard class="card-wrapper  min-h-32 group">
    <NFlex align="center" justify="start" class="mb-2">
      <span class="flex h-6 flex-start font-bold">{{ title }}</span>
      <ButtonIcon v-if="isEditable" :icon="QbIcon.Edit" level="text" type="info"
        class="invisible group-hover:visible z-4" @click.stop="onEditClick" />
    </NFlex>
    <NFlex wrap justify="start" class="ml-5">
      <RouterLink v-for="item in modules" class="w-47"
        :to="{ path: `/app/module/${item.moduleConfig_id}`, query: { app_id: item.app_id } }">
        <CardButton :title="item.name" sizeType="sm" bgScope="none" :icon="`mdi:${item.icon}`"
          :color="item.iconColor" />
      </RouterLink>
    </NFlex>
    <EditComName ref="refEditName" @update="updateName" />
  </NCard>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { useModuleInject } from "@/components/form-editor/useModuleInject";
import { QbIcon } from '@/enum';
import { useAuthStore } from '@/store/modules/auth';
import { isEmpty } from 'radashi';
import { decryptPack } from '@/utils/crypto-msgpack';
import { fetchGetAppModules, getUserAppPerm } from '@/service/api';

interface Props {
  comp: Meta.LayoutComp,
  isEditable?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
});

const { layoutNodes, updateWbLayout, layoutConfig } = useModuleInject();
const refEditName = ref();
const title = ref('快捷访问')
const modules = ref([] as any)
const userAuth = useAuthStore();
const currAuth = ref();

const updateName = (type: string, value: string) => {
  // 需要双向操作保存文本值，所以不能直接使用props.comp
  const currComp = layoutNodes![0].layout.find((n: Meta.LayoutComp) => n.i == props.comp.i) as Meta.LayoutComp;
  currComp['config'] = { title: value };
  updateWbLayout();
  title.value = value;
}

const onEditClick = () => {
  refEditName.value.show('修改名称', props.comp.config?.title);
}

const init = async () => {
  if (!currAuth.value) {
    currAuth.value = await decryptPack(userAuth.userInfo.auth);
  }
  const appPerm = await getUserAppPerm(currAuth.value);
  const permModuleIds = new Set(appPerm.flatMap((app: any) => app.module_ids ?? []))
  props.comp.config?.title && (title.value = props.comp.config.title);
  // 依据id查询所有菜单;
  // 过滤有权限的菜单：
  if (props.comp.value && props.comp.value?.length > 0) {
    const result = await fetchGetAppModules({ _id: props.comp.value });
    if ('ok' == result.msg && result.data?.length > 0) {
      modules.value = result.data.filter((d: Meta.ModuleNode) => permModuleIds.has(d._id));
    }
  }
}

watch(
  () => props.comp,    // 注意：监听props.i可能导致在当前组件配置更新前访问compConfigs无法获取
  (newValue, oldValue) => {
    if (newValue.value) {
      init();
    }
  },
  { immediate: true, deep: true }
);
</script>



<style scoped></style>
