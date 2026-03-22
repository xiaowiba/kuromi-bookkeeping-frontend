/**
 * 移动端 Toast 工具
 *
 * 统一封装 TDesign Mobile Vue Toast，
 * 供 `/m` 移动端页面替代 Arco Message 使用。
 *
 * @author Wangsongsong
 * @date 2026-03-22
 */
import { ToastPlugin } from 'tdesign-mobile-vue'

type MobileToastInput = Parameters<typeof ToastPlugin>[0]

const defaultOptions = {
  placement: 'middle' as const,
  duration: 2000,
}

const resolveToastOptions = (input: MobileToastInput) => {
  if (typeof input === 'string') {
    return {
      ...defaultOptions,
      message: input,
    }
  }

  return {
    ...defaultOptions,
    ...input,
  }
}

export const mobileToast = {
  clear: () => ToastPlugin.clear(),
  info: (input: MobileToastInput) => ToastPlugin(resolveToastOptions(input)),
  success: (input: MobileToastInput) => ToastPlugin.success(resolveToastOptions(input)),
  warning: (input: MobileToastInput) => ToastPlugin.warning(resolveToastOptions(input)),
  error: (input: MobileToastInput) => ToastPlugin.error(resolveToastOptions(input)),
}

