<template>
  <t-popup
    v-model:visible="popupVisible"
    placement="center"
    destroy-on-close
    :z-index="1400"
    :close-on-overlay-click="false"
  >
    <div class="mobile-create-screen">
      <header class="mobile-create-screen__header">
        <span class="mobile-create-screen__header-side" />
        <div class="mobile-create-screen__tabs-wrap">
          <t-tabs
            v-model="selectedCategory"
            class="mobile-create-screen__category-tabs"
            theme="line"
            size="large"
            :list="categoryTabList"
            bottom-line-mode="auto"
            :show-bottom-line="true"
            :space-evenly="false"
            @change="handleCategoryChange"
          />
        </div>
        <button
          type="button"
          class="mobile-create-screen__cancel-btn"
          @click="popupVisible = false"
        >
          取消
        </button>
      </header>

      <section class="mobile-create-screen__body">
        <t-loading :loading="optionsLoading">
          <div v-if="visibleSubjects.length" class="mobile-create-screen__subject-grid">
            <button
              v-for="item in visibleSubjects"
              :key="item.id"
              type="button"
              class="mobile-create-screen__subject-card"
              :class="{ 'is-active': selectedSubjectId === item.id }"
              @click="handleSubjectSelect(item)"
            >
              <span class="mobile-create-screen__subject-icon">
                <BookkeepingSubjectIcon
                  :icon="item.icon"
                  mode="mobile"
                  size="0.8rem"
                />
              </span>
              <span class="mobile-create-screen__subject-name">{{ item.name }}</span>
            </button>
          </div>

          <div v-else class="mobile-create-screen__empty">
            当前分类下暂无可用科目
          </div>
        </t-loading>
      </section>
    </div>
  </t-popup>

  <MobileDetailCreateFormSheet
    v-model:visible="formSheetVisible"
    :detail-id="currentDetailId"
    :detail-user-id="editingDetail?.userId || ''"
    :category="selectedCategory"
    :category-label="selectedCategoryLabel"
    :subject-id="selectedSubjectId"
    :subject-name="currentSubjectName"
    :initial-name="editingDetail?.name || ''"
    :initial-amount="editingDetailAmount"
    :initial-detail-date="editingDetail?.detailDate || ''"
    :initial-payment-method="editingDetail?.paymentMethod || 'default'"
    :initial-remark="editingDetail?.remark || ''"
    :initial-hidden="editingDetail?.hidden ?? 0"
    @submit-success="handleSubmitSuccess"
  />
</template>

<script setup lang="ts">
/**
 * 移动端新增明细选择弹层
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-21 @Wangsongsong
 * @desc 支持接收明细ID并回填编辑数据，使移动端编辑复用新记账表单流程
 * @update 2026-03-22 @Wangsongsong
 * @desc 调整移动端分类页的兜底图标映射，移除突兀的填充蓝色图标，并保留接口 icon 字段的统一解析入口
 * @update 2026-03-22 @Wangsongsong
 * @desc 调整分类选择页顶部取消按钮字号与点击热区，贴近移动端效果图
 * @update 2026-03-23 @Wangsongsong
 * @desc 编辑态透传支付方式初始值，复用移动端新记账表单的支付方式录入逻辑
 * @update 2026-03-23 @Wangsongsong
 * @desc 接入统一科目图标组件，移除移动端本地兜底图标映射逻辑，改为按图标编码跨端渲染
 */
import { computed, ref, watch } from 'vue'
import { type DetailResp, getDetail } from '@/apis/bookkeeping/detail'
import { type SubjectResp, listSubject } from '@/apis/bookkeeping/subject'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import { useDict } from '@/hooks/app'
import MobileDetailCreateFormSheet from './MobileDetailCreateFormSheet.vue'

interface Props {
  visible: boolean
  detailId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save-success'): void
}>()

defineOptions({ name: 'MobileDetailCreatePopup' })

const { bk_subject_category: bkSubjectCategory } = useDict('bk_subject_category')

const popupVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})
const currentDetailId = computed(() => props.detailId || '')

const optionsLoading = ref(false)
const formSheetVisible = ref(false)
const allSubjects = ref<SubjectResp[]>([])
const selectedCategory = ref('')
const selectedSubjectId = ref('')
const editingDetail = ref<DetailResp | null>(null)

const resolveDefaultCategory = () => {
  const expenseItem = bkSubjectCategory.value.find((item) => {
    const value = String(item.value)
    return value === '1' || value === 'expense' || String(item.label).includes('支出')
  })

  if (expenseItem) {
    return String(expenseItem.value)
  }

  return String(bkSubjectCategory.value[0]?.value || '')
}

const categoryTabList = computed(() =>
  bkSubjectCategory.value.map(item => ({
    value: String(item.value),
    label: String(item.label),
  })),
)

const selectedCategoryLabel = computed(() => {
  const current = bkSubjectCategory.value.find(item => String(item.value) === selectedCategory.value)
  return current?.label || ''
})

const visibleSubjects = computed(() => {
  if (!selectedCategory.value) return []
  return allSubjects.value.filter(item => item.category === selectedCategory.value && item.status === 1)
})

const selectedSubject = computed(() =>
  allSubjects.value.find(item => item.id === selectedSubjectId.value) || null,
)
const currentSubjectName = computed(() => selectedSubject.value?.name || editingDetail.value?.subjectName || '')
const editingDetailAmount = computed(() => {
  if (editingDetail.value?.amount == null) return ''
  return String(Math.abs(Number(editingDetail.value.amount)))
})

const resetState = () => {
  selectedCategory.value = resolveDefaultCategory()
  selectedSubjectId.value = ''
  formSheetVisible.value = false
  editingDetail.value = null
}

const loadSubjectOptions = async () => {
  if (allSubjects.value.length) return
  const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
  allSubjects.value = data.list
}

const fillStateByDetail = async (id: string) => {
  const { data } = await getDetail(id)
  const matchedSubject = allSubjects.value.find(item => item.id === data.subjectId)

  editingDetail.value = data
  selectedCategory.value = data.subjectCategory || matchedSubject?.category || resolveDefaultCategory()
  selectedSubjectId.value = data.subjectId || ''
  formSheetVisible.value = true
}

const handleCategoryChange = (category: string | number) => {
  selectedCategory.value = String(category)
  selectedSubjectId.value = ''
}

const handleSubjectSelect = (subject: SubjectResp) => {
  selectedSubjectId.value = subject.id
  formSheetVisible.value = true
}

const handleSubmitSuccess = () => {
  formSheetVisible.value = false
  popupVisible.value = false
  emit('save-success')
}

watch(
  [() => props.visible, currentDetailId],
  async ([visible]) => {
    if (!visible) {
      resetState()
      return
    }

    resetState()
    optionsLoading.value = true
    try {
      await loadSubjectOptions()
      if (currentDetailId.value) {
        await fillStateByDetail(currentDetailId.value)
      }
    } finally {
      optionsLoading.value = false
    }
  },
)
</script>

<style scoped lang="scss">
.mobile-create-screen {
  display: flex;
  flex-direction: column;
  width: 100vw;
  max-width: 11.4667rem;
  height: 100dvh;
  background: #fff;
}

.mobile-create-screen__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(env(safe-area-inset-top) + 1.16rem);
  padding: calc(env(safe-area-inset-top) + 0.18rem) 0.24rem 0.08rem;
  background: #ffd84d;
  box-shadow: inset 0 -0.0133rem 0 rgba(0, 0, 0, 0.05);
}

.mobile-create-screen__header-side {
  display: none;
}

.mobile-create-screen__tabs-wrap {
  width: auto;
  margin: 0 auto;
  transform: translateY(0.02rem);
}

.mobile-create-screen__cancel-btn {
  position: absolute;
  right: 0.24rem;
  bottom: 0.18rem;
  border: none;
  background: transparent;
  color: #222;
  font-size: 0.36rem;
  font-weight: 500;
  line-height: 1;
  padding: 0.12rem 0.08rem;
}

.mobile-create-screen__category-tabs {
  height: 100%;
  background: transparent;
  --td-tab-nav-background: transparent;
  --td-tab-item-active-color: #222;
  --td-brand-color: #333;
}

.mobile-create-screen__category-tabs :deep(.t-tabs) {
  background: transparent;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__nav),
.mobile-create-screen__category-tabs :deep(.t-tabs__scroll),
.mobile-create-screen__category-tabs :deep(.t-tabs__wrapper) {
  height: 100%;
  background: transparent !important;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__scroll) {
  overflow: visible;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__wrapper) {
  justify-content: center;
  gap: 0.68rem;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__item) {
  padding: 0;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__item--top) {
  height: 0.92rem;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__item-inner) {
  min-height: 0.92rem;
  color: #222;
  font-size: 0.38rem;
  font-weight: 500;
  line-height: 1;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__item--active .t-tabs__item-inner) {
  font-weight: 600;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__track) {
  height: 0.04rem;
  min-width: 0.52rem;
  border-radius: 999rem;
  background: #333;
}

.mobile-create-screen__category-tabs :deep(.t-tabs__content) {
  display: none;
}

.mobile-create-screen__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  padding: 0.28rem 0.12rem calc(env(safe-area-inset-bottom) + 0.44rem);
}

.mobile-create-screen__subject-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  row-gap: 0.38rem;
}

.mobile-create-screen__subject-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.16rem;
  min-height: 1.76rem;
  flex: 0 0 25%;
  width: 25%;
  max-width: 25%;
  border: none;
  background: transparent;
  padding: 0 0.06rem;
}

.mobile-create-screen__subject-card.is-active .mobile-create-screen__subject-icon {
  background: linear-gradient(180deg, #ffe986 0%, #ffd84d 100%);
  color: #5f4a00;
  box-shadow: 0 0.08rem 0.18rem rgba(255, 209, 61, 0.28);
}

.mobile-create-screen__subject-card.is-active .mobile-create-screen__subject-name {
  color: #1f1f1f;
  font-weight: 500;
}

.mobile-create-screen__subject-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #f5f5f5;
  color: #666;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.mobile-create-screen__subject-icon :deep(.svg-icon) {
  width: 0.66rem;
  height: 0.66rem;
}

.mobile-create-screen__subject-name {
  max-width: 100%;
  overflow: hidden;
  color: #303133;
  font-size: 0.4rem;
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mobile-create-screen__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  color: #909399;
  font-size: 0.28rem;
  line-height: 1.6;
  text-align: center;
  padding: 0 0.24rem;
}
</style>
