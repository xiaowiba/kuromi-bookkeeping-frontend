<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 900 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #top>
        <GiForm v-model="queryForm" search :columns="queryFormColumns" size="medium" @search="search" @reset="reset" />
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

    <AddModal ref="AddModalRef" @save-success="search" />

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
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { computed, h, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AddModal from './AddModal.vue'
import { type DetailResp, deleteDetail, listDetail } from '@/apis/bookkeeping/detail'
import { listMyFollow, listFollowUserOptions } from '@/apis/bookkeeping/follow'
import { hasPrivacyPassword, setPrivacyPassword, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'BookkeepingDetail' })

const router = useRouter()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category } = useDict('bk_subject_category')

/** 是否超级管理员 */
const isAdmin = computed(() => userStore.roles.includes('super_admin'))

/** 是否拥有隐藏权限 */
const hasHidePermission = computed(() => has.hasPermOr(['bk:hide-target:manage']))

/** 用户选项列表 */
const userOptions = ref<LabelValueState[]>([])

/**
 * 加载用户选项
 *
 * 超管：调用用户字典接口获取所有用户
 * 非超管：当前用户 + 关注的人
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 非超管不调用用户字典接口，直接用当前用户信息构造选项
 * @update 2026-03-18 @Wangsongsong
 * @desc 非超管通过关注列表构建用户下拉选项，可查看关注的人的明细
 */
const loadUserOptions = async () => {
  if (userOptions.value.length) return
  if (isAdmin.value) {
    const { data } = await listFollowUserOptions()
    userOptions.value = data
  } else {
    const options: LabelValueState[] = [
      { label: userStore.userInfo.nickname, value: userStore.userInfo.id },
    ]
    try {
      const { data } = await listMyFollow()
      if (data && data.length > 0) {
        data.forEach((item) => {
          options.push({ label: item.followUserNickname, value: item.followUserId })
        })
      }
    } catch {
      // 加载失败不影响，至少有自己
    }
    userOptions.value = options
  }
}

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
} = useTable((page) => listDetail({ ...queryForm, ...page, privacyMode: privacyStore.isPrivacyMode }), { immediate: true })

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
  },
  { title: '明细名称', dataIndex: 'name', minWidth: 100, ellipsis: true, tooltip: true },
  { title: '所属用户', dataIndex: 'userNickname', width: 90, ellipsis: true, tooltip: true },
  { title: '科目', dataIndex: 'subjectName', width: 80, align: 'center' },
  { title: '分类', dataIndex: 'subjectCategory', slotName: 'subjectCategory', width: 70, align: 'center' },
  { title: '金额', dataIndex: 'amount', slotName: 'amount', width: 100, align: 'right' },
  { title: '明细日期', dataIndex: 'detailDate', width: 100, align: 'center' },
  { title: '备注', dataIndex: 'remark', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '隐藏', dataIndex: 'hidden', slotName: 'hidden', width: 60, align: 'center', show: (has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode) || isAdmin.value },
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
    ]),
  },
]

/** 重置查询条件 */
const reset = () => {
  resetForm()
  search()
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

/**
 * 检查是否已设置隐私密码，决定弹出验证还是设置弹窗
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const checkAndShowPasswordModal = async () => {
  try {
    const { data } = await hasPrivacyPassword()
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
      privacyStore.enterPrivacyMode()
      Message.success('已进入隐私模式')
      verifyPassword.value = ''
      search()
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
    privacyStore.enterPrivacyMode()
    Message.success('密码设置成功，已进入隐私模式')
    search()
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
  search()
}

onMounted(() => {
  loadUserOptions()
  mittBus.on('footer-click', onFooterClick)
})

onUnmounted(() => {
  mittBus.off('footer-click', onFooterClick)
})
</script>

<style scoped lang="scss"></style>
