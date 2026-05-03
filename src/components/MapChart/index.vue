<template>
  <VCharts
    v-if="ready"
    ref="chart"
    :option="option"
    :autoresize="autoResize"
    :update-options="updateOptions"
    :style="{ width, height }"
  />
</template>

<script setup lang="ts">
import {
  DatasetComponent,
  GeoComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import {
  BarChart,
  LineChart,
  MapChart,
  PieChart,
} from 'echarts/charts'
import { use, registerMap } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VCharts from 'vue-echarts'

defineProps({
  option: {
    type: Object,
    default() {
      return {}
    },
  },
  mapName: {
    type: String,
    default: 'china',
  },
  autoResize: {
    type: Boolean,
    default: true,
  },
  updateOptions: {
    type: Object,
    default: undefined,
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '100%',
  },
})

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  GraphicComponent,
  VisualMapComponent,
  GeoComponent,
  DatasetComponent,
])

const loadedMaps = new Set<string>()
const ready = ref(false)

const loadMap = async (mapName: string) => {
  if (loadedMaps.has(mapName)) {
    return
  }

  if (mapName === 'china') {
    const chinaMap = await import('../Chart/china.json')
    registerMap('china', chinaMap.default)
    loadedMaps.add('china')
  }
}

onMounted(async () => {
  ready.value = false
  await loadMap('china')
  ready.value = true
})

const chart = ref(null)
defineExpose({
  chart,
})
</script>

<style scoped lang="less"></style>
