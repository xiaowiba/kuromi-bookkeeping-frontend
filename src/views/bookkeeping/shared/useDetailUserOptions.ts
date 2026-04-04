/**
 * 明细页用户选项共享逻辑
 *
 * @author Wangsongsong
 * @date 2026-03-21
 */
import { computed, ref } from 'vue'
import { listFollowUserOptions, listMyFollow } from '@/apis/bookkeeping/follow'
import { useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'

const normalizeOptions = (options: LabelValueState[]) => {
  const uniqueMap = new Map<string, LabelValueState>()
  options.forEach((item) => {
    uniqueMap.set(String(item.value), item)
  })
  return Array.from(uniqueMap.values())
}

export const useDetailUserOptions = () => {
  const userStore = useUserStore()
  const userOptions = ref<LabelValueState[]>([])
  const isAdmin = computed(() => userStore.roles.includes('super_admin'))

  const loadUserOptions = async () => {
    if (userOptions.value.length) {
      return userOptions.value
    }

    const fallbackOptions: LabelValueState[] = [
      { label: userStore.userInfo.nickname, value: userStore.userInfo.id },
    ]

    if (isAdmin.value) {
      try {
        const { data } = await listFollowUserOptions()
        userOptions.value = normalizeOptions(data)
      } catch {
        userOptions.value = normalizeOptions(fallbackOptions)
      }
      return userOptions.value
    }

    const options: LabelValueState[] = [...fallbackOptions]

    try {
      const { data } = await listMyFollow()
      data.forEach((item) => {
        options.push({
          label: item.followUserNickname,
          value: item.followUserId,
        })
      })
    } catch {
      // 关注列表加载失败时保留当前用户选项
    }

    userOptions.value = normalizeOptions(options)
    return userOptions.value
  }

  return {
    isAdmin,
    userOptions,
    loadUserOptions,
  }
}
