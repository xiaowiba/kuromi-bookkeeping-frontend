<template>
  <GiPageLayout>
    <a-card title="隐藏对象配置">
      <template #extra>
        <a-space>
          <a-select
            v-if="isAdmin"
            v-model="selectedUserId"
            placeholder="请选择用户"
            allow-search
            style="width: 200px"
            @change="onUserChange"
          >
            <a-option v-for="item in userOptions" :key="item.value" :value="item.value" :label="item.label" />
          </a-select>
        </a-space>
      </template>

      <a-alert style="margin-bottom: 16px">
        以下勾选的用户，将看不到你标记为"隐藏"的明细。
      </a-alert>

      <a-spin :loading="loading" style="width: 100%">
        <a-checkbox-group v-model="checkedTargetIds" direction="vertical">
          <a-checkbox v-for="item in targetUserOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-checkbox>
        </a-checkbox-group>

        <a-empty v-if="targetUserOptions.length === 0" description="暂无可选用户" />
      </a-spin>

      <div style="margin-top: 24px">
        <a-button type="primary" :loading="saving" @click="onSave">
          保存配置
        </a-button>
      </div>
    </a-card>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * 隐藏对象配置页面
 *
 * 用户可勾选要对其隐藏明细的目标用户，
 * 超管可切换用户查看/配置不同用户的隐藏对象
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { listHideTargetByUserId, listMyHideTarget, saveHideTarget } from '@/apis/bookkeeping/hide-target'
import { listMyFollow } from '@/apis/bookkeeping/follow'
import type { HideTargetResp } from '@/apis/bookkeeping/type'
import { listUserDict } from '@/apis/system/user'
import type { LabelValueState } from '@/types/global'
import { useUserStore } from '@/stores'

defineOptions({ name: 'BookkeepingHideTarget' })

const userStore = useUserStore()
const isAdmin = computed(() => userStore.roles.includes('super_admin'))
const currentUserId = computed(() => String(userStore.userInfo.id))

/** 用户选项列表 */
const userOptions = ref<LabelValueState[]>([])

/** 超管选择的用户ID */
const selectedUserId = ref<string | number | undefined>(undefined)

/** 当前配置的用户ID（超管可切换，普通用户为自己） */
const activeUserId = computed(() => {
  if (isAdmin.value && selectedUserId.value) {
    return selectedUserId.value
  }
  return currentUserId.value
})

/** 可选的隐藏目标用户（排除当前配置用户自身） */
const targetUserOptions = computed(() => {
  return userOptions.value.filter((item) => String(item.value) !== String(activeUserId.value))
})

/** 已勾选的隐藏目标用户ID */
const checkedTargetIds = ref<Array<string | number>>([])

const loading = ref(false)
const saving = ref(false)

/**
 * 加载用户选项
 *
 * 超管：调用 listUserDict 获取所有用户
 * 普通用户：从关注列表构建可选用户（自己 + 关注的人）
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 普通用户通过关注列表构建用户选项，解决 listUserDict 返回空的问题
 */
const loadUserOptions = async () => {
  try {
    if (isAdmin.value) {
      const { data } = await listUserDict({ status: 1 })
      userOptions.value = data
    } else {
      // 普通用户：从关注列表获取可选用户
      const options: LabelValueState[] = []
      // 添加自己
      options.push({
        label: userStore.userInfo.nickname || userStore.userInfo.username,
        value: String(userStore.userInfo.id),
      })
      // 添加关注的人
      const { data: followList } = await listMyFollow()
      if (followList && followList.length > 0) {
        followList.forEach((item) => {
          options.push({
            label: item.followUserNickname,
            value: item.followUserId,
          })
        })
      }
      userOptions.value = options
    }
  } catch {
    userOptions.value = []
  }
}

/**
 * 加载隐藏对象配置
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
const loadHideTargets = async () => {
  loading.value = true
  try {
    let data: HideTargetResp[]
    if (isAdmin.value && selectedUserId.value) {
      const res = await listHideTargetByUserId(selectedUserId.value)
      data = res.data
    } else {
      const res = await listMyHideTarget()
      data = res.data
    }
    checkedTargetIds.value = data.map((item) => item.targetUserId)
  } catch {
    checkedTargetIds.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 超管切换用户
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
const onUserChange = () => {
  loadHideTargets()
}

/**
 * 保存配置
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
const onSave = async () => {
  saving.value = true
  try {
    await saveHideTarget({
      userId: activeUserId.value,
      targetUserIds: checkedTargetIds.value,
    })
    Message.success('保存成功')
  } catch {
    // 错误由全局拦截处理
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadUserOptions()
  await loadHideTargets()
})
</script>

<style scoped lang="scss"></style>
