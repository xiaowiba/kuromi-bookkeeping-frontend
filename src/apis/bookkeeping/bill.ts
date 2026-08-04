/**
 * 账单管理 API
 *
 * @author Codex
 * @date 2026-04-26
 * @update 2026-07-09 @Wangsongsong
 * @desc 补齐账单实际统计默认值，避免接口空态下页面读取缺失字段
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/bill'

/** @desc 查询月账单 */
export function getMonthlyBill(query: T.BillMonthlyQuery) {
  return http.get<T.BillMonthlyResp>(`${BASE_URL}/monthly`, query)
}

/** @desc 查询年账单 */
export function getYearlyBill(query: T.BillYearlyQuery) {
  return http.get<T.BillYearlyResp>(`${BASE_URL}/yearly`, query)
}

/** 创建空账单汇总 */
export function createEmptyBillSummary(): T.BillSummaryResp {
  return {
    actualTotalIncome: 0,
    actualTotalExpense: 0,
    actualBalance: 0,
    actualRecordCount: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    recordCount: 0,
  }
}

/** 创建空月账单响应 */
export function createEmptyMonthlyBillResp(year: number | string): T.BillMonthlyResp {
  const numericYear = Number(year) || new Date().getFullYear()

  return {
    year: numericYear,
    summary: createEmptyBillSummary(),
    months: Array.from({ length: 12 }, (_, index) => {
      const monthNumber = 12 - index
      return {
        month: `${numericYear}-${String(monthNumber).padStart(2, '0')}`,
        monthNumber,
        actualTotalIncome: 0,
        actualTotalExpense: 0,
        actualBalance: 0,
        actualRecordCount: 0,
        income: 0,
        expense: 0,
        balance: 0,
        recordCount: 0,
      }
    }),
  }
}

/** 创建空年账单响应 */
export function createEmptyYearlyBillResp(): T.BillYearlyResp {
  return {
    summary: createEmptyBillSummary(),
    years: [],
  }
}
