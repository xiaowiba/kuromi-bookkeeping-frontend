import { createApp } from 'vue'
import ArcoVue, { Card, Drawer, Modal } from '@arco-design/web-vue'
import TDesign from 'tdesign-mobile-vue'
import '@/styles/arco-ui/index.less'
import 'tdesign-mobile-vue/es/style/index.css'
// import '@arco-themes/vue-gi-demo/index.less'
// import '@arco-design/web-vue/dist/arco.css'

// 额外引入 Arco Design Icon图标库
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import App from './App.vue'
import router from './router'
import { syncMobileRemByPath } from '@/utils/mobile-rem'

// 使用动画库

// 自定义过渡动画
import '@/styles/css/transition.css'

// 导入全局scss主文件
import '@/styles/index.scss'
import '@/styles/mobile.scss'

// 支持SVG
import 'virtual:svg-icons-register'

// 自定义指令
import directives from './directives'

// 状态管理
import pinia from '@/stores'

// 对特定组件进行默认配置
Card.props.bordered = false

syncMobileRemByPath(window.location.pathname)

const app = createApp(App)
Modal._context = app._context
Drawer._context = app._context

app.use(router)
router.afterEach((to) => {
  syncMobileRemByPath(to.path)
})
app.use(pinia)
app.use(ArcoVue)
app.use(TDesign)
app.use(ArcoVueIcon)
app.use(directives)

app.mount('#app')
