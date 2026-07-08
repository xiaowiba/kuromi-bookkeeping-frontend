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
        <a-space>
          <a-button v-permission="['bookkeeping:follow:manage']" type="primary" @click="onAdd">
            <template #icon><icon-plus /></template>
            <template #default>配置关注</template>
          </a-button>

          <a-popover trigger="click" position="bottom" :content-style="{ maxWidth: '380px', padding: '0' }">
            <a-button class="follow-help-trigger" type="text" size="small" aria-label="关注管理说明">
              <template #icon><icon-question-circle /></template>
            </a-button>
            <template #content>
              <div class="follow-help-popover">
                <div class="follow-help-popover__title">允许切换是什么意思</div>
                <div class="follow-help-popover__text">
                  开启某条 A -> B 关系，表示 A 可以切换到 B。允许切换由被关注的人决定，也就是谁被关注，谁来授权关注自己的人是否可以切换到自己。
                </div>
              </div>
            </template>
          </a-popover>
        </a-space>
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

    <AddModal ref="addModalRef" @save-success="search" />
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * 关注管理列表页。
 *
 * 用于维护用户之间的关注关系，并控制被关注用户是否允许关注者切换到自己的账户。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充页面职责说明和切换授权语义说明
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Switch } from '@arco-design/web-vue'
import { h, onMounted, reactive, ref } from 'vue'
import AddModal from './AddModal.vue'
import { type FollowResp, deleteFollow, listFollow, listFollowUserOptions, toggleAllowSwitch } from '@/apis/bookkeeping/follow'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import { useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'BookkeepingFollow' })

const userStore = useUserStore()
const userOptions = ref<LabelValueState[]>([])

const loadUserOptions = async () => {
  if (userOptions.value.length) {
    return
  }
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
  {
    title: '允许切换',
    dataIndex: 'allowSwitch',
    width: 100,
    align: 'center',
    render: ({ record }) => h(Switch, {
      modelValue: record.allowSwitch,
      disabled: String(record.followUserId) !== String(userStore.userInfo.id || ''),
      onChange: (value: boolean) => handleToggleSwitch(record.id, value),
    }),
  },
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

const handleToggleSwitch = async (followId: string, allowSwitch: boolean) => {
  try {
    await toggleAllowSwitch(followId, allowSwitch)
    Message.success('操作成功')
    search()
  } catch (error) {
    Message.error('操作失败')
  }
}

const reset = () => {
  resetForm()
  search()
}

const onDelete = (record: FollowResp) => {
  return handleDelete(() => deleteFollow([record.id]), {
    content: `确定要删除「${record.userNickname}」关注「${record.followUserNickname}」的关系吗？`,
    showModal: true,
  })
}

const addModalRef = ref<InstanceType<typeof AddModal>>()

const onAdd = () => {
  addModalRef.value?.onOpen(userOptions.value)
}
</script>

<style scoped lang="scss">
.follow-help-trigger {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50%;
  color: var(--color-text-3);
}

.follow-help-trigger:hover {
  color: rgb(var(--primary-6));
  background-color: var(--color-fill-2);
}

.follow-help-trigger:focus-visible {
  color: rgb(var(--primary-6));
  background-color: var(--color-fill-2);
}

.follow-help-trigger :deep(.arco-icon) {
  font-size: 16px;
}

.follow-help-popover {
  padding: 14px 16px;
}

.follow-help-popover__title {
  margin-bottom: 6px;
  color: var(--color-text-1);
  font-size: 15px;
  font-weight: 600;
}

.follow-help-popover__text {
  color: var(--color-text-2);
  font-size: 13px;
  line-height: 1.7;
}
</style>
