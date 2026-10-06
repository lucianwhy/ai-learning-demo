// 核心数据对象 —— 与 PRD 第13节对象保持一致的前端形状，便于后续对接后端
export type SubjectId = "math" | "physics" | "chemistry"

export type MasteryStatus =
  | "undiagnosed" // 未诊断
  | "weak" // 薄弱
  | "learning" // 学习中
  | "pending" // 待验证
  | "mastered" // 已掌握
  | "review" // 需复习

export interface KnowledgePoint {
  id: string
  subject: SubjectId
  grade: string
  textbook: string
  chapter: string
  name: string
  prerequisites: string[] // KnowledgePrerequisite
  summary: string
  formulas: string[]
  /** 学科差异化内容 */
  extra?: {
    steps?: string[] // 数学：步骤性推理 / 题型方法
    units?: string[] // 物理：单位
    experiment?: string // 物理：实验情境 / 化学：实验
    phenomenon?: string // 化学：现象
    apparatus?: string // 化学：装置
    pitfalls?: string[]
  }
}

export interface QuestionOption {
  key: string
  text: string
}

export interface Question {
  id: string
  version: string // QuestionVersion
  subject: SubjectId
  knowledgeId: string // QuestionKnowledgeMap
  type: "single"
  difficulty: 1 | 2 | 3 | 4 | 5
  source: string
  context?: { label: string; text: string } // 物理实验情境 / 化学现象
  stem: string // 支持 $...$ KaTeX
  options: QuestionOption[]
  answer: string
  explanation: string[] // Explanation 步骤
  variantOf?: string
}

export type TaskType = "learn" | "practice" | "correction" | "variant" | "stage" | "worksheet" | "review" | "remediate"
export type TaskStatus = "todo" | "doing" | "done" | "failed" | "locked" | "deferred"
export type TaskSource = "计划" | "错题订正" | "复习" | "阶段检测" | "补弱" | "重排"

export interface LearningTask {
  id: string
  date: string
  type: TaskType
  subject: SubjectId
  knowledgeId: string
  title: string
  priority: "P0" | "P1" | "P2"
  dependsOn: string[]
  status: TaskStatus
  source: TaskSource
  planItemId?: string
  errorId?: string
  minutes: number
  completionRule: string
  questionId?: string
  result?: TaskResult
}

export interface TaskResult {
  at: string
  correct?: boolean
  summary: string
  nextAction: string
}

export interface Attempt {
  id: string
  questionId: string
  taskId?: string
  knowledgeId: string
  subject: SubjectId
  answer: string
  correct: boolean
  durationSec: number
  at: string
  mode: "诊断" | "练习" | "变式验证" | "阶段检测" | "纸质学案"
}

export type ErrorType = "概念不清" | "公式记错" | "计算失误" | "审题不清" | "单位换算" | "漏考虑条件" | "方法不会"

export interface Correction {
  at: string
  errorType: ErrorType
  note: string
  answer: string
}

export interface VariantVerification {
  id: string
  questionId: string
  answer: string
  correct: boolean
  at: string
}

export interface ErrorRecord {
  id: string
  questionId: string
  knowledgeId: string
  subject: SubjectId
  attemptIds: string[]
  errorType?: ErrorType
  corrections: Correction[]
  verifications: VariantVerification[]
  status: "待订正" | "待验证" | "已验证" | "验证失败"
  risk: boolean
  createdAt: string
}

export type EvidenceType = "诊断" | "知识学习" | "作答" | "订正" | "变式验证" | "阶段检测" | "纸质学案" | "延迟复习" | "补弱" | "AI讲题"

export interface MasteryEvidence {
  id: string
  knowledgeId: string
  subject: SubjectId
  type: EvidenceType
  from: MasteryStatus
  to: MasteryStatus
  scoreDelta: number
  note: string
  at: string
  countsForMastery: boolean
}

export interface MasteryState {
  knowledgeId: string
  subject: SubjectId
  status: MasteryStatus
  score: number // 0-100
  updatedAt: string
  notLearned?: boolean // 诊断范围外：未学，不判薄弱
}

export interface PlanItem {
  id: string
  key: string // knowledgeId + type，用于版本 diff
  day: number
  date: string
  subject: SubjectId
  knowledgeId: string
  type: TaskType
  title: string
  reason: string
  minutes: number
}

export interface PlanChange {
  kind: "added" | "removed" | "moved" | "kept"
  key: string
  title: string
  subject: SubjectId
  fromDay?: number
  toDay?: number
  reason: string
}

export interface PlanVersion {
  id: string
  version: number
  createdAt: string
  trigger: string
  summary: string
  frozenBeforeDay: number // 之前的天数沿用历史，不被重排覆盖
  items: PlanItem[]
  changes: PlanChange[]
}

export interface LearningPlan {
  id: string
  startDate: string
  days: number
  goal: string
  dailyCapacityMin: number
  versions: PlanVersion[]
  activeVersion: number
}

export interface DiagnosticAttempt {
  questionId: string
  answer: string
  correct: boolean
  durationSec: number
}

export interface DiagnosticResult {
  id: string
  batch: string
  at: string
  attempts: DiagnosticAttempt[]
  totalSec: number
  scope: DiagnosticScope
}

/** V1.4 诊断范围控制器 */
export interface DiagnosticScope {
  version: string
  textbook: Record<SubjectId, string>
  currentChapter: Record<SubjectId, string>
  coveredKps: string[]
  notLearnedKps: string[]
  confirmedAt: string
}

export interface RemediationEvent {
  id: string
  knowledgeId: string
  subject: SubjectId
  level: 1 | 2 | 3
  trigger: string
  action: string
  strategyVersion: string
  at: string
}

export type WorksheetStatus = "待完成" | "待回收" | "已批改" | "需订正"

export interface Worksheet {
  id: string
  title: string
  subject: SubjectId
  knowledgeIds: string[]
  questionIds: string[]
  taskId?: string
  status: WorksheetStatus
  createdAt: string
  gradedAt?: string
  accuracy?: number
  grading?: { questionId: string; recognized: string; result: "正确" | "错误" | "待人工确认" }[]
}

export interface StudySession {
  id: string
  date: string
  minutes: number
  subject: SubjectId
  title: string
  kind: TaskType | "diagnostic"
}

/** 学生个人学习状态（以 student_id 为根） */
export interface LearningState {
  studentId: string
  diagnosed: boolean
  diagnostic?: DiagnosticResult
  scope?: DiagnosticScope
  dailyBudgetMin: 30 | 45 | 60
  mastery: Record<string, MasteryState>
  evidence: MasteryEvidence[]
  attempts: Attempt[]
  errors: ErrorRecord[]
  remediations: RemediationEvent[]
  plan: LearningPlan | null
  tasks: LearningTask[]
  worksheets: Worksheet[]
  sessions: StudySession[]
  streak: number
  feedback: { id: string; at: string; teacher: string; text: string; knowledgeId?: string }[]
}

// ───────── 平台 / 机构 / 权益 ─────────
export type Role = "student" | "teacher" | "principal" | "admin"
export type PackageType = "month" | "quarter" | "year"

export interface Package {
  id: PackageType
  name: string
  days: number
  subjects: SubjectId[]
  functions: string[]
  effectiveRule: "立即生效" | "首次使用生效"
  quota: string
  status: "启用" | "停用"
  version: string
}

export interface Organization {
  id: string
  name: string
  code: string
  city: string
  status: "启用" | "停用"
  principalId?: string
  subjects: SubjectId[]
  stages: string[]
  packages: PackageType[]
  studentQuota: number
  servicePeriod: string
  createdAt: string
  remark?: string
}

export interface Principal {
  id: string
  name: string
  account: string
  phone: string
  orgId?: string
  status: "启用" | "冻结" | "停用"
  createdAt: string
}

export interface StudentAccount {
  id: string
  orgId: string
  name: string
  account: string
  grade: string
  stage: "小学" | "初中" | "高中"
  status: "启用" | "停用"
  createdAt: string
  seedStats?: { mastery: number; completion: number; weak: number; risk: boolean; lastActive: string; verifyRate: number }
}

export type LedgerOp = "总部拨付" | "总部追加" | "冻结" | "解冻" | "回收" | "扣减" | "分配给学生" | "权益作废返还"

export interface InventoryLedger {
  transactionId: string
  orgId: string
  packageType: PackageType
  studentId?: string
  op: LedgerOp
  before: number
  change: number
  after: number
  operator: string
  occurredAt: string
  allocationId?: string
  reason: string
  idempotencyKey: string
}

export interface Entitlement {
  id: string
  studentId: string
  orgId: string
  packageType: PackageType
  sourceAllocation: string
  assignedBy: string
  assignedAt: string
  effectiveAt: string
  expireAt: string
  subjects: SubjectId[]
  functions: string[]
  status: "待生效" | "有效" | "已到期" | "冻结" | "已回收"
}

export interface FeatureFlag {
  key: string
  name: string
  group: "功能" | "学科" | "扩展位"
  platform: "on" | "off" | "force_off" | "gray"
  orgOverrides: Record<string, boolean>
  desc: string
}

export interface AuditLog {
  id: string
  at: string
  actor: string
  role: string
  action: string
  target: string
  detail: string
  ip: string
}

export interface AIProvider {
  id: string
  vendor: string
  alias: string
  endpoint: string
  role: "主" | "备用" | "评测"
  status: "正常" | "降级" | "停用"
  latencyMs: number
  costPer1k: number
}

export interface AIValidation {
  check: string
  pass: boolean
  detail: string
}

export interface AIRequestLog {
  id: string
  at: string
  scene: "AI讲题" | "变式生成" | "解析辅助" | "学习建议"
  studentId: string
  context: {
    subject: SubjectId
    stage: string
    grade: string
    textbook: string
    knowledgeId: string
    taskType: string
    masteryState: string
    difficulty: number
    questionType: string
    errorType?: string
    purpose: string
  }
  promptVersion: string
  strategyVersion: string
  model: string
  route: string
  tokens: number
  latencyMs: number
  costCny: number
  status: "成功" | "校验失败·已回退题库" | "超时·已重试" | "失败"
  validations?: AIValidation[]
}

export interface StrategyPolicy {
  diagnostic: string
  questionTypes: string[]
  difficulty: string
  knowledgeCard: string
  errorTypes: string[]
  explanation: string
  variant: string
  mastery: string
  remediation: string
  review: string
  assessment: string
}

export interface SubjectStageStrategy {
  id: string
  subject: SubjectId
  stage: "小学" | "初中" | "高中"
  gradeScope: string
  textbookScope: string
  version: string
  status: "已发布" | "灰度" | "草稿"
  updatedAt: string
  policy: StrategyPolicy
  params: { masteryThreshold: number; variantsRequired: number; failToDowngrade: number; failToRisk: number; reviewDays: number[] }
}

export interface AsyncJob {
  id: string
  type: "AI变式生成" | "拍照批改OCR" | "学案PDF生成" | "计划重排" | "内容导入"
  status: "成功" | "运行中" | "失败·可重试" | "排队中"
  createdAt: string
  retries: number
  detail: string
}

export interface ContentItem {
  id: string
  kind: "题目" | "知识卡" | "学案模板"
  title: string
  subject: SubjectId
  source: "教研录入" | "PDF导入·OCR" | "AI生成"
  status: "草稿" | "待审核" | "已发布" | "已停用"
  version: string
  reviewer?: string
  updatedAt: string
}
