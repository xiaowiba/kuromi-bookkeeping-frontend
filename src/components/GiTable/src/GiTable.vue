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
        <a-tooltip content="鍒锋柊">
          <a-button v-if="showRefreshBtn" @click="handleRefresh">
            <template #icon><icon-refresh /></template>
          </a-button>
        </a-tooltip>
        <a-dropdown v-if="showSizeBtn" @select="handleSizeChange">
          <a-tooltip content="灏哄">
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
        <a-tooltip content="鍏ㄥ睆">
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

// Props 榛樿鍊?
const props = withDefaults(defineProps<Props>(), {
  title: '',
  disabledColumnKeys: () => [],
  disabledTools: () => [],
  data: () => [],
})

/** Emits 绫诲瀷瀹氫箟 */
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'update:columns', columns: TableColumnData[]): void
  (e: 'change', ...args: any[]): void
}>()

/** Slots 绫诲瀷瀹氫箟 */
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

/** Props 绫诲瀷瀹氫箟 */
interface Props extends TableProps {
  /** 琛ㄦ牸鏍囬 */
  title?: string
  /** 绂佹鎺у埗鏄剧ず闅愯棌鐨勫垪 */
  disabledColumnKeys?: string[]
  /** 绂佹鏄剧ず鐨勫伐鍏?*/
  disabledTools?: string[]
  /** 琛ㄦ牸鏁版嵁 */
  data: T[]
  /** 琛ㄦ牸鏍囪瘑锛岀敤浜庡瓨鍌ㄥ垪璁剧疆 */
  tableId?: string
}

const slots = useSlots()
const attrs = useAttrs()

/** 缁勪欢鐘舵€?*/
const tableRef = useTemplateRef('tableRef')
const columnSettingRef = ref<InstanceType<typeof ColumnSetting> | null>(null)
const stripe = ref(false)
const size = ref<TableInstance['size']>('large')
const isBordered = ref(false)
const isFullscreen = ref(false)

/** 琛ㄦ牸灏哄閫夐」 */
const TABLE_SIZE_OPTIONS = [
  { label: '杩蜂綘', value: 'mini' },
  { label: '灏忓瀷', value: 'small' },
  { label: '涓瓑', value: 'medium' },
  { label: '澶у瀷', value: 'large' },
] as const

/** 澶勭悊琛ㄦ牸灏哄鍙樻洿 */
const handleSizeChange: DropdownInstance['onSelect'] = (value) => {
  if (value) {
    size.value = value as TableInstance['size']
  }
}

/** 澶勭悊琛ㄦ牸鍒锋柊 */
const handleRefresh = () => {
  emit('refresh')
}

/** 鍒囨崲鍏ㄥ睆鐘舵€?*/
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const showRefreshBtn = computed(() => !props.disabledTools?.includes('refresh'))
const showSizeBtn = computed(() => !props.disabledTools?.includes('size'))
const showFullscreenBtn = computed(() => !props.disabledTools?.includes('fullscreen'))
/** 鍒楄缃浉鍏抽€昏緫 */
const showSettingColumnBtn = computed(() => {
  const columns = props.columns as TableColumnData[] | undefined
  return !props.disabledTools?.includes('setting') && Boolean(columns?.length)
})

/** 鍐呴儴缁存姢鍒楁暟鎹?*/
const innerColumns = ref<TableColumnData[]>([])

/** 鐩戝惉 props.columns 鍙樺寲 */
watch(() => props.columns, (newColumns) => {
  innerColumns.value = newColumns ? [...newColumns] : []
}, { immediate: true, flush: 'sync' })

/** 瀹為檯鏄剧ず鐨勫垪锛堢敱 ColumnSetting 缁勪欢璁＄畻锛?*/
const tableColumns = ref<TableColumnData[]>([])

/** 澶勭悊鍒楄缃粍浠剁殑鍙鍒楀彉鍖?*/
const handleVisibleColumnsChange = (columns: TableColumnData[]) => {
  tableColumns.value = columns
}

/** 琛ㄦ牸灞炴€ц绠?*/
const tableProps = computed(() => ({
  ...omit(props, ['title', 'disabledColumnKeys', 'disabledTools']),
  ...attrs,
}))

/**
 * 鍒楀悎骞跺叧閿€笺€?
 *
 * 琛ㄦ牸鏀寔鍒楄缃€佹帓搴忕瓑鍔ㄦ€佸睍绀恒€傚綋鐖剁粍浠剁殑 columns 鍙戠敓鍙樺寲鏃讹紝
 * 闇€瑕佺敤鏈€鏂扮殑鍒楀畾涔夎鐩栨湰鍦板彲瑙佸垪锛屼絾淇濈暀鐢ㄦ埛宸插湪鍒楄缃腑璋冩暣鐨勯『搴忋€佸浐瀹氬拰瀹藉害銆? */
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

/** 鐢ㄦ渶鏂扮殑鍒楀畾涔夊悓姝ユ湰鍦板凡閫夊垪锛岄伩鍏嶆帓搴忕姸鎬佺瓑鍔ㄦ€佸睘鎬у仠鐣欏湪鏃ц涓娿€? */
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

/** 璁＄畻鏄剧ず鐨勫垪 */
const visibleColumns = computed(() => {
  const latestColumns = props.columns ?? []
  if (tableColumns.value.length > 0) {
    return mergeVisibleColumns(latestColumns, tableColumns.value)
  }

  return latestColumns.filter(col => col.show !== false)
})

// 澶勭悊琛ㄦ牸鍙樺寲鐨勫嚱鏁?
const handleTableChange = (...args: any[]) => {
  // 灏嗘帴鏀跺埌鐨勫弬鏁颁紶閫掔粰鐖剁粍浠?
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
