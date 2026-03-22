/**
 * 隐私密码 API
 *
 * @author Wangsongsong
 * @date 2026-03-19
 * @update 2026-03-22 @Wangsongsong
 * @desc 增加隐私配置查询接口，供移动端读取有效时长配置
 * @update 2026-03-22 @Wangsongsong
 * @desc 增加隐私配置修改接口，供 web 端隐藏配置页维护有效时长
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/privacy'

/** @desc 验证隐私密码 */
export function verifyPrivacyPassword(data: T.PrivacyVerifyReq) {
  return http.post<T.PrivacyVerifyResp>(`${BASE_URL}/verify`, data)
}

/** @desc 设置/修改隐私密码 */
export function setPrivacyPassword(data: T.PrivacyPasswordReq) {
  return http.post(`${BASE_URL}/set-password`, data)
}

/** @desc 检查是否已设置隐私密码 */
export function hasPrivacyPassword() {
  return http.get<T.PrivacyHasPasswordResp>(`${BASE_URL}/has-password`)
}

/** @desc 查询隐私配置 */
export function getPrivacyConfig() {
  return http.get<T.PrivacyConfigResp>(`${BASE_URL}/config`)
}

/** @desc 更新隐私配置 */
export function updatePrivacyConfig(data: T.PrivacyConfigUpdateReq) {
  return http.put(`${BASE_URL}/config`, data)
}
