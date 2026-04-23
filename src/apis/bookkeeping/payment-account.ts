/**
 * 支付账号管理 API
 *
 * @author Antigravity
 * @date 2026-04-21
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/payment-account'

/** @desc 分页查询支付账号 */
export function listPaymentAccount(query: T.PaymentAccountPageQuery) {
  return http.get<PageRes<T.PaymentAccountResp[]>>(`${BASE_URL}`, query)
}

/** @desc 获取当前用户的支付账号列表（供下拉选择用） */
export function listMyPaymentAccount() {
  return http.get<T.PaymentAccountResp[]>(`${BASE_URL}/my`)
}

/** @desc 查询支付账号详情 */
export function getPaymentAccount(id: string) {
  return http.get<T.PaymentAccountResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增支付账号 */
export function addPaymentAccount(data: T.PaymentAccountReq) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改支付账号 */
export function updatePaymentAccount(data: T.PaymentAccountReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除支付账号 */
export function deletePaymentAccount(ids: Array<string | number>) {
  return http.del(`${BASE_URL}`, { ids })
}
