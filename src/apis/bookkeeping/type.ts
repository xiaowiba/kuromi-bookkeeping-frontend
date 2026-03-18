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

/** 明细响应类型 */
export interface DetailResp {
  id: string
  userId: string
  userNickname: string
  subjectId: string
  subjectName: string
  subjectCategory: string
  name: string
  amount: number
  detailDate: string
  remark: string
  hidden: number
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 明细查询条件 */
export interface DetailQuery {
  userId?: string
  name?: string
  category?: string
  subjectId?: string
  month?: string
  minAmount?: number
  maxAmount?: number
  sort: Array<string>
}

/** 明细分页查询条件 */
export interface DetailPageQuery extends DetailQuery, PageQuery {}

/** 关注响应类型 */
export interface FollowResp {
  id: string
  userId: string
  userNickname: string
  followUserId: string
  followUserNickname: string
  createTime: string
}

/** 关注查询条件 */
export interface FollowQuery {
  userId?: string
  sort?: Array<string>
}

/** 关注分页查询条件 */
export interface FollowPageQuery extends FollowQuery, PageQuery {}

/** 关注配置请求参数 */
export interface FollowReq {
  userId: string | number
  followUserIds: Array<string | number>
}
