<template>
  <VCharts
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
import worldMap from './world.json'
import chinaMap from './china.json'

defineProps({
  option: {
    type: Object,
    default() {
      return {}
    },
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

registerMap('world', worldMap)
registerMap('china', chinaMap)

const chart = ref(null)
defineExpose({
  chart,
})
</script>

<style scoped lang="less"></style>
