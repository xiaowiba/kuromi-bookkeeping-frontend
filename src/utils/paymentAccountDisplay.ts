/**
 * 支付账号显示工具函数
 *
 * @author Claude
 * @date 2026-04-23
 */

/**
 * 格式化支付账号显示名称
 * @param name 账号名称
 * @param deleted 是否已删除
 * @returns 格式化后的显示名称
 */
export function formatPaymentAccountName(name?: string, deleted?: boolean): string {
  if (!name) return ''
  if (deleted) return `${name}（已删除）`
  return name
}

/**
 * 获取支付账号标签颜色
 * @param deleted 是否已删除
 * @returns 标签颜色
 */
export function getPaymentAccountTagColor(deleted?: boolean): string {
  return deleted ? 'gray' : 'cyan'
}

/**
 * 判断支付账号标签是否需要删除线样式
 * @param deleted 是否已删除
 * @returns 是否需要删除线
 */
export function isPaymentAccountDeleted(deleted?: boolean): boolean {
  return deleted === true
}
