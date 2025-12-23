import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';
import { fetchGetAdminGroupsBy, fetchGetPermGroupCount } from '@/service/api';
import { encryptPack } from '@/utils/crypto-msgpack';
import { isEmpty } from 'radashi';


export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    // todo: 兼容soy框架处理，后续处理以现有解构为主；
    userId: '',
    userName: '',
    roles: [],
    buttons: [],

    _id: '',
    name: '',
    phone: '',
    email: '',
    avatar: '',
    en_id: '',   // 当前登录的企业id，多个登录时需要提供界面选择，默认可以取第一个；
    en_name: '',
    dept: [],
    role: [],    // todo: 类型不兼容需要重构

    auth: null    // 加密存储权限数据
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore();

    recordUserId();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.userId) {
      return;
    }

    // Store current user ID locally for next login comparison
    localStg.set('lastLoginUserId', userInfo.userId);
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.userId) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== userInfo.userId) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(userName: string, password: string, redirect = true) {
    startLoading();
    // const { data: loginToken, error } = await fetchLogin(userName, password);
    const result = await fetchLogin(userName, password);
    if (result.msg == 'ok') {
      const pass = await loginByToken(result.token);
      if (pass) {
        await routeStore.initAuthRoute();
        if (redirect) {
          await redirectFromLogin();
        }
        if (routeStore.isInitAuthRoute) {
          window.$notification?.success({
            title: $t('page.login.common.loginSuccess'),
            content: $t('page.login.common.welcomeBack', { userName: userInfo.name }),
            duration: 1000
          });
        }
      }
    } else {
      resetStore();
      window.$message?.error(result.msg);
    }

    endLoading();
  }

  async function loginByToken(loginToken: string) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken);
    // localStg.set('refreshToken', loginToken.refreshToken);
    // 2. get user info
    const pass = await getUserInfo();
    if (pass) {
      token.value = loginToken;
      return true;
    }
    return false;
  }

  async function getAllAuth() {
    // 系统管理员(包括创建者)：所有权限；
    // 应用管理员：判断应用范围
    // 普通用户：判断应用和模块权限；
    // 管理角色；
    // 可管理应用_id集合；工作台应用控制管理操作用；
    // 可访问应用及模块Count结果集；工作台、应用列表、应用中的模块列表用；
    let userAuth: Meta.UserAuth = {
      groupRole: 'none',
      agAppPerm: [],
      adminGroup: [],
      permGroupCount: []
    }

    const agResult = await fetchGetAdminGroupsBy({ "member._id": userInfo.userId});
    if ('ok' == agResult.msg && agResult.data?.length > 0) {
      userAuth.adminGroup = agResult.data;   // 可以多条，在多个组中存在；
      const groupTypes = agResult.data.map((d: Meta.AdminGroup) => d.type);
      if (groupTypes.includes('creator')) {
        userAuth.groupRole = 'creator';
      } else if (groupTypes.includes('super')) {
        userAuth.groupRole = 'super';
      } else if (groupTypes.includes('system')) {
        userAuth.groupRole = 'system';
      } else if (groupTypes.includes('app')) {
        userAuth.groupRole = 'app';
      }

      userAuth.agAppPerm = agResult.data.flatMap((d: Meta.AdminGroup) => d.appPerm?.map((p: any) => p._id))
    }

    const pgResult = await fetchGetPermGroupCount();

    if ('ok' == pgResult.msg && pgResult.data?.length > 0) {
      userAuth.permGroupCount = pgResult.data;
      // console.log(pgResult.data)
    }

    return userAuth;
  }

  async function getUserInfo() {
    let result = null;
    try {
      result = await fetchGetUserInfo();
    } catch (e: any) {   // FetchError: name, message, stack...
      // console.log(e.status, e.statusText, e.statusCode)
      window.$message?.error(e.data.error);
    }
    // role[]、dept[]需要从account_en中获取
    if (result && result.msg == 'ok' && result.data?.length == 1) {
      // update store
      // Object.assign(userInfo, info);
      userInfo.userId = result.data[0]._id;
      userInfo.userName = result.data[0].loginName;

      userInfo._id = result.data[0]._id;
      userInfo.name = result.data[0].name;
      userInfo.phone = result.data[0].phone;
      userInfo.email = result.data[0].email;
      userInfo.avatar = result.data[0].avatar;
      userInfo.en_id = result.data[0].en_id;   // 默认第一个企业
      userInfo.en_name = result.data[0].en_name;
      userInfo.dept = result.data[0]?.dept;
      // userInfo.roles = result.data[0].role;    // todo: 类型不兼容，

      const allAuth = await getAllAuth();
      if (!isEmpty(allAuth)) {
        userInfo.auth = await encryptPack(allAuth); // 不要用token加密
      }



      return true;
    }

    return false;
  }


  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo
  };
});
