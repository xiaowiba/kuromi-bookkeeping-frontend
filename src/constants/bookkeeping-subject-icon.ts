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

const createSharedSvgIcon = (name: string) => ({
  web: createSvgIcon(name),
  mobile: createSvgIcon(name),
})

export const SUBJECT_ICON_DEFAULT_KEY = 'general'

export const SUBJECT_ICON_OPTIONS: SubjectIconMeta[] = [
  {
    key: 'general',
    label: '通用',
    searchText: '通用 默认 其他 apps app',
    web: createArcoIcon('IconApps', IconApps),
    mobile: createTdesignIcon('app'),
  },
  {
    key: 'food',
    label: '餐饮',
    searchText: '餐饮 吃饭 美食 早餐 早饭 午饭 午餐 晚饭 晚餐 food rice',
    web: createArcoIcon('IconFire', IconFire),
    mobile: createTdesignIcon('rice-ball'),
  },
  {
    key: 'shopping',
    label: '购物',
    searchText: '购物 商店 商城 网购 购物车 shopping cart',
    web: createArcoIcon('IconTag', IconTag),
    mobile: createTdesignIcon('cart'),
  },
  {
    key: 'travel',
    label: '出行',
    searchText: '出行 导航 旅行 交通 公交 地铁 打车 travel compass',
    web: createArcoIcon('IconCompass', IconCompass),
    mobile: createTdesignIcon('compass-1'),
  },
  {
    key: 'study',
    label: '学习',
    searchText: '学习 读书 教育 课程 培训 study education',
    web: createArcoIcon('IconBook', IconBook),
    mobile: createTdesignIcon('education'),
  },
  {
    key: 'medical',
    label: '医疗',
    searchText: '医疗 健康 医院 药品 门诊 medical hospital',
    web: createArcoIcon('IconHeart', IconHeart),
    mobile: createTdesignIcon('hospital'),
  },
  {
    key: 'home',
    label: '居家',
    searchText: '居家 家庭 家居 物业 房屋 home house',
    web: createArcoIcon('IconHome', IconHome),
    mobile: createTdesignIcon('home'),
  },
  {
    key: 'service',
    label: '服务',
    searchText: '服务 客服 生活服务 缴费 service support',
    web: createArcoIcon('IconCustomerService', IconCustomerService),
    mobile: createTdesignIcon('service'),
  },
  {
    key: 'digital',
    label: '数码',
    searchText: '数码 手机 电子 设备 digital mobile',
    web: createArcoIcon('IconMobile', IconMobile),
    mobile: createTdesignIcon('mobile'),
  },
  {
    key: 'tool',
    label: '工具',
    searchText: '工具 维修 修车 维护 tool tools',
    web: createArcoIcon('IconTool', IconTool),
    mobile: createTdesignIcon('tools'),
  },
  {
    key: 'entertainment',
    label: '娱乐',
    searchText: '娱乐 音乐 影音 游戏 entertainment music',
    web: createArcoIcon('IconMusic', IconMusic),
    mobile: createTdesignIcon('music'),
  },
  {
    key: 'beauty',
    label: '美妆',
    searchText: '美妆 服饰 穿搭 衣服 设计 颜色 beauty palette',
    web: createArcoIcon('IconPalette', IconPalette),
    mobile: createTdesignIcon('palette'),
  },
  {
    key: 'income',
    label: '收入',
    searchText: '收入 钱包 工资 奖金 兼职 薅羊毛 收款 income wallet money',
    web: createSvgIcon('profit-model-alt'),
    mobile: createTdesignIcon('wallet'),
  },
  {
    key: 'gift',
    label: '礼物',
    searchText: '礼物 礼金 红包 随礼 gift present',
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
    searchText: '定位 地点 快递 配送 location',
    web: createArcoIcon('IconLocation', IconLocation),
    mobile: createTdesignIcon('location'),
  },
  {
    key: 'storage',
    label: '收纳',
    searchText: '收纳 仓储 文件 storage folder',
    web: createArcoIcon('IconStorage', IconStorage),
    mobile: createTdesignIcon('folder-1'),
  },
  {
    key: 'personal',
    label: '个人',
    searchText: '个人 用户 转老公 转老婆 转账 personal user',
    web: createArcoIcon('IconUser', IconUser),
    mobile: createTdesignIcon('user'),
  },
  {
    key: 'family',
    label: '家庭',
    searchText: '家庭 家人 亲友 family usergroup',
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
  {
    key: 'refund',
    label: '退款',
    searchText: '退款 售后 回款 退回 refund return',
    ...createSharedSvgIcon('refresh'),
  },
  {
    key: 'secondhand',
    label: '二手',
    searchText: '二手 咸鱼 闲置 转卖 secondhand used swap',
    ...createSharedSvgIcon('swap'),
  },
  {
    key: 'wechat',
    label: '微信',
    searchText: '微信 微信支付 wechat wx',
    ...createSharedSvgIcon('wechat'),
  },
  {
    key: 'alipay',
    label: '支付宝',
    searchText: '支付宝 alipay zfb',
    ...createSharedSvgIcon('bookkeeping-subject-alipay'),
  },
  {
    key: 'bank',
    label: '银行',
    searchText: '银行 银行卡 对公 存款 bank card',
    ...createSharedSvgIcon('bookkeeping-subject-bank'),
  },
  {
    key: 'jd',
    label: '京东',
    searchText: '京东 jd jingdong',
    ...createSharedSvgIcon('bookkeeping-subject-jd'),
  },
  {
    key: 'taobao',
    label: '淘宝',
    searchText: '淘宝 taobao tb',
    ...createSharedSvgIcon('bookkeeping-subject-taobao'),
  },
  {
    key: 'pinduoduo',
    label: '拼多多',
    searchText: '拼多多 pinduoduo pdd',
    ...createSharedSvgIcon('bookkeeping-subject-pinduoduo'),
  },
  {
    key: 'douyin',
    label: '抖音',
    searchText: '抖音 douyin tiktok',
    ...createSharedSvgIcon('bookkeeping-subject-douyin'),
  },
  {
    key: 'fuel',
    label: '加油',
    searchText: '加油 油费 fuel gas station',
    ...createSharedSvgIcon('bookkeeping-subject-fuel'),
  },
  {
    key: 'electricity',
    label: '电费',
    searchText: '电费 用电 电力 electricity power',
    ...createSharedSvgIcon('thunderbolt'),
  },
  {
    key: 'water',
    label: '水费',
    searchText: '水费 用水 自来水 water',
    ...createSharedSvgIcon('bookkeeping-subject-water'),
  },
  {
    key: 'gas',
    label: '燃气',
    searchText: '燃气费 天然气 gas fire',
    ...createSharedSvgIcon('fire'),
  },
  {
    key: 'phone-bill',
    label: '话费',
    searchText: '话费 通讯费 手机费 电话费 phone mobile',
    ...createSharedSvgIcon('mobile'),
  },
  {
    key: 'ai',
    label: 'AI',
    searchText: 'AI 人工智能 模型 订阅 robot',
    ...createSharedSvgIcon('robot'),
  },
  {
    key: 'server',
    label: '服务器',
    searchText: '服务器 主机 云服务 域名 server desktop',
    ...createSharedSvgIcon('desktop'),
  },
  {
    key: 'transfer-public',
    label: '公户',
    searchText: '公户 对公 家庭公户 公共账户 public transfer',
    ...createSharedSvgIcon('public'),
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
