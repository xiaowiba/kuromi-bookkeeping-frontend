<template>
  <span :class="className"></span>
</template>

<script setup lang="ts">
import './dot.scss'

type TPropsType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

defineOptions({ name: 'GiDot' })

const props = withDefaults(defineProps<{
  animation?: boolean
  type?: TPropsType
}>(), {
  animation: true,
  type: 'primary',
})

const className = computed(() => [
  'gi-dot',
  { 'gi-dot-processing': props.animation },
  `gi-dot-${props.type}`,
])
</script>
