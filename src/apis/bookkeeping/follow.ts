/**
 * 关注管理 API
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 新增用户选项列表接口，绕过数据权限
 */
import type * as T from './type'
import http from '@/utils/http'
import type { LabelValueState } from '@/types/global'

export type * from './type'

const BASE_URL = '/bookkeeping/follow'

/** @desc 分页查询关注列表 */
export function listFollow(query: T.FollowPageQuery) {
  return http.get<PageRes<T.FollowResp[]>>(`${BASE_URL}`, query)
}

/** @desc 获取当前用户关注列表 */
export function listMyFollow() {
  return http.get<T.FollowResp[]>(`${BASE_URL}/my`)
}

/** @desc 查询指定用户的关注列表 */
export function listFollowByUserId(userId: string | number) {
  return http.get<T.FollowResp[]>(`${BASE_URL}/list/${userId}`)
}

/** @desc 保存关注配置（全量覆盖） */
export function saveFollow(data: T.FollowReq) {
  return http.post(`${BASE_URL}/save`, data)
}

/** @desc 删除关注关系 */
export function deleteFollow(ids: Array<string | number>) {
  return http.del(`${BASE_URL}`, ids)
}

/** @desc 查询用户选项列表（不走数据权限） */
export function listFollowUserOptions() {
  return http.get<LabelValueState[]>(`${BASE_URL}/user-options`)
}
