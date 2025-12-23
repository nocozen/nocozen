<template>
  <NFlex align="center" justify="center" class="w-full h-full">
    <NFlex v-if="!auth" vertical class="bg-white max-w-300 p-4 rounded mb-20" :size="0">
      <NFlex class="border-b-1 mb-6 pb-2">
        <span class="w-full text-center font-semibold">登录配置管理</span>
      </NFlex>
      <NFormItem label="账户" label-placement="left" size="small">
        <NInput v-model:value="account.admin"></NInput>
      </NFormItem>
      <NFormItem label="密码" label-placement="left" size="small">
        <NInput v-model:value="account.pwd" type="password" show-password-on="mousedown"></NInput>
      </NFormItem>
      <NButton type="info" size="small" @click="checkAuth" class="my-2">确认</NButton>
    </NFlex>
    <NFlex v-else vertical class="bg-white p-4 rounded mb-20" :size="0">
      <span class="w-full text-center font-semibold">系统初始化配置</span>
      <NDivider class="my-5!">Mongodb</NDivider>
      <NFormItem label="数据库名" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.MONGO_MAINDB"></NInput>
        <NButton @click="save('MONGO_MAINDB')" :disabled="config.MONGO_MAINDB == oldConfig.MONGO_MAINDB" type="info"
          size="small" class="ml-2">保存</NButton>
      </NFormItem>
      <NFormItem label="IP" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.MONGO_IP"></NInput>
        <NButton @click="save('MONGO_IP')" :disabled="config.MONGO_IP == oldConfig.MONGO_IP" type="info" size="small"
          class="ml-2">保存</NButton>
      </NFormItem>
      <NFormItem label="端口" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.MONGO_PORT"></NInput>
        <NButton @click="save('MONGO_PORT')" :disabled="config.MONGO_PORT == oldConfig.MONGO_PORT" type="info"
          size="small" class="ml-2">保存</NButton>
      </NFormItem>
      <NFormItem label="用户" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.MONGO_USERNAME"></NInput>
        <NButton @click="save('MONGO_USERNAME')" :disabled="config.MONGO_USERNAME == oldConfig.MONGO_USERNAME"
          type="info" size="small" class="ml-2">保存</NButton>
      </NFormItem>
      <NFormItem label="密码" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.MONGO_PASSWORD" type="password" show-password-on="mousedown"></NInput>
        <NButton @click="save('MONGO_PASSWORD')" :disabled="config.MONGO_PASSWORD == oldConfig.MONGO_PASSWORD"
          type="info" size="small" class="ml-2">保存</NButton>
      </NFormItem>
      <NDivider class="my-5!">认证</NDivider>
      <NFormItem label="管理员密码" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.INIT_PWD" type="password" show-password-on="mousedown"></NInput>
        <NButton @click="save('INIT_PWD')" :disabled="config.INIT_PWD == oldConfig.INIT_PWD" type="info" size="small"
          class="ml-2">保存</NButton>
      </NFormItem>
      <!-- <NFormItem label="过期设置" label-width="100" label-align="left" label-placement="left" size="small">
        <NInputGroup>
          <NSelect v-model:value="config.DATE_LIMIT" :options="expireOption" class="w-30"></NSelect>
          <NDatePicker @update:value="updateExpireDate" v-model:value="expireDate"
            :disabled="config.DATE_LIMIT == 'none'" type="datetime" class="50">
          </NDatePicker>
        </NInputGroup>
        <NButton @click="saveDateLimit()"
          :disabled="config.DATE_LIMIT == oldConfig.DATE_LIMIT && config.DATE_LIMIT_EXPIRE == oldConfig.DATE_LIMIT_EXPIRE"
          type="info" size="small" class="ml-2">保存</NButton>
      </NFormItem>
      <NFormItem label="系统授权码" label-width="100" label-align="left" label-placement="left" size="small">
        <NInput v-model:value="config.AUTH_KEY"></NInput>
        <NButton @click="save('AUTH_KEY')" :disabled="config.AUTH_KEY == oldConfig.AUTH_KEY" type="info" size="small"
          class="ml-2">保存</NButton>
      </NFormItem> -->
    </NFlex>
  </NFlex>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fetchGetAllConfig, fetchUpdateConfig, fetchInitConfig } from '@/service/api/init';
import dayjs from 'dayjs';

const expireOption = [
  { label: '无限制', value: 'none' },
  { label: '限制', value: 'limit' }
]
const account = ref({
  admin: '',
  pwd: ''
})
const auth = ref(false);
const expireDate = ref(Date.now());
const config = ref({
  INIT_PWD: '',
  DATE_LIMIT: 'none',
  DATE_LIMIT_EXPIRE: '',
  AUTH_KEY: '',             // 系统授权码，包含：授权类别、客户名称、系统版本、app数量、模块数量、高级模块[]、日期限制、

  MONGO_IP: '',
  MONGO_PORT: '',       // 27017
  MONGO_USERNAME: '',
  MONGO_PASSWORD: '',
  MONGO_MAINDB: '',   // main
  MONGO_BUSIDB: '',   // main
  MONGO_GFSDB: '',   // main
  MONGO_JOBDB: '',   // main
  MONGO_BUCKETNAME: '',   // qbfs
  // MONGO_DIMSPLIT: '|',

  HTTP_SERVER_PORT: '',   // 8000
  // HTTP_ONESERVER: true,
  // HTTP_APIROOT: 'api',
  // HTTP_STATICDIR: './web',
  // HTTP_MAXLIMIT: 1000,
  // HTTP_WORKERID: 1,
  // HTTP_TOKEN_EXPIRESIN: '16h',
  // HTTP_JWT_LRU_MAX: 1000,

  // PATH_IMAGEBASE: './',
  // PATH_LOGPATH: './',
} as any)

let oldConfig = ref({} as any);

const init = async () => {
  const result = await fetchInitConfig();
}

init();

const checkAuth = async () => {
  const result = await fetchGetAllConfig(account.value.admin, account.value.pwd);
  if ('ok' == result.msg && result.data) {
    oldConfig.value = { ...result.data };
    config.value = { ...result.data };
    if (config.value['DATE_LIMIT_EXPIRE']) {
      expireDate.value = dayjs(Number(config.value['DATE_LIMIT_EXPIRE'])).valueOf();
    }
    auth.value = true;
  } else {
    window.$message?.error('账户或密码错误')
  }
}

const updateExpireDate = async (value: any) => {
  config.value['DATE_LIMIT_EXPIRE'] = expireDate.value.toString();
}

const saveDateLimit = async () => {
  let key = 'DATE_LIMIT';
  const result = await fetchUpdateConfig(key, config.value[key], account.value.pwd);
  if ('ok' == result.msg) {
    if ('DATE_LIMIT' == key) {
      const updateExpired = await fetchUpdateConfig('DATE_LIMIT_EXPIRE', expireDate.value.toString(), account.value.pwd);
      console.log(updateExpired)
      if ('ok' == updateExpired.msg) {
        oldConfig.value[key] = config.value[key];
        oldConfig.value['DATE_LIMIT_EXPIRE'] = config.value['DATE_LIMIT_EXPIRE'];
        window.$message?.success('保存成功')
      }
    }
  } else {
    window.$message?.error('出错了，保存失败')
  }
}

const save = async (key: string) => {
  const result = await fetchUpdateConfig(key, config.value[key], account.value.pwd);
  if ('ok' == result.msg) {
    oldConfig.value[key] = config.value[key];
    window.$message?.success('保存成功');
  } else {
    window.$message?.error('出错了，保存失败')
  }
}

</script>
