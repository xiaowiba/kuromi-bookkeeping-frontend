/**
 * 记账模块类型定义
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */

/** 科目响应类型 */
export interface SubjectResp {
  id: string
  name: string
  category: string
  icon: string
  sort: number
  isDefault: boolean
  status: 1 | 2
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 科目查询条件 */
export interface SubjectQuery {
  name?: string
  category?: string
  status?: number
  sort: Array<string>
}

/** 科目分页查询条件 */
export interface SubjectPageQuery extends SubjectQuery, PageQuery {}
