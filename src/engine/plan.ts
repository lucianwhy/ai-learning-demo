import { pickPractice } from "@/data/questions"
import { KNOWLEDGE, KP, SUBJECT_LIST, TASK_META, successorsOf } from "@/data/knowledge"
import type { MasteryState, PlanChange, PlanItem, PlanVersion, SubjectId, TaskType } from "@/data/types"
import { addDays } from "./date"

/** 学习规则参数（PRD 4.5：算法参数配置化） */
export const PLAN_RULES = {
  days: 30,
  itemsPerDay: 3,
  dailyCapacityMin: 50,
  stageDays: [7, 14, 21, 28],
  worksheetEvery: 5,
  minutes: { learn: 12, practice: 15, correction: 10, variant: 8, stage: 20, worksheet: 20, review: 8, remediate: 12 } as Record<TaskType, number>,
}

type Mastery = Record<string, MasteryState>

function depth(id: string, memo: Record<string, number> = {}): number {
  if (memo[id] !== undefined) return memo[id]
  const k = KP[id]
  const d = k.prerequisites.length ? 1 + Math.max(...k.prerequisites.map((p) => depth(p, memo))) : 0
  memo[id] = d
  return d
}

export function topoOrder(subject: SubjectId) {
  return KNOWLEDGE.filter((k) => k.subject === subject).sort((a, b) => depth(a.id) - depth(b.id) || KNOWLEDGE.indexOf(a) - KNOWLEDGE.indexOf(b))
}

const nm = (id: string) => `「${KP[id].name}」`

export function reasonFor(type: TaskType, kid: string, m: Mastery): string {
  const st = m[kid]?.status ?? "undiagnosed"
  const succ = successorsOf(kid)[0]
  const prereq = KP[kid].prerequisites.find((p) => m[p]?.status === "mastered")
  switch (type) {
    case "learn":
      if (st === "weak") return `诊断/作答证据显示${nm(kid)}薄弱${succ ? `，且是${nm(succ.id)}的前置` : ""}，优先补齐`
      if (prereq) return `前置${nm(prereq)}已掌握，按知识图谱顺序进入${nm(kid)}`
      return `${nm(kid)}尚无学习证据，安排知识卡起步`
    case "practice":
      if (st === "review") return `${nm(kid)}需复习：距上次独立验证已超过 7 天，按遗忘曲线安排`
      return `完成知识卡后需作答产生证据；目标：${nm(kid)}正确率 ≥ 80%`
    case "variant":
      if (st === "pending") return `${nm(kid)}待验证：已订正，需用不同题目独立验证后才能判定掌握`
      return `练习后必须通过变式题独立验证，AI讲解/看答案不计入${nm(kid)}掌握度`
    case "correction":
      return `${nm(kid)}存在未订正错题，失败任务不得消失，进入订正流程`
    case "worksheet":
      return `纸质学案：线下书写${nm(kid)}完整步骤，回收拍照批改后回写同一证据体系`
    case "stage":
      return `阶段检测（高权重证据）：覆盖近期知识点，结果将触发后续计划重排`
    case "review":
      return `延迟复习：${nm(kid)}已掌握，按复习间隔（3/7/14天）安排独立验证，失败则状态回退`
    case "remediate":
      return `多级补弱：${nm(kid)}连续失败，降难并回退前置知识点后再学习`
  }
}

const TITLE: Record<TaskType, (kid: string) => string> = {
  learn: (k) => `知识卡 · ${KP[k].name}`,
  practice: (k) => `专项练习 · ${KP[k].name}`,
  variant: (k) => `变式验证 · ${KP[k].name}`,
  correction: (k) => `错题订正 · ${KP[k].name}`,
  worksheet: (k) => `纸质学案 · ${KP[k].name}`,
  stage: (k) => `阶段检测 · ${KP[k].chapter.replace(/^\d+\s*/, "")}`,
  review: (k) => `延迟复习 · ${KP[k].name}`,
  remediate: (k) => `补弱 · ${KP[k].name}`,
}

export interface PinnedItem {
  subject: SubjectId
  knowledgeId: string
  type: TaskType
}

function queueFor(subject: SubjectId, m: Mastery, notLearned: string[] = []): { kid: string; type: TaskType }[] {
  // 三档优先级（档内保持前置拓扑序）：诊断出的问题 → 范围内未确认 → 未学章节按进度新授
  const tiers: { kid: string; type: TaskType }[][] = [[], [], []]
  for (const k of topoOrder(subject)) {
    const st = m[k.id]?.status ?? "undiagnosed"
    if (st === "mastered") continue
    if (st === "weak") tiers[0].push({ kid: k.id, type: "learn" }, { kid: k.id, type: "practice" }, { kid: k.id, type: "variant" })
    else if (st === "learning") tiers[0].push({ kid: k.id, type: "practice" }, { kid: k.id, type: "variant" })
    else if (st === "pending") tiers[0].push({ kid: k.id, type: "variant" })
    else if (st === "review") tiers[0].push({ kid: k.id, type: "practice" })
    else tiers[notLearned.includes(k.id) || m[k.id]?.notLearned ? 2 : 1].push({ kid: k.id, type: "learn" }, { kid: k.id, type: "practice" })
  }
  return tiers.flat()
}

/**
 * 30 天计划引擎（演示版）：
 * 输入 = 掌握度 + 知识前置关系 + 每日容量；frozenBeforeDay 之前的计划项沿用历史版本，不被重排覆盖。
 */
export function generatePlan(opts: {
  mastery: Mastery
  startDate: string
  version: number
  trigger: string
  summary: string
  createdAt: string
  fromDay?: number
  prev?: PlanVersion
  pinned?: Record<number, PinnedItem[]>
  budgetMin?: number
  notLearned?: string[]
}): PlanVersion {
  const { mastery: m, startDate, version, prev } = opts
  const fromDay = opts.fromDay ?? 1
  const items: PlanItem[] = []
  const mk = (day: number, subject: SubjectId, kid: string, type: TaskType, reason?: string): PlanItem => ({
    id: `v${version}-d${day}-${kid}-${type}`,
    key: `${kid}:${type}`,
    day,
    date: addDays(startDate, day - 1),
    subject,
    knowledgeId: kid,
    type,
    title: TITLE[type](kid),
    reason: reason ?? reasonFor(type, kid, m),
    minutes: PLAN_RULES.minutes[type],
  })

  if (prev) for (const it of prev.items) if (it.day < fromDay) items.push(it)

  const queues = Object.fromEntries(SUBJECT_LIST.map((s) => [s, queueFor(s, m, opts.notLearned)])) as Record<SubjectId, { kid: string; type: TaskType }[]>
  // 已固定（今日已下发）的项从队列中移除
  const pinned = opts.pinned ?? {}
  for (const list of Object.values(pinned))
    for (const p of list) {
      const q = queues[p.subject]
      const i = q.findIndex((x) => x.kid === p.knowledgeId && x.type === p.type)
      if (i >= 0) q.splice(i, 1)
    }

  const covered: Record<SubjectId, string[]> = { math: [], physics: [], chemistry: [] }
  let rot = 0
  for (let day = fromDay; day <= PLAN_RULES.days; day++) {
    if (pinned[day]) {
      for (const p of pinned[day]) items.push(mk(day, p.subject, p.knowledgeId, p.type))
      continue
    }
    const dayItems: PlanItem[] = []
    if (PLAN_RULES.stageDays.includes(day)) {
      // 阶段检测：选择近期覆盖最多的学科
      const s = SUBJECT_LIST[(PLAN_RULES.stageDays.indexOf(day) + rot) % 3]
      const kid = covered[s].at(-1) ?? topoOrder(s)[0].id
      const names = [...new Set(covered[s].slice(-3))].map((k) => KP[k].name).join("、")
      dayItems.push(mk(day, s, kid, "stage", `阶段检测（高权重证据）：覆盖近期${names ? `「${names}」` : "知识点"}，结果将触发后续计划重排`))
      covered[s] = []
    }
    if (day % PLAN_RULES.worksheetEvery === 0) {
      const s = SUBJECT_LIST[(day / PLAN_RULES.worksheetEvery) % 3]
      const kid = covered[s].at(-1) ?? topoOrder(s).find((k) => m[k.id]?.status !== "mastered")?.id ?? topoOrder(s)[0].id
      dayItems.push(mk(day, s, kid, "worksheet"))
    }
    const budget = opts.budgetMin ?? PLAN_RULES.dailyCapacityMin
    const used = () => dayItems.reduce((a, b) => a + b.minutes, 0)
    if (!prev && day === fromDay) {
      // 首日闭环：最薄弱知识点「先学后练」同日下发，当天即可产生作答证据
      const weakest = SUBJECT_LIST.map((sub) => ({ sub, q: queues[sub] }))
        .filter(({ q }) => q[0]?.type === "learn" && q[1]?.kid === q[0].kid && q[1]?.type === "practice" && !!pickPractice(q[0].kid))
        .sort((a, b) => (m[a.q[0].kid]?.status === "weak" ? m[a.q[0].kid].score : 999) - (m[b.q[0].kid]?.status === "weak" ? m[b.q[0].kid].score : 999))[0]
      if (weakest) {
        const [l, pr] = weakest.q.splice(0, 2)
        dayItems.push(mk(day, weakest.sub, l.kid, "learn"), mk(day, weakest.sub, pr.kid, "practice", `首日闭环：学完知识卡后立即独立练习，产生第一条作答证据`))
        covered[weakest.sub].push(l.kid)
        rot = (SUBJECT_LIST.indexOf(weakest.sub) + 1) % 3
      }
    }
    for (let i = 0; i < 9; i++) {
      const s = SUBJECT_LIST[(rot + i) % 3]
      const next = queues[s][0]
      if (!next) continue
      if (used() + PLAN_RULES.minutes[next.type] > budget && dayItems.length > 0) break
      queues[s].shift()
      const reason = opts.notLearned?.includes(next.kid) && next.type === "learn" ? `按教材进度新授：${nm(next.kid)}属于未学章节（诊断不判薄弱），从知识卡开始` : undefined
      dayItems.push(mk(day, s, next.kid, next.type, reason))
      covered[s].push(next.kid)
    }
    // 队列耗尽：用已掌握知识点的延迟复习填充
    while (used() + PLAN_RULES.minutes.review <= budget && dayItems.length < 4) {
      const s = SUBJECT_LIST[(rot + dayItems.length) % 3]
      const mastered = topoOrder(s).filter((k) => m[k.id]?.status === "mastered")
      const k = mastered[(day + dayItems.length) % Math.max(1, mastered.length)] ?? topoOrder(s)[0]
      dayItems.push(mk(day, s, k.id, "review", `${nm(k.id)}已掌握，按复习间隔安排延迟独立验证；失败则状态回退`))
    }
    rot = (rot + 1) % 3
    items.push(...dayItems)
  }

  const changes = prev ? diffPlans(prev, items, fromDay, m) : []
  return {
    id: `pv-${version}`,
    version,
    createdAt: opts.createdAt,
    trigger: opts.trigger,
    summary: opts.summary,
    frozenBeforeDay: fromDay,
    items,
    changes,
  }
}

export function diffPlans(prev: PlanVersion, nextItems: PlanItem[], fromDay: number, m: Mastery): PlanChange[] {
  const a = prev.items.filter((i) => i.day >= fromDay)
  const b = nextItems.filter((i) => i.day >= fromDay)
  const am = new Map(a.map((i) => [i.key + (i.type === "review" ? `@${i.day}` : ""), i]))
  const bm = new Map(b.map((i) => [i.key + (i.type === "review" ? `@${i.day}` : ""), i]))
  const out: PlanChange[] = []
  for (const [k, it] of bm) {
    const old = am.get(k)
    const st = m[it.knowledgeId]?.status
    if (!old) {
      out.push({
        kind: "added", key: k, title: it.title, subject: it.subject, toDay: it.day,
        reason: st === "weak" ? `${nm(it.knowledgeId)}最新证据为「薄弱」，插入补弱任务` : st === "pending" ? `${nm(it.knowledgeId)}已订正，插入变式独立验证` : it.reason,
      })
    } else if (old.day !== it.day) {
      out.push({
        kind: "moved", key: k, title: it.title, subject: it.subject, fromDay: old.day, toDay: it.day,
        reason: it.day < old.day ? `前置任务已完成/移除，${TASK_META[it.type].label}提前到第 ${it.day} 天` : `为高优先级补弱任务让出每日容量，顺延到第 ${it.day} 天`,
      })
    }
  }
  for (const [k, it] of am) {
    if (bm.has(k)) continue
    const st = m[it.knowledgeId]?.status
    out.push({
      kind: "removed", key: k, title: it.title, subject: it.subject, fromDay: it.day,
      reason: st === "mastered" ? `${nm(it.knowledgeId)}已通过独立验证/阶段检测判定掌握，移除冗余任务` : `容量重新分配，${TASK_META[it.type].label}合并到后续任务`,
    })
  }
  const order = { added: 0, moved: 1, removed: 2, kept: 3 }
  return out.sort((x, y) => order[x.kind] - order[y.kind] || (x.toDay ?? x.fromDay ?? 0) - (y.toDay ?? y.fromDay ?? 0))
}
