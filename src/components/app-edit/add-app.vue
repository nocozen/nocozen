<template>
  <n-modal v-model:show="showModal" :bordered="false" :mask-closable=false>
    <n-card :segmented="{ content: true, footer: 'soft', }" closable class="pa-0 w-100" :title="title" :bordered="false"
      size="small" role="dialog" aria-modal="true" :on-close="() => showModal = false">
      <n-form-item label="名称" label-placement="left" :show-feedback="false">
        <NInput v-model:value="option.name" placeholder="请输入应用名称"></NInput>
      </n-form-item>
      <div v-if="showIconEditor">
        <NFlex align="center" class="my-2 ">
          <span>图标</span>
          <CardButton v-if="'card' == iconType" titlePosition="none" sizeType="md" bgScope="all"
            :icon="`mdi:${option.icon}`" :color="option.iconColor">
          </CardButton>
          <WrapIcon v-else :icon="`mdi:${option.icon}`" :color="option.iconColor"></WrapIcon>
          <span class="text-gray">{{ `mdi:${option.icon}` }}</span>
        </NFlex>
        <NFlex class="bg-gray-100 round">
          <NFlex class="pa-2 mr-3 w-100" justify="space-between">
            <NButton v-for="color in iconColors" :color="color" @click="option.iconColor = color" circle
              :class="option.iconColor == color ? 'border-solid border-blue-500 border-2' : ''"></NButton>
          </NFlex>
          <n-input-group class="ml-2 mr-5">
            <n-input v-model:value="searchValue" clearable placeholder="请输入MDI图标名称" />
            <n-button @click="onSearchClick()" type="primary" :loading="loading" ghost>
              搜索
            </n-button>
          </n-input-group>
          <n-scrollbar class="h-50" trigger="none">
            <NFlex class="ma-2" :size="8">
              <IconBtnList :iconType="iconType" :app-option="option" :iconList="iconList" @onSelectIcon="onSelectIcon">
              </IconBtnList>
            </NFlex>
          </n-scrollbar>
        </NFlex>
      </div>
      <template #action>
        <NFlex justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="onAppOkClick">确认</NButton>
        </NFlex>
      </template>
    </n-card>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, onBeforeUpdate, inject, Ref } from 'vue';
import { midMin } from './mdi'
import { fetchInsertAppNode, fetchInsertModuleNode, fetchUpdateApp, fetchEditModuleNode } from '@/service/api';
import { defineAsyncComponent } from 'vue';
import { MenuEventType, ModuleType } from '@/enum';
import { ProviderName } from '@/enum';
import { defSysColors } from '@/enum/biMeta';
import { debounce } from 'radashi';

defineOptions({
  name: 'AddApp',
});

let IconBtnList = null as any;

interface Emits {
  (e: 'refreshMenu'): void;
}

const emit = defineEmits<Emits>();

let currModuleNode = inject<Ref<Meta.ModuleNode> | undefined>(ProviderName.CurrModuleNodeProvide, undefined);

const optType = ref('add');   // add | edit
const title = ref('');
const searchValue = ref('');
const iconColors = defSysColors;
const iconList = ref();
const loading = ref(false)
const option = ref({
  _id: '',
  name: '',
  icon: '',
  iconColor: ''
})

const search =  () => {
  loading.value = true;
  if (searchValue.value) {
    iconList.value = mdiIcons.value.filter((icon: string) => icon.includes(searchValue.value)).slice(0, 320);
  } else {
    iconList.value = midMin
  }
  loading.value = false;
}

const onSearchClick = debounce({ delay: 300 }, search);

const showModal = ref(false)

const onSelectIcon = (icon: string) => {
  option.value.icon = icon;
}

const showIconEditor = ref(true);
let appOption: Meta.AppNode = {} as any;
let modulNode: Meta.ModuleNode = {} as any;
const iconType = ref('card');
const mdiIcons = ref([] as any);

const loadIconList = async () => {
  if (showIconEditor.value) {
    IconBtnList = defineAsyncComponent({
      loader: () => import('./IconBtnList.vue'),
    })
    // 动态加载MDI图标集
    const mdi = await import(
      /* @vite-ignore */
      '@iconify/json/json/mdi.json'
    );
    mdiIcons.value = Object.keys(mdi.icons).map((name) => (name));
  }
}

const openAdd = (editType: MenuEventType, app_id: string, node: any) => {
  searchValue.value = "";
  option.value = {
    _id: '',
    name: '',
    icon: '',
    iconColor: ''
  }
  if (MenuEventType.AppAdd == editType) {
    showIconEditor.value = true;
    option.value = {
      _id: '',
      name: '',
      icon: 'application-outline',
      iconColor: '#29f4de'
    }
    title.value = '创建新应用';
    appOption = {
      name: '',
      icon: 'application-outline',
      iconColor: '#29f4de',
      parent_id: null,
      suf_id: null,
      type: 'app',
      formLayout: {
        layoutType: ModuleType.Form as any,   // 兼容原有编辑界面参数简化应用，后续可再拆分
        isEditable: true,
        draggable: true,
        layoutPadding: [10, 10],
        colNum: 12,
        defCompWidth: 6,
        defCompHeight: 2,
        rowHeight: 24,
        itemPadding: [0, 0],
        vglHeightPadding: 100,

        labelPlace: 'left',
        labelAlign: 'left',
        labelWidthType: 'default',
        labelWidth: 100
      },
      boardLayout: {
        layoutType: ModuleType.Board as any,   // 兼容原有编辑界面参数简化应用，后续可再拆分
        isEditable: true,
        draggable: true,
        layoutPadding: [10, 10],
        colNum: 60,
        defCompWidth: 20,
        defCompHeight: 10,
        rowHeight: 24,
        itemPadding: [5, 5],
        vglHeightPadding: 100
      },
      imports: [],
      home_id: null,
      en_id: ''
    } as Meta.AppNode
  } else if (MenuEventType.ModuleAddGroup == editType) {
    title.value = '添加分组';
    modulNode = {
      app_id: app_id,
      name: '',
      icon: 'document',
      iconColor: '#29f4de',
      parent_id: app_id,
      suf_id: null,
      type: 'group',
      en_id: ''
    }
    showIconEditor.value = false;
  } else if (MenuEventType.ModuleAddSubGroup == editType) {
    title.value = '添加子分组';
    modulNode = {
      app_id: app_id,
      name: '',
      icon: 'document',
      iconColor: '#29f4de',
      parent_id: node._id,
      suf_id: null,
      type: 'group',
      en_id: ''
    }
    showIconEditor.value = false;
  }
  optType.value = editType;
  showModal.value = true;
  loadIconList();
}

const openEdit = (editType: MenuEventType, node: any) => {
  searchValue.value = "";
  option.value = {
    _id: '',
    name: '',
    icon: '',
    iconColor: ''
  }
  if (MenuEventType.AppEditLable == editType) {
    showIconEditor.value = true;
    // edit
    title.value = '修改名称和图标';
    if (node) {
      appOption = node;
      let { _id, name, icon, iconColor } = node;
      option.value = { _id, name, icon, iconColor };
    }
  } else if (MenuEventType.ModuleEditLabel == editType) {
    showIconEditor.value = true;
    iconType.value = 'wrap';
    modulNode = node;
    let { _id, name, icon, iconColor } = node;
    option.value = { _id, name, icon, iconColor };
    title.value = '修改名称和图标';
  } else if (MenuEventType.ModuleGroupEditLabel == editType) {
    modulNode = node;
    let { _id, name, icon, iconColor } = node;
    option.value = { _id, name, icon, iconColor };
    title.value = '修改名称';
    showIconEditor.value = false;
  }
  optType.value = editType;
  showModal.value = true;
  loadIconList();
}

onBeforeUpdate(() => {
  iconList.value = midMin;
})

const addApp = async () => {
  // 校验：名称不能空；新插入记录插入最前，取pre_id=null的记录；
  if (option.value.name) {
    appOption = { ...appOption, ...option.value }
    const result = await fetchInsertAppNode(appOption);
    if (result.msg == 'ok') {
      emit('refreshMenu');
      showModal.value = false;
      // window.$message?.success(`添加应用【${option.value.name}】成功！`);
    } else {
      window.$message?.error(result.msg);
    }
  }
}

const addModelGroup = async () => {
  // 校验：名称不能空；新插入记录插入最前，取pre_id=null的记录；
  if (option.value.name) {
    modulNode = { ...modulNode, ...option.value }
    const result = await fetchInsertModuleNode(modulNode);
    if (result.msg == 'ok') {
      emit('refreshMenu');
      showModal.value = false;
      // window.$message?.success(`添加分组【${option.value.name}】成功！`);
    } else {
      window.$message?.error(result.msg);
    }
  }
}

const eidtApp = async () => {
  // 修改名称和图标
  if (option.value.name) {
    appOption = { ...appOption, ...option.value }
    const result = await fetchUpdateApp(appOption);
    if (result.msg == 'ok') {
      emit('refreshMenu');
      showModal.value = false;
      // window.$message?.success(`修改应用成功！`);
    } else {
      window.$message?.error('修改应用出错了！');
      console.log(result.msg)
    }
  }
}

const eidtModuleLabel = async () => {
  // 修改名称和图标
  if (option.value.name) {
    modulNode = { ...modulNode, ...option.value };
    const result = await fetchEditModuleNode(modulNode);
    if (result.msg == 'ok') {
      currModuleNode && modulNode && (currModuleNode.value = modulNode);
      emit('refreshMenu');
      showModal.value = false;
      // window.$message?.success(`修改模块标题成功！`);
    } else {
      window.$message?.error('修改模块标题出错了！');
      console.log(result.msg)
    }
  }
}

const onAppOkClick = async () => {
  if (optType.value == MenuEventType.AppAdd) {
    await addApp();
  } else if (optType.value == MenuEventType.AppEditLable) {
    await eidtApp();
  } else if (optType.value == MenuEventType.ModuleAddGroup) {
    await addModelGroup();
  } else if (optType.value == MenuEventType.ModuleAddSubGroup) {
    await addModelGroup();
  } else if (optType.value == MenuEventType.ModuleEditLabel || optType.value == MenuEventType.ModuleGroupEditLabel) {
    await eidtModuleLabel();
  }
}
// 删除app：标记删除，清除垃圾桶后彻底删除，涉及：模块元数据、模块实例数据；

defineExpose({
  openAdd,
  openEdit
})
</script>

<style lang="scss">
.border-bottom {
  border-bottom: 1px solid gray;
}
</style>
