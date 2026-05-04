<template>
  <a-card class="workplace-welcome" :bordered="false">
    <div class="workplace-welcome__content">
      <div class="workplace-welcome__main">
        <Avatar :src="userStore.avatar" :name="displayName" :size="72" />
        <div class="workplace-welcome__copy">
          <p class="workplace-welcome__eyebrow">记账工作台</p>
          <h2 class="workplace-welcome__title">{{ goodTimeText() }}，{{ displayName }}</h2>
        </div>
      </div>

      <div class="workplace-welcome__meta">
        <div class="workplace-welcome__meta-item">
          <span class="label">当前账号</span>
          <strong>@{{ usernameText }}</strong>
        </div>
        <div class="workplace-welcome__meta-item">
          <span class="label">统计视角</span>
          <strong>{{ periodLabel }}</strong>
        </div>
        <div class="workplace-welcome__meta-item">
          <span class="label">展示范围</span>
          <strong>{{ scopeLabel }}</strong>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores'
import { goodTimeText } from '@/utils'

withDefaults(defineProps<{
  scopeLabel?: string
  periodLabel?: string
}>(), {
  scopeLabel: '当前用户',
  periodLabel: '全部 / 本月 / 上月',
})

const userStore = useUserStore()

const displayName = computed(() => userStore.userInfo.nickname || userStore.userInfo.username || '用户')
const usernameText = computed(() => userStore.userInfo.username || '未设置')
</script>

<style scoped lang="scss">
.workplace-welcome {
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 26px;
  background: #f8fbff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.05);
}

.workplace-welcome :deep(.arco-card-body) {
  padding: 0;
}

.workplace-welcome__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 24px 26px 22px;
}

.workplace-welcome__main {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.workplace-welcome__copy {
  min-width: 0;
}

.workplace-welcome__eyebrow {
  margin: 0 0 8px;
  color: rgb(var(--primary-6));
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.workplace-welcome__title {
  margin: 0;
  color: var(--color-text-1);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
}

.workplace-welcome__subtitle {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--color-text-2);
  font-size: 14px;
  line-height: 1.8;
}

.workplace-welcome__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  min-width: min(470px, 100%);
}

.workplace-welcome__meta-item {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 15px 16px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.workplace-welcome__meta-item::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 2px;
  background: rgba(59, 130, 246, 0.18);
}

.workplace-welcome__meta-item .label {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.4;
}

.workplace-welcome__meta-item strong {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
  word-break: break-word;
}

@media (max-width: 1280px) {
  .workplace-welcome__content {
    flex-direction: column;
    align-items: stretch;
  }

  .workplace-welcome__meta {
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .workplace-welcome__title {
    font-size: 24px;
  }

  .workplace-welcome__main {
    align-items: flex-start;
  }

  .workplace-welcome__content {
    padding: 20px 18px 18px;
  }

  .workplace-welcome__meta {
    grid-template-columns: 1fr;
  }
}
</style>
