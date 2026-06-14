<template>
  <div class="gi-table" :class="{ 'gi-table--fullscreen': isFullscreen }">
    <a-row v-if="props.title" justify="space-between" align="center" class="gi-table__header">
      <a-space wrap>
        <slot name="custom-title">
          <div class="gi-table__header-title">{{ props.title }}</div>
        </slot>
      </a-space>
    </a-row>
    <a-row>
      <slot name="top"></slot>
    </a-row>
    <a-row justify="space-between" align="center" class="gi-table__toolbar">
      <a-space wrap class="gi-table__toolbar-left" :size="[8, 8]">
        <slot name="toolbar-left"></slot>
      </a-space>
      <a-space wrap class="gi-table__toolbar-right" :size="[8, 8]">
        <slot name="toolbar-right"></slot>
        <a-tooltip content="刷新">
          <a-button v-if="showRefreshBtn" @click="handleRefresh">
            <template #icon><icon-refresh /></template>
          </a-button>
        </a-tooltip>
        <a-dropdown v-if="showSizeBtn" @select="handleSizeChange">
          <a-tooltip content="尺寸">
            <a-button>
              <template #icon><icon-table-size style="width: 14px; height: 14px" /></template>
            </a-button>
          </a-tooltip>
          <template #content>
            <a-doption v-for="item in TABLE_SIZE_OPTIONS" :key="item.value" :value="item.value" :active="item.value === size">
              {{ item.label }}
            </a-doption>
          </template>
        </a-dropdown>
        <ColumnSetting
          v-if="showSettingColumnBtn"
          :key="columnSettingKey"
          ref="columnSettingRef"
          v-model:columns="innerColumns"
          :disabled-keys="disabledColumnKeys"
          :table-id="tableId"
          @visible-columns-change="handleVisibleColumnsChange"
        />
        <a-tooltip content="全屏">
          <a-button v-if="showFullscreenBtn" @click="toggleFullscreen">
            <template #icon>
              <icon-fullscreen v-if="!isFullscreen" />
              <icon-fullscreen-exit v-else />
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
    </a-row>
    <a-row class="gi-table__toolbar-bottom">
      <slot name="toolbar-bottom"></slot>
    </a-row>
    <div class="gi-table__body" :class="`gi-table__body-pagination-${tableProps['page-position']}`">
      <div class="gi-table__container">
        <a-table
          ref="tableRef"
          v-bind="tableProps"
          :stripe="stripe"
          :size="size"
          :bordered="{ cell: isBordered }"
          :columns="visibleColumns"
          :scrollbar="true"
          :data="data"
          column-resizable
          @change="handleTableChange"
        >
          <template v-for="key in Object.keys(slots)" :key="key" #[key]="scope">
            <slot :key="key" :name="key" v-bind="scope" />
          </template>
        </a-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends TableData">
import { computed, ref, watch } from 'vue'
import type { DropdownInstance, TableColumnData, TableData, TableInstance } from '@arco-design/web-vue'
import { omit } from 'lodash-es'
import type { TableProps } from './type'
import ColumnSetting from './components/ColumnSetting.vue'

defineOptions({ name: 'GiTable' })

// Props 默认值
const props = withDefaults(defineProps<Props>(), {
  title: '',
  disabledColumnKeys: () => [],
  disabledTools: () => [],
  data: () => [],
})

/** Emits 类型定义 */
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'update:columns', columns: TableColumnData[]): void
  (e: 'change', ...args: any[]): void
}>()

/** Slots 类型定义 */
defineSlots<{
  'th': (props: { column: TableColumnData }) => void
  'thead': () => void
  'empty': (props: { column: TableColumnData }) => void
  'summary-cell': (props: { column: TableColumnData, record: T, rowIndex: number }) => void
  'pagination-right': () => void
  'pagination-left': () => void
  'td': (props: { column: TableColumnData, record: T, rowIndex: number }) => void
  'tr': (props: { record: T, rowIndex: number }) => void
  'tbody': () => void
  'drag-handle-icon': () => void
  'footer': () => void
  'expand-row': (props: { record: T }) => void
  'expand-icon': (props: { record: T, expanded?: boolean }) => void
  'columns': () => void
  'custom-title': () => void
  'top': () => void
  'toolbar-left': () => void
  'toolbar-right': () => void
  'toolbar-bottom': () => void
  [propsName: string]: (props: { key: string, record: T, column: TableColumnData, rowIndex: number }) => void
}>()

/** Props 类型定义 */
interface Props extends TableProps {
  /** 表格标题 */
  title?: string
  /** 禁止在列设置中控制显示/隐藏的列 */
  disabledColumnKeys?: string[]
  /** 禁止显示的工具 */
  disabledTools?: string[]
  /** 表格数据 */
  data: T[]
  /** 表格标识，用于存储列设置 */
  tableId?: string
}

const slots = useSlots()
const attrs = useAttrs()

/** 组件状态 */
const tableRef = useTemplateRef('tableRef')
const columnSettingRef = ref<InstanceType<typeof ColumnSetting> | null>(null)
const stripe = ref(false)
const size = ref<TableInstance['size']>('large')
const isBordered = ref(false)
const isFullscreen = ref(false)

/** 表格尺寸选项 */
const TABLE_SIZE_OPTIONS = [
  { label: '迷你', value: 'mini' },
  { label: '小型', value: 'small' },
  { label: '中等', value: 'medium' },
  { label: '大型', value: 'large' },
] as const

/** 处理表格尺寸变更 */
const handleSizeChange: DropdownInstance['onSelect'] = (value) => {
  if (value) {
    size.value = value as TableInstance['size']
  }
}

/** 处理表格刷新 */
const handleRefresh = () => {
  emit('refresh')
}

/** 切换全屏状态 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const showRefreshBtn = computed(() => !props.disabledTools?.includes('refresh'))
const showSizeBtn = computed(() => !props.disabledTools?.includes('size'))
const showFullscreenBtn = computed(() => !props.disabledTools?.includes('fullscreen'))
/** 列设置相关逻辑 */
const showSettingColumnBtn = computed(() => {
  const columns = props.columns as TableColumnData[] | undefined
  return !props.disabledTools?.includes('setting') && Boolean(columns?.length)
})

/** 内部维护的列数据 */
const innerColumns = ref<TableColumnData[]>([])

/** 监听 props.columns 变化 */
watch(() => props.columns, (newColumns) => {
  innerColumns.value = newColumns ? [...newColumns] : []
}, { immediate: true, flush: 'sync' })

/** 实际显示的列，由 ColumnSetting 组件计算 */
const tableColumns = ref<TableColumnData[]>([])

/** 处理列设置组件抛出的可见列变化 */
const handleVisibleColumnsChange = (columns: TableColumnData[]) => {
  tableColumns.value = columns
}

/** 表格属性计算 */
const tableProps = computed(() => ({
  ...omit(props, ['title', 'disabledColumnKeys', 'disabledTools']),
  ...attrs,
}))

/**
 * 列合并的关键值
 *
 * 表格支持列设置、排序等动态展示。当父组件的 columns 发生变化时，
 * 需要用最新的列定义覆盖本地可见列，但保留用户已在列设置中调整的顺序、固定和宽度。
 */
const resolveColumnKey = (column: TableColumnData) => {
  if (column.dataIndex) {
    return String(column.dataIndex)
  }
  if (column.slotName) {
    return `slot:${column.slotName}`
  }
  if (typeof column.title === 'string') {
    return `title:${column.title}`
  }
  return ''
}

const columnSettingKey = computed(() => (props.columns ?? [])
  .map(resolveColumnKey)
  .join('|'))

/** 用最新的列定义同步本地已选列，避免排序状态等动态属性停留在旧列上。 */
const mergeVisibleColumns = (latestColumns: TableColumnData[], currentColumns: TableColumnData[]) => {
  const currentColumnMap = new Map(
    currentColumns.map(column => [resolveColumnKey(column), column]),
  )

  return latestColumns
    .map((column) => {
      const currentColumn = currentColumnMap.get(resolveColumnKey(column))
      if (!currentColumn) {
        return column
      }
      return {
        ...column,
        fixed: currentColumn.fixed ?? column.fixed,
        width: props.disabledColumnKeys?.includes(resolveColumnKey(column))
          ? column.width
          : (currentColumn.width ?? column.width),
        show: currentColumn.show ?? column.show,
      }
    })
    .filter(column => column.show !== false)
}

/** 计算显示的列 */
const visibleColumns = computed(() => {
  const latestColumns = props.columns ?? []
  if (tableColumns.value.length > 0) {
    return mergeVisibleColumns(latestColumns, tableColumns.value)
  }

  return latestColumns.filter(col => col.show !== false)
})

// 处理表格变化的函数
const handleTableChange = (...args: any[]) => {
  // 将接收到的参数透传给父组件
  emit('change', ...args)
}

defineExpose({
  tableRef,
  toggleFullscreen,
  resetColumns: () => columnSettingRef.value?.resetColumns?.(),
  saveColumns: () => columnSettingRef.value?.saveColumns?.(),
})
</script>

<style lang="scss" scoped>
.gi-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  background: var(--color-bg-1);
  position: relative;
  box-sizing: border-box;
  &--fullscreen {
    padding: $padding;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1001;
  }

  &__container {
    max-height: 100%;
    overflow: hidden;
    flex: 1;

    :deep(.arco-table) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :deep(.arco-table-container) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :deep(.arco-table-content) {
      flex: 1;
      min-height: 0;
    }
  }

  &__header {
    margin-bottom: $margin;
  }

  &__header-title {
    font-size: 18px;
    font-weight: bold;
  }

  &__toolbar {
    margin-bottom: $margin;
  }

  &__toolbar-left {
    max-width: 100%;
  }

  &__toolbar-right {
    max-width: 100%;
  }

  &__toolbar-bottom {
    margin-bottom: $margin;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    &-pagination-top,
    &-pagination-both {
      :deep(.arco-table-pagination) {
        margin-top: $margin;
        order: -1;
      }
    }
  }
}
</style>
