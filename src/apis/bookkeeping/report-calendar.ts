/**
 * 日历报表 API
 *
 * @author Wangsongsong
 * @date 2026-04-03
 */
import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/bookkeeping/report'

/** @desc 查询日历报表总览 */
export function getReportCalendar(query: T.ReportCalendarQuery) {
  return http.get<T.ReportCalendarResp>(`${BASE_URL}/calendar`, query)
}

/** @desc 查询日历报表单日明细 */
export function getReportCalendarDayDetail(query: T.ReportCalendarQuery) {
  return http.get<T.ReportCalendarDayDetailResp>(`${BASE_URL}/calendar/day-detail`, query)
}
