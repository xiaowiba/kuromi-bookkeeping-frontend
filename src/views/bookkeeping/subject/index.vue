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
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #top>
        <GiForm v-model="queryForm" search :columns="queryFormColumns" size="medium" @search="search" @reset="reset" />
      </template>
      <template #toolbar-left>
        <a-button v-permission="['bookkeeping:subject:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #category="{ record }">
        <GiCellTag :value="record.category" :dict="bk_subject_category" />
      </template>
      <template #isDefault="{ record }">
        <a-tag v-if="record.isDefault" color="arcoblue" size="small">是</a-tag>
        <a-tag v-else color="gray" size="small">否</a-tag>
      </template>
      <template #status="{ record }">
        <GiCellStatus :status="record.status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['bookkeeping:subject:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['bookkeeping:subject:delete']"
            status="danger"
            title="删除"
            :disabled="record.isDefault"
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
 * 科目管理列表页面
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 统一列表页面风格，搜索表单改用 GiForm 组件，
 *       补全表格列，预留左侧树位置
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { h, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type SubjectQuery, type SubjectResp, deleteSubject, listSubject } from '@/apis/bookkeeping/subject'
import type { ColumnItem } from '@/components/GiForm'
import { DisEnableStatusList } from '@/constant/common'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingSubject' })

const { bk_subject_category } = useDict('bk_subject_category')

const [queryForm, resetForm] = useResetReactive({
  sort: ['sort,asc'],
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'input',
    label: '类型名称',
    field: 'name',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: {
      placeholder: '请输入类型名称',
    },
  },
  {
    type: 'select',
    label: '分类',
    field: 'category',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: {
      options: bk_subject_category,
      placeholder: '请选择分类',
    },
  },
  {
    type: 'select',
    label: '状态',
    field: 'status',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: {
      options: DisEnableStatusList,
      placeholder: '请选择状态',
    },
  },
])

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listSubject({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
  },
  { title: '类型名称', dataIndex: 'name', ellipsis: true, tooltip: true, align: 'center' },
  { title: '所属分类', dataIndex: 'category', slotName: 'category', width: 100, align: 'center' },
  { title: '是否默认', dataIndex: 'isDefault', slotName: 'isDefault', width: 100, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 100, align: 'center' },
  { title: '创建人', dataIndex: 'createUserString', width: 140, ellipsis: true, tooltip: true, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 180, show: false },
  { title: '修改人', dataIndex: 'updateUserString', width: 140, ellipsis: true, tooltip: true, show: false },
  { title: '修改时间', dataIndex: 'updateTime', width: 180, show: false },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr([
      'bookkeeping:subject:update',
      'bookkeeping:subject:delete',
    ]),
  },
]

/** 重置查询条件 */
const reset = () => {
  resetForm()
  search()
}

/** 删除科目 */
const onDelete = (record: SubjectResp) => {
  if (record.isDefault) {
    return Message.warning('默认类型不允许删除')
  }
  return handleDelete(() => deleteSubject(record.id), {
    content: `确定要删除科目「${record.name}」吗？删除后，所有关联该科目的明细数据将自动迁移至默认科目。此操作不可撤销！`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()

/** 新增 */
const onAdd = () => {
  AddModalRef.value?.onAdd()
}

/** 修改 */
const onUpdate = (record: SubjectResp) => {
  AddModalRef.value?.onUpdate(record.id)
}
</script>

<style scoped lang="scss"></style>
