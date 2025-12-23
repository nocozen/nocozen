<template>
  <SmoothScrollbar>
    <NFlex vertical :size="10" align="center" justify="center" class="w-full">
      <NCard :title="userAuth.userInfo.en_name" :bordered="false" size="small" segmented class="card-wrapper w-140">
        <span class="ml-5">所属部门：</span><span>{{userAuth.userInfo.dept.map((d: any) => d.name).join(',')}}</span>
      </NCard>
      <NCard title="基础信息" :bordered="false" size="small" segmented class="card-wrapper w-140">
        <NFlex vertical class="h-full p-5" :size="10">
          <NFlex class="w-full mt-4 mb-6" align="center">
            <NFlex align="center">
              <span>头像</span>
            </NFlex>
            <FileUpload :gfsIds="[account.avatar]" @uploadCompleted="uploadCompleted" type="avatar"
              title="上传头像"></FileUpload>
          </NFlex>
          <NFlex class="border-b-1">
            <NFormItem label="姓名" class="w-100" :rule="nameRule" label-placement="left">
              <NInput v-model:value="account.name" :bordered="account.nameEdit" @click="account.nameEdit = true"
                :maxlength="18" size="small" />
              <NButton v-if="account.nameEdit" @click="onUpdateAccount({ name: account.name })" class="ml-2"
                size="small" type="info">保存</NButton>
              <NButton v-if="account.nameEdit" @click="account.nameEdit = false" class="ml-2" size="small"
                type="default">取消</NButton>
            </NFormItem>
          </NFlex>
          <!-- <NFlex>
            <NFormItem label="账户" class="w-80" :rule="nameRule" label-placement="left">
              <NInput @blur="onUpdateAccount({ loginName: account.loginName })" v-model:value="account.loginName" @click=""
                :bordered="false" :maxlength="18" size="small" />
            </NFormItem>
          </NFlex> -->
          <NFlex class="border-b-1">
            <NFormItem :rule="phoneRule" label="手机" class="w-100" label-placement="left">
              <NInput v-model:value="account.phone" :bordered="account.phoneEdit" @click="account.phoneEdit = true"
                :allow-input="limitNum" :minlength="11" :maxlength="11" size="small" />
              <NButton v-if="account.phoneEdit" @click="onUpdateAccount({ phone: account.phone })" class="ml-2"
                size="small" type="info">保存</NButton>
              <NButton v-if="account.phoneEdit" @click="account.phoneEdit = false" class="ml-2" size="small"
                type="default">取消</NButton>
            </NFormItem>
          </NFlex>
          <NFlex>
            <NFormItem :rule="emailRule" label="邮箱" class="w-100" label-placement="left">
              <NInput v-model:value="account.email" :bordered="account.emailEdit" @click="account.emailEdit = true"
                size="small" />
              <NButton v-if="account.emailEdit" @click="onUpdateAccount({ phone: account.email })" class="ml-2"
                size="small" type="info">保存</NButton>
              <NButton v-if="account.emailEdit" @click="account.emailEdit = false" class="ml-2" size="small"
                type="default">取消</NButton>
            </NFormItem>
          </NFlex>
        </NFlex>
      </NCard>
      <NCard :bordered="false" size="small" segmented class="card-wrapper w-140" content-style="padding:0">
        <NFlex class="h-12.5 mx-4" :size="0" align="center" justify="space-between">
          <span>修改密码</span>
          <ButtonIcon @click="pwdEdit = !pwdEdit" :icon="pwdEdit ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            iconClass="text-xl text-gray-500" />
        </NFlex>
        <NFlex v-if="pwdEdit" vertical class="h-full p-5 border-t-1" :size="10">
          <NFormItem :rule="oldPwdRule" label="旧密码" class="w-92" label-placement="left">
            <NInput v-model:value="account.oldPwd" :allow-input="limitStrOrNum" show-password-on="click" type="password"
              size="small" placeholder="输入密码" />
          </NFormItem>
          <NFormItem :rule="newPwdRule" label="新密码" class="w-120" label-placement="left">
            <NInput v-model:value="account.password" :allow-input="limitStrOrNum" show-password-on="click"
              type="password" size="small" placeholder="输入新密码" class="mr-1" />
            <NInput v-model:value="account.checkedPwd" :allow-input="limitStrOrNum" show-password-on="click"
              type="password" size="small" placeholder="再次输入新密码" />
            <NButton :disabled="!isPwdValid" ref="refSavePwd" class="ml-2" size="small" type="info" @click="savePwd">保存
            </NButton>
            <NButton class="ml-2" size="small" type="default" @click="pwdEdit = false">取消</NButton>
          </NFormItem>
        </NFlex>
      </NCard>
    </NFlex>
  </SmoothScrollbar>

</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { fetchUpdatePwd, fetchUpdateAccount } from '@/service/api';
import { isEmpty } from 'radashi';
import { useAuthStore } from '@/store/modules/auth';

const userAuth = useAuthStore();
const account = ref({} as any);
const pwdEdit = ref(false);
const refSavePwd = ref();

const isPwdValid = computed(() => {
  // 检查旧密码
  const oldPwdValid = !validatePwdLength(account.value.oldPwd)
  // 检查新密码
  const newPwdValid = !validatePwdLength(account.value.password)
  // 检查密码一致性
  const pwdMatch = account.value.password === account.value.checkedPwd

  return oldPwdValid && newPwdValid && pwdMatch
})

// 只允许输入字母和数字
const limitStrOrNum = (value: string) => {
  return /^[a-zA-Z0-9]*$/.test(value); // 仅允许字母和数字
};

// 只允许输入数字
const limitNum = (value: string) => {
  return /^[0-9]*$/.test(value); // 仅允许字母和数字
};

const validatePwdLength = (pwd: string) => {
  if (pwd?.length < 4 || pwd?.length > 18) {
    return new Error('4-18位字符或数字');
  }
  return undefined;
};

const oldPwdRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: () => validatePwdLength(account.value.oldPwd)
  }
})

const checkNewPwd = (pwd: string) => {
  const lengthError = validatePwdLength(account.value.password);
  if (lengthError) return lengthError;
  if (account.value.password != account.value.checkedPwd) {
    return new Error('密码输入不一致')
  }
}

const newPwdRule = computed(() => {
  return {
    trigger: ['input', 'blur'],
    validator: () => checkNewPwd(account.value.password)
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
    name: userAuth.userInfo.name,     // 账户名称必须唯一
    nameEdit: false,
    // loginName: '',
    // nickName: '',
    // code: '',
    phone: userAuth.userInfo.phone,
    phoneEdit: false,
    email: userAuth.userInfo.email,
    emailEdit: false,
    avatar: userAuth.userInfo.avatar,

    oldPwd: '',
    password: '',
    checkedPwd: '',
  }
}

initData()


// 包装接口
const updateAccount = async (ids: Array<string> | string, update: Partial<Meta.Account>) => {
  if (!isEmpty(ids)) {
    const result = await fetchUpdateAccount(ids, update);
    if ('ok' == result.msg) {
      window.$message?.success('账户信息更新成功')
    } else {
      window.$message?.error('账户信息更新失败')
    }
  }
}

const uploadCompleted = async (id: string) => {
  const result = await updateAccount(userAuth.userInfo._id, { avatar: id });
  // console.log(result)
}

// blur事件
const onUpdateAccount = async (update: Partial<Meta.Account>) => {
  if ('name' in update) {
    account.value.nameEdit = false;
  } else if ('phone' in update) {
    account.value.phoneEdit = false;
  } else if ('email' in update) {
    account.value.emailEdit = false;
  }
  await updateAccount(userAuth.userInfo._id, update);
}

const savePwd = async () => {
  if (isPwdValid) {
    if (!isEmpty(userAuth.userInfo._id)) {
      // 先查询旧密码是否能获取到账户记录，
      const result = await fetchUpdatePwd(userAuth.userInfo._id, account.value.oldPwd,  { password: account.value.password });
      if ('ok' == result.msg) {
        window.$message?.success('密码修改成功')
      } else {
        window.$message?.error('密码修改失败！' + result.msg)
      }
    }
  }
}

</script>

<style scoped></style>
