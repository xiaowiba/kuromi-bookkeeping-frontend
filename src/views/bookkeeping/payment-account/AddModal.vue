<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item label="账号名称" field="name">
        <a-input v-model="form.name" placeholder="请输入账号名称" :max-length="64" allow-clear />
      </a-form-item>
      <a-form-item label="排序" field="sort">
        <a-input-number v-model="form.sort" placeholder="请输入排序号" :min="0" :precision="0" />
      </a-form-item>
      <a-form-item label="状态" field="status">
        <a-radio-group v-model="form.status" :options="DisEnableStatusList" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 支付账号新增/编辑弹窗
 *
 * @author Wangsongsong
 * @date 2026-04-21
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { ref } from 'vue'
import { addPaymentAccount, getPaymentAccount, updatePaymentAccount } from '@/apis/bookkeeping/payment-account'
import { DisEnableStatusList } from '@/constant/common'

const emit = defineEmits<{ (e: 'save-success'): void }>()

const { width } = useWindowSize()
const visible = ref(false)
const formRef = ref()
const editId = ref('')
const title = ref('新增支付账号')

const form = ref({
  name: '',
  sort: 0,
  status: 1,
})

const rules = {
  name: [{ required: true, message: '请输入账号名称' }],
}

const reset = () => {
  formRef.value?.resetFields()
  form.value = { name: '', sort: 0, status: 1 }
  editId.value = ''
}

const save = async () => {
  try {
    const errors = await formRef.value?.validate()
    if (errors) return false
    if (editId.value) {
      await updatePaymentAccount(form.value, editId.value)
      Message.success('修改成功')
    } else {
      await addPaymentAccount(form.value)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch {
    return false
  }
}

const onAdd = () => {
  reset()
  title.value = '新增支付账号'
  visible.value = true
}

const onUpdate = async (id: string) => {
  reset()
  title.value = '编辑支付账号'
  editId.value = id
  try {
    const { data } = await getPaymentAccount(id)
    form.value = { name: data.name, sort: data.sort ?? 0, status: data.status }
  } catch {
    Message.error('获取支付账号详情失败')
  }
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>
