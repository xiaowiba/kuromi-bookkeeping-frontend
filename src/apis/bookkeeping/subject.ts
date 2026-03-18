/**
 * 科目管理 API
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/subject'

/** @desc 查询科目列表 */
export function listSubject(query: T.SubjectPageQuery) {
  return http.get<PageRes<T.SubjectResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询科目详情 */
export function getSubject(id: string) {
  return http.get<T.SubjectResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增科目 */
export function addSubject(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改科目 */
export function updateSubject(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除科目 */
export function deleteSubject(id: string) {
  return http.del(`${BASE_URL}`, { ids: [id] })
}
