<template>
  <div class="mobile-page">
    <section class="mobile-panel mobile-subject-hero">
      <p class="mobile-subject-hero__eyebrow">独立移动页</p>
      <h2 class="mobile-subject-hero__title">科目管理</h2>
      <p class="mobile-subject-hero__desc">
        这里是独立于 PC 页面的移动端科目列表，用于承接“我的”页九宫格入口。
      </p>
    </section>

    <section class="mobile-panel mobile-subject-filter">
      <div class="mobile-subject-filter__chips">
        <button
          type="button"
          class="mobile-chip"
          :class="{ 'is-active': !currentCategory }"
          @click="handleCategoryChange('')"
        >
          全部
        </button>
        <button
          v-for="item in bkSubjectCategory"
          :key="item.value"
          type="button"
          class="mobile-chip"
          :class="{ 'is-active': currentCategory === item.value }"
          @click="handleCategoryChange(String(item.value))"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <section class="mobile-subject-list">
      <MobilePageSkeleton v-if="loading" variant="subject-list" />
      <template v-else-if="filteredSubjects.length">
        <article
          v-for="item in filteredSubjects"
          :key="item.id"
          class="mobile-subject-card mobile-panel"
        >
          <div class="mobile-subject-card__top">
            <div>
              <p class="mobile-subject-card__meta">{{ subjectCategoryLabel(item.category) }}</p>
              <h3 class="mobile-subject-card__title">{{ item.name }}</h3>
            </div>
            <span class="mobile-chip" :class="{ 'is-active': item.isDefault }">
              {{ item.isDefault ? '默认' : '普通' }}
            </span>
          </div>
        </article>
      </template>
      <div v-else class="mobile-empty mobile-panel">
        当前分类下暂无科目。
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端科目页面
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-22 @Wangsongsong
 * @desc 接入移动端骨架屏，列表加载态改为 TDesign Skeleton 渐变动效
 * @update 2026-03-22 @Wangsongsong
 * @desc 接入移动端布局层下拉刷新，页面注册科目列表刷新回调
 * @update 2026-03-22 @Wangsongsong
 * @desc 统一科目页面的眉标与占位元素配色，使其与移动端黄色系主题保持一致
 * @update 2026-03-22 @Wangsongsong
 * @desc 移除科目页下拉刷新注册逻辑，避免无意义手势刷新造成页面状态干扰
 */
import { computed, onMounted, ref } from 'vue'
import MobilePageSkeleton from '@/views/mobile/components/MobilePageSkeleton.vue'
import { type SubjectResp, listSubject } from '@/apis/bookkeeping/subject'
import { useDict } from '@/hooks/app'

defineOptions({ name: 'MobileSubject' })

const loading = ref(false)
const subjects = ref<SubjectResp[]>([])
const currentCategory = ref('')
const { bk_subject_category: bkSubjectCategory } = useDict('bk_subject_category')

const filteredSubjects = computed(() => {
  if (!currentCategory.value) return subjects.value
  return subjects.value.filter(item => item.category === currentCategory.value)
})

const loadSubjects = async () => {
  loading.value = true
  try {
    const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
    subjects.value = data.list
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = (category: string) => {
  currentCategory.value = category
}

const subjectCategoryLabel = (value: string) => {
  const current = bkSubjectCategory.value.find(item => String(item.value) === value)
  return current?.label || value || '未分类'
}

onMounted(() => {
  loadSubjects()
})
</script>

<style scoped lang="scss">
.mobile-subject-hero,
.mobile-subject-filter {
  padding: 18px 16px;
}

.mobile-subject-hero__eyebrow {
  margin: 0 0 8px;
  color: var(--mobile-brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-subject-hero__title {
  margin: 0 0 10px;
  color: var(--color-text-1);
  font-size: 24px;
  font-weight: 700;
}

.mobile-subject-hero__desc {
  margin: 0;
  color: var(--color-text-2);
  font-size: 14px;
  line-height: 1.7;
}

.mobile-subject-filter__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mobile-subject-list {
  margin-top: 14px;
}

.mobile-subject-card {
  padding: 16px;
  margin-bottom: 12px;
}

.mobile-subject-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.mobile-subject-card__meta {
  margin: 0 0 6px;
  color: rgba(120, 94, 51, 0.64);
  font-size: 12px;
}

.mobile-subject-card__title {
  margin: 0;
  color: var(--color-text-1);
  font-size: 18px;
  font-weight: 700;
}
</style>
