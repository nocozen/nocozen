<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useCaptcha } from '@/hooks/business/captcha';
import { fetchRegiter } from '@/service/api'
import { ModuleType } from '@/enum';

defineOptions({
  name: 'Register'
});

const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();
// const { label, isCounting, loading, getCaptcha } = useCaptcha();

interface FormModel {
  enName: string,
  enFullName: string,
  accName: string,
  phone: string;
  code: string;
  password: string;
  confirmPassword: string;
}

const model: FormModel = reactive({
  enName: '',
  enFullName: '',
  accName: '',
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
});
const slierVerify = ref(false);
const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules, createConfirmPwdRule } = useFormRules();

  return {
    enName: formRules.userName,
    enFullName: formRules.userName,
    accName: formRules.userName,
    phone: formRules.phone,
    code: formRules.code,
    password: formRules.pwd,
    confirmPassword: createConfirmPwdRule(model.password)
  };
});

async function handleSubmit() {
  if (!slierVerify.value) {
    window.$message?.warning('滑块验证未通过！')
  }
  await validate();
  // request to register
  // window.$message?.success($t('page.login.common.validateSuccess'));
  const en: Meta.Enterprise = {
    name: model.enName,
    fullName: model.enFullName,
    wbComps: [],
  }
  const acc: Meta.Account = {
    loginName: model.accName,
    code: '',
    name: model.accName,
    nickName: '',
    phone: model.phone,
    email: '',
    password: model.password,
    avatar: '',
    active: true,
    onJob: true,
  }
  const reuslt = await fetchRegiter(en, acc);
  if (reuslt.msg == 'ok') {
    window.$message?.success('注册成功请登录！');
    toggleLoginModule('pwd-login')
  } else {
    window.$message?.error(reuslt.msg);
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="enName">
      <NInput v-model:value="model.enName" placeholder="请输入企业简称" />
    </NFormItem>
    <NFormItem path="enFullName">
      <NInput v-model:value="model.enFullName" placeholder="请输入企业全称" />
    </NFormItem>
    <NFormItem path="accName">
      <NInput v-model:value="model.accName" placeholder="请输入创建人账户" />
    </NFormItem>
    <NFormItem path="phone">
      <NInput v-model:value="model.phone" :placeholder="$t('page.login.common.phonePlaceholder')" />
    </NFormItem>
    <!-- <NFormItem path="code">
      <div class="w-full flex-y-center gap-16px">
        <NInput v-model:value="model.code" :placeholder="$t('page.login.common.codePlaceholder')" />
        <NButton size="large" :disabled="isCounting" :loading="loading" @click="getCaptcha(model.phone)">
          {{ label }}
        </NButton>
      </div>
    </NFormItem> -->
    <NFormItem path="password">
      <NInput v-model:value="model.password" type="password" show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')" />
    </NFormItem>
    <NFormItem path="confirmPassword">
      <NInput v-model:value="model.confirmPassword" type="password" show-password-on="click"
        :placeholder="$t('page.login.common.confirmPasswordPlaceholder')" />
    </NFormItem>
    <SliderVerify v-model="slierVerify" class="mb-3"></SliderVerify>
    <NSpace vertical :size="18" class="w-full">
      <NButton type="primary" size="large" round block @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <NButton size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ $t('page.login.common.back') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
