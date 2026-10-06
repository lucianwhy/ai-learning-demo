import { create } from "zustand"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { KP, SUBJECTS, successorsOf } from "@/data/knowledge"
import { Q, pickPractice, pickVariant, questionsOfKp } from "@/data/questions"
import { buildDemoLearning, DEMO_STUDENT_ID, emptyLearning, scopeFrom } from "@/data/seed-learning"
import { buildPlatformSeed, PACKAGES } from "@/data/seed-platform"
import { addDays, diffDays, nowISO, todayISO, uid } from "@/engine/date"
import { clampScore } from "@/engine/mastery"
import { inventoryOf, makeLedger, PKG_NAME } from "@/engine/inventory"
import { generatePlan } from "@/engine/plan"
import type {
  AIRequestLog, AIValidation, Attempt, AuditLog, DiagnosticAttempt, DiagnosticScope, ErrorRecord, ErrorType, EvidenceType, FeatureFlag, LearningState, LearningTask,
  MasteryStatus, Organization, PackageType, PlanItem, Role, StudentAccount, SubjectId, TaskType,
} from "@/data/types"

export interface RiskItem { id: string; studentId: string; orgId: string; knowledgeId: string; failures: number; level: number; lastEvidence: string; at: string; status: "待处理" | "观察中" | "已反馈" }
export interface ManualItem { id: string; studentId: string; orgId: string; worksheetId: string; questionId: string; recognized: string; confidence: number; reason: string; status: "待确认" | "已确认正确" | "已确认错误"; at: string }

type Platform = ReturnType<typeof buildPlatformSeed>

export interface StoreState extends Omit<Platform, "riskQueue" | "manualQueue"> {
  role: Role
  loggedIn: boolean
  currentStudentId: string
  principalOrgId: string
  subject: SubjectId
  learning: Record<string, LearningState>
  riskQueue: RiskItem[]
  manualQueue: ManualItem[]
  guideOpen: boolean
  guideVisited: string[]
  markVisited: (key: string) => void
  usedIdemKeys: string[]
  lastTxn?: { ledgerTx: string; entitlementId: string; before: number; after: number }

  // 通用
  login: (role: Role) => void
  logout: () => void
  setRole: (role: Role) => void
  setSubject: (s: SubjectId) => void
  setGuideOpen: (v: boolean) => void
  switchStudent: (id: string) => void
  setPrincipalOrg: (id: string) => void
  resetAll: () => void
  resetStudentFresh: () => void

  // 学习引擎
  setBudget: (m: 30 | 45 | 60) => void
  confirmScope: (textbook: DiagnosticScope["textbook"], chapters: DiagnosticScope["currentChapter"]) => void
  completeDiagnostic: (attempts: DiagnosticAttempt[], totalSec: number) => void
  generatePlanFromDiagnosis: () => number
  startTask: (id: string) => void
  finishLearn: (taskId: string) => void
  completeTask: (taskId: string, summary: string, next: string, correct?: boolean) => void
  answerPractice: (taskId: string, qid: string, answer: string, sec: number) => { correct: boolean; errorId?: string }
  submitCorrection: (errorId: string, errorType: ErrorType, note: string, answer: string) => void
  verifyVariant: (taskId: string, errorId: string | undefined, qid: string, answer: string, sec: number) => { correct: boolean; level: number; version?: number; fallbackKp?: string }
  answerReview: (taskId: string, qid: string, answer: string, sec: number) => { correct: boolean; version?: number }
  submitStage: (taskId: string, answers: Record<string, string>) => { correct: number; total: number; version: number }
  markWorksheet: (id: string, status: "待回收") => void
  gradeWorksheet: (id: string) => void
  logAI: (log: Omit<AIRequestLog, "id" | "at">) => void
  addAIValidationLog: (kid: string, purpose: string) => AIValidation[]

  // 平台 / 机构
  createOrg: (o: Pick<Organization, "name" | "code" | "city" | "subjects" | "stages" | "packages">) => string
  toggleOrg: (id: string) => void
  bindPrincipal: (orgId: string, name: string, account: string, phone: string) => string
  allocate: (orgId: string, pkg: PackageType, qty: number, reason: string, idem: string, op?: "总部拨付" | "总部追加") => { ok: boolean; msg: string }
  adjust: (orgId: string, pkg: PackageType, qty: number, op: "冻结" | "解冻" | "回收", reason: string) => { ok: boolean; msg: string }
  createStudent: (orgId: string, name: string, grade: string) => { ok: boolean; msg: string; id?: string }
  importStudents: (orgId: string, names: string[]) => number
  toggleStudent: (id: string) => void
  assignEntitlement: (orgId: string, studentId: string, pkg: PackageType, idem: string) => { ok: boolean; msg: string; code?: string }
  setFlagPlatform: (key: string, v: FeatureFlag["platform"]) => void
  setFlagOrg: (key: string, orgId: string, v: boolean | null) => void
  // 教师
  resolveManual: (id: string, correct: boolean) => void
  feedbackRisk: (id: string, text: string) => void
}

const TODAY = () => todayISO()

function freshState() {
  const platform = buildPlatformSeed()
  return {
    ...platform,
    role: "student" as Role,
    loggedIn: false,
    currentStudentId: DEMO_STUDENT_ID,
    principalOrgId: "org-xh",
    subject: "math" as SubjectId,
    learning: { [DEMO_STUDENT_ID]: buildDemoLearning() } as Record<string, LearningState>,
    guideOpen: false,
    guideVisited: [] as string[],
    usedIdemKeys: platform.ledger.map((l) => l.idempotencyKey),
    lastTxn: undefined,
  }
}

export function isFeatureOn(flags: FeatureFlag[], key: string, orgId?: string) {
  const f = flags.find((x) => x.key === key)
  if (!f) return true
  if (f.platform === "force_off") return false
  const o = orgId ? f.orgOverrides[orgId] : undefined
  if (o !== undefined) return o
  return f.platform === "on"
}

export function todayDayOf(L: LearningState) {
  if (!L.plan) return 0
  return diffDays(L.plan.startDate, TODAY()) + 1
}

function addEvidence(L: LearningState, kid: string, type: EvidenceType, to: MasteryStatus, delta: number, note: string, counts = true) {
  const cur = L.mastery[kid]
  const from = cur.status
  const score = clampScore(to, cur.score + delta)
  L.mastery[kid] = { ...cur, status: to, score, updatedAt: nowISO(), notLearned: cur.notLearned && to === "undiagnosed" }
  L.evidence.push({ id: uid("ev"), knowledgeId: kid, subject: KP[kid].subject, type, from, to, scoreDelta: delta, note, at: nowISO(), countsForMastery: counts })
}

function addAttempt(L: LearningState, qid: string, answer: string, mode: Attempt["mode"], sec: number, taskId?: string) {
  const q = Q[qid]
  const a: Attempt = { id: uid("att"), questionId: qid, taskId, knowledgeId: q.knowledgeId, subject: q.subject, answer, correct: q.answer === answer, durationSec: sec, at: nowISO(), mode }
  L.attempts.push(a)
  return a
}

function taskFromPlanItem(it: PlanItem, L: LearningState): LearningTask {
  const used = L.attempts.map((a) => a.questionId)
  const q = it.type === "practice" || it.type === "review" ? pickPractice(it.knowledgeId) : it.type === "variant" ? pickVariant(it.knowledgeId, used) : undefined
  const pr: Record<TaskType, LearningTask["priority"]> = { learn: "P0", practice: "P0", correction: "P0", variant: "P1", review: "P1", stage: "P1", remediate: "P0", worksheet: "P2" }
  return {
    id: uid("t"), date: TODAY(), type: it.type, subject: it.subject, knowledgeId: it.knowledgeId, title: it.title, priority: pr[it.type], dependsOn: [], status: "todo",
    source: it.type === "stage" ? "阶段检测" : it.type === "review" ? "复习" : "计划", planItemId: it.id, minutes: it.minutes,
    completionRule: it.type === "learn" ? "阅读知识卡并完成要点自检" : it.type === "practice" ? "独立作答；错题须订正并通过变式验证" : it.type === "stage" ? "全部题目独立作答，高权重证据" : "按任务要求完成并回写证据",
    questionId: q?.id,
  }
}

function linkDeps(tasks: LearningTask[]) {
  for (const t of tasks) {
    if (t.type === "practice" || t.type === "variant") {
      const learn = tasks.find((x) => x.type === "learn" && x.knowledgeId === t.knowledgeId && x.id !== t.id)
      if (learn && !t.dependsOn.includes(learn.id)) t.dependsOn.push(learn.id)
    }
  }
}

function doReplan(L: LearningState, trigger: string, summary: string) {
  if (!L.plan) return 0
  const prev = L.plan.versions.find((v) => v.version === L.plan!.activeVersion)!
  const version = Math.max(...L.plan.versions.map((v) => v.version)) + 1
  const pv = generatePlan({
    mastery: L.mastery, startDate: L.plan.startDate, version, trigger, summary, createdAt: nowISO(), fromDay: todayDayOf(L) + 1, prev, budgetMin: L.dailyBudgetMin, notLearned: L.scope?.notLearnedKps,
  })
  L.plan.versions.push(pv)
  L.plan.activeVersion = version
  return version
}

function riskAndRemediation(s: StoreState, L: LearningState, kid: string, failures: number, evidenceNote: string) {
  const subject = KP[kid].subject
  const strat = s.strategies.find((x) => x.subject === subject && x.stage === "初中")
  const sv = strat ? `${strat.id}@${strat.version}` : "default@v1"
  const prereq = KP[kid].prerequisites[0]
  if (failures >= (strat?.params.failToRisk ?? 3)) {
    L.remediations.push({ id: uid("rem"), knowledgeId: kid, subject, level: 3, trigger: `连续第 ${failures} 次独立训练失败`, action: "标记持续薄弱 / 风险 → 进入轻量教师关注队列（学习不中断）", strategyVersion: sv, at: nowISO() })
    s.riskQueue.unshift({ id: uid("rk"), studentId: L.studentId, orgId: s.students.find((x) => x.id === L.studentId)?.orgId ?? "", knowledgeId: kid, failures, level: 3, lastEvidence: evidenceNote, at: nowISO(), status: "待处理" })
    return 3
  }
  if (failures >= (strat?.params.failToDowngrade ?? 2)) {
    L.remediations.push({ id: uid("rem"), knowledgeId: kid, subject, level: 2, trigger: `第 ${failures} 次失败（${evidenceNote}）`, action: `降低难度 1 级${prereq ? ` + 回退前置「${KP[prereq].name}」再学习` : ""} → 新变式验证`, strategyVersion: sv, at: nowISO() })
    const t: LearningTask = {
      id: uid("t"), date: TODAY(), type: "remediate", subject, knowledgeId: prereq ?? kid, title: prereq ? `补弱 · 回退前置「${KP[prereq].name}」` : `补弱 · 降难练习「${KP[kid].name}」`, priority: "P0", dependsOn: [], status: "todo", source: "补弱",
      minutes: 12, completionRule: "降难再学习 + 新变式验证", questionId: pickPractice(prereq ?? kid)?.id,
    }
    L.tasks.push(t)
    return 2
  }
  L.remediations.push({ id: uid("rem"), knowledgeId: kid, subject, level: 1, trigger: `首次错误（${evidenceNote}）`, action: "错因识别 → 针对性讲解/知识回看 → 订正 → 独立变式验证", strategyVersion: sv, at: nowISO() })
  return 1
}

function audit(s: StoreState, actor: string, role: string, action: string, target: string, detail: string) {
  const a: AuditLog = { id: uid("AU"), at: nowISO(), actor, role, action, target, detail, ip: role.startsWith("总部") ? "10.2.3.14" : "115.236.9.77" }
  s.audit.unshift(a)
}

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      ...freshState(),

      login: (role) => set((s) => { s.role = role; s.loggedIn = true }),
      logout: () => set((s) => { s.loggedIn = false }),
      setRole: (role) => set((s) => { s.role = role; s.loggedIn = true }),
      setSubject: (v) => set((s) => { s.subject = v }),
      setGuideOpen: (v) => set((s) => { s.guideOpen = v }),
      markVisited: (key) => set((s) => { if (!s.guideVisited.includes(key)) s.guideVisited.push(key) }),
      switchStudent: (id) => set((s) => {
        s.currentStudentId = id
        if (!s.learning[id]) s.learning[id] = emptyLearning(id)
      }),
      setPrincipalOrg: (id) => set((s) => { s.principalOrgId = id }),
      resetAll: () => set(() => ({ ...freshState(), loggedIn: true })),
      resetStudentFresh: () => set((s) => { s.learning[s.currentStudentId] = emptyLearning(s.currentStudentId) }),

      setBudget: (m) => set((s) => { s.learning[s.currentStudentId].dailyBudgetMin = m }),
      confirmScope: (textbook, chapters) => set((s) => {
        const L = s.learning[s.currentStudentId]
        L.scope = scopeFrom(textbook, chapters, nowISO())
      }),
      completeDiagnostic: (attempts, totalSec) => set((s) => {
        const L = s.learning[s.currentStudentId]
        const scope = L.scope ?? scopeFrom({ math: "人教版", physics: "人教版", chemistry: "人教版" }, { math: "22 二次函数", physics: "17 欧姆定律", chemistry: "5 化学方程式" }, nowISO())
        L.scope = scope
        for (const a of attempts) addAttempt(L, a.questionId, a.answer, "诊断", a.durationSec)
        const tested = new Map<string, boolean>()
        for (const a of attempts) tested.set(Q[a.questionId].knowledgeId, a.correct)
        for (const kid of scope.notLearnedKps) L.mastery[kid] = { ...L.mastery[kid], status: "undiagnosed", score: 0, notLearned: true }
        for (const [kid, ok] of tested) {
          L.mastery[kid] = { ...L.mastery[kid], notLearned: false }
          addEvidence(L, kid, "诊断", ok ? "mastered" : "weak", ok ? 82 : 35 - L.mastery[kid].score, ok ? "诊断题独立作答正确" : "诊断题错误，判定薄弱")
          // 前置推断：答对则前置视为掌握；答错则前置标为待诊断学习中
          for (const p of KP[kid].prerequisites) {
            if (tested.has(p) || !scope.coveredKps.includes(p)) continue
            if (ok && L.mastery[p].status === "undiagnosed") addEvidence(L, p, "诊断", "mastered", 78, `前置推断：后继「${KP[kid].name}」作答正确`)
            else if (!ok && L.mastery[p].status === "undiagnosed") addEvidence(L, p, "诊断", "learning", 50, `前置推断：后继「${KP[kid].name}」错误，前置需确认`)
          }
        }
        L.diagnosed = true
        L.diagnostic = { id: uid("diag"), batch: `DX-${TODAY().replaceAll("-", "")}-${String(Math.floor(Math.random() * 90) + 10)}`, at: nowISO(), attempts, totalSec, scope }
        L.sessions.push({ id: uid("ss"), date: TODAY(), minutes: Math.max(5, Math.round(totalSec / 60)), subject: "math", title: "首次诊断", kind: "diagnostic" })
      }),
      generatePlanFromDiagnosis: () => {
        let v = 1
        set((s) => {
          const L = s.learning[s.currentStudentId]
          const weakCount = Object.values(L.mastery).filter((m) => m.status === "weak").length
          if (!L.plan) {
            const pv = generatePlan({ mastery: L.mastery, startDate: TODAY(), version: 1, trigger: "首次诊断", createdAt: nowISO(), budgetMin: L.dailyBudgetMin, notLearned: L.scope?.notLearnedKps, summary: `依据首次诊断：${weakCount} 个薄弱知识点按前置关系排序；未学章节不判薄弱，按教材进度新授` })
            L.plan = { id: uid("plan"), startDate: TODAY(), days: 30, goal: "补齐诊断薄弱点，按教材进度推进", dailyCapacityMin: L.dailyBudgetMin, versions: [pv], activeVersion: 1 }
            L.tasks = pv.items.filter((i) => i.day === 1).map((i) => taskFromPlanItem(i, L))
            linkDeps(L.tasks)
            L.streak = 1
          } else {
            v = doReplan(L, "重新诊断", `重新诊断后：${weakCount} 个薄弱知识点，重排后续计划（历史版本保留）`)
          }
          v = L.plan!.activeVersion
        })
        return v
      },
      startTask: (id) => set((s) => {
        const t = s.learning[s.currentStudentId].tasks.find((x) => x.id === id)
        if (t && t.status === "todo") t.status = "doing"
      }),
      finishLearn: (taskId) => set((s) => {
        const L = s.learning[s.currentStudentId]
        const t = L.tasks.find((x) => x.id === taskId)!
        const st = L.mastery[t.knowledgeId].status
        if (st === "weak" || st === "undiagnosed") addEvidence(L, t.knowledgeId, t.type === "remediate" ? "补弱" : "知识学习", "learning", 8, `完成知识卡「${KP[t.knowledgeId].name}」`)
        if (t.type !== "remediate") {
          t.status = "done"
          t.result = { at: nowISO(), summary: "已完成知识卡学习", nextAction: "进入专项练习" }
        }
        L.sessions.push({ id: uid("ss"), date: TODAY(), minutes: t.minutes, subject: t.subject, title: t.title, kind: t.type })
      }),
      completeTask: (taskId, summary, next, correct) => set((s) => {
        const L = s.learning[s.currentStudentId]
        const t = L.tasks.find((x) => x.id === taskId)
        if (!t) return
        t.status = "done"
        t.result = { at: nowISO(), summary, nextAction: next, correct }
        L.sessions.push({ id: uid("ss"), date: TODAY(), minutes: t.minutes, subject: t.subject, title: t.title, kind: t.type })
      }),
      answerPractice: (taskId, qid, answer, sec) => {
        let out: { correct: boolean; errorId?: string } = { correct: false }
        set((s) => {
          const L = s.learning[s.currentStudentId]
          const t = L.tasks.find((x) => x.id === taskId)
          const a = addAttempt(L, qid, answer, "练习", sec, taskId)
          const kid = Q[qid].knowledgeId
          if (a.correct) {
            addEvidence(L, kid, t?.type === "remediate" ? "补弱" : "作答", "pending", 10, `练习 ${qid} 独立作答正确，待变式验证`)
            out = { correct: true }
          } else {
            addEvidence(L, kid, "作答", "weak", -6, `练习 ${qid} 错选 ${answer}，进入错因与订正`)
            const err: ErrorRecord = { id: uid("err"), questionId: qid, knowledgeId: kid, subject: Q[qid].subject, attemptIds: [a.id], corrections: [], verifications: [], status: "待订正", risk: false, createdAt: nowISO() }
            L.errors.unshift(err)
            if (t) t.errorId = err.id
            riskAndRemediation(s as StoreState, L, kid, 1, `${qid} 错误`)
            out = { correct: false, errorId: err.id }
          }
        })
        return out
      },
      submitCorrection: (errorId, errorType, note, answer) => set((s) => {
        const L = s.learning[s.currentStudentId]
        const e = L.errors.find((x) => x.id === errorId)!
        e.errorType = errorType
        e.corrections.push({ at: nowISO(), errorType, note, answer })
        e.status = "待验证"
        addEvidence(L, e.knowledgeId, "订正", "pending", 0, `订正完成（错因：${errorType}）；订正不直接判定掌握`, false)
      }),
      verifyVariant: (taskId, errorId, qid, answer, sec) => {
        let out: { correct: boolean; level: number; version?: number; fallbackKp?: string } = { correct: false, level: 0 }
        set((s) => {
          const L = s.learning[s.currentStudentId]
          const t = L.tasks.find((x) => x.id === taskId)
          const a = addAttempt(L, qid, answer, "变式验证", sec, taskId)
          const kid = Q[qid].knowledgeId
          let e = errorId ? L.errors.find((x) => x.id === errorId) : undefined
          if (a.correct) {
            if (e) { e.verifications.push({ id: uid("vv"), questionId: qid, answer, correct: true, at: nowISO() }); e.status = "已验证" }
            addEvidence(L, kid, "变式验证", "mastered", 15, `变式题 ${qid}（不同题目）独立作答正确 → 判定掌握`)
            if (t) { t.status = "done"; t.result = { at: nowISO(), correct: true, summary: "变式独立验证通过", nextAction: "掌握度更新，后续计划已重排" } }
            const v = doReplan(L, `变式验证通过：「${KP[kid].name}」`, `「${KP[kid].name}」由证据判定已掌握：移除冗余练习，后续任务前移；新增延迟复习`)
            L.sessions.push({ id: uid("ss"), date: TODAY(), minutes: t?.minutes ?? 10, subject: KP[kid].subject, title: t?.title ?? "变式验证", kind: "variant" })
            out = { correct: true, level: 0, version: v }
          } else {
            if (!e) {
              e = { id: uid("err"), questionId: qid, knowledgeId: kid, subject: Q[qid].subject, attemptIds: [a.id], corrections: [], verifications: [], status: "验证失败", risk: false, createdAt: nowISO() }
              L.errors.unshift(e)
            }
            e.verifications.push({ id: uid("vv"), questionId: qid, answer, correct: false, at: nowISO() })
            e.status = "验证失败"
            const failures = e.attemptIds.length - (e.attemptIds.length > 1 ? 1 : 0) + e.verifications.filter((v) => !v.correct).length
            const level = riskAndRemediation(s as StoreState, L, kid, failures, `变式 ${qid} 错误`)
            if (level === 3) e.risk = true
            addEvidence(L, kid, "变式验证", "weak", -8, `变式题 ${qid} 独立作答错误（第 ${failures} 次失败）→ 多级补弱 L${level}`)
            if (t) { t.status = "failed"; t.result = { at: nowISO(), correct: false, summary: `变式验证失败（L${level} 补弱）`, nextAction: level === 3 ? "风险标记 → 教师关注队列" : "降难 + 回退前置，任务不消失" } }
            const v = doReplan(L, `变式验证失败：「${KP[kid].name}」`, `「${KP[kid].name}」验证失败，插入补弱与回退前置任务，低优先级任务顺延`)
            out = { correct: false, level, version: v, fallbackKp: KP[kid].prerequisites[0] }
          }
        })
        return out
      },
      answerReview: (taskId, qid, answer, sec) => {
        let out: { correct: boolean; version?: number } = { correct: false }
        set((s) => {
          const L = s.learning[s.currentStudentId]
          const t = L.tasks.find((x) => x.id === taskId)!
          const a = addAttempt(L, qid, answer, "变式验证", sec, taskId)
          const kid = Q[qid].knowledgeId
          if (a.correct) {
            addEvidence(L, kid, "延迟复习", "mastered", 3, `延迟复习 ${qid} 正确 → 保持证据 +1`)
            t.status = "done"; t.result = { at: nowISO(), correct: true, summary: "复习保持", nextAction: "下次复习间隔 14 天" }
            out = { correct: true }
          } else {
            addEvidence(L, kid, "延迟复习", "review", -15, `延迟复习 ${qid} 错误 → 状态回退为「需复习」`)
            t.status = "failed"; t.result = { at: nowISO(), correct: false, summary: "复习失败，状态回退", nextAction: "进入补弱并重排" }
            const v = doReplan(L, `延迟复习失败：「${KP[kid].name}」`, `「${KP[kid].name}」已掌握 → 需复习（新证据回退），重新安排练习与验证`)
            out = { correct: false, version: v }
          }
        })
        return out
      },
      submitStage: (taskId, answers) => {
        let out = { correct: 0, total: 0, version: 0 }
        set((s) => {
          const L = s.learning[s.currentStudentId]
          const t = L.tasks.find((x) => x.id === taskId)!
          let c = 0
          for (const [qid, ans] of Object.entries(answers)) {
            const a = addAttempt(L, qid, ans, "阶段检测", 60, taskId)
            const kid = Q[qid].knowledgeId
            const st = L.mastery[kid].status
            if (a.correct) {
              c++
              addEvidence(L, kid, "阶段检测", "mastered", st === "mastered" ? 4 : 14, st === "mastered" ? "阶段检测：保持已掌握" : "阶段检测（高权重）独立作答正确 → 判定掌握")
            } else {
              addEvidence(L, kid, "阶段检测", "weak", -12, `阶段检测 ${qid} 错误（高权重）`)
              L.errors.unshift({ id: uid("err"), questionId: qid, knowledgeId: kid, subject: Q[qid].subject, attemptIds: [a.id], corrections: [], verifications: [], status: "待订正", risk: false, createdAt: nowISO() })
            }
          }
          t.status = "done"
          t.result = { at: nowISO(), correct: c === Object.keys(answers).length, summary: `阶段检测 ${c}/${Object.keys(answers).length}`, nextAction: "触发计划重排" }
          const v = doReplan(L, `阶段检测完成：${t.title}`, `阶段检测 ${c}/${Object.keys(answers).length}：通过项判定掌握，失败项转薄弱并插入补弱`)
          L.sessions.push({ id: uid("ss"), date: TODAY(), minutes: t.minutes, subject: t.subject, title: t.title, kind: "stage" })
          out = { correct: c, total: Object.keys(answers).length, version: v }
        })
        return out
      },
      markWorksheet: (id, status) => set((s) => {
        const w = s.learning[s.currentStudentId].worksheets.find((x) => x.id === id)
        if (w) w.status = status
      }),
      gradeWorksheet: (id) => set((s) => {
        const L = s.learning[s.currentStudentId]
        const w = L.worksheets.find((x) => x.id === id)
        if (!w) return
        w.grading = w.questionIds.map((qid, i) => {
          const q = Q[qid]
          if (i === w.questionIds.length - 1) return { questionId: qid, recognized: "?", result: "待人工确认" as const }
          const wrong = i === 1 && w.subject !== "math"
          return { questionId: qid, recognized: wrong ? (q.answer === "A" ? "B" : "A") : q.answer, result: wrong ? ("错误" as const) : ("正确" as const) }
        })
        const graded = w.grading.filter((g) => g.result !== "待人工确认")
        w.accuracy = Math.round((graded.filter((g) => g.result === "正确").length / Math.max(1, graded.length)) * 100)
        w.gradedAt = nowISO()
        w.status = w.grading.some((g) => g.result === "错误") ? "需订正" : "已批改"
        for (const g of w.grading) {
          if (g.result === "待人工确认") {
            s.manualQueue.unshift({ id: uid("mc"), studentId: L.studentId, orgId: s.students.find((x) => x.id === L.studentId)?.orgId ?? "", worksheetId: w.id, questionId: g.questionId, recognized: "?", confidence: 0.46, reason: "OCR 置信度 0.46 < 0.75，不伪造正确率", status: "待确认", at: nowISO() })
            continue
          }
          addAttempt(L, g.questionId, g.recognized, "纸质学案", 90)
          const kid = Q[g.questionId].knowledgeId
          const st = L.mastery[kid].status
          addEvidence(L, kid, "纸质学案", g.result === "正确" ? (st === "weak" ? "learning" : st) : st === "mastered" ? "review" : "weak", g.result === "正确" ? 4 : -6, `纸质学案 ${w.title} 第 ${w.questionIds.indexOf(g.questionId) + 1} 题${g.result}`)
        }
        const t = L.tasks.find((x) => x.id === w.taskId)
        if (t) { t.status = "done"; t.result = { at: nowISO(), summary: `学案批改 ${w.accuracy}%（1 题待人工确认）`, nextAction: "结果已回写证据体系" } }
      }),
      logAI: (log) => set((s) => { s.aiLogs.unshift({ ...log, id: `AIR-${20932 + s.aiLogs.length}`, at: nowISO() }) }),
      addAIValidationLog: (kid, purpose) => {
        const v: AIValidation[] = [
          { check: "输出结构完整（题干/选项/答案/解析）", pass: true, detail: "JSON Schema 校验通过" },
          { check: "学科/学段/年级/知识点范围匹配", pass: true, detail: `${kid} · ${KP[kid].chapter}，未越级` },
          { check: "题型与难度约束", pass: true, detail: "单选 · 难度 3（策略 2–4）" },
          { check: "答案与解析一致性", pass: true, detail: "逐步推导结果 = 标注答案" },
          { check: "与原题/近期题目重复度", pass: true, detail: "相似度 0.29 < 0.6，非仅数字替换" },
          { check: "学科表达合法性", pass: true, detail: "KaTeX 解析通过" },
        ]
        const s = get()
        const st = s.students.find((x) => x.id === s.currentStudentId)
        get().logAI({
          scene: "变式生成", studentId: s.currentStudentId,
          context: { subject: KP[kid].subject, stage: st?.stage ?? "初中", grade: st?.grade ?? "初三", textbook: KP[kid].textbook, knowledgeId: kid, taskType: "variant", masteryState: s.learning[s.currentStudentId].mastery[kid].status, difficulty: 3, questionType: "单选", purpose },
          promptVersion: `variant.${KP[kid].subject === "math" ? "math" : KP[kid].subject === "physics" ? "phy" : "chem"}.junior@v2.3`, strategyVersion: "math-junior@v1.3", model: "DeepSeek · variant-gen", route: "主路由", tokens: 1760, latencyMs: 1240, costCny: 0.007, status: "成功", validations: v,
        })
        return v
      },

      createOrg: (o) => {
        const id = uid("org")
        set((s) => {
          s.orgs.unshift({ ...o, id, status: "启用", studentQuota: 200, servicePeriod: `${TODAY()} ~ ${addDays(TODAY(), 365)}`, createdAt: nowISO() })
          audit(s as StoreState, "赵敏", "总部运营", "创建机构", o.name, `编码 ${o.code} · 学科 ${o.subjects.map((x) => SUBJECTS[x].name).join("/")}`)
        })
        return id
      },
      toggleOrg: (id) => set((s) => {
        const o = s.orgs.find((x) => x.id === id)!
        o.status = o.status === "启用" ? "停用" : "启用"
        audit(s as StoreState, "赵敏", "总部运营", o.status === "停用" ? "机构停用" : "机构启用", o.name, "历史数据保留，权限即时生效")
      }),
      bindPrincipal: (orgId, name, account, phone) => {
        const id = uid("pr")
        set((s) => {
          s.principals.unshift({ id, name, account, phone, orgId, status: "启用", createdAt: nowISO() })
          const o = s.orgs.find((x) => x.id === orgId)!
          o.principalId = id
          audit(s as StoreState, "赵敏", "总部运营", "绑定校长账号", o.name, `${name}（${account}）绑定唯一机构，角色：机构管理员`)
        })
        return id
      },
      allocate: (orgId, pkg, qty, reason, idem, op = "总部拨付") => {
        let r = { ok: true, msg: "" }
        set((s) => {
          if (s.usedIdemKeys.includes(idem)) { r = { ok: false, msg: `重复请求已拦截：幂等键 ${idem} 已处理，未重复拨付` }; audit(s as StoreState, "系统", "幂等", "重复请求拦截", orgId, idem); return }
          const o = s.orgs.find((x) => x.id === orgId)!
          if (o.status !== "启用") { r = { ok: false, msg: "机构已停用，禁止拨付" }; return }
          if (qty <= 0) { r = { ok: false, msg: "数量必须为正整数" }; return }
          const hasPrev = s.ledger.some((l) => l.orgId === orgId && l.packageType === pkg && (l.op === "总部拨付" || l.op === "总部追加"))
          const allocationId = `AL-${o.code.split("-")[0]}-${String(s.ledger.length + 1).padStart(4, "0")}`
          s.ledger.push(makeLedger(s.ledger, { orgId, packageType: pkg, op: hasPrev && op === "总部拨付" ? "总部追加" : op, change: qty, operator: "总部·运营 赵敏", occurredAt: nowISO(), allocationId, reason, idempotencyKey: idem }))
          s.usedIdemKeys.push(idem)
          audit(s as StoreState, "赵敏", "总部运营", "库存拨付", o.name, `${PKG_NAME[pkg]} +${qty}（${allocationId}）`)
          r = { ok: true, msg: `已拨付 ${PKG_NAME[pkg]} ${qty} 张（${allocationId}）` }
        })
        return r
      },
      adjust: (orgId, pkg, qty, op, reason) => {
        let r = { ok: true, msg: "" }
        set((s) => {
          const inv = inventoryOf(s.ledger, orgId, pkg)
          if (op !== "解冻" && qty > inv.available) { r = { ok: false, msg: `可用库存仅 ${inv.available} 张，操作被拒绝（库存不得为负）` }; return }
          if (op === "解冻" && qty > inv.frozen) { r = { ok: false, msg: `冻结库存仅 ${inv.frozen} 张` }; return }
          const o = s.orgs.find((x) => x.id === orgId)!
          s.ledger.push(makeLedger(s.ledger, { orgId, packageType: pkg, op, change: op === "解冻" ? qty : -qty, operator: "总部·运营 赵敏", occurredAt: nowISO(), reason, idempotencyKey: uid("idem") }))
          audit(s as StoreState, "赵敏", "总部运营", `库存${op}`, o.name, `${PKG_NAME[pkg]} ${op === "解冻" ? "+" : "−"}${qty}：${reason}`)
          r = { ok: true, msg: `已${op} ${PKG_NAME[pkg]} ${qty} 张` }
        })
        return r
      },
      createStudent: (orgId, name, grade) => {
        let r: { ok: boolean; msg: string; id?: string } = { ok: false, msg: "" }
        set((s) => {
          const o = s.orgs.find((x) => x.id === orgId)!
          if (o.status !== "启用") { r = { ok: false, msg: "机构已停用，不得新增学生" }; return }
          const id = uid("stu")
          const stage: StudentAccount["stage"] = grade.includes("年级") ? "小学" : grade.startsWith("高") ? "高中" : "初中"
          s.students.unshift({ id, orgId, name, account: `${o.code.toLowerCase().replaceAll("-", "")}${String(s.students.length + 1).padStart(3, "0")}`, grade, stage, status: "启用", createdAt: nowISO() })
          s.learning[id] = emptyLearning(id)
          const pr = s.principals.find((p) => p.id === o.principalId)
          audit(s as StoreState, pr?.name ?? "校长", "机构校长", "创建学生", o.name, `${name}（${grade}）`)
          r = { ok: true, msg: `已创建学生 ${name}`, id }
        })
        return r
      },
      importStudents: (orgId, names) => {
        let n = 0
        for (const nm of names) if (get().createStudent(orgId, nm, "初三").ok) n++
        return n
      },
      toggleStudent: (id) => set((s) => {
        const st = s.students.find((x) => x.id === id)!
        st.status = st.status === "启用" ? "停用" : "启用"
        audit(s as StoreState, "校长", "机构校长", st.status === "停用" ? "停用学生" : "启用学生", st.name, "学习记录保留")
      }),
      assignEntitlement: (orgId, studentId, pkg, idem) => {
        let r: { ok: boolean; msg: string; code?: string } = { ok: false, msg: "" }
        set((s) => {
          // 服务端判定（演示）：机构范围 → 机构状态 → 套餐授权 → 库存 → 幂等 → 原子事务
          const st = s.students.find((x) => x.id === studentId)
          const o = s.orgs.find((x) => x.id === orgId)!
          if (!st || st.orgId !== orgId) { r = { ok: false, code: "TENANT_SCOPE_DENIED", msg: "跨机构操作被拒绝：该学生不属于本机构" }; audit(s as StoreState, "系统", "安全", "越权拒绝", o.name, `assign ${studentId}`); return }
          if (o.status !== "启用") { r = { ok: false, code: "ORG_DISABLED", msg: "机构已停用，不得分配新权益" }; return }
          if (!o.packages.includes(pkg)) { r = { ok: false, code: "PACKAGE_NOT_ALLOWED", msg: `总部未授权本机构使用${PKG_NAME[pkg]}` }; return }
          if (s.usedIdemKeys.includes(idem)) { r = { ok: false, code: "DUPLICATE_REQUEST", msg: "重复提交已拦截：未重复扣卡、未重复开通" }; audit(s as StoreState, "系统", "幂等", "重复请求拦截", o.name, idem); return }
          const inv = inventoryOf(s.ledger, orgId, pkg)
          if (inv.available <= 0) { r = { ok: false, code: "INVENTORY_INSUFFICIENT", msg: `${PKG_NAME[pkg]}可用库存为 0，服务端拒绝分配` }; return }
          if (s.entitlements.some((e) => e.studentId === studentId && e.status === "有效" && e.packageType === pkg)) { r = { ok: false, code: "ENTITLEMENT_EXISTS", msg: "该学生已有同类有效权益" }; return }
          const pr = s.principals.find((p) => p.id === o.principalId)
          const lastAlloc = [...s.ledger].reverse().find((l) => l.orgId === orgId && l.packageType === pkg && (l.op === "总部拨付" || l.op === "总部追加"))
          const led = makeLedger(s.ledger, { orgId, packageType: pkg, studentId, op: "分配给学生", change: -1, operator: `校长 ${pr?.name ?? ""}`, occurredAt: nowISO(), allocationId: lastAlloc?.allocationId, reason: `分配给 ${st.name}`, idempotencyKey: idem })
          const pk = PACKAGES.find((p) => p.id === pkg)!
          const entId = `ENT-${Date.now().toString(36).toUpperCase()}`
          // 原子提交：库存扣减 + 权益创建 + 流水
          s.ledger.push(led)
          s.entitlements.unshift({ id: entId, studentId, orgId, packageType: pkg, sourceAllocation: lastAlloc?.allocationId ?? "-", assignedBy: `校长 ${pr?.name ?? ""}`, assignedAt: nowISO(), effectiveAt: nowISO(), expireAt: addDays(TODAY(), pk.days), subjects: o.subjects, functions: pk.functions, status: "有效" })
          s.usedIdemKeys.push(idem)
          s.lastTxn = { ledgerTx: led.transactionId, entitlementId: entId, before: led.before, after: led.after }
          audit(s as StoreState, pr?.name ?? "校长", "机构校长", "分配学生权益", st.name, `${PKG_NAME[pkg]} · 库存 ${led.before}→${led.after} · ${led.transactionId}`)
          r = { ok: true, msg: `已为 ${st.name} 开通${PKG_NAME[pkg]}，库存 ${led.before} → ${led.after}` }
        })
        return r
      },
      setFlagPlatform: (key, v) => set((s) => {
        const f = s.flags.find((x) => x.key === key)!
        f.platform = v
        audit(s as StoreState, "钱航", "总部产品", "功能开关", f.name, `平台级 → ${v}`)
      }),
      setFlagOrg: (key, orgId, v) => set((s) => {
        const f = s.flags.find((x) => x.key === key)!
        if (f.platform === "force_off") return
        if (v === null) delete f.orgOverrides[orgId]
        else f.orgOverrides[orgId] = v
        audit(s as StoreState, "钱航", "总部产品", "功能开关", f.name, `机构 ${orgId} → ${v === null ? "继承" : v ? "开启" : "关闭"}`)
      }),
      resolveManual: (id, correct) => set((s) => {
        const m = s.manualQueue.find((x) => x.id === id)!
        m.status = correct ? "已确认正确" : "已确认错误"
        const L = s.learning[m.studentId]
        if (L && Q[m.questionId]) {
          const kid = Q[m.questionId].knowledgeId
          addAttempt(L, m.questionId, correct ? Q[m.questionId].answer : "X", "纸质学案", 90)
          addEvidence(L, kid, "纸质学案", correct ? L.mastery[kid].status : "weak", correct ? 3 : -6, `教师人工确认纸质作答${correct ? "正确" : "错误"}（OCR 不确定项）`)
        }
        audit(s as StoreState, "王老师", "教师", "人工确认", m.questionId, correct ? "确认正确" : "确认错误")
      }),
      feedbackRisk: (id, text) => set((s) => {
        const r = s.riskQueue.find((x) => x.id === id)!
        r.status = "已反馈"
        const L = s.learning[r.studentId]
        if (L) L.feedback.unshift({ id: uid("fb"), at: nowISO(), teacher: "王老师", text, knowledgeId: r.knowledgeId })
        audit(s as StoreState, "王老师", "教师", "风险反馈", r.studentId, text.slice(0, 30))
      }),
    })),
    { name: "ai-learning-demo-v14", version: 4 },
  ),
)

// ───────── selectors ─────────
export const useLearning = () => useStore((s) => s.learning[s.currentStudentId])
export const useCurrentStudent = () => useStore((s) => s.students.find((x) => x.id === s.currentStudentId))

export function activeEntitlement(s: Pick<StoreState, "entitlements">, sid: string) {
  const today = TODAY()
  return s.entitlements.find((e) => e.studentId === sid && e.status === "有效" && e.expireAt >= today)
}

/** 今日队列：按优先级 + 依赖 + 时间预算计算（超出预算顺延） */
export function computeQueue(L: LearningState) {
  const rank = { P0: 0, P1: 1, P2: 2 }
  const sorted = [...L.tasks].sort((a, b) => {
    const da = a.status === "done" || a.status === "failed" ? 0 : 1
    const db = b.status === "done" || b.status === "failed" ? 0 : 1
    if (da !== db) return da - db
    return rank[a.priority] - rank[b.priority] || L.tasks.indexOf(a) - L.tasks.indexOf(b)
  })
  let used = 0
  return sorted.map((t) => {
    used += t.minutes
    const locked = t.dependsOn.some((d) => {
      const dep = L.tasks.find((x) => x.id === d)
      return dep && dep.status !== "done"
    })
    const over = t.status !== "done" && t.status !== "failed" && used > L.dailyBudgetMin
    return { task: t, locked, deferred: over, cumulative: used }
  })
}

export function questionsForStage(kid: string) {
  const kps = [kid, ...KP[kid].prerequisites, ...successorsOf(kid).map((k) => k.id), ...KP[kid].prerequisites.flatMap((p) => KP[p].prerequisites)]
  const out: string[] = []
  for (const k of kps) {
    const qs = questionsOfKp(k)
    const q = qs.filter((x) => x.variantOf).at(-1) ?? qs[0]
    if (q && !out.includes(q.id) && out.length < 3) out.push(q.id)
  }
  return out
}
