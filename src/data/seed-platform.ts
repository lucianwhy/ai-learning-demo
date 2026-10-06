import { addDays, at, todayISO } from "@/engine/date"
import { makeLedger } from "@/engine/inventory"
import { DEMO_STUDENT_ID } from "./seed-learning"
import type {
  AIProvider, AIRequestLog, AsyncJob, AuditLog, ContentItem, Entitlement, FeatureFlag, InventoryLedger, Organization, Package, PackageType, Principal, StudentAccount, SubjectStageStrategy,
} from "./types"

export const PACKAGES: Package[] = [
  { id: "month", name: "月卡", days: 30, subjects: ["math", "physics", "chemistry"], functions: ["诊断", "30天计划", "今日学习", "AI讲题", "错题本", "报告"], effectiveRule: "立即生效", quota: "AI讲题 300 次/月", status: "启用", version: "pkg@v1.1" },
  { id: "quarter", name: "季卡", days: 90, subjects: ["math", "physics", "chemistry"], functions: ["诊断", "30天计划", "今日学习", "AI讲题", "错题本", "报告", "纸质学案", "拍照批改"], effectiveRule: "立即生效", quota: "AI讲题 1000 次/季", status: "启用", version: "pkg@v1.1" },
  { id: "year", name: "年卡", days: 365, subjects: ["math", "physics", "chemistry"], functions: ["诊断", "30天计划", "今日学习", "AI讲题", "错题本", "报告", "纸质学案", "拍照批改", "阶段诊断"], effectiveRule: "首次使用生效", quota: "AI讲题 不限（公平使用）", status: "启用", version: "pkg@v1.2" },
]

export function buildPlatformSeed() {
  const today = todayISO()
  const ago = (d: number, hh = 10, mm = 0) => at(addDays(today, -d), hh, mm)

  const orgs: Organization[] = [
    { id: "org-xh", name: "星海教育 · 滨江校区", code: "XH-HZ-001", city: "杭州", status: "启用", principalId: "pr-chen", subjects: ["math", "physics", "chemistry"], stages: ["初中", "高中"], packages: ["month", "quarter", "year"], studentQuota: 500, servicePeriod: `${addDays(today, -160)} ~ ${addDays(today, 205)}`, createdAt: ago(160) },
    { id: "org-qm", name: "启明学堂 · 南山校区", code: "QM-SZ-002", city: "深圳", status: "启用", principalId: "pr-liu", subjects: ["math"], stages: ["小学", "初中"], packages: ["month", "quarter"], studentQuota: 200, servicePeriod: `${addDays(today, -90)} ~ ${addDays(today, 275)}`, createdAt: ago(90), remark: "仅采购数学" },
    { id: "org-by", name: "博雅培优 · 天河校区", code: "BY-GZ-003", city: "广州", status: "启用", principalId: "pr-zhou", subjects: ["math", "physics", "chemistry"], stages: ["初中"], packages: ["month", "quarter", "year"], studentQuota: 300, servicePeriod: `${addDays(today, -45)} ~ ${addDays(today, 320)}`, createdAt: ago(45) },
    { id: "org-zx", name: "知行教育 · 武侯校区", code: "ZX-CD-004", city: "成都", status: "停用", principalId: "pr-wu", subjects: ["math", "physics"], stages: ["初中"], packages: ["month"], studentQuota: 100, servicePeriod: `${addDays(today, -200)} ~ ${addDays(today, -5)}`, createdAt: ago(200), remark: "服务期到期停用，历史数据只读保留" },
  ]
  const principals: Principal[] = [
    { id: "pr-chen", name: "陈立群", account: "chen.lq@xh", phone: "138****2051", orgId: "org-xh", status: "启用", createdAt: ago(160) },
    { id: "pr-liu", name: "刘晓峰", account: "liu.xf@qm", phone: "139****7710", orgId: "org-qm", status: "启用", createdAt: ago(90) },
    { id: "pr-zhou", name: "周敏", account: "zhou.m@by", phone: "137****3306", orgId: "org-by", status: "启用", createdAt: ago(45) },
    { id: "pr-wu", name: "吴涛", account: "wu.t@zx", phone: "136****9024", orgId: "org-zx", status: "停用", createdAt: ago(200) },
  ]
  const S = (id: string, orgId: string, name: string, grade: string, stage: StudentAccount["stage"], mastery: number, completion: number, weak: number, risk: boolean, verifyRate: number, lastActive: number, status: StudentAccount["status"] = "启用"): StudentAccount => ({
    id, orgId, name, account: `${orgId.slice(4)}${id.slice(4)}`, grade, stage, status, createdAt: ago(100), seedStats: { mastery, completion, weak, risk, verifyRate, lastActive: ago(lastActive, 20) },
  })
  const students: StudentAccount[] = [
    { id: DEMO_STUDENT_ID, orgId: "org-xh", name: "林小舟", account: "xh2025031", grade: "初三", stage: "初中", status: "启用", createdAt: ago(152) },
    S("stu-smy", "org-xh", "苏沐阳", "初三", "初中", 72, 88, 3, false, 81, 0),
    S("stu-hjy", "org-xh", "何嘉怡", "初二", "初中", 64, 76, 5, false, 70, 1),
    S("stu-zzm", "org-xh", "周子墨", "初三", "初中", 58, 61, 7, true, 52, 2),
    S("stu-csy", "org-xh", "陈思远", "高一", "高中", 81, 93, 2, false, 88, 0),
    S("stu-wyn", "org-xh", "王一诺", "初三", "初中", 49, 55, 9, true, 41, 1),
    S("stu-zkx", "org-xh", "赵可欣", "初二", "初中", 69, 80, 4, false, 77, 0),
    S("stu-lhr", "org-xh", "李浩然", "初三", "初中", 54, 47, 8, true, 46, 3),
    S("stu-xyt", "org-xh", "许以棠", "初二", "初中", 0, 0, 0, false, 0, 30, "停用"),
    S("stu-qm1", "org-qm", "黄子轩", "五年级", "小学", 77, 90, 2, false, 85, 0),
    S("stu-qm2", "org-qm", "吴雨桐", "初一", "初中", 62, 71, 5, false, 66, 1),
    S("stu-by1", "org-by", "郑博文", "初三", "初中", 70, 84, 3, false, 79, 0),
    S("stu-by2", "org-by", "林诗涵", "初二", "初中", 57, 63, 6, true, 50, 2),
  ]

  const ledger: InventoryLedger[] = []
  const push = (e: Omit<InventoryLedger, "before" | "after" | "transactionId">) => ledger.push(makeLedger(ledger, e))
  const k = (s: string) => `idem-${s}`
  // 星海
  push({ orgId: "org-xh", packageType: "month", op: "总部拨付", change: 200, operator: "总部·运营 赵敏", occurredAt: ago(158, 10), allocationId: "AL-XH-0001", reason: "签约首批拨付", idempotencyKey: k("xh-a1") })
  push({ orgId: "org-xh", packageType: "quarter", op: "总部拨付", change: 80, operator: "总部·运营 赵敏", occurredAt: ago(158, 10, 5), allocationId: "AL-XH-0002", reason: "签约首批拨付", idempotencyKey: k("xh-a2") })
  push({ orgId: "org-xh", packageType: "year", op: "总部拨付", change: 40, operator: "总部·运营 赵敏", occurredAt: ago(158, 10, 8), allocationId: "AL-XH-0003", reason: "签约首批拨付", idempotencyKey: k("xh-a3") })
  push({ orgId: "org-xh", packageType: "month", op: "分配给学生", change: -118, operator: "校长 陈立群", occurredAt: ago(150, 15), allocationId: "AL-XH-0001", reason: "批量导入学生并分配（批次 BT-0412，逐条明细见权益台账）", idempotencyKey: k("xh-b1") })
  push({ orgId: "org-xh", packageType: "quarter", op: "分配给学生", change: -44, operator: "校长 陈立群", occurredAt: ago(150, 15, 10), allocationId: "AL-XH-0002", reason: "批量分配（批次 BT-0413）", idempotencyKey: k("xh-b2") })
  push({ orgId: "org-xh", packageType: "year", op: "分配给学生", change: -38, operator: "校长 陈立群", occurredAt: ago(150, 15, 20), allocationId: "AL-XH-0003", reason: "批量分配（批次 BT-0414）", idempotencyKey: k("xh-b3") })
  push({ orgId: "org-xh", packageType: "month", op: "冻结", change: -10, operator: "总部·财务 孙悦", occurredAt: ago(60, 11), allocationId: "AL-XH-0001", reason: "补充协议待签署，冻结未分配库存 10 张", idempotencyKey: k("xh-f1") })
  push({ orgId: "org-xh", packageType: "month", op: "总部追加", change: 50, operator: "总部·运营 赵敏", occurredAt: ago(20, 9), allocationId: "AL-XH-0007", reason: "秋季班追加", idempotencyKey: k("xh-a4") })
  const ent: Entitlement[] = []
  const assign = (sid: string, pkg: PackageType, daysAgo: number, alloc: string, status: Entitlement["status"] = "有效") => {
    push({ orgId: "org-xh", packageType: pkg, studentId: sid, op: "分配给学生", change: -1, operator: "校长 陈立群", occurredAt: ago(daysAgo, 16), allocationId: alloc, reason: "校长分配学生权益", idempotencyKey: k(`xh-${sid}`) })
    const days = PACKAGES.find((p) => p.id === pkg)!.days
    ent.push({ id: `ENT-${sid.slice(4).toUpperCase()}-${pkg.slice(0, 1).toUpperCase()}`, studentId: sid, orgId: "org-xh", packageType: pkg, sourceAllocation: alloc, assignedBy: "校长 陈立群", assignedAt: ago(daysAgo, 16), effectiveAt: ago(daysAgo, 16), expireAt: addDays(today, days - daysAgo), subjects: ["math", "physics", "chemistry"], functions: PACKAGES.find((p) => p.id === pkg)!.functions, status })
  }
  assign(DEMO_STUDENT_ID, "year", 152, "AL-XH-0003")
  assign("stu-smy", "quarter", 40, "AL-XH-0002")
  assign("stu-hjy", "month", 12, "AL-XH-0007")
  assign("stu-zzm", "month", 26, "AL-XH-0007")
  assign("stu-csy", "year", 100, "AL-XH-0003")
  assign("stu-wyn", "quarter", 70, "AL-XH-0002")
  assign("stu-zkx", "month", 5, "AL-XH-0007")
  assign("stu-lhr", "month", 27, "AL-XH-0001")
  // 启明（仅数学）
  push({ orgId: "org-qm", packageType: "month", op: "总部拨付", change: 100, operator: "总部·运营 赵敏", occurredAt: ago(88, 10), allocationId: "AL-QM-0001", reason: "签约首批（仅数学）", idempotencyKey: k("qm-a1") })
  push({ orgId: "org-qm", packageType: "quarter", op: "总部拨付", change: 30, operator: "总部·运营 赵敏", occurredAt: ago(88, 10, 3), allocationId: "AL-QM-0002", reason: "签约首批（仅数学）", idempotencyKey: k("qm-a2") })
  push({ orgId: "org-qm", packageType: "month", op: "分配给学生", change: -86, operator: "校长 刘晓峰", occurredAt: ago(80, 14), allocationId: "AL-QM-0001", reason: "批量分配（批次 BT-0507）", idempotencyKey: k("qm-b1") })
  push({ orgId: "org-qm", packageType: "quarter", op: "回收", change: -5, operator: "总部·运营 赵敏", occurredAt: ago(30, 14), allocationId: "AL-QM-0002", reason: "未分配库存按合同回收", idempotencyKey: k("qm-r1") })
  // 博雅
  push({ orgId: "org-by", packageType: "month", op: "总部拨付", change: 50, operator: "总部·运营 赵敏", occurredAt: ago(44, 10), allocationId: "AL-BY-0001", reason: "签约首批", idempotencyKey: k("by-a1") })
  push({ orgId: "org-by", packageType: "quarter", op: "总部拨付", change: 20, operator: "总部·运营 赵敏", occurredAt: ago(44, 10, 2), allocationId: "AL-BY-0002", reason: "签约首批", idempotencyKey: k("by-a2") })
  push({ orgId: "org-by", packageType: "month", op: "分配给学生", change: -50, operator: "校长 周敏", occurredAt: ago(40, 14), allocationId: "AL-BY-0001", reason: "批量分配（批次 BT-0601）", idempotencyKey: k("by-b1") })
  // 知行（停用）
  push({ orgId: "org-zx", packageType: "month", op: "总部拨付", change: 60, operator: "总部·运营 赵敏", occurredAt: ago(198, 10), allocationId: "AL-ZX-0001", reason: "签约首批", idempotencyKey: k("zx-a1") })
  push({ orgId: "org-zx", packageType: "month", op: "分配给学生", change: -41, operator: "校长 吴涛", occurredAt: ago(190, 14), allocationId: "AL-ZX-0001", reason: "批量分配", idempotencyKey: k("zx-b1") })
  push({ orgId: "org-zx", packageType: "month", op: "冻结", change: -19, operator: "总部·运营 赵敏", occurredAt: ago(5, 9), allocationId: "AL-ZX-0001", reason: "机构停用，冻结全部未分配库存", idempotencyKey: k("zx-f1") })
  ent.push({ id: "ENT-LHR-OLD", studentId: "stu-lhr", orgId: "org-xh", packageType: "month", sourceAllocation: "AL-XH-0001", assignedBy: "校长 陈立群", assignedAt: ago(60, 16), effectiveAt: ago(60, 16), expireAt: ago(30, 23), subjects: ["math", "physics", "chemistry"], functions: PACKAGES[0].functions, status: "已到期" })

  const flags: FeatureFlag[] = [
    { key: "ai_explain", name: "AI讲题", group: "功能", platform: "on", orgOverrides: {}, desc: "从题目/任务进入的 AI 讲解，经统一 AI Gateway" },
    { key: "ai_variant", name: "AI受控变式生成", group: "功能", platform: "gray", orgOverrides: { "org-xh": true }, desc: "题库不足时由 AI 受控生成变式，必须通过质量门禁" },
    { key: "photo_grading", name: "拍照批改", group: "功能", platform: "on", orgOverrides: { "org-qm": false }, desc: "纸质学案拍照上传 OCR 批改，不确定项进入人工确认" },
    { key: "worksheet", name: "纸质学案", group: "功能", platform: "on", orgOverrides: {}, desc: "学案生成、打印/下载、回收" },
    { key: "stage_assessment", name: "阶段检测", group: "功能", platform: "on", orgOverrides: {}, desc: "高权重证据，触发计划重排" },
    { key: "subject_math", name: "数学", group: "学科", platform: "on", orgOverrides: {}, desc: "小学 / 初中 / 高中" },
    { key: "subject_physics", name: "物理", group: "学科", platform: "on", orgOverrides: { "org-qm": false }, desc: "初中 / 高中" },
    { key: "subject_chemistry", name: "化学", group: "学科", platform: "on", orgOverrides: { "org-qm": false }, desc: "初中 / 高中" },
    { key: "interactive_lab", name: "INTERACTIVE_LAB 互动实验", group: "扩展位", platform: "force_off", orgOverrides: {}, desc: "V1 仅预留能力码，平台强制关闭，下层不可开启" },
    { key: "simulation", name: "SIMULATION 参数化模拟", group: "扩展位", platform: "force_off", orgOverrides: {}, desc: "V1 仅预留扩展位" },
  ]

  const providers: AIProvider[] = [
    { id: "pv-1", vendor: "通义千问", alias: "tutor-explain", endpoint: "https://gateway.internal/v1/qwen", role: "主", status: "正常", latencyMs: 820, costPer1k: 0.012 },
    { id: "pv-2", vendor: "DeepSeek", alias: "variant-gen", endpoint: "https://gateway.internal/v1/deepseek", role: "主", status: "正常", latencyMs: 1150, costPer1k: 0.004 },
    { id: "pv-3", vendor: "豆包", alias: "tutor-explain", endpoint: "https://gateway.internal/v1/doubao", role: "备用", status: "正常", latencyMs: 640, costPer1k: 0.008 },
    { id: "pv-4", vendor: "文心一言", alias: "quality-judge", endpoint: "https://gateway.internal/v1/ernie", role: "评测", status: "降级", latencyMs: 1630, costPer1k: 0.01 },
  ]

  const passAll = (extra: [string, boolean, string][] = []) => [
    { check: "输出结构完整（题干/选项/答案/解析）", pass: true, detail: "JSON Schema 校验通过" },
    { check: "学科/学段/年级/知识点范围匹配", pass: true, detail: "knowledge_id 与 chapter 一致，未越级" },
    { check: "题型与难度约束", pass: true, detail: "单选 · 难度 3（策略要求 2–3）" },
    { check: "答案与解析一致性", pass: true, detail: "解析推导结果与标注答案一致" },
    { check: "与原题/近期题目重复度", pass: true, detail: "相似度 0.31 < 阈值 0.6，非仅数字替换" },
    { check: "学科表达合法性", pass: true, detail: "KaTeX / mhchem 解析通过" },
    ...extra.map(([check, pass, detail]) => ({ check, pass, detail })),
  ]
  const aiLogs: AIRequestLog[] = [
    {
      id: "AIR-20931", at: ago(0, 8, 41), scene: "变式生成", studentId: DEMO_STUDENT_ID,
      context: { subject: "math", stage: "初中", grade: "初三", textbook: "人教版九上", knowledgeId: "m2", taskType: "variant", masteryState: "learning", difficulty: 3, questionType: "单选", errorType: "漏考虑条件", purpose: "根的判别式·独立变式验证（含二次项系数隐含条件）" },
      promptVersion: "variant.math.junior@v2.3", strategyVersion: "math-junior@v1.3", model: "DeepSeek · variant-gen", route: "主路由", tokens: 1840, latencyMs: 1320, costCny: 0.0074, status: "成功", validations: passAll(),
    },
    {
      id: "AIR-20917", at: ago(1, 20, 12), scene: "变式生成", studentId: DEMO_STUDENT_ID,
      context: { subject: "chemistry", stage: "初中", grade: "初三", textbook: "人教版九上", knowledgeId: "c4", taskType: "variant", masteryState: "pending", difficulty: 2, questionType: "单选", errorType: "概念不清", purpose: "化学方程式配平·降难变式" },
      promptVersion: "variant.chem.junior@v2.1", strategyVersion: "chem-junior@v1.2", model: "DeepSeek · variant-gen", route: "主路由", tokens: 1620, latencyMs: 1210, costCny: 0.0065, status: "校验失败·已回退题库",
      validations: [
        { check: "输出结构完整（题干/选项/答案/解析）", pass: true, detail: "JSON Schema 校验通过" },
        { check: "学科/学段/年级/知识点范围匹配", pass: true, detail: "c4 · 第5单元" },
        { check: "题型与难度约束", pass: true, detail: "单选 · 难度 2" },
        { check: "答案与解析一致性", pass: false, detail: "解析配平结果为 2、1、2，标注答案为 4、3、2 → 冲突" },
        { check: "与原题/近期题目重复度", pass: true, detail: "相似度 0.42" },
        { check: "学科表达合法性", pass: false, detail: "mhchem：Fe3O4 下标位置异常" },
      ],
    },
    {
      id: "AIR-20902", at: ago(1, 20, 5), scene: "AI讲题", studentId: DEMO_STUDENT_ID,
      context: { subject: "physics", stage: "初中", grade: "初二", textbook: "人教版八下", knowledgeId: "p4", taskType: "practice", masteryState: "weak", difficulty: 2, questionType: "单选", errorType: "单位换算", purpose: "讲解 qp4a：浸没 + 体积单位换算" },
      promptVersion: "explain.phy.junior@v3.0", strategyVersion: "phy-junior@v1.1", model: "通义千问 · tutor-explain", route: "主路由", tokens: 2310, latencyMs: 2410, costCny: 0.0277, status: "成功",
    },
    {
      id: "AIR-20877", at: ago(2, 19, 31), scene: "AI讲题", studentId: "stu-smy",
      context: { subject: "math", stage: "初中", grade: "初三", textbook: "人教版九上", knowledgeId: "m9", taskType: "practice", masteryState: "learning", difficulty: 4, questionType: "单选", purpose: "讲解利润最值建模" },
      promptVersion: "explain.math.junior@v3.2", strategyVersion: "math-junior@v1.3", model: "豆包 · tutor-explain", route: "主模型超时 → 备用路由", tokens: 1980, latencyMs: 4120, costCny: 0.0158, status: "超时·已重试",
    },
    {
      id: "AIR-20861", at: ago(2, 18, 2), scene: "变式生成", studentId: "stu-qm1",
      context: { subject: "math", stage: "小学", grade: "五年级", textbook: "人教版五上", knowledgeId: "小数乘法", taskType: "variant", masteryState: "pending", difficulty: 1, questionType: "情境应用题", purpose: "小学情境化变式（购物场景）" },
      promptVersion: "variant.math.primary@v1.4", strategyVersion: "math-primary@v1.1", model: "DeepSeek · variant-gen", route: "主路由", tokens: 1210, latencyMs: 980, costCny: 0.0048, status: "成功", validations: passAll(),
    },
    {
      id: "AIR-20840", at: ago(3, 21, 15), scene: "解析辅助", studentId: "—",
      context: { subject: "chemistry", stage: "初中", grade: "初三", textbook: "人教版九上", knowledgeId: "c5", taskType: "content", masteryState: "—", difficulty: 3, questionType: "计算题", purpose: "教研题库解析补全（需审核后发布）" },
      promptVersion: "solution.chem.junior@v1.2", strategyVersion: "chem-junior@v1.2", model: "通义千问 · tutor-explain", route: "主路由", tokens: 2890, latencyMs: 2950, costCny: 0.0347, status: "成功",
    },
    {
      id: "AIR-20822", at: ago(3, 20, 40), scene: "变式生成", studentId: "stu-csy",
      context: { subject: "math", stage: "高中", grade: "高一", textbook: "人教A版必修一", knowledgeId: "函数单调性", taskType: "variant", masteryState: "pending", difficulty: 4, questionType: "解答题", purpose: "高中综合变式：含参分类讨论" },
      promptVersion: "variant.math.senior@v1.0", strategyVersion: "math-senior@v1.0", model: "DeepSeek · variant-gen", route: "主路由", tokens: 2440, latencyMs: 1890, costCny: 0.0098, status: "失败",
      validations: [
        { check: "输出结构完整（题干/选项/答案/解析）", pass: true, detail: "通过" },
        { check: "学科/学段/年级/知识点范围匹配", pass: false, detail: "使用导数求单调性 → 越级（高二内容）" },
        { check: "题型与难度约束", pass: true, detail: "解答题 · 难度 4" },
        { check: "答案与解析一致性", pass: true, detail: "一致" },
        { check: "与原题/近期题目重复度", pass: true, detail: "0.28" },
        { check: "学科表达合法性", pass: true, detail: "通过" },
      ],
    },
  ]

  const strategies: SubjectStageStrategy[] = [
    {
      id: "math-primary", subject: "math", stage: "小学", gradeScope: "1–6 年级", textbookScope: "人教版 / 北师大版", version: "v1.1", status: "已发布", updatedAt: ago(30),
      policy: {
        diagnostic: "按单元抽样 6–8 题，情境化题干，不限时，读题语音辅助", questionTypes: ["情境应用题", "口算", "图形直观题", "选择题"], difficulty: "1–3 级，单步为主",
        knowledgeCard: "图文情境 + 实物/数轴示意，少符号", errorTypes: ["数感偏差", "运算顺序", "看错数字", "单位混淆"], explanation: "具体情境类比，口语化，最多 3 步，禁止直接给出抽象公式",
        variant: "替换生活情境与数量关系，保持运算结构", mastery: "连续 2 次独立正确 + 正确率 ≥ 80%", remediation: "失败 2 次 → 回到直观图形/实物操作；3 次 → 教师关注", review: "间隔 2 / 5 / 10 天", assessment: "每单元 5 题小测，含 1 道情境题",
      },
      params: { masteryThreshold: 80, variantsRequired: 2, failToDowngrade: 2, failToRisk: 3, reviewDays: [2, 5, 10] },
    },
    {
      id: "math-junior", subject: "math", stage: "初中", gradeScope: "7–9 年级", textbookScope: "人教版 / 北师大版 / 苏科版", version: "v1.3", status: "已发布", updatedAt: ago(12),
      policy: {
        diagnostic: "按已学章节 + 前置知识确定范围，每知识点 1–2 题，计时", questionTypes: ["单选", "填空", "步骤解答题", "几何证明（结构化步骤）"], difficulty: "2–4 级，2–3 步推理",
        knowledgeCard: "公式/定理 + 题型方法 + 步骤模板 + 易错点", errorTypes: ["概念不清", "公式记错", "计算失误", "漏考虑条件", "方法不会"], explanation: "分步推导，每步给出依据（定理/公式），强调隐含条件",
        variant: "改变参数位置 / 问法 / 条件形式（如 Δ>0 → 含参二次项系数），禁止仅数字替换", mastery: "1 次变式独立验证通过 + 阶段检测保持", remediation: "失败 2 次 → 降难 1 级 + 回退前置知识点；3 次 → 风险标记 + 教师关注", review: "间隔 3 / 7 / 14 天", assessment: "每 7 天阶段检测，权重 ×2",
      },
      params: { masteryThreshold: 80, variantsRequired: 1, failToDowngrade: 2, failToRisk: 3, reviewDays: [3, 7, 14] },
    },
    {
      id: "math-senior", subject: "math", stage: "高中", gradeScope: "高一–高三", textbookScope: "人教A版 / 北师大版", version: "v1.0", status: "灰度", updatedAt: ago(5),
      policy: {
        diagnostic: "模块化诊断（函数/几何/概率统计），含多知识点关联题", questionTypes: ["单选", "多选", "填空", "综合解答题"], difficulty: "3–5 级，多步推导 + 方法选择",
        knowledgeCard: "抽象概念 + 知识关联图 + 方法对比", errorTypes: ["条件分析不全", "方法选择不当", "分类讨论遗漏", "运算失误", "概念混淆"], explanation: "先分析条件与方法选择，再推导；提示程度分 3 级",
        variant: "综合变式：换背景 / 增加参数讨论 / 逆向设问", mastery: "2 次不同维度变式通过", remediation: "失败 2 次 → 拆分子问题 + 回退前置模块；3 次 → 教师关注", review: "间隔 3 / 7 / 21 天", assessment: "每 10 天模块检测",
      },
      params: { masteryThreshold: 85, variantsRequired: 2, failToDowngrade: 2, failToRisk: 3, reviewDays: [3, 7, 21] },
    },
    {
      id: "phy-junior", subject: "physics", stage: "初中", gradeScope: "8–9 年级", textbookScope: "人教版", version: "v1.1", status: "已发布", updatedAt: ago(18),
      policy: {
        diagnostic: "概念 + 实验情境 + 计算组合，必含单位换算项", questionTypes: ["实验情境题", "图像题", "计算题（带单位）", "单选"], difficulty: "2–4 级",
        knowledgeCard: "公式 + 单位表 + 实验装置/步骤 + 过程分析", errorTypes: ["单位换算", "公式记错", "受力/过程分析错误", "图像读取错误", "审题不清"], explanation: "先建情境与过程分析，再列公式，最后单位检查与量级合理性",
        variant: "保持物理过程，替换实验情境或已知量形式（如由体积求浮力 → 由称重法求体积）", mastery: "1 次变式验证 + 单位正确", remediation: "失败 2 次 → 回退前置（如 液体压强）+ 单位专项；3 次 → 教师关注", review: "间隔 3 / 7 / 14 天", assessment: "每章阶段检测，含 1 道实验题",
      },
      params: { masteryThreshold: 80, variantsRequired: 1, failToDowngrade: 2, failToRisk: 3, reviewDays: [3, 7, 14] },
    },
    {
      id: "phy-senior", subject: "physics", stage: "高中", gradeScope: "高一–高三", textbookScope: "人教版（2019）", version: "v0.9", status: "草稿", updatedAt: ago(2),
      policy: {
        diagnostic: "模型识别（匀变速/圆周/能量）+ 图像分析", questionTypes: ["多选", "实验题", "计算题", "图像题"], difficulty: "3–5 级",
        knowledgeCard: "物理模型 + 矢量图 + 图像斜率/面积意义", errorTypes: ["模型识别错误", "矢量方向", "图像物理意义", "单位/量纲"], explanation: "模型 → 受力/能量分析 → 方程 → 量纲检查",
        variant: "同一模型换情境 / 换已知未知", mastery: "2 次变式通过", remediation: "失败 2 次 → 拆解为子模型", review: "间隔 3 / 7 / 21 天", assessment: "每单元检测",
      },
      params: { masteryThreshold: 85, variantsRequired: 2, failToDowngrade: 2, failToRisk: 3, reviewDays: [3, 7, 21] },
    },
    {
      id: "chem-junior", subject: "chemistry", stage: "初中", gradeScope: "9 年级", textbookScope: "人教版", version: "v1.2", status: "已发布", updatedAt: ago(15),
      policy: {
        diagnostic: "化学用语 + 方程式 + 实验现象/装置 + 计算", questionTypes: ["方程式配平", "实验现象题", "装置图题", "化学计算"], difficulty: "1–4 级",
        knowledgeCard: "方程式（mhchem）+ 现象 + 装置要点 + 计算模板", errorTypes: ["概念不清", "化学用语错误", "现象描述错误", "装置操作错误", "计算失误"], explanation: "宏观现象 → 微观粒子 → 符号表达三重表征",
        variant: "更换反应体系，保持配平方法/计算模型", mastery: "1 次变式验证 + 方程式书写规范", remediation: "失败 2 次 → 降难 + 回退「化学式/意义」；3 次 → 教师关注", review: "间隔 3 / 7 / 14 天", assessment: "每单元检测，含 1 道实验探究",
      },
      params: { masteryThreshold: 80, variantsRequired: 1, failToDowngrade: 2, failToRisk: 3, reviewDays: [3, 7, 14] },
    },
    {
      id: "chem-senior", subject: "chemistry", stage: "高中", gradeScope: "高一–高三", textbookScope: "人教版（2019）", version: "v0.8", status: "草稿", updatedAt: ago(3),
      policy: {
        diagnostic: "物质的量 + 离子反应 + 氧化还原", questionTypes: ["离子方程式", "实验探究", "工艺流程", "计算"], difficulty: "3–5 级",
        knowledgeCard: "反应原理 + 守恒思想 + 流程图", errorTypes: ["电荷/得失电子不守恒", "条件遗漏", "流程理解"], explanation: "守恒思想贯穿，先判断反应类型",
        variant: "换反应体系 / 换设问角度", mastery: "2 次变式通过", remediation: "失败 2 次 → 回退物质的量", review: "间隔 3 / 7 / 21 天", assessment: "每单元检测",
      },
      params: { masteryThreshold: 85, variantsRequired: 2, failToDowngrade: 2, failToRisk: 3, reviewDays: [3, 7, 21] },
    },
  ]

  const audit: AuditLog[] = [
    { id: "AU-1", at: ago(158, 10), actor: "赵敏", role: "总部运营", action: "库存拨付", target: "星海教育 · 滨江校区", detail: "月卡 +200 / 季卡 +80 / 年卡 +40（AL-XH-0001~3）", ip: "10.2.3.14" },
    { id: "AU-2", at: ago(60, 11), actor: "孙悦", role: "总部财务", action: "库存冻结", target: "星海教育 · 滨江校区", detail: "月卡 −10（未分配库存）", ip: "10.2.3.22" },
    { id: "AU-3", at: ago(30, 14), actor: "赵敏", role: "总部运营", action: "库存回收", target: "启明学堂 · 南山校区", detail: "季卡 −5", ip: "10.2.3.14" },
    { id: "AU-4", at: ago(20, 9), actor: "赵敏", role: "总部运营", action: "库存追加", target: "星海教育 · 滨江校区", detail: "月卡 +50（AL-XH-0007）", ip: "10.2.3.14" },
    { id: "AU-5", at: ago(12, 15), actor: "周敬", role: "总部教研", action: "策略发布", target: "math-junior", detail: "v1.2 → v1.3：变式策略禁止仅数字替换", ip: "10.2.5.9" },
    { id: "AU-6", at: ago(5, 9), actor: "赵敏", role: "总部运营", action: "机构停用", target: "知行教育 · 武侯校区", detail: "服务期到期，冻结未分配库存 19 张，历史数据保留", ip: "10.2.3.14" },
    { id: "AU-7", at: ago(5, 9, 5), actor: "赵敏", role: "总部运营", action: "账号停用", target: "校长 吴涛", detail: "随机构停用", ip: "10.2.3.14" },
    { id: "AU-8", at: ago(3, 16), actor: "系统", role: "安全", action: "越权拒绝", target: "校长 刘晓峰", detail: "尝试访问 org-xh 学生 stu-smy → 403 TENANT_SCOPE_DENIED", ip: "113.88.12.40" },
    { id: "AU-9", at: ago(2, 11), actor: "钱航", role: "总部产品", action: "功能开关", target: "AI受控变式生成", detail: "平台：关闭 → 灰度（星海 开启）", ip: "10.2.4.2" },
    { id: "AU-10", at: ago(1, 10), actor: "系统", role: "幂等", action: "重复请求拦截", target: "校长 陈立群", detail: "idem-xh-stu-zkx 重复提交，未重复扣卡", ip: "115.236.9.77" },
  ]

  const jobs: AsyncJob[] = [
    { id: "JOB-88231", type: "AI变式生成", status: "成功", createdAt: ago(0, 8, 41), retries: 0, detail: "AIR-20931 · 质量门禁 6/6" },
    { id: "JOB-88219", type: "计划重排", status: "成功", createdAt: ago(2, 20, 35), retries: 0, detail: "林小舟 · V1 → V2（阶段检测①）" },
    { id: "JOB-88204", type: "拍照批改OCR", status: "失败·可重试", createdAt: ago(2, 21, 30), retries: 1, detail: "ws-4 第2题识别置信度 0.41 → 待人工确认" },
    { id: "JOB-88190", type: "学案PDF生成", status: "成功", createdAt: ago(1, 18, 0), retries: 0, detail: "ws-2 浮力学案" },
    { id: "JOB-88177", type: "AI变式生成", status: "失败·可重试", createdAt: ago(1, 20, 12), retries: 2, detail: "AIR-20917 校验失败 → 已回退题库 qc4b" },
    { id: "JOB-88160", type: "内容导入", status: "运行中", createdAt: ago(0, 9, 10), retries: 0, detail: "苏科版八上物理.pdf · OCR 第 46/120 页" },
    { id: "JOB-88151", type: "AI变式生成", status: "排队中", createdAt: ago(0, 9, 12), retries: 0, detail: "批量预生成 · 欧姆定律变式 ×20" },
  ]
  const content: ContentItem[] = [
    { id: "CT-1", kind: "题目", title: "根的判别式 · 含参二次项系数（qm2b）", subject: "math", source: "教研录入", status: "已发布", version: "v2", reviewer: "周敬", updatedAt: ago(20) },
    { id: "CT-2", kind: "题目", title: "阿基米德原理 · 称重法求体积（qp4b）", subject: "physics", source: "教研录入", status: "已发布", version: "v2", reviewer: "王磊", updatedAt: ago(18) },
    { id: "CT-3", kind: "题目", title: "Fe₃O₄ 与 CO 反应配平（AI 生成）", subject: "chemistry", source: "AI生成", status: "待审核", version: "v1", updatedAt: ago(1) },
    { id: "CT-4", kind: "知识卡", title: "二次函数 · 顶点式与平移", subject: "math", source: "教研录入", status: "已发布", version: "v3", reviewer: "周敬", updatedAt: ago(40) },
    { id: "CT-5", kind: "题目", title: "苏科版八上 · 光的折射 12 题", subject: "physics", source: "PDF导入·OCR", status: "待审核", version: "v1", updatedAt: ago(0) },
    { id: "CT-6", kind: "学案模板", title: "初中化学 · 方程式专项学案模板", subject: "chemistry", source: "教研录入", status: "已发布", version: "v2", reviewer: "李琳", updatedAt: ago(25) },
    { id: "CT-7", kind: "题目", title: "利润最值建模（旧版答案有误）", subject: "math", source: "教研录入", status: "已停用", version: "v1", reviewer: "周敬", updatedAt: ago(33) },
    { id: "CT-8", kind: "题目", title: "电阻性质 · 电压为 0 时（AI 生成）", subject: "physics", source: "AI生成", status: "草稿", version: "v1", updatedAt: ago(0) },
  ]

  const riskSeed = [
    { id: "rk-1", studentId: "stu-wyn", orgId: "org-xh", knowledgeId: "m2", failures: 3, level: 3, lastEvidence: "变式验证 qm2b 第 3 次失败", at: ago(1, 20, 10), status: "待处理" as const },
    { id: "rk-2", studentId: "stu-lhr", orgId: "org-xh", knowledgeId: "p8", failures: 3, level: 3, lastEvidence: "阶段检测 + 2 次变式均失败（串联分压）", at: ago(2, 21, 5), status: "待处理" as const },
    { id: "rk-3", studentId: "stu-zzm", orgId: "org-xh", knowledgeId: "c4", failures: 2, level: 2, lastEvidence: "降难练习后变式仍错误", at: ago(0, 7, 50), status: "观察中" as const },
  ]
  const manualSeed = [
    { id: "mc-1", studentId: "stu-lxz", orgId: "org-xh", worksheetId: "ws-4", questionId: "qp7b", recognized: "?", confidence: 0.41, reason: "字迹涂改，OCR 置信度 0.41 < 0.75", status: "待确认" as const, at: ago(2, 21, 30) },
    { id: "mc-2", studentId: "stu-hjy", orgId: "org-xh", worksheetId: "ws-x1", questionId: "qp4b", recognized: "A/C", confidence: 0.52, reason: "勾选两个选项", status: "待确认" as const, at: ago(0, 7, 20) },
    { id: "mc-3", studentId: "stu-smy", orgId: "org-xh", worksheetId: "ws-x2", questionId: "qm9a", recognized: "900", confidence: 0.63, reason: "图片倾斜、局部过曝", status: "待确认" as const, at: ago(1, 19, 0) },
  ]

  return { orgs, principals, students, ledger, entitlements: ent, flags, providers, aiLogs, strategies, audit, jobs, content, riskQueue: riskSeed, manualQueue: manualSeed }
}

export type RiskItem = ReturnType<typeof buildPlatformSeed>["riskQueue"][number]
export type ManualItem = ReturnType<typeof buildPlatformSeed>["manualQueue"][number]
