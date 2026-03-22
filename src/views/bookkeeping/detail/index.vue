<template>
  <GiPageLayout>
    <GiTable
      ref="tableRef"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="isMobile() ? { x: '100%', y: '100%' } : { x: '100%', y: '100%', minWidth: 900 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="searchMethod"
    >
      <template #top>
        <GiForm
          v-model="queryForm"
          search
          :columns="queryFormColumns"
          :default-collapsed="isMobile()"
          size="medium"
          @search="searchMethod"
          @reset="reset"
        />
      </template>
      <template #toolbar-left>
        <a-button v-permission="['bookkeeping:detail:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <!-- 隐私模式退出按钮 -->
        <a-button v-if="privacyStore.isPrivacyMode" status="warning" size="small" style="margin-left: 12px" @click="onExitPrivacy">
          <template #icon><icon-lock /></template>
          退出隐私模式
        </a-button>
        <!-- 隐私模式下进入隐藏配置 -->
        <a-button v-if="privacyStore.isPrivacyMode" size="small" style="margin-left: 8px" @click="router.push('/bookkeeping/hide-target')">
          <template #icon><icon-settings /></template>
          隐藏配置
        </a-button>
      </template>
      <template #toolbar-right>
        <!-- 统计数据展示 -->
        <div class="statistics-container">
          <div class="statistics-item expense">
            <span class="label">总支出：</span>
            <span class="value">{{ statistics.totalExpense.toFixed(2) }}</span>
          </div>
          <div class="statistics-item income">
            <span class="label">总收入：</span>
            <span class="value">{{ statistics.totalIncome.toFixed(2) }}</span>
          </div>
          <div class="statistics-item" :class="statistics.netIncome >= 0 ? 'income' : 'expense'">
            <span class="label">结余：</span>
            <span class="value">{{ statistics.netIncome.toFixed(2) }}</span>
          </div>
        </div>
      </template>
      <!-- 移动端紧凑布局 -->
      <template #mobileDetail="{ record }">
        <div class="mobile-detail-compact" :class="{ 'is-hidden': privacyStore.isPrivacyMode && record.hidden === 1 }">
          <!-- 第一行：主要信息 -->
          <div class="compact-row info-line">
            <span class="user-name">{{ record.userNickname }}</span>
            <span class="date-text">{{ record.detailDate }}</span>
            <span class="subject-name">{{ record.subjectName }}</span>
            <GiCellTag :value="record.subjectCategory" :dict="bk_subject_category" />
            <span class="detail-name">{{ record.name }}</span>
            <span class="amount" :style="{ color: record.amount < 0 ? '#f53f3f' : '#00b42a' }">
              {{ record.amount < 0 ? record.amount.toFixed(2) : `+${record.amount.toFixed(2)}` }}
            </span>
          </div>
          <!-- 第二行：备注信息（如果有） -->
          <div v-if="record.remark" class="compact-row remark-line">
            <span class="remark-text">{{ record.remark }}</span>
          </div>
          <!-- 最后一行：操作按钮 -->
          <div class="compact-row action-row">
            <a-space size="small">
              <a-button 
                v-permission="['bookkeeping:detail:update']" 
                type="primary" 
                size="large"
                @click="onUpdate(record)"
              >
                <template #icon><icon-edit /></template>
                <template #default>修改</template>
              </a-button>
              <a-button 
                v-permission="['bookkeeping:detail:delete']" 
                status="danger"
                size="large"
                @click="onDelete(record)"
              >
                <template #icon><icon-delete /></template>
                <template #default>删除</template>
              </a-button>
            </a-space>
          </div>
        </div>
      </template>
      <template #userNickname="{ record }">
        <span>{{ record.userNickname }}</span>
      </template>
      <template #subjectCategory="{ record }">
        <GiCellTag :value="record.subjectCategory" :dict="bk_subject_category" />
      </template>
      <template #amount="{ record }">
        <span :style="{ color: record.amount < 0 ? '#f53f3f' : '#00b42a', fontWeight: 'bold' }">
          {{ record.amount < 0 ? record.amount.toFixed(2) : `+${record.amount.toFixed(2)}` }}
        </span>
        <a-tag v-if="privacyStore.isPrivacyMode && record.hidden === 1" color="orangered" size="small" style="margin-left: 4px">隐</a-tag>
      </template>
      <template #hidden="{ record }">
        <a-tag v-if="record.hidden === 1" color="orangered" size="small">隐藏</a-tag>
        <a-tag v-else color="arcoblue" size="small">正常</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['bookkeeping:detail:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['bookkeeping:detail:delete']"
            status="danger"
            title="删除"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="onSaveSuccess" />

    <!-- 密码验证弹窗 -->
    <a-modal v-model:visible="verifyModalVisible" title="请输入密码" :width="360" :mask-closable="false" simple @before-ok="onVerifyPassword" @close="verifyPassword = ''">
      <a-input-password v-model="verifyPassword" placeholder="请输入隐私密码" allow-clear />
    </a-modal>

    <!-- 首次设置密码弹窗 -->
    <a-modal v-model:visible="setupModalVisible" title="设置隐私密码" :width="360" :mask-closable="false" :esc-to-close="false" simple @before-ok="onSetupPassword">
      <a-space direction="vertical" fill>
        <a-input-password v-model="setupForm.password" placeholder="请输入隐私密码" allow-clear />
        <a-input-password v-model="setupForm.confirmPassword" placeholder="请再次输入密码" allow-clear />
      </a-space>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * 明细管理列表页面
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 查询条件增加用户下拉选择（仅管理员可见）
 * @update 2026-03-18 @Wangsongsong
 * @desc 非超管用户通过关注列表构建用户下拉选项，可查看关注的人的明细
 * @update 2026-03-19 @Wangsongsong
 * @desc 集成隐私模式：隐蔽入口、密码验证/设置、隐私模式查询参数、退出按钮
 * @update 2026-03-19 @Wangsongsong
 * @desc 超管增加"是否隐藏"筛选条件，默认展示全部
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端优化：默认全屏模式、默认收起搜索条件、分页页码最大化
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端列表优化：
 *       第一行：主要数据信息（用户、日期、科目、分类、名称、金额）
 *       第二行：备注信息（如果有备注）
 *       最后一行：大尺寸操作按钮
 *       字体加大，便于移动端阅读
 * @update 2026-03-19 @Wangsongsong
 * @desc 修复移动端表格横向滚动问题：移动端不设置 minWidth，避免不必要的横向滚动
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端隐藏数据优化：不显示"隐"标签，改用橙色背景色区分隐藏数据
 * @update 2026-03-19 @Wangsongsong
 * @desc 增加明细统计功能：
 *       在刷新按钮左边显示总支出和总收入统计数据
 *       统计数据通过后端接口获取，统计所有符合查询条件的明细
 *       不区分PC端和移动端，统一显示
 * @update 2026-03-21 @Wangsongsong
 * @desc 复用共享的明细用户选项加载逻辑，统一桌面端与移动端口径
 * @update 2026-03-22 @Wangsongsong
 * @desc Web 端统计区补充结余展示，保持与移动端统计口径一致
 * @update 2026-03-22 @Wangsongsong
 * @desc 进入 web 端隐私模式前同步数据库中的有效时长配置，确保过期时间与隐藏配置页保持一致
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { computed, h, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AddModal from './AddModal.vue'
import { type DetailResp, deleteDetail, getDetailStatistics, listDetail } from '@/apis/bookkeeping/detail'
import { getPrivacyConfig, setPrivacyPassword, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import mittBus from '@/utils/mitt'
import { useDetailUserOptions } from '../shared/useDetailUserOptions'

defineOptions({ name: 'BookkeepingDetail' })

const router = useRouter()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category } = useDict('bk_subject_category')
const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()

/** 是否拥有隐藏权限 */
const hasHidePermission = computed(() => has.hasPermOr(['bk:hide-target:manage']))

/**
 * 获取当前月份字符串（yyyy-MM 格式）
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const [queryForm, resetForm] = useResetReactive({
  sort: ['detailDate,desc', 'id,desc'],
  month: getCurrentMonth(),
  userId: userStore.userInfo.id,
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'select',
    label: '所属用户',
    field: 'userId',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      options: userOptions,
      placeholder: '请选择用户',
      allowClear: true,
      allowSearch: true,
    },
  },
  {
    type: 'input',
    label: '明细名称',
    field: 'name',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      placeholder: '请输入明细名称',
    },
  },
  {
    type: 'select',
    label: '分类',
    field: 'category',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      options: bk_subject_category,
      placeholder: '请选择分类',
      allowClear: true,
    },
  },
  {
    type: 'month-picker',
    label: '月份',
    field: 'month',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      placeholder: '请选择月份',
      allowClear: true,
    },
  },
  {
    type: 'select',
    label: '是否隐藏',
    field: 'hidden',
    span: { xs: 24, sm: 8, xxl: 6 },
    show: () => isAdmin.value,
    props: {
      options: [
        { label: '全部', value: '' },
        { label: '正常', value: 0 },
        { label: '隐藏', value: 1 },
      ],
      placeholder: '请选择',
      allowClear: true,
    },
  },
])

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable(
  (page) => listDetail({ ...queryForm, ...page, privacyMode: privacyStore.isPrivacyMode }),
  { immediate: false, paginationOption: isMobile() ? { defaultPageSize: 50 } : undefined },
)

/**
 * 统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const statistics = ref({
  totalExpense: 0,
  totalIncome: 0,
  netIncome: 0,
})

/**
 * 加载统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const loadStatistics = async () => {
  try {
    const { data } = await getDetailStatistics({ ...queryForm, privacyMode: privacyStore.isPrivacyMode })
    statistics.value = data
  } catch {
    // 加载失败不影响列表展示
    statistics.value = { totalExpense: 0, totalIncome: 0, netIncome: 0 }
  }
}

/**
 * 统一的查询方法，同时加载列表和统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const searchMethod = async () => {
  await Promise.all([search(), loadStatistics()])
}

/** 表格引用 */
const tableRef = ref()

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
    show: false,
  },
  // 移动端：单列展示所有信息
  {
    title: '明细信息',
    dataIndex: 'mobileDetail',
    slotName: 'mobileDetail',
    width: 100,
    show: isMobile(),
  },
  // PC端：保持原有列结构
  { title: '明细名称', dataIndex: 'name', width: 100, ellipsis: true, tooltip: true, show: !isMobile() },
  { title: '所属用户', dataIndex: 'userNickname', slotName: 'userNickname', width: 90, ellipsis: true, tooltip: true, show: !isMobile() },
  { title: '科目', dataIndex: 'subjectName', width: 80, align: 'center', show: !isMobile() },
  { title: '分类', dataIndex: 'subjectCategory', slotName: 'subjectCategory', width: 70, align: 'center', show: !isMobile() },
  { title: '金1额', dataIndex: 'amount', slotName: 'amount', width: 160, align: 'right', show: !isMobile() },
  { title: '明细日期', dataIndex: 'detailDate', width: 120, align: 'center', show: !isMobile() },
  { title: '备注', dataIndex: 'remark', width: 120, ellipsis: true, tooltip: true, show: !isMobile() },
  { title: '隐藏', dataIndex: 'hidden', slotName: 'hidden', width: 60, align: 'center', show: ((has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode) || isAdmin.value) && !isMobile() },
  { title: '创建人', dataIndex: 'createUserString', width: 100, ellipsis: true, tooltip: true, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 160, show: false },
  { title: '修改人', dataIndex: 'updateUserString', width: 100, ellipsis: true, tooltip: true, show: false },
  { title: '修改时间', dataIndex: 'updateTime', width: 160, show: false },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr([
      'bookkeeping:detail:update',
      'bookkeeping:detail:delete',
    ]) && !isMobile(),
  },
]

/** 重置查询条件 */
const reset = () => {
  resetForm()
  searchMethod()
}

/** 删除明细 */
const onDelete = (record: DetailResp) => {
  return handleDelete(() => deleteDetail(record.id), {
    content: `是否确定删除明细「${record.name}」？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()

/** 新增 */
const onAdd = () => {
  AddModalRef.value?.onAdd()
}

/** 修改 */
const onUpdate = (record: DetailResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

/**
 * 保存成功后刷新列表和统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onSaveSuccess = () => {
  searchMethod()
}

// ==================== 隐私模式相关 ====================

/** 版权区域点击计数器 */
let footerClickCount = 0
let footerClickTimer: ReturnType<typeof setTimeout> | null = null

/** 密码验证弹窗 */
const verifyModalVisible = ref(false)
const verifyPassword = ref('')

/** 首次设置密码弹窗 */
const setupModalVisible = ref(false)
const setupForm = reactive({ password: '', confirmPassword: '' })

/**
 * 检查是否已设置隐私密码，决定弹出验证还是设置弹窗
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const checkAndShowPasswordModal = async () => {
  try {
    const { data } = await getPrivacyConfig()
    privacyStore.syncExpireMinutes(data.expireMinutes)
    if (data.hasPassword) {
      verifyPassword.value = ''
      verifyModalVisible.value = true
    } else {
      setupForm.password = ''
      setupForm.confirmPassword = ''
      setupModalVisible.value = true
    }
  } catch {
    Message.error('检查密码状态失败')
  }
}

/**
 * 验证隐私密码
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onVerifyPassword = async () => {
  if (!verifyPassword.value) {
    Message.warning('请输入密码')
    return false
  }
  try {
    const { data } = await verifyPrivacyPassword({ password: verifyPassword.value })
    if (data.verified) {
      const { data: config } = await getPrivacyConfig()
      privacyStore.syncExpireMinutes(config.expireMinutes)
      privacyStore.enterPrivacyMode(config.expireMinutes)
      Message.success('已进入隐私模式')
      verifyPassword.value = ''
      searchMethod()
      return true
    } else {
      Message.error('密码错误')
      return false
    }
  } catch {
    Message.error('验证失败')
    return false
  }
}

/**
 * 首次设置隐私密码
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onSetupPassword = async () => {
  if (!setupForm.password) {
    Message.warning('请输入密码')
    return false
  }
  if (setupForm.password.length < 4) {
    Message.warning('密码长度不能少于4位')
    return false
  }
  if (setupForm.password !== setupForm.confirmPassword) {
    Message.warning('两次输入的密码不一致')
    return false
  }
  try {
    await setPrivacyPassword({ password: setupForm.password })
    const { data } = await getPrivacyConfig()
    privacyStore.syncExpireMinutes(data.expireMinutes)
    privacyStore.enterPrivacyMode(data.expireMinutes)
    Message.success('密码设置成功，已进入隐私模式')
    searchMethod()
    return true
  } catch {
    Message.error('设置密码失败')
    return false
  }
}

/**
 * 退出隐私模式
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onExitPrivacy = () => {
  privacyStore.exitPrivacyMode()
  Message.success('已退出隐私模式')
  searchMethod()
}

/**
 * 页脚版权区域点击事件（通过 mitt 监听）
 *
 * 连续点击 3 次触发隐私模式入口
 *
 * @author Wangsongsong
 * @date 2026-03-19
 * @update 2026-03-19 @Wangsongsong
 * @desc 改为监听 GiFooter 的 mitt 事件，用底部版权区域作为隐蔽入口
 */
const onFooterClick = () => {
  if (!hasHidePermission.value) return
  footerClickCount++
  if (footerClickTimer) clearTimeout(footerClickTimer)
  footerClickTimer = setTimeout(() => { footerClickCount = 0 }, 2000)
  if (footerClickCount >= 3) {
    footerClickCount = 0
    if (footerClickTimer) clearTimeout(footerClickTimer)
    if (privacyStore.isPrivacyMode) {
      Message.info('当前已在隐私模式')
      return
    }
    checkAndShowPasswordModal()
  }
}

onMounted(() => {
  loadUserOptions()
  mittBus.on('footer-click', onFooterClick)
  // 初始加载数据和统计
  searchMethod()
  // 移动端默认进入全屏模式
  if (isMobile() && tableRef.value) {
    // 延迟执行，确保组件已完全挂载
    setTimeout(() => {
      const giTable = tableRef.value as any
      if (giTable && typeof giTable.toggleFullscreen === 'function') {
        giTable.toggleFullscreen()
      }
    }, 100)
  }
})

onUnmounted(() => {
  mittBus.off('footer-click', onFooterClick)
})
</script>

<style scoped lang="scss">
// 统计数据样式
.statistics-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 12px;

  .statistics-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;

    .label {
      color: var(--color-text-2);
    }

    .value {
      font-size: 16px;
      font-weight: 600;
    }

    &.expense .value {
      color: #f53f3f;
    }

    &.income .value {
      color: #00b42a;
    }
  }
}

// 移动端紧凑布局样式
.mobile-detail-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;

  // 隐藏数据的背景色
  &.is-hidden {
    background-color: rgba(255, 125, 0, 0.08);
    border-radius: 4px;
    padding: 8px;
    margin: -4px 0;
  }

  .compact-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    line-height: 1.6;

    // 第一行：主要信息
    &.info-line {
      font-size: 17px;

      .user-name {
        color: var(--color-text-1);
        font-weight: 600;
        font-size: 18px;
      }

      .date-text {
        color: var(--color-text-3);
        font-size: 16px;
      }

      .subject-name {
        color: var(--color-text-2);
        font-size: 16px;
      }

      .detail-name {
        color: var(--color-text-1);
        font-weight: 600;
        font-size: 18px;
      }

      .amount {
        font-weight: bold;
        font-size: 19px;
        white-space: nowrap;
      }
    }

    // 第二行：备注信息
    &.remark-line {
      .remark-text {
        color: var(--color-text-3);
        font-size: 15px;
        font-style: italic;
        word-break: break-all;
      }
    }

    // 最后一行：操作按钮
    &.action-row {
      padding-top: 4px;
    }
  }
}
</style>
