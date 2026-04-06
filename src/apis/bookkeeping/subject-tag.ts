/**
 * 科目标签管理 API
 *
 * @author Codex
 * @date 2026-04-05
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/subject-tag'

/** @desc 分页查询科目标签 */
export function listSubjectTag(query: T.SubjectTagPageQuery) {
  return http.get<PageRes<T.SubjectTagResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询科目标签列表 */
export function listSubjectTagAll(query?: T.SubjectTagQuery) {
  return http.get<T.SubjectTagResp[]>(`${BASE_URL}/list`, query)
}

/** @desc 查询科目标签详情 */
export function getSubjectTag(id: string) {
  return http.get<T.SubjectTagResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增科目标签 */
export function addSubjectTag(data: T.SubjectTagReq) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改科目标签 */
export function updateSubjectTag(data: T.SubjectTagReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除科目标签 */
export function deleteSubjectTag(id: string) {
  return http.del(`${BASE_URL}`, { ids: [id] })
}

/** @desc 查询标签删除影响预检查结果 */
export function getSubjectTagDeleteImpact(id: string) {
  return http.get<T.SubjectTagDeleteImpactResp>(`${BASE_URL}/delete-impact/${id}`)
}
