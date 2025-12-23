import { request } from '../request';

/** get constant routes */
export function fetchGetConstantRoutes(): Promise<any> {
  // return request<Api.Route.MenuRoute[]>({ url: '/route/getConstantRoutes' });
  return request<Api.Route.MenuRoute[]>('/route/getConstantRoutes');
}

/** get user routes */
export function fetchGetUserRoutes(): Promise<any> {
  // return request<Api.Route.UserRoute>({ url: '/route/getUserRoutes' });
  return request<Api.Route.UserRoute>('/route/getUserRoutes');
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string): Promise<any> {
  // return request<boolean>({ url: '/route/isRouteExist', params: { routeName } });
  return request<boolean>('/route/isRouteExist', { params: { routeName } });
}
