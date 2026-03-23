<template>
  <GiPageLayout>
    <!-- 左侧树预留：如需左侧分类树，取消注释并创建对应的 Tree 组件 -->
    <!-- <template #left>
      <CategoryTree @node-click="handleSelectCategory" />
    </template> -->
    <GiTable
      ref="tableRef"
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
        <GiForm 
          v-model="queryForm" 
          search 
          :columns="queryFormColumns" 
          :default-collapsed="isMobile()" 
          size="medium" 
          @search="search" 
          @reset="reset" 
        />
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
      <template #icon="{ record }">
        <span class="subject-table__icon">
          <BookkeepingSubjectIcon :icon="record.icon" mode="web" :size="18" />
        </span>
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
 * @desc 统一列表页面风格，搜索表单改用 GiForm 组件，补全表格列，预留左侧树位置
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端优化：默认全屏模式、默认收起搜索条件、分页页码最大化
 * @update 2026-03-23 @Wangsongsong
 * @desc 科目列表新增图标列，统一展示科目图标编码对应的 Web 端图标
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { h, onMounted, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type SubjectQuery, type SubjectResp, deleteSubject, listSubject } from '@/apis/bookkeeping/subject'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
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
} = useTable(
  (page) => listSubject({ ...queryForm, ...page }), 
  { 
    immediate: true,
    paginationOption: isMobile() ? { defaultPageSize: 50 } : undefined,
  },
)

/** 表格引用 */
const tableRef = ref()

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 30,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
    show: false,
  },
  { title: '图标', dataIndex: 'icon', slotName: 'icon', width: 70, align: 'center' },
  { title: '类型名称', dataIndex: 'name', ellipsis: true, tooltip: true, width: 30, align: 'center' },
  { title: '所属分类', dataIndex: 'category', slotName: 'category', width: 30, align: 'center' },
  { title: '是否默认', dataIndex: 'isDefault', slotName: 'isDefault', width: 100, align: 'center', show: false },
  { title: '排序', dataIndex: 'sort', slotName: 'sort', width: 30, align: 'center' },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 100, align: 'center', show: false },
  { title: '创建人', dataIndex: 'createUserString', width: 140, ellipsis: true, tooltip: true, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 180, show: false },
  { title: '修改人', dataIndex: 'updateUserString', width: 140, ellipsis: true, tooltip: true, show: false },
  { title: '修改时间', dataIndex: 'updateTime', width: 180, show: false },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 80,
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

/**
 * 组件挂载后处理移动端全屏
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
onMounted(() => {
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
</script>

<style scoped lang="scss">
.subject-table__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-fill-2);
  color: rgb(var(--primary-6));
}
</style>
