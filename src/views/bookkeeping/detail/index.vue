<template>
  <GiPageLayout>
    <!-- 左侧树预留：如需左侧分类树，取消注释并创建对应的 Tree 组件 -->
    <!-- <template #left>
      <CategoryTree @node-click="handleSelectCategory" />
    </template> -->
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
      </template>
      <template #subjectCategory="{ record }">
        <GiCellTag :value="record.subjectCategory" :dict="bk_subject_category" />
      </template>
      <template #amount="{ record }">
        <span :style="{ color: record.amount < 0 ? '#f53f3f' : '#00b42a', fontWeight: 'bold' }">
          {{ record.amount < 0 ? record.amount.toFixed(2) : `+${record.amount.toFixed(2)}` }}
        </span>
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
 */
import type { TableInstance } from '@arco-design/web-vue'
import { computed, h, onMounted, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type DetailResp, deleteDetail, listDetail } from '@/apis/bookkeeping/detail'
import { listUserDict } from '@/apis/system/user'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingDetail' })

const userStore = useUserStore()
const { bk_subject_category } = useDict('bk_subject_category')

/** 是否超级管理员 */
const isAdmin = computed(() => userStore.roles.includes('super_admin'))

/** 用户选项列表 */
const userOptions = ref<LabelValueState[]>([])

/**
 * 加载用户选项
 *
 * 超管：调用用户字典接口获取所有用户
 * 非超管：仅显示当前登录用户
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 非超管不调用用户字典接口，直接用当前用户信息构造选项
 */
const loadUserOptions = async () => {
  if (userOptions.value.length) return
  if (isAdmin.value) {
    const { data } = await listUserDict({ status: 1 })
    userOptions.value = data
  } else {
    userOptions.value = [{ label: userStore.userInfo.nickname, value: userStore.userInfo.id }]
  }
}

onMounted(() => {
  loadUserOptions()
})

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
    disabled: () => !isAdmin.value,
    props: {
      options: userOptions,
      placeholder: '请选择用户',
      allowClear: isAdmin.value,
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
])

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listDetail({ ...queryForm, ...page }), { immediate: true })

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
  { title: '隐藏', dataIndex: 'hidden', slotName: 'hidden', width: 60, align: 'center', show: false },
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
</script>

<style scoped lang="scss"></style>
