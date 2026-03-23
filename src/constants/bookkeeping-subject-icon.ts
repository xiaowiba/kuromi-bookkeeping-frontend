/**
 * 记账科目图标注册表
 *
 * @author Wangsongsong
 * @date 2026-03-23
 */
import type { Component } from 'vue'
import { markRaw } from 'vue'
import {
  IconApps,
  IconBook,
  IconCalendar,
  IconCompass,
  IconCustomerService,
  IconFire,
  IconGift,
  IconHeart,
  IconHome,
  IconLocation,
  IconMobile,
  IconMusic,
  IconPalette,
  IconStorage,
  IconTag,
  IconTool,
  IconUser,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'

export type SubjectIconRenderType = 'arco' | 'tdesign' | 'svg'

export interface SubjectIconRenderMeta {
  type: SubjectIconRenderType
  name: string
  component?: Component
}

export interface SubjectIconMeta {
  key: string
  label: string
  searchText: string
  web: SubjectIconRenderMeta
  mobile: SubjectIconRenderMeta
}

const createArcoIcon = (name: string, component: Component): SubjectIconRenderMeta => ({
  type: 'arco',
  name,
  component: markRaw(component),
})

const createSvgIcon = (name: string): SubjectIconRenderMeta => ({
  type: 'svg',
  name,
})

const createTdesignIcon = (name: string): SubjectIconRenderMeta => ({
  type: 'tdesign',
  name,
})

export const SUBJECT_ICON_DEFAULT_KEY = 'general'

export const SUBJECT_ICON_OPTIONS: SubjectIconMeta[] = [
  {
    key: 'general',
    label: '通用',
    searchText: '通用 apps app',
    web: createArcoIcon('IconApps', IconApps),
    mobile: createTdesignIcon('app'),
  },
  {
    key: 'food',
    label: '餐饮',
    searchText: '餐饮 吃饭 美食 food rice',
    web: createArcoIcon('IconFire', IconFire),
    mobile: createTdesignIcon('rice-ball'),
  },
  {
    key: 'shopping',
    label: '购物',
    searchText: '购物 商店 shopping cart',
    web: createArcoIcon('IconTag', IconTag),
    mobile: createTdesignIcon('cart'),
  },
  {
    key: 'travel',
    label: '出行',
    searchText: '出行 导航 旅行 travel compass',
    web: createArcoIcon('IconCompass', IconCompass),
    mobile: createTdesignIcon('compass-1'),
  },
  {
    key: 'study',
    label: '学习',
    searchText: '学习 读书 教育 study education',
    web: createArcoIcon('IconBook', IconBook),
    mobile: createTdesignIcon('education'),
  },
  {
    key: 'medical',
    label: '医疗',
    searchText: '医疗 健康 医院 medical hospital',
    web: createArcoIcon('IconHeart', IconHeart),
    mobile: createTdesignIcon('hospital'),
  },
  {
    key: 'home',
    label: '居家',
    searchText: '居家 家庭 home house',
    web: createArcoIcon('IconHome', IconHome),
    mobile: createTdesignIcon('home'),
  },
  {
    key: 'service',
    label: '服务',
    searchText: '服务 客服 service support',
    web: createArcoIcon('IconCustomerService', IconCustomerService),
    mobile: createTdesignIcon('service'),
  },
  {
    key: 'digital',
    label: '数码',
    searchText: '数码 手机 digital mobile',
    web: createArcoIcon('IconMobile', IconMobile),
    mobile: createTdesignIcon('mobile'),
  },
  {
    key: 'tool',
    label: '工具',
    searchText: '工具 维修 tool tools',
    web: createArcoIcon('IconTool', IconTool),
    mobile: createTdesignIcon('tools'),
  },
  {
    key: 'entertainment',
    label: '娱乐',
    searchText: '娱乐 音乐 影音 entertainment music',
    web: createArcoIcon('IconMusic', IconMusic),
    mobile: createTdesignIcon('music'),
  },
  {
    key: 'beauty',
    label: '美妆',
    searchText: '美妆 设计 颜色 beauty palette',
    web: createArcoIcon('IconPalette', IconPalette),
    mobile: createTdesignIcon('palette'),
  },
  {
    key: 'income',
    label: '收入',
    searchText: '收入 钱包 工资 income wallet money',
    web: createSvgIcon('profit-model-alt'),
    mobile: createTdesignIcon('wallet'),
  },
  {
    key: 'gift',
    label: '礼物',
    searchText: '礼物 礼金 gift present',
    web: createArcoIcon('IconGift', IconGift),
    mobile: createTdesignIcon('gift'),
  },
  {
    key: 'calendar',
    label: '日程',
    searchText: '日程 日期 calendar',
    web: createArcoIcon('IconCalendar', IconCalendar),
    mobile: createTdesignIcon('calendar'),
  },
  {
    key: 'location',
    label: '定位',
    searchText: '定位 地点 location',
    web: createArcoIcon('IconLocation', IconLocation),
    mobile: createTdesignIcon('location'),
  },
  {
    key: 'storage',
    label: '收纳',
    searchText: '收纳 仓储 storage folder',
    web: createArcoIcon('IconStorage', IconStorage),
    mobile: createTdesignIcon('folder-1'),
  },
  {
    key: 'personal',
    label: '个人',
    searchText: '个人 用户 personal user',
    web: createArcoIcon('IconUser', IconUser),
    mobile: createTdesignIcon('user'),
  },
  {
    key: 'family',
    label: '家庭',
    searchText: '家庭 家人 family usergroup',
    web: createArcoIcon('IconUserGroup', IconUserGroup),
    mobile: createTdesignIcon('usergroup'),
  },
  {
    key: 'project',
    label: '项目',
    searchText: '项目 工程 project layer',
    web: createSvgIcon('project'),
    mobile: createTdesignIcon('layers'),
  },
]

export const SUBJECT_ICON_MAP = SUBJECT_ICON_OPTIONS.reduce<Record<string, SubjectIconMeta>>((acc, item) => {
  acc[item.key] = item
  return acc
}, {})

export const getSubjectIconMeta = (key?: string) => {
  if (key && SUBJECT_ICON_MAP[key]) return SUBJECT_ICON_MAP[key]
  return SUBJECT_ICON_MAP[SUBJECT_ICON_DEFAULT_KEY]
}
