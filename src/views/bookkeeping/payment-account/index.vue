<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 600 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #top>
        <GiForm v-model="queryForm" search :columns="queryFormColumns" size="medium" @search="search" @reset="reset" />
      </template>
      <template #toolbar-left>
        <a-button v-permission="['bookkeeping:payment-account:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          新增
        </a-button>
      </template>
      <template #status="{ record }">
        <GiCellStatus :status="record.status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['bookkeeping:payment-account:update']" title="编辑" @click="onUpdate(record)">编辑</a-link>
          <a-link v-permission="['bookkeeping:payment-account:delete']" status="danger" title="删除" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>
    <AddModal ref="addModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * 支付账号管理列表页
 *
 * @author Wangsongsong
 * @date 2026-04-21
 */
import type { TableInstance } from '@arco-design/web-vue'
import { h, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type PaymentAccountResp, deletePaymentAccount, listPaymentAccount } from '@/apis/bookkeeping/payment-account'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingPaymentAccount' })

const [queryForm, resetForm] = useResetReactive({
  name: '',
  sort: ['sort,asc', 'createTime,desc'],
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'input',
    label: '账号名称',
    field: 'name',
    span: { xs: 24, sm: 12, xxl: 8 },
    props: { placeholder: '请输入账号名称' },
  },
])

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listPaymentAccount({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '序号', width: 66, align: 'center', render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize) },
  { title: '账号名称', dataIndex: 'name', ellipsis: true, tooltip: true },
  { title: '所属用户', dataIndex: 'userNickname', width: 120, ellipsis: true, tooltip: true },
  { title: '排序', dataIndex: 'sort', width: 80, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    fixed: 'right',
    show: has.hasPermOr(['bookkeeping:payment-account:update', 'bookkeeping:payment-account:delete']),
  },
]

const reset = () => {
  resetForm()
  search()
}

const onDelete = (record: PaymentAccountResp) => {
  return handleDelete(() => deletePaymentAccount([record.id]), {
    content: `确定要删除支付账号「${record.name}」吗？`,
    showModal: true,
  })
}

const addModalRef = ref<InstanceType<typeof AddModal>>()
const onAdd = () => addModalRef.value?.onAdd()
const onUpdate = (record: PaymentAccountResp) => addModalRef.value?.onUpdate(record.id)
</script>
