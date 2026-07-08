/**
 * 明细时间筛选共享工具。
 *
 * 明细列表、报表筛选和关联弹窗共用这里的时间模式、默认范围和周/月/季/年范围计算。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充时间筛选共享范围和计算口径说明
 */
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import type { DetailDatePreset, DetailTimeMode } from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'

dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)

export const DETAIL_DEFAULT_SORT = ['detailDate,desc', 'id,desc']
export const DETAIL_DEFAULT_TIME_MODE: DetailTimeMode = 'preset'
export const DETAIL_DEFAULT_DATE_PRESET: DetailDatePreset = 'currentMonth'

export const DETAIL_TIME_MODE_OPTIONS: LabelValueState[] = [
  { label: '快捷范围', value: 'preset' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年', value: 'year' },
  { label: '自定义范围', value: 'range' },
]

export const DETAIL_DATE_PRESET_OPTIONS: LabelValueState[] = [
  { label: '本月', value: 'currentMonth' },
  { label: '上月', value: 'lastMonth' },
  { label: '近 3 个月', value: 'last3Months' },
  { label: '近 6 个月', value: 'last6Months' },
  { label: '本年', value: 'currentYear' },
]

export interface DetailTimePickerState {
  weekDate: string
  month: string
  quarter: string
  year: string
  range: string[]
}

const formatDate = (value: dayjs.ConfigType) => dayjs(value).format('YYYY-MM-DD')

export const getCurrentMonthValue = () => dayjs().format('YYYY-MM')

export const getCurrentQuarterValue = () => `${dayjs().format('YYYY')}-Q${dayjs().quarter()}`

export const getCurrentYearValue = () => dayjs().format('YYYY')

export function createDefaultDetailTimePickerState(): DetailTimePickerState {
  const presetRange = getDetailPresetRange(DETAIL_DEFAULT_DATE_PRESET)
  return {
    weekDate: formatDate(dayjs()),
    month: getCurrentMonthValue(),
    quarter: getCurrentQuarterValue(),
    year: getCurrentYearValue(),
    range: [presetRange.startDate, presetRange.endDate],
  }
}

export function getDetailPresetRange(preset: DetailDatePreset) {
  const now = dayjs()
  switch (preset) {
    case 'lastMonth': {
      const lastMonth = now.subtract(1, 'month')
      return {
        startDate: formatDate(lastMonth.startOf('month')),
        endDate: formatDate(lastMonth.endOf('month')),
      }
    }
    case 'last3Months':
      return {
        startDate: formatDate(now.subtract(2, 'month').startOf('month')),
        endDate: formatDate(now.endOf('month')),
      }
    case 'last6Months':
      return {
        startDate: formatDate(now.subtract(5, 'month').startOf('month')),
        endDate: formatDate(now.endOf('month')),
      }
    case 'currentYear':
      return {
        startDate: formatDate(now.startOf('year')),
        endDate: formatDate(now.endOf('year')),
      }
    case 'currentMonth':
    default:
      return {
        startDate: formatDate(now.startOf('month')),
        endDate: formatDate(now.endOf('month')),
      }
  }
}

export const getDetailWeekRange = (date: string) => {
  const current = dayjs(date || undefined)
  return {
    startDate: formatDate(current.startOf('isoWeek')),
    endDate: formatDate(current.endOf('isoWeek')),
  }
}

export const getDetailMonthRange = (month: string) => {
  const current = dayjs(`${month}-01`)
  return {
    startDate: formatDate(current.startOf('month')),
    endDate: formatDate(current.endOf('month')),
  }
}

export const getDetailQuarterRange = (quarterValue: string) => {
  const matched = /^(\d{4})-Q([1-4])$/.exec(quarterValue)
  if (!matched) {
    const current = dayjs()
    return {
      startDate: formatDate(current.startOf('quarter')),
      endDate: formatDate(current.endOf('quarter')),
    }
  }
  const year = Number(matched[1])
  const quarter = Number(matched[2])
  const current = dayjs(`${year}-01-01`).quarter(quarter)
  return {
    startDate: formatDate(current.startOf('quarter')),
    endDate: formatDate(current.endOf('quarter')),
  }
}

export const getDetailYearRange = (year: string) => {
  const current = dayjs(`${year}-01-01`)
  return {
    startDate: formatDate(current.startOf('year')),
    endDate: formatDate(current.endOf('year')),
  }
}
