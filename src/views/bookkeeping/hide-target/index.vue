<template>
  <GiPageLayout :body-style="{ overflowY: 'auto', overflowX: 'hidden' }">
    <!-- 未进入隐私模式时的提示 -->
    <template v-if="!privacyStore.isPrivacyMode">
      <a-result status="warning" title="请先进入隐私模式" subtitle="请在明细管理页面通过隐蔽入口进入隐私模式后再访问此页面" />
    </template>

    <!-- 隐私模式下显示正常内容 -->
    <template v-else>
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

      <a-card title="隐私模式设置" style="margin-top: 16px">
        <a-form :model="configForm" layout="vertical" style="max-width: 400px">
          <a-form-item label="有效时长" required>
            <a-input-number
              v-model="configForm.expireMinutes"
              placeholder="请输入隐私模式有效时长"
              :min="1"
              :max="1440"
              :precision="0"
              style="width: 100%"
            >
              <template #append>
                分钟
              </template>
            </a-input-number>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" :loading="configSaving" @click="onSavePrivacyConfig">
                保存时长
              </a-button>
              <span class="hide-target-config__tip">默认 10 分钟，最大支持 1440 分钟。</span>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 修改隐私密码 -->
      <a-card title="修改隐私密码" style="margin-top: 16px">
        <a-form :model="pwdForm" layout="vertical" style="max-width: 400px">
          <a-form-item label="原密码" required>
            <a-input-password v-model="pwdForm.oldPassword" placeholder="请输入原密码" allow-clear />
          </a-form-item>
          <a-form-item label="新密码" required>
            <a-input-password v-model="pwdForm.newPassword" placeholder="请输入新密码" allow-clear />
          </a-form-item>
          <a-form-item label="确认新密码" required>
            <a-input-password v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" allow-clear />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="pwdSaving" @click="onChangePassword">
              修改密码
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
    </template>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * 隐藏对象配置页面
 *
 * 用户可勾选要对其隐藏明细的目标用户，
 * 超管可切换用户查看/配置不同用户的隐藏对象。
 * 页面需在隐私模式下才可访问，同时提供修改隐私密码功能。
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 增加隐私模式守卫和修改隐私密码功能
 * @update 2026-03-19 @Wangsongsong
 * @desc 用户选项改为调用 bookkeeping 专用接口，统一绕过数据权限
 * @update 2026-03-22 @Wangsongsong
 * @desc 增加隐私模式有效时长配置，支持在 web 端隐藏配置页面直接修改
 * @update 2026-03-22 @Wangsongsong
 * @desc 隐藏配置页开启内容区纵向滚动，修复页面超出后无法继续下滑查看的问题
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { listHideTargetByUserId, listMyHideTarget, saveHideTarget } from '@/apis/bookkeeping/hide-target'
import { listFollowUserOptions } from '@/apis/bookkeeping/follow'
import { getPrivacyConfig, setPrivacyPassword, updatePrivacyConfig, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import type { HideTargetResp } from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'
import { usePrivacyStore, useUserStore } from '@/stores'

defineOptions({ name: 'BookkeepingHideTarget' })

const userStore = useUserStore()
const privacyStore = usePrivacyStore()
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
const configSaving = ref(false)

const configForm = reactive({
  expireMinutes: 10,
})

// ==================== 修改密码相关 ====================

const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdSaving = ref(false)

/**
 * 加载用户选项
 *
 * 统一调用 bookkeeping 模块专用接口获取所有用户选项，
 * 不走数据权限过滤
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 改为调用 bookkeeping 专用接口，解决普通用户数据权限导致返回空的问题
 */
const loadUserOptions = async () => {
  try {
    const { data } = await listFollowUserOptions()
    userOptions.value = data
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

/**
 * 加载隐私配置
 *
 * @author Wangsongsong
 * @date 2026-03-22
 */
const loadPrivacyConfig = async () => {
  const { data } = await getPrivacyConfig()
  configForm.expireMinutes = Number(data.expireMinutes) || 10
  privacyStore.syncExpireMinutes(configForm.expireMinutes)
}

/**
 * 保存隐私配置
 *
 * @author Wangsongsong
 * @date 2026-03-22
 */
const onSavePrivacyConfig = async () => {
  const expireMinutes = Number(configForm.expireMinutes)
  if (!Number.isInteger(expireMinutes) || expireMinutes < 1 || expireMinutes > 1440) {
    Message.warning('请输入 1 到 1440 之间的整数分钟数')
    return
  }

  configSaving.value = true
  try {
    await updatePrivacyConfig({ expireMinutes })
    privacyStore.syncExpireMinutes(expireMinutes)
    Message.success('隐私模式有效时长保存成功')
  } catch {
    Message.error('隐私模式有效时长保存失败')
  } finally {
    configSaving.value = false
  }
}

/**
 * 修改隐私密码
 *
 * 先验证原密码，再设置新密码
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onChangePassword = async () => {
  if (!pwdForm.oldPassword) {
    Message.warning('请输入原密码')
    return
  }
  if (!pwdForm.newPassword) {
    Message.warning('请输入新密码')
    return
  }
  if (pwdForm.newPassword.length < 4) {
    Message.warning('新密码长度不能少于4位')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    Message.warning('两次输入的新密码不一致')
    return
  }
  pwdSaving.value = true
  try {
    // 先验证原密码
    const { data } = await verifyPrivacyPassword({ password: pwdForm.oldPassword })
    if (!data.verified) {
      Message.error('原密码错误')
      return
    }
    // 设置新密码
    await setPrivacyPassword({ password: pwdForm.newPassword, oldPassword: pwdForm.oldPassword })
    Message.success('密码修改成功')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch {
    Message.error('修改密码失败')
  } finally {
    pwdSaving.value = false
  }
}

onMounted(async () => {
  if (privacyStore.isPrivacyMode) {
    await Promise.all([loadUserOptions(), loadHideTargets(), loadPrivacyConfig()])
  }
})
</script>

<style scoped lang="scss">
.hide-target-config__tip {
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
