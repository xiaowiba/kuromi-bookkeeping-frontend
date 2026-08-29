import { Modal, type ModalReturn } from '@arco-design/web-vue'

interface AuthExpiredModalOptions {
  title?: string
  content: string
  okText?: string
  cancelText?: string
  hideCancel?: boolean
  onOk: () => Promise<void> | void
  onCancel?: () => Promise<void> | void
}

let modalInstance: ModalReturn | null = null

/**
 * 认证失效弹窗
 *
 * 统一承载被顶下线、被踢下线和普通认证失效的二次确认交互。
 *
 * @author Wangsongsong
 * @date 2026-08-28
 */
const authExpiredModal = (options: AuthExpiredModalOptions) => {
  if (modalInstance) {
    modalInstance.close()
  }
  modalInstance = Modal.confirm({
    title: options.title ?? '提示',
    content: options.content,
    okText: options.okText ?? '重新登录',
    cancelText: options.cancelText ?? '回登录页',
    hideCancel: options.hideCancel ?? false,
    maskClosable: false,
    escToClose: false,
    closable: false,
    async onOk() {
      try {
        await options.onOk()
      } finally {
        modalInstance = null
      }
    },
    async onCancel() {
      try {
        if (options.onCancel) {
          await options.onCancel()
        }
      } finally {
        modalInstance = null
      }
    },
  })
}

export default authExpiredModal
