<template>
  <GiPageLayout>
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
      <template #toolbar-left>
        <a-input-search v-model="queryForm.name" placeholder="搜索类型名称" allow-clear @search="search" />
        <a-select
          v-model="queryForm.category"
          :options="bk_subject_category"
          placeholder="请选择分类"
          allow-clear
          style="width: 150px"
          @change="search"
        />
        <a-select
          v-model="queryForm.status"
          placeholder="请选择状态"
          allow-clear
          style="width: 120px"
          @change="search"
        >
          <a-option :value="1">启用</a-option>
          <a-option :value="2">禁用</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
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
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { h, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type SubjectQuery, type SubjectResp, deleteSubject, listSubject } from '@/apis/bookkeeping/subject'
import { useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingSubject' })

const { bk_subject_category } = useDict('bk_subject_category')

const queryForm = reactive<SubjectQuery>({
  sort: ['sort,asc'],
})

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
  { title: '类型名称', dataIndex: 'name', minWidth: 120, ellipsis: true, tooltip: true },
  { title: '所属分类', dataIndex: 'category', slotName: 'category', width: 120, align: 'center' },
  { title: '图标', dataIndex: 'icon', width: 100, align: 'center', ellipsis: true, tooltip: true },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 80,
    align: 'center',
    sortable: { sortDirections: ['ascend', 'descend'] },
  },
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
    width: 130,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['bookkeeping:subject:update', 'bookkeeping:subject:delete']),
  },
]

/** 重置查询条件 */
const reset = () => {
  queryForm.name = undefined
  queryForm.category = undefined
  queryForm.status = undefined
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
