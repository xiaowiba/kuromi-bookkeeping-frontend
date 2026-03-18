/**
 * 明细管理 API
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/detail'

/** @desc 查询明细列表 */
export function listDetail(query: T.DetailPageQuery) {
  return http.get<PageRes<T.DetailResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询明细详情 */
export function getDetail(id: string) {
  return http.get<T.DetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增明细 */
export function addDetail(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改明细 */
export function updateDetail(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除明细 */
export function deleteDetail(id: string) {
  return http.del(`${BASE_URL}`, { ids: [id] })
}
