/**
 * 各业务模块的公共约定：接口端点、列、可执行动作名与页面既有文案。
 *
 * 收拢之后，页面只声明“用哪个模块 key”，其余都从这份配置生成；
 * 动作名仍按模块原样保留，成功/失败提示语由公共链路与后端结果生成。
 */
import { MODULES, type ModuleKey } from '@/api/modules'

export interface ModuleConfig {
  key: ModuleKey
  /** 与 MODULES 中的端点/名称一致，这里直接引用，避免两处各写一份。 */
  endpoint: (typeof MODULES)[ModuleKey]['endpoint']
  name: string
  columns: string[]
  /** 页面声明的动作名：按钮文案与提交给后端的动作名都取这里。 */
  actions: string[]
  /** 页面标题。 */
  title: string
  /** 页面说明。 */
  description: string
  /** 顶部「登记」按钮文案。 */
  createLabel: string
  /** 顶部「导出」按钮文案。 */
  exportLabel: string
  /** 空表格提示。 */
  emptyText: string
  /** 页脚记录量词，如「光伏阵列记录」。 */
  recordNoun: string
  /** 点登记按钮时的原文案（登记入口未接入）。 */
  createPendingMessage: string
  /** 列表读取失败的页面原文案。 */
  listLoadFailed: string
}

const rawConfigs: Array<Omit<ModuleConfig, 'endpoint' | 'name'>> = [
  {
    key: 'pv_array',
    columns: ['阵列编号', '所属片区', '组件型号', '单块功率', '串联片数', '总装机容量', '投运日期', '阵列状态'],
    actions: ['恢复全功率', '降功率运行', '申请停机'],
    title: '光伏阵列管理',
    description: '维护光伏阵列，围绕阵列编号、所属片区、组件型号、单块功率做登记、筛选与状态流转。',
    createLabel: '登记光伏阵列',
    exportLabel: '导出光伏阵列清单',
    emptyText: '暂无光伏阵列数据，可先登记光伏阵列',
    recordNoun: '光伏阵列记录',
    createPendingMessage: '光伏阵列登记入口尚未接入审批流',
    listLoadFailed: '光伏阵列列表读取失败',
  },
  {
    key: 'inverter',
    columns: ['逆变器编号', '品牌型号', '额定功率', '输入电压范围', '所属阵列', '运行温度', '日均发电量', '运行状态'],
    actions: ['恢复运行', '降容保护', '安排检修'],
    title: '逆变器监视管理',
    description: '维护逆变器，围绕逆变器编号、品牌型号、额定功率、输入电压范围做登记、筛选与状态流转。',
    createLabel: '登记逆变器',
    exportLabel: '导出逆变器监视清单',
    emptyText: '暂无逆变器监视数据，可先登记逆变器',
    recordNoun: '逆变器监视记录',
    createPendingMessage: '逆变器登记入口尚未接入审批流',
    listLoadFailed: '逆变器监视列表读取失败',
  },
  {
    key: 'combiner_box',
    columns: ['汇流箱编号', '所属阵列', '输入路数', '熔断器状态', '防雷模块状态', '通讯状态', '箱体温度', '运行状态'],
    actions: ['恢复正常', '标记异常', '停用设备'],
    title: '汇流箱检测管理',
    description: '维护汇流箱，围绕汇流箱编号、所属阵列、输入路数、熔断器状态做登记、筛选与状态流转。',
    createLabel: '登记汇流箱',
    exportLabel: '导出汇流箱检测清单',
    emptyText: '暂无汇流箱检测数据，可先登记汇流箱',
    recordNoun: '汇流箱检测记录',
    createPendingMessage: '汇流箱登记入口尚未接入审批流',
    listLoadFailed: '汇流箱检测列表读取失败',
  },
  {
    key: 'transformer',
    columns: ['变压器编号', '电压等级', '额定容量', '油温上限', '绕组温度', '油位状态', '瓦斯保护状态', '运行状态'],
    actions: ['恢复正常', '降负荷运行', '安排检修'],
    title: '变压器监视管理',
    description: '维护变压器，围绕变压器编号、电压等级、额定容量、油温上限做登记、筛选与状态流转。',
    createLabel: '登记变压器',
    exportLabel: '导出变压器监视清单',
    emptyText: '暂无变压器监视数据，可先登记变压器',
    recordNoun: '变压器监视记录',
    createPendingMessage: '变压器登记入口尚未接入审批流',
    listLoadFailed: '变压器监视列表读取失败',
  },
  {
    key: 'energy_storage',
    columns: ['电池组编号', '电池类型', '额定容量', 'SOC上限', '充放电循环', '电池温度', '内阻变化率', '运行状态'],
    actions: ['启动充电', '启动放电', '切换到待机'],
    title: '储能电池组管理',
    description: '维护储能电池组，围绕电池组编号、电池类型、额定容量、SOC上限做登记、筛选与状态流转。',
    createLabel: '登记储能电池组',
    exportLabel: '导出储能电池组清单',
    emptyText: '暂无储能电池组数据，可先登记储能电池组',
    recordNoun: '储能电池组记录',
    createPendingMessage: '储能电池组登记入口尚未接入审批流',
    listLoadFailed: '储能电池组列表读取失败',
  },
  {
    key: 'boosting_station',
    columns: ['升压站编号', '进线电压', '出线电压', '主变容量', '母线状态', '断路器状态', '无功补偿', '运行状态'],
    actions: ['恢复正常', '检查保护', '安排检修'],
    title: '升压站监视管理',
    description: '维护升压站，围绕升压站编号、进线电压、出线电压、主变容量做登记、筛选与状态流转。',
    createLabel: '登记升压站',
    exportLabel: '导出升压站监视清单',
    emptyText: '暂无升压站监视数据，可先登记升压站',
    recordNoun: '升压站监视记录',
    createPendingMessage: '升压站登记入口尚未接入审批流',
    listLoadFailed: '升压站监视列表读取失败',
  },
  {
    key: 'meter',
    columns: ['表计编号', '计量点名称', '表计精度', '正向有功电量', '反向有功电量', '上月示数', '本月示数', '通讯状态'],
    actions: ['确认正常', '标记异常', '停用表计'],
    title: '关口计量管理',
    description: '维护关口表计，围绕表计编号、计量点名称、表计精度、正向有功电量做登记、筛选与状态流转。',
    createLabel: '登记关口表计',
    exportLabel: '导出关口计量清单',
    emptyText: '暂无关口计量数据，可先登记关口表计',
    recordNoun: '关口计量记录',
    createPendingMessage: '关口表计登记入口尚未接入审批流',
    listLoadFailed: '关口计量列表读取失败',
  },
  {
    key: 'environment',
    columns: ['站点编号', '安装位置', '辐照度', '环境温度', '风速', '风向', '积灰比', '通讯状态'],
    actions: ['恢复正常', '标记异常', '停用站点'],
    title: '环境监测站管理',
    description: '维护环境监测站，围绕站点编号、安装位置、辐照度、环境温度做登记、筛选与状态流转。',
    createLabel: '登记环境监测站',
    exportLabel: '导出环境监测站清单',
    emptyText: '暂无环境监测站数据，可先登记环境监测站',
    recordNoun: '环境监测站记录',
    createPendingMessage: '环境监测站登记入口尚未接入审批流',
    listLoadFailed: '环境监测站列表读取失败',
  },
  {
    key: 'cleaning',
    columns: ['任务编号', '清洗区域', '清洗方式', '计划日期', '作业人员', '用水吨数', '清洗后PR值', '清洗状态'],
    actions: ['排期确认', '开始作业', '验收完成'],
    title: '组件清洗管理',
    description: '维护清洗任务，围绕任务编号、清洗区域、清洗方式、计划日期做登记、筛选与状态流转。',
    createLabel: '登记清洗任务',
    exportLabel: '导出组件清洗清单',
    emptyText: '暂无组件清洗数据，可先登记清洗任务',
    recordNoun: '组件清洗记录',
    createPendingMessage: '清洗任务登记入口尚未接入审批流',
    listLoadFailed: '组件清洗列表读取失败',
  },
  {
    key: 'patrol',
    columns: ['记录编号', '巡视区域', '巡视日期', '巡视人员', '发现缺陷数', '红外测温结果', '接线端子温度', '巡视状态'],
    actions: ['开始巡视', '提交记录', '归档记录'],
    title: '巡视检查管理',
    description: '维护巡视记录，围绕记录编号、巡视区域、巡视日期、巡视人员做登记、筛选与状态流转。',
    createLabel: '登记巡视记录',
    exportLabel: '导出巡视检查清单',
    emptyText: '暂无巡视检查数据，可先登记巡视记录',
    recordNoun: '巡视检查记录',
    createPendingMessage: '巡视记录登记入口尚未接入审批流',
    listLoadFailed: '巡视检查列表读取失败',
  },
  {
    key: 'defect',
    columns: ['缺陷编号', '发现日期', '缺陷设备', '缺陷类别', '严重等级', '处理方案', '整改时限', '缺陷状态'],
    actions: ['分派处理', '提交验收', '关闭缺陷'],
    title: '缺陷管理管理',
    description: '维护设备缺陷，围绕缺陷编号、发现日期、缺陷设备、缺陷类别做登记、筛选与状态流转。',
    createLabel: '登记设备缺陷',
    exportLabel: '导出缺陷管理清单',
    emptyText: '暂无缺陷管理数据，可先登记设备缺陷',
    recordNoun: '缺陷管理记录',
    createPendingMessage: '设备缺陷登记入口尚未接入审批流',
    listLoadFailed: '缺陷管理列表读取失败',
  },
  {
    key: 'maintenance',
    columns: ['计划编号', '检修设备', '检修类别', '计划开始', '计划结束', '责任人', '安全措施', '计划状态'],
    actions: ['提交审批', '开始执行', '确认完工'],
    title: '检修计划管理',
    description: '维护检修计划，围绕计划编号、检修设备、检修类别、计划开始做登记、筛选与状态流转。',
    createLabel: '登记检修计划',
    exportLabel: '导出检修计划清单',
    emptyText: '暂无检修计划数据，可先登记检修计划',
    recordNoun: '检修计划记录',
    createPendingMessage: '检修计划登记入口尚未接入审批流',
    listLoadFailed: '检修计划列表读取失败',
  },
  {
    key: 'spare_parts',
    columns: ['备件编号', '备件名称', '规格型号', '适用设备', '安全存量', '当前存量', '存放位置', '备件状态'],
    actions: ['入库登记', '领用出库', '标记废弃'],
    title: '备品备件管理',
    description: '维护备件物料，围绕备件编号、备件名称、规格型号、适用设备做登记、筛选与状态流转。',
    createLabel: '登记备件物料',
    exportLabel: '导出备品备件清单',
    emptyText: '暂无备品备件数据，可先登记备件物料',
    recordNoun: '备品备件记录',
    createPendingMessage: '备件物料登记入口尚未接入审批流',
    listLoadFailed: '备品备件列表读取失败',
  },
  {
    key: 'alarm',
    columns: ['告警编号', '告警来源', '告警类型', '触发时间', '告警阈值', '当前值', '确认人', '告警状态'],
    actions: ['确认告警', '开始处理', '消除告警'],
    title: '告警事件管理',
    description: '维护告警事件，围绕告警编号、告警来源、告警类型、触发时间做登记、筛选与状态流转。',
    createLabel: '登记告警事件',
    exportLabel: '导出告警事件清单',
    emptyText: '暂无告警事件数据，可先登记告警事件',
    recordNoun: '告警事件记录',
    createPendingMessage: '告警事件登记入口尚未接入审批流',
    listLoadFailed: '告警事件列表读取失败',
  },
  {
    key: 'dispatch',
    columns: ['指令编号', '下发单位', '指令类型', '下发时间', '执行时限', '执行人', '执行结果', '指令状态'],
    actions: ['确认执行', '完成回复', '驳回指令'],
    title: '调度指令管理',
    description: '维护调度指令单，围绕指令编号、下发单位、指令类型、下发时间做登记、筛选与状态流转。',
    createLabel: '登记调度指令单',
    exportLabel: '导出调度指令清单',
    emptyText: '暂无调度指令数据，可先登记调度指令单',
    recordNoun: '调度指令记录',
    createPendingMessage: '调度指令单登记入口尚未接入审批流',
    listLoadFailed: '调度指令列表读取失败',
  },
  {
    key: 'safety',
    columns: ['措施编号', '措施类型', '涉及设备', '签发人', '执行人', '监护人', '有效期至', '措施状态'],
    actions: ['签发措施', '开始执行', '解除措施'],
    title: '安全措施管理',
    description: '维护安全措施票，围绕措施编号、措施类型、涉及设备、签发人做登记、筛选与状态流转。',
    createLabel: '登记安全措施票',
    exportLabel: '导出安全措施清单',
    emptyText: '暂无安全措施数据，可先登记安全措施票',
    recordNoun: '安全措施记录',
    createPendingMessage: '安全措施票登记入口尚未接入审批流',
    listLoadFailed: '安全措施列表读取失败',
  },
  {
    key: 'contract',
    columns: ['合同编号', '合同名称', '签约甲方', '签约乙方', '合同金额', '起止日期', '续签条款', '合同状态'],
    actions: ['确认签订', '开始履行', '终止合同'],
    title: '运维合同管理',
    description: '维护运维合同，围绕合同编号、合同名称、签约甲方、签约乙方做登记、筛选与状态流转。',
    createLabel: '登记运维合同',
    exportLabel: '导出运维合同清单',
    emptyText: '暂无运维合同数据，可先登记运维合同',
    recordNoun: '运维合同记录',
    createPendingMessage: '运维合同登记入口尚未接入审批流',
    listLoadFailed: '运维合同列表读取失败',
  },
  {
    key: 'report',
    columns: ['月报编号', '统计月份', '发电量', '等效利用小时', '综合效率PR', '设备可利用率', '故障停机时间', '月报状态'],
    actions: ['填写月报', '提交审核', '发布月报'],
    title: '运行月报管理',
    description: '维护运行月报，围绕月报编号、统计月份、发电量、等效利用小时做登记、筛选与状态流转。',
    createLabel: '登记运行月报',
    exportLabel: '导出运行月报清单',
    emptyText: '暂无运行月报数据，可先登记运行月报',
    recordNoun: '运行月报记录',
    createPendingMessage: '运行月报登记入口尚未接入审批流',
    listLoadFailed: '运行月报列表读取失败',
  },
]

export const MODULE_CONFIGS: Record<ModuleKey, ModuleConfig> = Object.fromEntries(
  rawConfigs.map((raw) => {
    const base = MODULES[raw.key]
    const config: ModuleConfig = {
      ...raw,
      endpoint: base.endpoint,
      name: base.name,
    }
    return [raw.key, config]
  }),
) as Record<ModuleKey, ModuleConfig>

export const MODULE_LIST: ModuleConfig[] = rawConfigs.map((raw) => MODULE_CONFIGS[raw.key])

export function moduleConfig(key: string): ModuleConfig | null {
  return MODULE_CONFIGS[key as ModuleKey] ?? null
}
