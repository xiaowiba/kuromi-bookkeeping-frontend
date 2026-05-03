<template>
  <span :class="className" :style="calcStyle" @click="handleClick">
    <slot />
    <span v-if="closable" class="gi-tag-close-btn" @click.stop="handleClose">
      <icon-close class="close-icon" />
    </span>
  </span>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import './tag.scss'

type PropsType = 'dark' | 'light' | 'outline' | 'light-outline'
type PropsStatus = 'primary' | 'success' | 'warning' | 'danger' | 'info'
type PropsSize = 'mini' | 'small' | 'large'

const baseColorObj = {
  red: '#FF0000 ',
  orangered: '#f77234',
  orange: '#ff7d00',
  gold: '#f7ba1e',
  lime: '#9fdb1d',
  green: '#00b42a',
  cyan: '#14c9c9',
  blue: '#3491fa',
  purple: '#722ed1',
  pink: '#f5319d',
  gray: '#86909c',
}

type BaseColor = keyof typeof baseColorObj

defineOptions({ name: 'GiTag' })

const props = withDefaults(defineProps<{
  type?: PropsType
  status?: PropsStatus
  color?: BaseColor | string
  size?: PropsSize
  closable?: boolean
}>(), {
  type: 'light',
  status: 'primary',
  color: '',
  size: 'small',
  closable: false,
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'close'): void
}>()

const className = computed(() => {
  const arr = ['gi-tag']
  if (props.type) {
    arr.push(`gi-tag__type--${props.type}`)
  }
  if (props.size) {
    arr.push(`gi-tag__size--${props.size}`)
  }
  if (props.status) {
    arr.push(`gi-tag__status--${props.status}`)
  }
  return arr
})

function hexToRgb(hex: string) {
  if (hex.includes('#')) {
    hex = hex.slice(1)
  }
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return { r, g, b }
}

const calcStyle = computed(() => {
  const obj: CSSProperties = {}
  if (props.color) {
    const color = baseColorObj[props.color as BaseColor] || props.color
    const { r, g, b } = hexToRgb(color)
    if (props.type === 'light') {
      obj.color = color
      obj.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`
      obj['--tag-close-hover-bg-color'] = color
    }
    if (props.type === 'dark') {
      obj.color = '#fff'
      obj.backgroundColor = color
      obj['--tag-close-hover-color'] = color
      obj['--tag-close-hover-bg-color'] = 'rgba(255, 255, 255, 0.9)'
    }
    if (props.type === 'outline') {
      obj.color = color
      obj.backgroundColor = 'transparent'
      obj.borderColor = color
      obj['--tag-close-hover-bg-color'] = color
    }
    if (props.type === 'light-outline') {
      obj.color = color
      obj.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`
      obj.borderColor = `rgba(${r}, ${g}, ${b}, 0.2)`
      obj['--tag-close-hover-bg-color'] = color
    }
  }
  return obj
})

const closable = computed(() => props.closable)

const handleClick = () => {
  emit('click')
}

const handleClose = () => {
  emit('close')
}
</script>
