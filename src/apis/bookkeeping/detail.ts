/**
 * 明细管理 API
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 增加明细统计接口，用于统计总支出和总收入
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/detail'

/** @desc 查询明细列表 */
export function listDetail(query: T.DetailPageQuery) {
  return http.get<PageRes<T.DetailResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询移动端明细列表 */
export function listMobileDetail(query: T.DetailQuery) {
  return http.get<T.DetailResp[]>(`${BASE_URL}/mobile/list`, query)
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

/**
 * 查询明细统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
export function getDetailStatistics(query: T.DetailPageQuery) {
  return http.get<T.DetailStatisticsResp>(`${BASE_URL}/statistics`, query)
}
