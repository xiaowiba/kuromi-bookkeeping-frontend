<template>
  <div class="mobile-detail-page">
    <section class="mobile-detail-hero">
      <div class="mobile-detail-hero__bar">
        <button type="button" class="mobile-detail-hero__avatar" @click="router.push('/m/me')">
          {{ avatarText }}
        </button>

        <div class="mobile-detail-hero__title-block">
          <h1 class="mobile-detail-hero__title">{{ appTitle }}</h1>
          <p class="mobile-detail-hero__subtitle">本月明细 · 轻量记账</p>
        </div>

        <div class="mobile-detail-hero__actions">
          <button type="button" class="mobile-detail-hero__icon-btn" @click="openMonthPicker">
            <icon-calendar />
          </button>
          <button type="button" class="mobile-detail-hero__icon-btn" @click="toggleFilterPanel">
            <icon-filter />
          </button>
        </div>
      </div>

      <div class="mobile-detail-hero__month-strip">
        <button
          type="button"
          class="mobile-detail-hero__month-nav"
          @click="shiftMonth(-1)"
        >
          上月
        </button>

        <button type="button" class="mobile-detail-hero__month-main" @click="openMonthPicker">
          <span class="mobile-detail-hero__month-text">{{ currentMonthText }}</span>
          <small class="mobile-detail-hero__month-meta">{{ monthMetaText }}</small>
        </button>

        <button
          type="button"
          class="mobile-detail-hero__month-nav"
          :disabled="isCurrentMonth"
          @click="shiftMonth(1)"
        >
          下月
        </button>

        <input
          ref="monthInputRef"
          v-model="query.month"
          class="mobile-detail-hero__month-input"
          type="month"
          @change="loadData"
        />
      </div>

      <div class="mobile-detail-hero__summary">
        <article class="mobile-detail-hero__summary-item">
          <span>收入</span>
          <strong class="is-income">¥{{ formatNumber(statistics.totalIncome) }}</strong>
        </article>
        <article class="mobile-detail-hero__summary-item">
          <span>支出</span>
          <strong class="is-expense">¥{{ formatNumber(statistics.totalExpense) }}</strong>
        </article>
        <article class="mobile-detail-hero__summary-item">
          <span>结余</span>
          <strong :class="statistics.netIncome >= 0 ? 'is-income' : 'is-expense'">
            {{ formatBalanceNumber(statistics.netIncome) }}
          </strong>
        </article>
      </div>
    </section>

    <section class="mobile-detail-shortcuts">
      <button type="button" class="mobile-detail-shortcuts__item is-active" @click="loadData">
        <span class="mobile-detail-shortcuts__icon">
          <icon-unordered-list />
        </span>
        <span>明细</span>
      </button>
      <button type="button" class="mobile-detail-shortcuts__item" @click="router.push('/m/report')">
        <span class="mobile-detail-shortcuts__icon">
          <icon-bar-chart />
        </span>
        <span>报表</span>
      </button>
      <button type="button" class="mobile-detail-shortcuts__item" @click="router.push('/m/subject')">
        <span class="mobile-detail-shortcuts__icon">
          <icon-apps />
        </span>
        <span>科目</span>
      </button>
      <button type="button" class="mobile-detail-shortcuts__item" @click="handlePrivacyAction">
        <span class="mobile-detail-shortcuts__icon">
          <icon-eye-invisible v-if="privacyStore.isPrivacyMode" />
          <icon-eye v-else />
        </span>
        <span>{{ privacyStore.isPrivacyMode ? '隐私中' : '隐私' }}</span>
      </button>
      <button type="button" class="mobile-detail-shortcuts__item" @click="toggleFilterPanel">
        <span class="mobile-detail-shortcuts__icon">
          <icon-search />
        </span>
        <span>筛选</span>
      </button>
    </section>

    <section v-if="filterVisible" class="mobile-detail-filter">
      <div class="mobile-detail-filter__grid">
        <div class="mobile-field">
          <label class="mobile-field__label">记账用户</label>
          <select v-model="query.userId" class="mobile-select">
            <option value="">全部用户</option>
            <option v-for="item in userOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>

        <div class="mobile-field">
          <label class="mobile-field__label">明细名称</label>
          <input
            v-model.trim="query.name"
            class="mobile-input"
            type="text"
            maxlength="100"
            placeholder="输入名称或备注关键词"
            @keydown.enter="loadData"
          />
        </div>
      </div>

      <div class="mobile-field">
        <label class="mobile-field__label">分类筛选</label>
        <div class="mobile-detail-filter__chips">
          <button
            type="button"
            class="mobile-chip"
            :class="{ 'is-active': !query.category }"
            @click="query.category = ''"
          >
            全部
          </button>
          <button
            v-for="item in bkSubjectCategory"
            :key="item.value"
            type="button"
            class="mobile-chip"
            :class="{ 'is-active': query.category === String(item.value) }"
            @click="query.category = String(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="mobile-detail-filter__actions">
        <button type="button" class="mobile-detail-filter__btn is-ghost" @click="resetFilters">
          重置
        </button>
        <button type="button" class="mobile-detail-filter__btn is-primary" @click="loadData">
          应用筛选
        </button>
      </div>
    </section>

    <section class="mobile-detail-ledger">
      <header class="mobile-detail-ledger__header">
        <div>
          <h2 class="mobile-detail-ledger__title">明细账本</h2>
          <p class="mobile-detail-ledger__meta">{{ ledgerMetaText }}</p>
        </div>
        <button type="button" class="mobile-detail-ledger__refresh" @click="loadData">
          刷新
        </button>
      </header>

      <t-loading :loading="loading" text="加载中...">
        <div v-if="groupedDetails.length" class="mobile-detail-group-list">
          <article v-for="group in groupedDetails" :key="group.date" class="mobile-detail-group">
            <header class="mobile-detail-group__header">
              <div class="mobile-detail-group__date-line">
                <h3 class="mobile-detail-group__title">{{ group.title }}</h3>
                <p class="mobile-detail-group__week">{{ group.weekText }}</p>
              </div>
              <p class="mobile-detail-group__summary">{{ formatGroupSummary(group) }}</p>
            </header>

            <div class="mobile-detail-group__panel">
              <article
                v-for="item in group.items"
                :key="item.id"
                class="mobile-detail-row"
                :class="{
                  'is-hidden': privacyStore.isPrivacyMode && item.hidden === 1,
                  'is-clickable': canOperateItem,
                }"
                @click="handleRowClick(item)"
              >
                <span class="mobile-detail-row__badge" :class="subjectCategoryClass(item.subjectCategory)">
                  {{ subjectBadge(item) }}
                </span>

                <div class="mobile-detail-row__content">
                  <h4 class="mobile-detail-row__title">{{ item.name }}</h4>
                  <span
                    v-if="privacyStore.isPrivacyMode && item.hidden === 1"
                    class="mobile-detail-row__privacy"
                  >
                    已隐藏
                  </span>
                </div>

                <div class="mobile-detail-row__aside">
                  <strong
                    class="mobile-detail-row__amount"
                    :class="item.amount >= 0 ? 'is-income' : 'is-expense'"
                  >
                    {{ formatListAmount(item.amount) }}
                  </strong>
                </div>
              </article>
            </div>
          </article>
        </div>

        <div v-else class="mobile-detail-empty">
          <p class="mobile-detail-empty__title">这个月份还没有明细</p>
          <p class="mobile-detail-empty__desc">可以点击底部“记账”，或者切换月份查看历史记录。</p>
        </div>
      </t-loading>
    </section>

    <t-popup v-model:visible="actionPopupVisible" placement="bottom" destroy-on-close>
      <div class="mobile-bottom-sheet">
        <div class="mobile-bottom-sheet__panel">
          <div class="mobile-bottom-sheet__header">
            <p class="mobile-bottom-sheet__eyebrow">明细操作</p>
            <h3 class="mobile-bottom-sheet__title">{{ activeDetail?.name || '当前明细' }}</h3>
            <p v-if="activeDetail" class="mobile-bottom-sheet__meta">
              {{ activeDetail.subjectName }} · {{ activeDetail.userNickname }} · {{ activeDetail.detailDate }}
            </p>
          </div>

          <div class="mobile-bottom-sheet__stack">
            <button
              v-if="canUpdateDetail && activeDetail"
              type="button"
              class="mobile-bottom-sheet__action"
              @click="handleEditActiveDetail"
            >
              <span>编辑明细</span>
              <small>进入移动端独立编辑表单</small>
            </button>
            <button
              v-if="canDeleteDetail && activeDetail"
              type="button"
              class="mobile-bottom-sheet__action is-danger"
              @click="handleDeleteActiveDetail"
            >
              <span>删除明细</span>
              <small>删除后不可恢复，请确认后再执行</small>
            </button>
          </div>

          <button type="button" class="mobile-bottom-sheet__cancel" @click="closeActionPopup">
            取消
          </button>
        </div>
      </div>
    </t-popup>

    <t-popup v-model:visible="verifyPopupVisible" placement="bottom" destroy-on-close>
      <div class="mobile-bottom-sheet">
        <div class="mobile-bottom-sheet__panel">
          <div class="mobile-bottom-sheet__header">
            <p class="mobile-bottom-sheet__eyebrow">隐私模式</p>
            <h3 class="mobile-bottom-sheet__title">输入隐私密码</h3>
            <p class="mobile-bottom-sheet__meta">验证通过后，将切换到隐私明细视图。</p>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">隐私密码</label>
            <input
              v-model.trim="verifyPassword"
              class="mobile-input"
              type="password"
              maxlength="32"
              placeholder="请输入隐私密码"
              @keydown.enter="handleVerifyPassword"
            />
          </div>

          <div class="mobile-form-actions mobile-bottom-sheet__actions">
            <t-button block variant="outline" size="large" @click="closeVerifyPopup">
              取消
            </t-button>
            <t-button block theme="primary" size="large" :loading="privacySubmitting" @click="handleVerifyPassword">
              进入隐私模式
            </t-button>
          </div>
        </div>
      </div>
    </t-popup>

    <t-popup v-model:visible="setupPopupVisible" placement="bottom" destroy-on-close>
      <div class="mobile-bottom-sheet">
        <div class="mobile-bottom-sheet__panel">
          <div class="mobile-bottom-sheet__header">
            <p class="mobile-bottom-sheet__eyebrow">隐私模式</p>
            <h3 class="mobile-bottom-sheet__title">首次设置隐私密码</h3>
            <p class="mobile-bottom-sheet__meta">密码至少 4 位，后续进入隐私模式时需要验证。</p>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">新密码</label>
            <input
              v-model.trim="setupForm.password"
              class="mobile-input"
              type="password"
              maxlength="32"
              placeholder="请输入新密码"
            />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">确认密码</label>
            <input
              v-model.trim="setupForm.confirmPassword"
              class="mobile-input"
              type="password"
              maxlength="32"
              placeholder="请再次输入密码"
              @keydown.enter="handleSetupPassword"
            />
          </div>

          <div class="mobile-form-actions mobile-bottom-sheet__actions">
            <t-button block variant="outline" size="large" @click="closeSetupPopup">
              取消
            </t-button>
            <t-button block theme="primary" size="large" :loading="privacySubmitting" @click="handleSetupPassword">
              保存并进入
            </t-button>
          </div>
        </div>
      </div>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端明细页
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-21 @Wangsongsong
 * @desc 重做移动端账单首页视觉，并补充分组明细与筛选交互
 * @update 2026-03-21 @Wangsongsong
 * @desc 补充移动端明细编辑、删除与隐私模式完整流程
 * @update 2026-03-21 @Wangsongsong
 * @desc 浼樺寲绉诲姩绔槑缁嗗垪琛ㄥ睍绀猴紝鏀朵负鍗曡鏄庣粏鏍峰紡骞堕殣鍘诲娉ㄤ俊鎭?
 */
import { Message, Modal } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { type DetailResp, deleteDetail, getDetailStatistics, listDetail } from '@/apis/bookkeeping/detail'
import { hasPrivacyPassword, setPrivacyPassword, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import { useDict } from '@/hooks/app'
import { useAppStore, usePrivacyStore, useUserStore } from '@/stores'
import has from '@/utils/has'
import mittBus from '@/utils/mitt'
import { useDetailUserOptions } from '@/views/bookkeeping/shared/useDetailUserOptions'

defineOptions({ name: 'MobileBookkeepingDetail' })

interface DetailGroup {
  date: string
  title: string
  weekText: string
  totalExpense: number
  totalIncome: number
  items: DetailResp[]
}

const weekLabelList = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const numberFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category: bkSubjectCategory } = useDict('bk_subject_category')
const { userOptions, loadUserOptions } = useDetailUserOptions()

const loading = ref(false)
const filterVisible = ref(false)
const monthInputRef = ref<HTMLInputElement>()
const details = ref<DetailResp[]>([])
const statistics = ref({
  totalExpense: 0,
  totalIncome: 0,
  netIncome: 0,
})
const actionPopupVisible = ref(false)
const activeDetail = ref<DetailResp | null>(null)
const verifyPopupVisible = ref(false)
const setupPopupVisible = ref(false)
const verifyPassword = ref('')
const privacySubmitting = ref(false)
const setupForm = reactive({
  password: '',
  confirmPassword: '',
})

const getCurrentMonth = () => dayjs().format('YYYY-MM')

const query = reactive({
  month: getCurrentMonth(),
  category: '',
  userId: userStore.userInfo.id,
  name: '',
})

const appTitle = computed(() => appStore.getTitle() || '鲨鱼记账')
const avatarText = computed(() => {
  return (userStore.userInfo.nickname || userStore.userInfo.username || '我').slice(0, 1).toUpperCase()
})
const isCurrentMonth = computed(() => query.month === getCurrentMonth())
const currentMonthText = computed(() => dayjs(`${query.month}-01`).format('YYYY年M月'))
const monthMetaText = computed(() => `${details.value.length} 笔明细`)
const ledgerMetaText = computed(() => {
  const categoryLabel = subjectCategoryLabel(query.category)
  return `${currentMonthText.value} · ${categoryLabel} · ${details.value.length} 笔`
})
const hasPrivacyPermission = computed(() => has.hasPermOr(['bk:hide-target:manage']))
const canUpdateDetail = computed(() => has.hasPermOr(['bookkeeping:detail:update']))
const canDeleteDetail = computed(() => has.hasPermOr(['bookkeeping:detail:delete']))
const canOperateItem = computed(() => canUpdateDetail.value || canDeleteDetail.value)

const groupedDetails = computed<DetailGroup[]>(() => {
  const groupMap = new Map<string, DetailGroup>()

  details.value.forEach((item) => {
    const groupKey = item.detailDate
    const currentDate = dayjs(groupKey)
    let group = groupMap.get(groupKey)

    if (!group) {
      group = {
        date: groupKey,
        title: currentDate.format('MM月DD日'),
        weekText: weekLabelList[currentDate.day()],
        totalExpense: 0,
        totalIncome: 0,
        items: [],
      }
      groupMap.set(groupKey, group)
    }

    if (item.amount < 0) {
      group.totalExpense += Math.abs(item.amount)
    } else {
      group.totalIncome += item.amount
    }
    group.items.push(item)
  })

  return Array.from(groupMap.values())
})

const loadData = async () => {
  loading.value = true
  try {
    const [detailRes, statisticsRes] = await Promise.all([
      listDetail({
        ...query,
        sort: ['detailDate,desc', 'id,desc'],
        page: 1,
        size: 50,
        privacyMode: privacyStore.isPrivacyMode,
      } as any),
      getDetailStatistics({
        ...query,
        sort: ['detailDate,desc', 'id,desc'],
        privacyMode: privacyStore.isPrivacyMode,
      } as any),
    ])

    details.value = detailRes.data.list
    statistics.value = statisticsRes.data
  } finally {
    loading.value = false
  }
}

const openMonthPicker = () => {
  monthInputRef.value?.showPicker?.()
  monthInputRef.value?.click()
}

const shiftMonth = (step: number) => {
  if (step > 0 && isCurrentMonth.value) return
  query.month = dayjs(`${query.month}-01`).add(step, 'month').format('YYYY-MM')
  loadData()
}

const toggleFilterPanel = () => {
  filterVisible.value = !filterVisible.value
}

const resetFilters = () => {
  query.month = getCurrentMonth()
  query.category = ''
  query.userId = userStore.userInfo.id
  query.name = ''
  loadData()
}

const openItemActions = (item: DetailResp) => {
  activeDetail.value = item
  actionPopupVisible.value = true
}

const handleRowClick = (item: DetailResp) => {
  if (!canOperateItem.value) return
  openItemActions(item)
}

const closeActionPopup = () => {
  actionPopupVisible.value = false
  activeDetail.value = null
}

const handleEditActiveDetail = () => {
  const current = activeDetail.value
  if (!current || !canUpdateDetail.value) return
  closeActionPopup()
  mittBus.emit('mobile-detail-edit-open', current.id)
}

const handleDeleteActiveDetail = () => {
  const current = activeDetail.value
  if (!current || !canDeleteDetail.value) return

  closeActionPopup()
  Modal.warning({
    title: '删除明细',
    content: `是否确定删除明细「${current.name}」？`,
    okButtonProps: { status: 'danger' },
    hideCancel: false,
    maskClosable: false,
    onBeforeOk: async () => {
      try {
        const res = await deleteDetail(current.id)
        if (res.success) {
          Message.success('删除成功')
          await loadData()
        }
        return res.success
      } catch {
        return false
      }
    },
  })
}

const closeVerifyPopup = () => {
  verifyPassword.value = ''
  verifyPopupVisible.value = false
}

const closeSetupPopup = () => {
  setupForm.password = ''
  setupForm.confirmPassword = ''
  setupPopupVisible.value = false
}

const handlePrivacyAction = async () => {
  if (privacyStore.isPrivacyMode) {
    privacyStore.exitPrivacyMode()
    Message.success('已退出隐私模式')
    await loadData()
    return
  }

  if (!hasPrivacyPermission.value) {
    Message.info('当前账号暂无隐私模式入口权限')
    return
  }

  try {
    const { data } = await hasPrivacyPassword()
    if (data.hasPassword) {
      closeVerifyPopup()
      verifyPopupVisible.value = true
    } else {
      closeSetupPopup()
      setupPopupVisible.value = true
    }
  } catch {
    Message.error('检查隐私密码状态失败')
  }
}

const handleVerifyPassword = async () => {
  if (!verifyPassword.value) {
    Message.warning('请输入隐私密码')
    return
  }

  privacySubmitting.value = true
  try {
    const { data } = await verifyPrivacyPassword({ password: verifyPassword.value })
    if (!data.verified) {
      Message.error('密码错误')
      return
    }

    privacyStore.enterPrivacyMode()
    closeVerifyPopup()
    Message.success('已进入隐私模式')
    await loadData()
  } catch {
    Message.error('验证失败')
  } finally {
    privacySubmitting.value = false
  }
}

const handleSetupPassword = async () => {
  if (!setupForm.password) {
    Message.warning('请输入密码')
    return
  }
  if (setupForm.password.length < 4) {
    Message.warning('密码长度不能少于 4 位')
    return
  }
  if (setupForm.password !== setupForm.confirmPassword) {
    Message.warning('两次输入的密码不一致')
    return
  }

  privacySubmitting.value = true
  try {
    await setPrivacyPassword({ password: setupForm.password })
    privacyStore.enterPrivacyMode()
    closeSetupPopup()
    Message.success('密码设置成功，已进入隐私模式')
    await loadData()
  } catch {
    Message.error('设置隐私密码失败')
  } finally {
    privacySubmitting.value = false
  }
}

const formatNumber = (value: number) => numberFormatter.format(Number(value || 0))
const formatListAmount = (value: number) => {
  const amountText = Number(value || 0).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  return `${value >= 0 ? '+' : '-'}${amountText.replace('-', '')}`
}
const formatBalanceNumber = (value: number) => `${value < 0 ? '-' : ''}¥${formatNumber(Math.abs(value))}`
const formatSignedNumber = (value: number) => `${value >= 0 ? '+' : '-'}¥${formatNumber(Math.abs(value))}`
const formatGroupSummary = (group: DetailGroup) => {
  if (group.totalIncome > 0 && group.totalExpense > 0) {
    return `收 ¥${formatNumber(group.totalIncome)}  支 ¥${formatNumber(group.totalExpense)}`
  }
  if (group.totalIncome > 0) {
    return `收 ¥${formatNumber(group.totalIncome)}`
  }
  return `支 ¥${formatNumber(group.totalExpense)}`
}

const subjectCategoryLabel = (value: string) => {
  if (!value) return '全部分类'
  const current = bkSubjectCategory.value.find(item => String(item.value) === value)
  return current?.label || value
}

const subjectCategoryClass = (value: string) => {
  if (value === 'expense' || value === '1') return 'is-expense'
  if (value === 'income' || value === '2') return 'is-income'
  return 'is-neutral'
}

const subjectBadge = (item: DetailResp) => {
  if (item.subjectName) {
    return item.subjectName.slice(0, 1)
  }
  if (item.name) {
    return item.name.slice(0, 1)
  }
  return '账'
}

onMounted(async () => {
  await Promise.all([loadUserOptions(), loadData()])
  mittBus.on('mobile-detail-refresh', loadData)
})

onUnmounted(() => {
  mittBus.off('mobile-detail-refresh', loadData)
})
</script>

<style scoped lang="scss">
.mobile-detail-page {
  min-height: 100%;
  padding-bottom: 24px;
  overflow-x: hidden;
  background: linear-gradient(180deg, #f7f1e7 0%, #f3eee6 100%);
}

.mobile-detail-hero {
  padding: 14px 16px 76px;
  background: linear-gradient(180deg, #f9d86d 0%, #f2c338 100%);
  border-radius: 0 0 34px 34px;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.25);
}

.mobile-detail-hero__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mobile-detail-hero__avatar,
.mobile-detail-hero__icon-btn,
.mobile-detail-hero__month-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.22);
  color: #50350d;
}

.mobile-detail-hero__avatar {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
}

.mobile-detail-hero__title-block {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.mobile-detail-hero__title {
  margin: 0;
  color: #3a2607;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.mobile-detail-hero__subtitle {
  margin: 4px 0 0;
  color: rgba(58, 38, 7, 0.72);
  font-size: 12px;
  font-weight: 600;
}

.mobile-detail-hero__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.mobile-detail-hero__icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  font-size: 18px;
}

.mobile-detail-hero__month-strip {
  position: relative;
  display: grid;
  grid-template-columns: 72px 1fr 72px;
  gap: 10px;
  align-items: center;
  margin-top: 22px;
}

.mobile-detail-hero__month-nav {
  height: 40px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
}

.mobile-detail-hero__month-nav:disabled {
  opacity: 0.4;
}

.mobile-detail-hero__month-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 54px;
  padding: 10px 12px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.28);
  color: #3a2607;
}

.mobile-detail-hero__month-text {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
}

.mobile-detail-hero__month-meta {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  opacity: 0.72;
}

.mobile-detail-hero__month-input {
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  opacity: 0;
  pointer-events: none;
}

.mobile-detail-hero__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
  overflow: hidden;
}

.mobile-detail-hero__summary-item {
  min-width: 0;
  padding: 14px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.24);
  color: #6b5426;
  overflow: hidden;
}

.mobile-detail-hero__summary-item span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
}

.mobile-detail-hero__summary-item strong {
  display: block;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.mobile-detail-hero__summary-item .is-income {
  color: #0f7d47;
}

.mobile-detail-hero__summary-item .is-expense {
  color: #bc4a28;
}

.mobile-detail-shortcuts {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin: -36px 16px 0;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 26px;
  box-shadow: 0 16px 28px rgba(65, 45, 11, 0.08);
}

.mobile-detail-shortcuts__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: #7d7062;
  font-size: 11px;
  font-weight: 700;
}

.mobile-detail-shortcuts__item.is-active {
  color: #53380f;
}

.mobile-detail-shortcuts__item.is-active .mobile-detail-shortcuts__icon {
  background: rgba(244, 202, 84, 0.22);
  color: #7a5100;
}

.mobile-detail-shortcuts__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background: #f5f1ea;
  color: inherit;
  font-size: 20px;
}

.mobile-detail-filter {
  margin: 16px;
  padding: 18px 16px;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 26px;
  box-shadow: 0 12px 24px rgba(65, 45, 11, 0.06);
}

.mobile-detail-filter__grid {
  display: grid;
  gap: 14px;
}

.mobile-detail-filter__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mobile-detail-filter__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.mobile-detail-filter__btn {
  height: 44px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 700;
}

.mobile-detail-filter__btn.is-ghost {
  border: 1px solid rgba(83, 56, 15, 0.12);
  background: #fff;
  color: #5d4a2a;
}

.mobile-detail-filter__btn.is-primary {
  border: none;
  background: linear-gradient(180deg, #f7d45e 0%, #efbc2e 100%);
  color: #3a2607;
}

.mobile-detail-ledger {
  margin: 18px 16px 0;

  :deep(.t-loading) {
    display: block;
    width: 100%;
  }
}

.mobile-detail-ledger__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.mobile-detail-ledger__title {
  margin: 0;
  color: #312111;
  font-size: 20px;
  font-weight: 800;
}

.mobile-detail-ledger__meta {
  margin: 6px 0 0;
  color: #8a7a68;
  font-size: 12px;
  font-weight: 600;
}

.mobile-detail-ledger__refresh {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #5d4a2a;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 18px rgba(65, 45, 11, 0.05);
}

.mobile-detail-group-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.mobile-detail-group {
  display: block;
  width: 100%;
  clear: both;
}

.mobile-detail-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 0 2px;
}

.mobile-detail-group__date-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.mobile-detail-group__title {
  margin: 0;
  color: #88827b;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.mobile-detail-group__week {
  margin: 0;
  color: #9f9990;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.mobile-detail-group__summary {
  flex-shrink: 0;
  margin: 0;
  color: #a19a90;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  text-align: right;
}

.mobile-detail-group__panel {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  box-shadow: 0 8px 18px rgba(65, 45, 11, 0.04);
}

.mobile-detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(93, 74, 42, 0.06);
}

.mobile-detail-row:last-child {
  border-bottom: none;
}

.mobile-detail-row.is-clickable {
  cursor: pointer;
}

.mobile-detail-row.is-hidden {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 245, 225, 0.98) 100%);
}

.mobile-detail-row__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 700;
}

.mobile-detail-row__badge.is-expense {
  background: #f5f1e6;
  color: #5d4a2a;
}

.mobile-detail-row__badge.is-income {
  background: #eef8f2;
  color: #0f8a59;
}

.mobile-detail-row__badge.is-neutral {
  background: #f2f2f2;
  color: #666;
}

.mobile-detail-row__content {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-detail-row__main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.mobile-detail-row__title {
  margin: 0;
  min-width: 0;
  flex: 1;
  color: #403a35;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-detail-row__privacy {
  display: inline-flex;
  align-items: center;
  height: 20px;
  flex-shrink: 0;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(244, 174, 74, 0.18);
  color: #9a5f00;
  font-size: 11px;
  font-weight: 700;
}

.mobile-detail-row__desc {
  display: none;
}

.mobile-detail-row__aside {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-left: auto;
  text-align: right;
}

.mobile-detail-row__amount {
  min-width: 64px;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.mobile-detail-row__amount.is-income {
  color: #0f8a59;
}

.mobile-detail-row__amount.is-expense {
  color: #54505a;
}

.mobile-detail-row__more {
  display: none;
}

.mobile-detail-empty {
  padding: 48px 20px;
  background: rgba(255, 255, 255, 0.84);
  border-radius: 26px;
  text-align: center;
  box-shadow: 0 12px 20px rgba(65, 45, 11, 0.05);
}

.mobile-detail-empty__title {
  margin: 0;
  color: #3c2a16;
  font-size: 18px;
  font-weight: 800;
}

.mobile-detail-empty__desc {
  margin: 10px 0 0;
  color: #8a7a68;
  font-size: 14px;
  line-height: 1.6;
}

.mobile-bottom-sheet {
  padding: 0 0 calc(8px + env(safe-area-inset-bottom));
}

.mobile-bottom-sheet__panel {
  padding: 20px 16px 16px;
  border-radius: 26px 26px 0 0;
  background:
    radial-gradient(circle at top right, rgba(249, 216, 109, 0.25) 0%, transparent 36%),
    linear-gradient(180deg, #fffdf8 0%, #f8f3eb 100%);
  box-shadow: 0 -12px 28px rgba(65, 45, 11, 0.1);
}

.mobile-bottom-sheet__header {
  margin-bottom: 14px;
}

.mobile-bottom-sheet__eyebrow {
  margin: 0 0 6px;
  color: #9a6b00;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-bottom-sheet__title {
  margin: 0;
  color: #342413;
  font-size: 22px;
  font-weight: 800;
}

.mobile-bottom-sheet__meta {
  margin: 8px 0 0;
  color: #8a7a68;
  font-size: 13px;
  line-height: 1.6;
}

.mobile-bottom-sheet__stack {
  display: grid;
  gap: 10px;
}

.mobile-bottom-sheet__action {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 16px 18px;
  border: none;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #3b2a16;
  text-align: left;
  box-shadow: inset 0 0 0 1px rgba(83, 56, 15, 0.08);
}

.mobile-bottom-sheet__action span {
  font-size: 16px;
  font-weight: 800;
}

.mobile-bottom-sheet__action small {
  color: #8a7a68;
  font-size: 12px;
  line-height: 1.5;
}

.mobile-bottom-sheet__action.is-danger {
  background: rgba(211, 79, 48, 0.08);
  color: #bf452c;
  box-shadow: inset 0 0 0 1px rgba(211, 79, 48, 0.12);
}

.mobile-bottom-sheet__action.is-danger small {
  color: rgba(191, 69, 44, 0.78);
}

.mobile-bottom-sheet__actions {
  margin-top: 18px;
}

.mobile-bottom-sheet__cancel {
  width: 100%;
  height: 48px;
  margin-top: 14px;
  border: none;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  color: #5d4a2a;
  font-size: 15px;
  font-weight: 700;
}
</style>
