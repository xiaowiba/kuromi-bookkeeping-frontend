/**
 * 报表中心 API
 *
 * @author Codex
 * @date 2026-03-28
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/report'

/** @desc 查询报表看板 */
export function getReportDashboard(query: T.ReportQuery) {
  return http.get<T.ReportDashboardResp>(`${BASE_URL}/dashboard`, query)
}

/** @desc 查询报表排行表格 */
export function listReportRankingTable(query: T.ReportPageQuery) {
  return http.get<PageRes<T.ReportRankingTableResp[]>>(`${BASE_URL}/ranking-table`, query)
}
