<template>
  <a-modal
    v-model:visible="visible"
    title="配置关注"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item label="选择用户" field="userId">
        <a-select
          v-model="form.userId"
          placeholder="请选择要配置关注的用户"
          allow-search
          :loading="userLoading"
          @change="onUserChange"
        >
          <a-option v-for="item in allUserOptions" :key="item.value" :value="item.value" :label="item.label" />
        </a-select>
      </a-form-item>
      <a-form-item label="关注对象" field="followUserIds">
        <a-select
          v-model="form.followUserIds"
          placeholder="请选择关注的用户（可多选）"
          multiple
          allow-search
        >
          <a-option
            v-for="item in followUserOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 关注配置弹窗
 *
 * 选择用户后，自动加载该用户已有的关注关系并回显，
 * 已关注的用户在下拉选项中标注"（已关注）"，
 * 保存时全量覆盖该用户的关注关系
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 选择用户后自动加载已有关注关系并回显，合并新增与修改操作
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { listFollowByUserId, saveFollow } from '@/apis/bookkeeping/follow'
import type { LabelValueState } from '@/types/global'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const formRef = ref()
const userLoading = ref(false)

/** 所有用户选项 */
const allUserOptions = ref<LabelValueState[]>([])

/** 当前用户已关注的用户ID集合 */
const existingFollowIds = ref<Set<string | number>>(new Set())

const form = ref<{
  userId: string | number | undefined
  followUserIds: Array<string | number>
}>({
  userId: undefined,
  followUserIds: [],
})

const rules = {
  userId: [{ required: true, message: '请选择用户' }],
}

/**
 * 关注对象选项（排除当前选中的用户自身）
 *
 * 已关注的用户在 label 后追加"（已关注）"标识
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 已关注用户标注"（已关注）"
 */
const followUserOptions = computed(() => {
  const options = form.value.userId
    ? allUserOptions.value.filter((item) => item.value !== form.value.userId)
    : allUserOptions.value
  return options.map((item) => ({
    ...item,
    label: existingFollowIds.value.has(item.value) ? `${item.label}（已关注）` : item.label,
  }))
})

/**
 * 用户切换时，查询该用户已有的关注关系并自动勾选
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 切换用户后自动加载已有关注关系
 */
const onUserChange = async (userId: string | number | undefined) => {
  form.value.followUserIds = []
  existingFollowIds.value = new Set()
  if (!userId) return
  try {
    userLoading.value = true
    const { data } = await listFollowByUserId(userId)
    if (data && data.length > 0) {
      const ids = data.map((item) => item.followUserId)
      form.value.followUserIds = ids
      existingFollowIds.value = new Set(ids)
    }
  } catch {
    // 查询失败不影响操作
  } finally {
    userLoading.value = false
  }
}

/** 重置 */
const reset = () => {
  formRef.value?.resetFields()
  form.value = { userId: undefined, followUserIds: [] }
  existingFollowIds.value = new Set()
}

/** 保存 */
const save = async () => {
  try {
    const errors = await formRef.value?.validate()
    if (errors) return false
    await saveFollow({
      userId: form.value.userId!,
      followUserIds: form.value.followUserIds,
    })
    Message.success('配置成功')
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

/**
 * 打开弹窗
 *
 * @param userOptions 用户选项列表
 * @author Wangsongsong
 * @date 2026-03-18
 */
const onOpen = (userOptions: LabelValueState[]) => {
  reset()
  allUserOptions.value = userOptions
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
