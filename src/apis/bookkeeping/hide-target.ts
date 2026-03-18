/**
 * 隐藏对象配置 API
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/hide-target'

/** @desc 获取当前用户隐藏对象列表 */
export function listMyHideTarget() {
  return http.get<T.HideTargetResp[]>(`${BASE_URL}/list`)
}

/** @desc 查询指定用户的隐藏对象列表 */
export function listHideTargetByUserId(userId: string | number) {
  return http.get<T.HideTargetResp[]>(`${BASE_URL}/list/${userId}`)
}

/** @desc 保存隐藏对象配置（全量覆盖） */
export function saveHideTarget(data: T.HideTargetReq) {
  return http.post(`${BASE_URL}/save`, data)
}
