/**
 * 模块公共约定：各页面只声明自己的动作名，端点、名称与文案兜底都从这里取。
 */

export interface ModuleMeta {
  /** 接口前缀，同时作为后端模块标识，如 /api/pv_array。 */
  endpoint: `/${string}`
  /** 模块中文名，用于公共兜底提示。 */
  name: string
}

/** 键与路由、后端模块名保持一致；页面与详情按 key 反查本约定。 */
export const MODULES = {
  pv_array: { endpoint: '/api/pv_array', name: '光伏阵列' },
  inverter: { endpoint: '/api/inverter', name: '逆变器监视' },
  combiner_box: { endpoint: '/api/combiner_box', name: '汇流箱检测' },
  transformer: { endpoint: '/api/transformer', name: '变压器监视' },
  energy_storage: { endpoint: '/api/energy_storage', name: '储能电池组' },
  boosting_station: { endpoint: '/api/boosting_station', name: '升压站监视' },
  meter: { endpoint: '/api/meter', name: '关口计量' },
  environment: { endpoint: '/api/environment', name: '环境监测站' },
  cleaning: { endpoint: '/api/cleaning', name: '组件清洗' },
  patrol: { endpoint: '/api/patrol', name: '巡视检查' },
  defect: { endpoint: '/api/defect', name: '缺陷管理' },
  maintenance: { endpoint: '/api/maintenance', name: '检修计划' },
  spare_parts: { endpoint: '/api/spare_parts', name: '备品备件' },
  alarm: { endpoint: '/api/alarm', name: '告警事件' },
  dispatch: { endpoint: '/api/dispatch', name: '调度指令' },
  safety: { endpoint: '/api/safety', name: '安全措施' },
  contract: { endpoint: '/api/contract', name: '运维合同' },
  report: { endpoint: '/api/report', name: '运行月报' },
} as const satisfies Record<string, ModuleMeta>

export type ModuleKey = keyof typeof MODULES

export function moduleMeta(key: string): ModuleMeta {
  const meta = (MODULES as Record<string, ModuleMeta>)[key]
  if (!meta) {
    throw new Error(`未知业务模块：${key}`)
  }
  return meta
}

export function isModuleKey(key: string): key is ModuleKey {
  return key in MODULES
}
