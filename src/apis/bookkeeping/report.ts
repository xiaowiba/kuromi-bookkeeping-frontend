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

/**
 * 查询指定科目下的标签排行
 *
 * @author Wangsongsong
 * @date 2026-04-17
 */
export function getReportTagRankBySubject(query: T.ReportQuery & { subjectId: string }) {
  return http.get<T.ReportTagRankItemResp[]>(`${BASE_URL}/tag-rank`, query)
}
