/**
 * 收支金额颜色常量
 * 中国标准：红色=收入，绿色=支出
 *
 * 用于 ECharts 等需要 JS 配置的场景
 *
 * @author Wangsongsong
 * @date 2026-04-26
 */

export const AmountColors = {
  income: {
    primary: '#f5222d',
    light: '#ff4d4f',
    dark: '#cf1322',
    bg: '#fff1f0',
    bgHover: '#ffccc7',
  },
  expense: {
    primary: '#52c41a',
    light: '#73d13d',
    dark: '#389e0d',
    bg: '#f6ffed',
    bgHover: '#d9f7be',
  },
} as const

/**
 * 根据金额正负获取颜色
 * @param amount 金额值
 * @returns 颜色值
 */
export function getAmountColor(amount: number): string {
  return amount >= 0 ? AmountColors.income.primary : AmountColors.expense.primary
}

/**
 * 根据分类获取颜色
 * @param category 分类类型
 * @returns 颜色值
 */
export function getCategoryColor(category: 'income' | 'expense'): string {
  return AmountColors[category].primary
}

/**
 * 获取金额颜色对象（包含主色和背景色）
 * @param amount 金额值
 * @returns 颜色对象
 */
export function getAmountColorSet(amount: number) {
  return amount >= 0 ? AmountColors.income : AmountColors.expense
}
