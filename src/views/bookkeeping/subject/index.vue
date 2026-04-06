<template>
  <div class="subject-manage-page">
    <div class="subject-manage-page__column subject-manage-page__column--subject">
      <div class="subject-manage-page__panel">
        <div class="subject-manage-page__panel-header">
          <div>
            <div class="subject-manage-page__panel-title">科目列表</div>
            <div class="subject-manage-page__panel-subtitle">
              共 {{ subjectPagination.total }} 个科目，左侧选择后可在右侧管理标签
            </div>
          </div>
        </div>

        <div class="subject-manage-page__subject-table">
          <GiTable
            row-key="id"
            :data="subjectDataList"
            :columns="subjectColumns"
            :loading="subjectLoading"
            :scroll="{ x: '100%', y: '100%', minWidth: 860 }"
            :pagination="false"
            :disabled-tools="['size']"
            :disabled-column-keys="['name']"
            :row-class="getSubjectRowClass"
            @refresh="searchSubjectList"
            @row-click="handleSubjectRowClick"
          >
            <template #top>
              <GiForm
                v-model="subjectQueryForm"
                search
                :columns="subjectQueryFormColumns"
                @search="searchSubjectList"
                @reset="resetSubjectQuery"
              />
            </template>

            <template #toolbar-left>
              <a-button v-permission="['bookkeeping:subject:create']" type="primary" @click="onAddSubject">
                <template #icon><icon-plus /></template>
                新增科目
              </a-button>
            </template>

            <template #toolbar-right>
              <div class="subject-manage-page__toolbar-summary">
                点击左侧科目行后，可在右侧管理该科目下的标签
              </div>
            </template>

            <template #icon="{ record }">
              <div class="subject-manage-page__tag-icon">
                <BookkeepingSubjectIcon :icon="record.icon" mode="web" :size="18" />
              </div>
            </template>

            <template #category="{ record }">
              <GiCellTag :value="record.category" :dict="bk_subject_category" />
            </template>

            <template #isDefault="{ record }">
              <a-tag v-if="record.isDefault" color="arcoblue" size="small">默认科目</a-tag>
              <a-tag v-else color="gray" size="small">普通科目</a-tag>
            </template>

            <template #status="{ record }">
              <GiCellStatus :status="record.status" />
            </template>

            <template #action="{ record }">
              <a-space @click.stop>
                <a-link
                  v-permission="['bookkeeping:subject:update']"
                  title="编辑"
                  @click="onUpdateSubject(record)"
                >
                  编辑
                </a-link>
                <a-link
                  v-permission="['bookkeeping:subject:delete']"
                  status="danger"
                  title="删除"
                  :disabled="record.isDefault"
                  @click="onDeleteSubject(record)"
                >
                  删除
                </a-link>
              </a-space>
            </template>

            <template #empty>
              <a-empty description="暂无科目数据">
                <a-button v-permission="['bookkeeping:subject:create']" type="primary" @click="onAddSubject">
                  新增科目
                </a-button>
              </a-empty>
            </template>
          </GiTable>
        </div>
      </div>
    </div>

    <div class="subject-manage-page__column subject-manage-page__column--tag">
      <div class="subject-manage-page__panel">
        <template v-if="selectedSubject">
          <div class="subject-manage-page__panel-header subject-manage-page__panel-header--tag">
            <div class="subject-manage-page__selected-subject">
              <div class="subject-manage-page__selected-icon">
                <BookkeepingSubjectIcon :icon="selectedSubject.icon" mode="web" :size="20" />
              </div>

              <div class="subject-manage-page__selected-content">
                <div class="subject-manage-page__selected-title">
                  <span>{{ selectedSubject.name }}</span>
                  <a-tag v-if="selectedSubject.isDefault" size="small" color="arcoblue">默认科目</a-tag>
                  <a-tag v-if="selectedSubject.status === 2" size="small" color="gray">已停用</a-tag>
                </div>

                <div class="subject-manage-page__selected-meta">
                  <GiCellTag :value="selectedSubject.category" :dict="bk_subject_category" />
                  <span>排序 {{ selectedSubject.sort }}</span>
                </div>
              </div>
            </div>

            <div class="subject-manage-page__tag-summary">
              当前共 {{ tagPagination.total }} 个标签
            </div>
          </div>

          <div class="subject-manage-page__tag-table">
            <GiTable
              row-key="id"
              :data="tagDataList"
              :columns="tagColumns"
              :loading="tagLoading"
              :scroll="{ x: '100%', y: '100%', minWidth: 920 }"
              :pagination="false"
              :disabled-tools="['size']"
              :disabled-column-keys="['name']"
              @refresh="searchTagList"
            >
              <template #top>
                <GiForm
                  v-model="tagQueryForm"
                  search
                  :columns="tagQueryFormColumns"
                  @search="searchTagList"
                  @reset="resetTagQuery"
                />
              </template>

              <template #toolbar-left>
                <a-button
                  v-permission="['bookkeeping:subject-tag:create']"
                  type="primary"
                  :disabled="!selectedSubject"
                  @click="onAddTag"
                >
                  <template #icon><icon-plus /></template>
                  新增标签
                </a-button>
              </template>

              <template #toolbar-right>
                <div class="subject-manage-page__toolbar-summary">
                  默认标签会自动承接被删除标签的历史明细
                </div>
              </template>

              <template #isDefault="{ record }">
                <a-tag v-if="record.isDefault" color="arcoblue" size="small">默认标签</a-tag>
                <a-tag v-else color="gray" size="small">普通标签</a-tag>
              </template>

              <template #icon="{ record }">
                <div class="subject-manage-page__tag-icon">
                  <BookkeepingSubjectIcon :icon="record.icon || selectedSubject?.icon || 'general'" mode="web" :size="18" />
                </div>
              </template>

              <template #status="{ record }">
                <GiCellStatus :status="record.status" />
              </template>

              <template #action="{ record }">
                <a-space>
                  <a-link
                    v-permission="['bookkeeping:subject-tag:update']"
                    title="编辑"
                    @click="onUpdateTag(record)"
                  >
                    编辑
                  </a-link>
                  <a-link
                    v-permission="['bookkeeping:subject-tag:update']"
                    :disabled="record.isDefault"
                    :title="record.status === 1 ? '停用' : '启用'"
                    @click="onToggleTagStatus(record)"
                  >
                    {{ record.status === 1 ? '停用' : '启用' }}
                  </a-link>
                  <a-link
                    v-permission="['bookkeeping:subject-tag:delete']"
                    status="danger"
                    :disabled="record.isDefault"
                    title="删除"
                    @click="onDeleteTag(record)"
                  >
                    删除
                  </a-link>
                </a-space>
              </template>
            </GiTable>
          </div>
        </template>

        <div v-else class="subject-manage-page__empty">
          <a-empty description="请先从左侧选择一个科目，再管理该科目下的标签" />
        </div>
      </div>
    </div>

    <AddModal ref="addModalRef" @save-success="onSubjectSaveSuccess" />
    <TagModal ref="tagModalRef" @save-success="onTagSaveSuccess" />
  </div>
</template>

<script setup lang="ts">
/**
 * Web 端科目管理页
 *
 * 当前页面按“左科目、右标签”的双栏结构组织：
 * 1. 左侧负责科目的查询、分页和增删改。
 * 2. 右侧只展示当前选中科目下的标签列表。
 * 3. 删除标签前先走后端预检查接口，明确提示影响范围和迁移目标。
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import { computed, h, reactive, ref, watch } from 'vue'
import AddModal from './AddModal.vue'
import TagModal from './TagModal.vue'
import type { SubjectResp } from '@/apis/bookkeeping/subject'
import type { SubjectTagResp } from '@/apis/bookkeeping/subject-tag'
import {
  deleteSubject,
  listSubject,
} from '@/apis/bookkeeping/subject'
import {
  deleteSubjectTag,
  getSubjectTagDeleteImpact,
  listSubjectTagAll,
  updateSubjectTag,
} from '@/apis/bookkeeping/subject-tag'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import type { ColumnItem } from '@/components/GiForm'
import { DisEnableStatusList } from '@/constant/common'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingSubject' })

const { bk_subject_category } = useDict('bk_subject_category')

const [subjectQueryForm, resetSubjectForm] = useResetReactive({
  name: '',
  category: '',
  status: '' as number | '',
  sort: ['sort,asc'],
})

const [tagQueryForm, resetTagForm] = useResetReactive({
  name: '',
  status: '' as number | '',
})

const selectedSubject = ref<SubjectResp | null>(null)
const addModalRef = ref<InstanceType<typeof AddModal>>()
const tagModalRef = ref<InstanceType<typeof TagModal>>()
const SUBJECT_QUERY_ALL_SIZE = 1000

const subjectCategoryQueryOptions = computed(() => ([
  { label: '全部', value: '' },
  ...bk_subject_category.value,
]))

const subjectStatusQueryOptions = computed(() => ([
  { label: '全部', value: '' },
  ...DisEnableStatusList,
]))

const subjectQueryFormColumns: ColumnItem[] = reactive([
  {
    type: 'radio-group',
    label: '分类',
    field: 'category',
    span: { xs: 24, sm: 12, xl: 12 },
    props: {
      options: subjectCategoryQueryOptions,
    },
  },
  {
    type: 'radio-group',
    label: '状态',
    field: 'status',
    span: { xs: 24, sm: 12, xl: 12 },
    props: {
      options: subjectStatusQueryOptions,
    },
  },
  {
    type: 'input',
    label: '科目名称',
    field: 'name',
    span: { xs: 24, sm: 16, xl: 16 },
    props: {
      placeholder: '请输入科目名称',
    },
  },
])

const tagQueryFormColumns: ColumnItem[] = reactive([
  {
    type: 'radio-group',
    label: '状态',
    field: 'status',
    span: 24,
    props: {
      options: subjectStatusQueryOptions,
    },
  },
  {
    type: 'input',
    label: '标签名称',
    field: 'name',
    span: { xs: 24, sm: 16, xl: 16 },
    props: {
      placeholder: '请输入标签名称',
    },
  },
])

const {
  tableData: subjectDataList,
  loading: subjectLoading,
  pagination: subjectPagination,
  search: subjectSearch,
  handleDelete: handleDeleteSubject,
} = useTable(
  (page) => listSubject({ ...buildSubjectQuery(), ...page, size: SUBJECT_QUERY_ALL_SIZE }),
  {
    immediate: true,
    paginationOption: { defaultPageSize: SUBJECT_QUERY_ALL_SIZE, defaultSizeOptions: [SUBJECT_QUERY_ALL_SIZE] },
    onSuccess: syncSelectedSubject,
  },
)

/**
 * 单选“全部”在界面层使用空字符串，占位更直观；
 * 发请求前统一转成 undefined，避免把无意义的空值透传给后端。
 */
function buildSubjectQuery() {
  return {
    ...subjectQueryForm,
    category: subjectQueryForm.category || undefined,
    status: subjectQueryForm.status === '' ? undefined : subjectQueryForm.status,
  }
}

const buildTagQuery = () => ({
  subjectId: selectedSubject.value?.id,
  name: tagQueryForm.name || undefined,
  status: tagQueryForm.status === '' ? undefined : tagQueryForm.status,
})

const {
  tableData: tagDataList,
  loading: tagLoading,
  pagination: tagPagination,
  search: tagSearch,
  refresh: refreshTagList,
} = useTable(
  () => {
    if (!selectedSubject.value) {
      return Promise.resolve({ data: [] } as any)
    }
    return listSubjectTagAll(buildTagQuery())
  },
  {
    immediate: false,
  },
)

let skipSubjectRadioWatch = true
let skipTagStatusWatch = true

const subjectColumns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 70,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1),
    show: false,
  },
  {
    title: '图标',
    dataIndex: 'icon',
    slotName: 'icon',
    width: 90,
    align: 'center',
  },
  {
    title: '科目名称',
    dataIndex: 'name',
    width: 180,
    ellipsis: true,
    tooltip: true,
  },
  {
    title: '分类',
    dataIndex: 'category',
    slotName: 'category',
    width: 100,
    align: 'center',
  },
  {
    title: '默认科目',
    dataIndex: 'isDefault',
    slotName: 'isDefault',
    width: 120,
    align: 'center',
    show: false,
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 90,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status',
    width: 100,
    align: 'center',
  },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 140,
    align: 'center',
    fixed: 'right',
    show: has.hasPermOr([
      'bookkeeping:subject:update',
      'bookkeeping:subject:delete',
    ]),
  },
]

const tagColumns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 70,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1),
    show: false,
  },
  {
    title: '标签名称',
    dataIndex: 'name',
    width: 220,
    ellipsis: true,
    tooltip: true,
  },
  {
    title: '图标',
    dataIndex: 'icon',
    slotName: 'icon',
    width: 100,
    align: 'center',
  },
  {
    title: '默认标签',
    dataIndex: 'isDefault',
    slotName: 'isDefault',
    width: 120,
    align: 'center',
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 100,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status',
    width: 100,
    align: 'center',
  },
  {
    title: '创建人',
    dataIndex: 'createUserString',
    width: 140,
    ellipsis: true,
    tooltip: true,
    show: false,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    show: false,
  },
  {
    title: '修改人',
    dataIndex: 'updateUserString',
    width: 140,
    ellipsis: true,
    tooltip: true,
    show: false,
  },
  {
    title: '修改时间',
    dataIndex: 'updateTime',
    width: 180,
    show: false,
  },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 180,
    align: 'center',
    fixed: 'right',
    show: has.hasPermOr([
      'bookkeeping:subject-tag:update',
      'bookkeeping:subject-tag:delete',
    ]),
  },
]

/** 没有选中科目时，右侧标签区需要立即回到空态。 */
function clearTagState() {
  tagDataList.value = []
  tagPagination.total = 0
  tagPagination.current = 1
}

/**
 * 切换当前科目时，统一重置右侧标签查询条件。
 * 这样可以避免上一科目的筛选条件误伤下一科目的标签结果。
 */
function handleSelectSubject(
  record: SubjectResp,
  options: { force?: boolean, resetTagFilters?: boolean } = {},
) {
  const changed = !!options.force || selectedSubject.value?.id !== record.id
  selectedSubject.value = record
  if (!changed) {
    return
  }
  if (options.resetTagFilters !== false) {
    skipTagStatusWatch = true
    resetTagForm()
  }
  tagSearch()
}

const getSubjectRowClass = (record: SubjectResp) => {
  const classNameList = ['subject-table__row']
  if (selectedSubject.value?.id === record.id) {
    classNameList.push('is-active')
  }
  if (record.status === 2) {
    classNameList.push('is-disabled')
  }
  return classNameList.join(' ')
}

const handleSubjectRowClick = (record: SubjectResp) => {
  handleSelectSubject(record)
}

/** 同步左侧科目分页结果与当前选中项，避免右侧停留在无效科目上。 */
function syncSelectedSubject() {
  if (!subjectDataList.value.length) {
    selectedSubject.value = null
    clearTagState()
    return
  }

  if (!selectedSubject.value) {
    handleSelectSubject(subjectDataList.value[0], { force: true, resetTagFilters: true })
    return
  }

  const matchedSubject = subjectDataList.value.find((item) => item.id === selectedSubject.value?.id)
  if (matchedSubject) {
    selectedSubject.value = matchedSubject
    return
  }

  handleSelectSubject(subjectDataList.value[0], { force: true, resetTagFilters: true })
}

const searchSubjectList = () => {
  subjectSearch()
}

const resetSubjectQuery = () => {
  skipSubjectRadioWatch = true
  resetSubjectForm()
  subjectSearch()
}

const searchTagList = () => {
  if (!selectedSubject.value) {
    clearTagState()
    return
  }
  tagSearch()
}

const resetTagQuery = () => {
  skipTagStatusWatch = true
  resetTagForm()
  searchTagList()
}

watch(
  () => [subjectQueryForm.category, subjectQueryForm.status],
  (value, oldValue) => {
    if (skipSubjectRadioWatch) {
      skipSubjectRadioWatch = false
      return
    }
    if (value[0] === oldValue?.[0] && value[1] === oldValue?.[1]) {
      return
    }
    searchSubjectList()
  },
)

watch(
  () => tagQueryForm.status,
  (value, oldValue) => {
    if (skipTagStatusWatch) {
      skipTagStatusWatch = false
      return
    }
    if (value === oldValue) {
      return
    }
    searchTagList()
  },
)

const onAddSubject = () => {
  addModalRef.value?.onAdd()
}

const onUpdateSubject = (record: SubjectResp) => {
  addModalRef.value?.onUpdate(record.id)
}

const onDeleteSubject = (record: SubjectResp) => {
  if (record.isDefault) {
    Message.warning('默认科目不允许删除')
    return
  }
  return handleDeleteSubject(() => deleteSubject(record.id), {
    content: `确定要删除科目「${record.name}」吗？删除后，相关明细会自动迁移到同分类默认科目下，且该科目下的标签会被一并清理，此操作不可撤销。`,
    showModal: true,
  })
}

const onSubjectSaveSuccess = () => {
  subjectSearch()
}

const onAddTag = () => {
  if (!selectedSubject.value) {
    Message.warning('请先选择一个科目')
    return
  }
  tagModalRef.value?.onAdd(selectedSubject.value)
}

const onUpdateTag = (record: SubjectTagResp) => {
  if (!selectedSubject.value) {
    Message.warning('请先选择一个科目')
    return
  }
  tagModalRef.value?.onUpdate(selectedSubject.value, record.id)
}

const onTagSaveSuccess = () => {
  searchTagList()
}

/** 默认标签不可停用；普通标签允许直接启停，保持列表页操作效率。 */
const onToggleTagStatus = async (record: SubjectTagResp) => {
  if (record.isDefault) {
    Message.warning('默认标签不允许停用')
    return
  }
  const nextStatus = record.status === 1 ? 2 : 1
  const actionText = nextStatus === 1 ? '启用' : '停用'
  try {
    await updateSubjectTag(
      {
        subjectId: record.subjectId,
        name: record.name,
        icon: record.icon,
        sort: record.sort,
        status: nextStatus,
      },
      record.id,
    )
    Message.success(`标签${actionText}成功`)
    refreshTagList()
  } catch {
    Message.error(`标签${actionText}失败`)
  }
}

/**
 * 删除标签前必须先拿预检查结果，再展示强提醒。
 * 这样用户能明确知道受影响明细数量，以及这些历史数据会迁移到哪个默认标签。
 */
const onDeleteTag = async (record: SubjectTagResp) => {
  if (record.isDefault) {
    Message.warning('默认标签不允许删除')
    return
  }
  try {
    const { data: impact } = await getSubjectTagDeleteImpact(record.id)
    if (!impact.canDelete) {
      Message.warning(impact.warningMessage || '当前标签不允许删除')
      return
    }
    Modal.warning({
      title: '删除标签风险提示',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      hideCancel: false,
      maskClosable: false,
      content: () => h('div', { class: 'subject-manage-page__delete-impact' }, [
        h('p', { class: 'subject-manage-page__delete-impact-title' }, `即将删除标签「${impact.tagName}」`),
        h('p', {}, `所属科目：${impact.subjectName}`),
        h('p', {}, `受影响明细：${impact.affectedDetailCount} 条`),
        h('p', {}, `迁移目标：默认标签「${impact.defaultTagName}」`),
        h('p', { class: 'subject-manage-page__delete-impact-warning' }, impact.warningMessage || '删除后不可撤销，请确认后再操作。'),
      ]),
      onBeforeOk: async () => {
        try {
          const res = await deleteSubjectTag(record.id)
          if (res.success) {
            Message.success('标签删除成功')
            tagSearch()
          }
          return res.success
        } catch {
          return false
        }
      },
    })
  } catch {
    Message.error('删除影响预检查失败')
  }
}
</script>

<style scoped lang="scss">
.subject-manage-page {
  display: flex;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
}

.subject-manage-page__column {
  flex: 0 0 calc((100% - 8px) / 2);
  width: calc((100% - 8px) / 2);
  min-width: 0;
  display: flex;
}

.subject-manage-page__panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  background: var(--color-bg-1);
  overflow: hidden;
}

.subject-manage-page__panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--color-border-2);
}

.subject-manage-page__panel-header--tag {
  align-items: center;
}

.subject-manage-page__panel-title {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.subject-manage-page__panel-subtitle {
  margin-top: 4px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.subject-manage-page__subject-table {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.subject-manage-page__subject-table :deep(.subject-table__row) {
  cursor: pointer;
}

.subject-manage-page__subject-table :deep(.subject-table__row.is-active .arco-table-td) {
  background: rgb(var(--primary-1));
}

.subject-manage-page__subject-table :deep(.subject-table__row.is-active:hover .arco-table-td) {
  background: rgb(var(--primary-1));
}

.subject-manage-page__subject-table :deep(.subject-table__row.is-disabled .arco-table-td) {
  color: var(--color-text-3);
}

.subject-manage-page__subject-table :deep(.subject-table__row .arco-table-td) {
  transition: background-color 0.2s ease;
}

.subject-manage-page__selected-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-fill-2);
  color: rgb(var(--primary-6));
  flex-shrink: 0;
}

.subject-manage-page__selected-content {
  flex: 1;
  min-width: 0;
}

.subject-manage-page__selected-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: var(--color-text-3);
  font-size: 12px;
}

.subject-manage-page__selected-subject {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.subject-manage-page__tag-summary,
.subject-manage-page__toolbar-summary {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
}

.subject-manage-page__selected-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.subject-manage-page__tag-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--color-fill-2);
  color: rgb(var(--primary-6));
}

.subject-manage-page__tag-table {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.subject-manage-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.subject-manage-page__delete-impact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text-2);
  line-height: 1.7;
}

.subject-manage-page__delete-impact-title {
  color: var(--color-text-1);
  font-weight: 600;
}

.subject-manage-page__delete-impact-warning {
  color: rgb(var(--danger-6));
}

@media (max-width: 1200px) {
  .subject-manage-page {
    flex-direction: column;
  }

  .subject-manage-page__column {
    flex: 1 1 auto;
    width: 100%;
  }

  .subject-manage-page__panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .subject-manage-page__tag-summary,
  .subject-manage-page__toolbar-summary {
    text-align: left;
  }
}
</style>
