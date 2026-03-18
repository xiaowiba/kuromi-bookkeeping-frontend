/**
 * 隐私密码 API
 *
 * @author Wangsongsong
 * @date 2026-03-19
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
