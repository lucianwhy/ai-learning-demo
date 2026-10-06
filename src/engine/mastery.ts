import { KNOWLEDGE } from "@/data/knowledge"
import type { MasteryEvidence, MasteryState, MasteryStatus, SubjectId } from "@/data/types"

export function clampScore(status: MasteryStatus, score: number) {
  let s = Math.max(0, Math.min(100, Math.round(score)))
  if (status === "mastered") s = Math.max(s, 80)
  if (status === "weak") s = Math.min(s, 45)
  if (status === "pending") s = Math.min(Math.max(s, 50), 79)
  if (status === "learning") s = Math.min(Math.max(s, 30), 72)
  if (status === "review") s = Math.min(s, 70)
  return s
}

/** 按证据回放得到掌握度（掌握度只由证据驱动） */
export function replay(evidence: MasteryEvidence[], untilISO?: string): Record<string, MasteryState> {
  const m: Record<string, MasteryState> = {}
  for (const k of KNOWLEDGE) m[k.id] = { knowledgeId: k.id, subject: k.subject, status: "undiagnosed", score: 0, updatedAt: "" }
  const sorted = [...evidence].sort((a, b) => a.at.localeCompare(b.at))
  for (const e of sorted) {
    if (untilISO && e.at.slice(0, 10) > untilISO) break
    if (e.type === "AI讲题") continue // AI 讲解不计入掌握度
    const cur = m[e.knowledgeId]
    const score = e.type === "诊断" ? e.scoreDelta : cur.score + e.scoreDelta
    m[e.knowledgeId] = { ...cur, status: e.to, score: clampScore(e.to, score), updatedAt: e.at }
  }
  return m
}

export function subjectAvg(m: Record<string, MasteryState>, subject: SubjectId) {
  const list = Object.values(m).filter((x) => x.subject === subject && x.status !== "undiagnosed" && !x.notLearned)
  if (!list.length) return 0
  return Math.round(list.reduce((a, b) => a + b.score, 0) / list.length)
}
