<template>
  <NDrawer @after-leave="onDrawerClose" class=" border-1" v-model:show="showEditor" :width="300" placement="right">
    <SmoothScrollbar style="height: calc(100vh - 62px);">
      <NFlex vertical class="h-full p-5" :size="0">
        <template  v-if="showEditor">
        <NFlex v-if="'edit' == editType" class="w-full mt-4 mb-6" align="center">
          <FileUpload :gfsIds="[account.avatar]" @uploadCompleted="uploadCompleted" type="avatar"
            title="上传头像"></FileUpload>
          <NFlex vertical>
            <NFlex align="center">
              <span>{{ account.name }}</span>
              <span>{{ account.phone }}</span>
            </NFlex>
            <NButton @click="onUpdateAccount({ active: account.active = !account.active })" size="tiny" round
              :type="account.active ? 'success' : 'default'">{{ account.active ? '已启用' : '已停用' }}</NButton>
          </NFlex>
        </NFlex>
        <NFlex>
          <NFormItem label="账号" class="w-full" :rule="accRule" :show-require-mark="true">
            <NInput :allow-input="limitStrOrNum" @blur="onUpdateLoginName({ loginName: account.loginName })"
              v-model:value="account.loginName" size="small" />
          </NFormItem>
        </NFlex>
        <NFlex>
          <NFormItem v-if="'add' == editType" :rule="pwdRule" label="密码" class="w-full" :show-require-mark="true">
            <NInput v-model:value="account.password" :allow-input="limitStrOrNum" size="small" placeholder="输入密码"
              class="mr-1" />
            <NInput v-model:value="account.checkedPwd" :allow-input="limitStrOrNum" size="small" placeholder="再次输入密码" />
          </NFormItem>
        </NFlex>
        <NFlex>
          <NFormItem label="姓名" class="w-full" :rule="nameRule" :show-require-mark="true">
            <NInput @blur="onUpdateAccount({ name: account.name })" v-model:value="account.name" :maxlength="18"
              size="small" />
          </NFormItem>
        </NFlex>
        <!-- <NFlex>
          <NFormItem label="编号" class="w-full">
            <NInput @blur="onUpdateAccount({ code: account.code })" v-model:value="account.code" size="small" />
          </NFormItem>
        </NFlex> -->
        <NFlex>
          <NFormItem :rule="phoneRule" label="手机" class="w-full" :show-require-mark="true">
            <NInput @blur="onUpdateAccount({ phone: account.phone })" v-model:value="account.phone"
              :allow-input="limitNum" :minlength="11" :maxlength="11" size="small" />
          </NFormItem>
        </NFlex>
        <NFlex>
          <NFormItem :rule="emailRule" label="邮箱" class="w-full">
            <NInput @blur="onUpdateAccount({ email: account.email })" v-model:value="account.email" size="small" />
          </NFormItem>
        </NFlex>
        <NFlex>
          <NFormItem label="部门" class="w-full">
            <NDynamicTags :render-tag="renderDeptTags" v-model:value="accDept" size="small"
              class="p-1 min-h-15 border-1 border-dashed w-full" @click="openOrgCheck('dept')">
              <template #trigger="{ activate, disabled }">
                <NButton v-if="accDept?.length == 0" class="w-62 h-full" text :disabled="disabled">
                  <Icon icon="mdi:plus"></Icon>
                  <span>选择部门</span>
                </NButton>
              </template>
            </NDynamicTags>
          </NFormItem>
        </NFlex>
        <NFlex>
          <NFormItem label="角色" class="w-full">
            <NDynamicTags :render-tag="renderRoleTags" v-model:value="accRole" size="small"
              class="p-1 min-h-15 border-1 border-dashed w-full" @click="openOrgCheck('role')">
              <template #trigger="{ activate, disabled }">
                <NButton v-if="accRole?.length == 0" class="w-62 h-full" text :disabled="disabled">
                  <Icon icon="mdi:plus"></Icon>
                  <span>选择角色</span>
                </NButton>
              </template>
            </NDynamicTags>
          </NFormItem>
        </NFlex>
        </template>
      </NFlex>
    </SmoothScrollbar>
    <NFlex class="h-15 px-5 border-t-1" align="center">
      <NButton v-if="'add' == editType" size="small" type="info" @click="onSaveAccount">保存</NButton>
      <NButton v-if="'edit' == editType" size="small"
        @click="onUpdateAccount({ onJob: account.onJob = !account.onJob })">{{ account.onJob ? "转离职" : "恢复在职" }}</NButton>
      <!-- <NButton v-if="'edit' == editType" size="small">工作交接</NButton> -->
    </NFlex>
  </NDrawer>
  <OrgMemberChecker ref="refOrgChecker" @onCheckedOk="onCheckedOk"></OrgMemberChecker>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue';
import { fetchGetAccInfo, fetchGetAccounts, fetchGetUserInfo, fetchNewAccount, fetchUpdateAccount, fetchUpdateAccountEn } from '@/service/api';
import { NTag } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { MemberCheckerType } from '@/enum';
import { isEmpty } from 'radashi';

interface Props {
}

const props = withDefaults(defineProps<Props>(), {
})

interface Emits {
  (e: 'reLoadData'): void,
  // (e: 'onSelected', node: any): void
}

const emit = defineEmits<Emits>()

const refOrgChecker = ref();
const showEditor = ref(false);
const editType = ref('add');
const candidates = ref([
  { label: '部门主管', value: '部门主管' }
])
const account = ref({} as any)
const accountEn = ref({} as any)
const accDept = ref([] as any);
const accRole = ref([] as any);
const accIsExist = ref(false);
const refLoginName = ref();

const checkLoginName = async () => {
  // 1. 先校验长度（同步）
  if (account.value.loginName?.length < 4 || account.value.loginName?.length > 18) {
    throw new Error('长度需为4-18位字符'); // 必须用 throw 而非 return
  }
  // 2. 再校验数据库（异步）
  const userResult = await fetchGetAccInfo({
    loginName: account.value.loginName
  });

  if (userResult.msg === 'ok' && userResult.data?.length > 0) {
    throw new Error('账户名已存在');
  }

}
// 异步校验输入账户是否存在
const accRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: checkLoginName
  };
});

// 只允许输入字母和数字
const limitStrOrNum = (value: string) => {
  return /^[a-zA-Z0-9]*$/.test(value); // 仅允许字母和数字
};

// 只允许输入数字
const limitNum = (value: string) => {
  return /^[0-9]*$/.test(value); // 仅允许字母和数字
};

const checkPwd = () => {
  if (account.value.password?.length < 4 || account.value.password?.length > 18) {
    return new Error('4-18位字符或数字')
  }
  if (account.value.password != account.value.checkedPwd) {
    return new Error('密码输入不一致')
  }
}

const pwdRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: checkPwd
  }
})

const checkName = () => {
  if (account.value.name?.length < 3) {
    return new Error('不能少于3个字符')
  }
}

const nameRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: checkName
  }
})

const checkPhone = () => {
  if (account.value.phone?.length !== 11) {
    return new Error('输入长度不正确')
  }
}
const phoneRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: checkPhone
  }
})

const checkEmail = () => {
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!EMAIL_REGEX.test(account.value.email)) {
    return new Error('邮箱格式不正确')
  }
}
const emailRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: checkEmail
  }
})


const initData = () => {
  account.value = {
    name: '',     // 账户名称必须唯一
    loginName: '',
    nickName: '',
    code: '',
    phone: '',
    email: '',
    password: '',
    checkedPwd: '',
    avatar: '',
    active: false,
    onJob: true,
  }
  accountEn.value = {
    _id: '',
    acc_id: '',
    dept: [],
    role: [],
    en_id: ''
  }
  accDept.value = [];
  accRole.value = [];
}

const onDrawerClose = () => {
  emit('reLoadData');
}

// 包装接口
const updateAccount = async (ids: Array<string> | string, update: Partial<Meta.Account>) => {
  if (!isEmpty(ids)) {
    const result = await fetchUpdateAccount(ids, update);
    if ('ok' == result.msg) {
      // window.$message?.success('账户信息更新成功')
    } else {
      window.$message?.error('账户信息更新失败')
    }
  }
}
// 包装接口
const updateAccountEn = async (_id: string, update: Partial<Meta.AccountEn>) => {
  if (_id) {
    const result = await fetchUpdateAccountEn(accountEn.value._id, update);
    return result;
  } else {
    return { msg: '_id不能为空' };
  }
}

const mapAccEn = () => {
  accountEn.value.dept?.length > 0 && (accDept.value = accountEn.value.dept.map((d: Meta.Base) => ({ label: d.name, value: d._id })));
  accountEn.value.role?.length > 0 && (accRole.value = accountEn.value.role.map((r: Meta.Base) => ({ label: r.name, value: r._id })));
}

const mapAccEnModel = () => {
  accDept.value?.length > 0 && (accountEn.value.dept = accDept.value.map((d: any) => ({ _id: d.value, name: d.label })));
  accRole.value?.length > 0 && (accountEn.value.role = accRole.value.map((r: any) => ({ _id: r.value, name: r.label })));
}

const uploadCompleted = async (id: string) => {
  const result = await updateAccount(accountEn.value.acc_id, { avatar: id });
  // console.log(result)
}

// blur事件
const onUpdateAccount = async (update: Partial<Meta.Account>) => {
  const updateResult = await updateAccount(accountEn.value.acc_id, update);
}

const onUpdateLoginName = async (update: Partial<Meta.Account>) => {
  try {
    await checkLoginName(); // 重名后抛异常
    const updateResult = await updateAccount(accountEn.value.acc_id, update);
  } catch (e: any) {
    window.$message?.error(e.message);
  }

}

// 新增保存
const onSaveAccount = async () => {
  if ('edit' == editType.value) return;

  try {
    await checkLoginName(); // 重名后抛异常
    if (checkPwd() || checkName() || checkPhone()) {
      window.$message?.error('必填项不能为空');
      return;
    }

    mapAccEnModel();
    // 新增账户需要保存
    const result = await fetchNewAccount(account.value, accountEn.value);
    showEditor.value = false;
    if ('ok' == result.msg) {
      window.$message?.success('添加用户成功')
    } else {
      window.$message?.error(result.msg)
    }
  } catch (e: any) {
    window.$message?.error('保存出错了')
    console.log(e.message)
  }
}

const removeTag = async (type: 'dept' | 'role' | 'member', tag: { label: string, value: string }) => {
  if ('dept' == type) {
    accDept.value = accDept.value.filter((v: any) => v.value != tag.value);
    accountEn.value.dept = accountEn.value.dept.filter((v: Meta.Base) => v._id != tag.value);
    const result = await updateAccountEn(accountEn.value._id, { dept: accountEn.value.dept });
  } else {
    accRole.value = accRole.value.filter((v: any) => v.value != tag.value);
    accountEn.value.role = accountEn.value.role.filter((v: Meta.Base) => v._id != tag.value);;
    const result = await updateAccountEn(accountEn.value._id, { role: accountEn.value.role });
  }
}

const renderDeptTags = (tag: { label: string, value: string }, index: number) => {
  return h(
    NTag,
    {
      closable: true,
      onClose: () => {
        removeTag('dept', tag);
      }
    },
    {
      default: () => tag.label
    }
  )
}

const renderRoleTags = (tag: { label: string, value: string }, index: number) => {
  return h(
    NTag,
    {
      closable: true,
      onClose: () => {
        removeTag('role', tag);
      }
    },
    {
      default: () => tag.label
    }
  )
}

const onCheckedOk = async (orgType: MemberCheckerType, values: Array<Meta.Tag>) => {
  if ('dept' == orgType) {
    accDept.value = values;
    accountEn.value.dept = values.map((v: Meta.Tag) => ({ _id: v.value, name: v.label }));
    if (accountEn.value._id) {
      const result = await updateAccountEn(accountEn.value._id, { dept: accountEn.value.dept as any });
    }
  } else {
    accRole.value = values;
    accountEn.value.role = values.map((v: Meta.Tag) => ({ _id: v.value, name: v.label }));
    if (accountEn.value._id) {
      const result = await updateAccountEn(accountEn.value._id, { role: accountEn.value.role as any });
    }
  }
}

const showAdd = (selectedType: 'dept' | 'role' | 'other', selectedNode: any) => {
  // 初始化
  initData();
  if ('dept' == selectedType) {
    accDept.value.push({ label: selectedNode.label, value: selectedNode.value })
  } else if ('role' == selectedType) {
    accRole.value.push({ label: selectedNode.label, value: selectedNode.value })
  }
  editType.value = 'add';
  showEditor.value = true;
}

const showEdit = (rowData: object) => {
  initData();
  Object.entries(rowData)?.forEach(([key, value]) => {
    if (key in accountEn.value) {
      accountEn.value[key] = value;
    } else {
      account.value[key] = value;
    }
  })
  mapAccEn();
  editType.value = 'edit';
  showEditor.value = true;
}


const openOrgCheck = (type: 'dept' | 'role') => {
  let pgOption: Partial<Meta.ModulePermGroup> = {};   // 兼容权限组配置对话框的处理；
  if ('dept' == type) {
    pgOption = {
      deptAuth: accountEn.value.dept
    }
  } else {
    pgOption = {
      roleAuth: accountEn.value.role
    }
  }
  refOrgChecker.value.show([type], pgOption);
}

defineExpose({
  showAdd,
  showEdit
})
</script>