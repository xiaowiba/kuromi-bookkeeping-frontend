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
      :disabled-column-keys="['userNickname']"
      @refresh="search"
    >
      <template #top>
        <GiForm v-model="queryForm" search :columns="queryFormColumns" size="medium" @search="search" @reset="reset" />
      </template>
      <template #toolbar-left>
        <a-button v-permission="['bookkeeping:follow:manage']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>配置关注</template>
        </a-button>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link
            v-permission="['bookkeeping:follow:manage']"
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
 * 关注管理列表页面
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 用户选项改为调用 bookkeeping 专用接口，解决普通用户数据权限导致返回空的问题
 */
import type { TableInstance } from '@arco-design/web-vue'
import { h, onMounted, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type FollowResp, deleteFollow, listFollow, listFollowUserOptions } from '@/apis/bookkeeping/follow'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingFollow' })

/** 用户选项列表 */
const userOptions = ref<LabelValueState[]>([])

/**
 * 加载用户选项
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 改为调用 bookkeeping 模块专用接口，绕过数据权限
 */
const loadUserOptions = async () => {
  if (userOptions.value.length) return
  const { data } = await listFollowUserOptions()
  userOptions.value = data
}

onMounted(() => {
  loadUserOptions()
})

const [queryForm, resetForm] = useResetReactive({
  sort: ['createTime,desc'],
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'select',
    label: '用户',
    field: 'userId',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: {
      options: userOptions,
      placeholder: '请选择用户',
      allowClear: true,
      allowSearch: true,
    },
  },
])

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listFollow({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
  },
  { title: '用户', dataIndex: 'userNickname', ellipsis: true, tooltip: true, align: 'center' },
  { title: '关注了', dataIndex: 'followUserNickname', ellipsis: true, tooltip: true, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 180, align: 'center' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 80,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['bookkeeping:follow:manage']),
  },
]

/** 重置查询条件 */
const reset = () => {
  resetForm()
  search()
}

/** 删除关注关系 */
const onDelete = (record: FollowResp) => {
  return handleDelete(() => deleteFollow([record.id]), {
    content: `确定要删除「${record.userNickname}」关注「${record.followUserNickname}」的关系吗？`,
    showModal: true,
  })
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()

/** 配置关注 */
const onAdd = () => {
  AddModalRef.value?.onOpen(userOptions.value)
}
</script>

<style scoped lang="scss"></style>
