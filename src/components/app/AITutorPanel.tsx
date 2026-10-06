import { motion } from "motion/react"
import { Bot, Cpu, ShieldAlert, Sparkles, X } from "lucide-react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KP } from "@/data/knowledge"
import { Q } from "@/data/questions"
import { MASTERY_META } from "@/data/knowledge"
import { useLearning, useStore } from "@/store/useStore"
import { Tex } from "./Tex"

type Seg = { t: "s" | "tex" | "b"; v: string }
function segs(text: string): Seg[] {
  const out: Seg[] = []
  const re = /\$([^$]+)\$|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "s", v: text.slice(last, m.index) })
    out.push(m[1] !== undefined ? { t: "tex", v: m[1] } : { t: "b", v: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ t: "s", v: text.slice(last) })
  return out
}
const units = (ss: Seg[]) => ss.reduce((a, s) => a + (s.t === "tex" ? 1 : s.v.length), 0)

function Typed({ text, n }: { text: string; n: number }) {
  const ss = useMemo(() => segs(text), [text])
  let left = n
  return (
    <>
      {ss.map((s, i) => {
        if (left <= 0) return null
        if (s.t === "tex") { left -= 1; return <Tex key={i}>{s.v}</Tex> }
        const take = Math.min(left, s.v.length)
        left -= take
        return <Fragment key={i}>{s.t === "b" ? <b>{s.v.slice(0, take)}</b> : s.v.slice(0, take)}</Fragment>
      })}
    </>
  )
}

export function AITutorPanel({ qid, taskType, onClose }: { qid: string; taskType: string; onClose: () => void }) {
  const q = Q[qid]
  const kp = KP[q.knowledgeId]
  const L = useLearning()
  const logAI = useStore((s) => s.logAI)
  const st = useStore((s) => s.students.find((x) => x.id === s.currentStudentId))
  const steps = q.explanation
  const lens = useMemo(() => steps.map((s) => units(segs(s))), [steps])
  const [pos, setPos] = useState({ step: 0, n: 0 })
  const logged = useRef<string | null>(null)
  const err = L.errors.find((e) => e.questionId === qid)
  useEffect(() => {
    setPos({ step: 0, n: 0 })
    if (logged.current === qid) return
    logged.current = qid
    logAI({
      scene: "AI讲题", studentId: L.studentId,
      context: { subject: q.subject, stage: st?.stage ?? "初中", grade: st?.grade ?? kp.grade, textbook: kp.textbook, knowledgeId: kp.id, taskType, masteryState: L.mastery[kp.id].status, difficulty: q.difficulty, questionType: "单选", errorType: err?.errorType, purpose: `讲解 ${q.id}` },
      promptVersion: `explain.${q.subject === "math" ? "math" : q.subject === "physics" ? "phy" : "chem"}.junior@v3.2`, strategyVersion: `${q.subject === "math" ? "math" : q.subject === "physics" ? "phy" : "chem"}-junior@v1.3`,
      model: "通义千问 · tutor-explain", route: "主路由", tokens: 1800 + Math.floor(Math.random() * 600), latencyMs: 900 + Math.floor(Math.random() * 900), costCny: 0.021, status: "成功",
    })
  }, [qid])
  useEffect(() => {
    if (pos.step >= steps.length) return
    const t = setTimeout(() => {
      setPos((p) => (p.n + 1 >= lens[p.step] ? { step: p.step + 1, n: 0 } : { ...p, n: p.n + 2 }))
    }, pos.n === 0 ? 260 : 22)
    return () => clearTimeout(t)
  }, [pos, steps.length, lens])
  return (
    <motion.aside initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="relative flex h-fit flex-col gap-3 overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-violet-500/30 backdrop-blur-xl xl:sticky xl:top-20">
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"><Bot className="size-4" /></div>
          <div>
            <div className="text-sm font-semibold">AI 讲题</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Cpu className="size-3" />AI Gateway · tutor-explain · Prompt v3.2</div>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="关闭"><X /></Button>
      </div>
      <Alert className="relative border-amber-500/30 bg-amber-500/10">
        <ShieldAlert className="text-amber-500" />
        <AlertTitle className="text-amber-500">AI 讲解不计入掌握度</AlertTitle>
        <AlertDescription className="text-xs">讲解仅帮助理解；掌握度只由独立作答、订正后的变式验证、阶段检测等证据更新。</AlertDescription>
      </Alert>
      <div className="relative flex flex-wrap gap-1">
        {[`subject=${q.subject}`, `stage=${st?.stage ?? "初中"}`, `grade=${st?.grade ?? kp.grade}`, `knowledge_id=${kp.id}`, `task_type=${taskType}`, `mastery=${MASTERY_META[L.mastery[kp.id].status].label}`, `difficulty=${q.difficulty}`, err?.errorType ? `error=${err.errorType}` : "error=—"].map((t) => (
          <Badge key={t} variant="outline" className="font-mono text-[10px]">{t}</Badge>
        ))}
      </div>
      <div className="relative flex flex-col gap-2.5">
        {steps.map((s, i) => i <= pos.step && (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-violet-500/15 text-[10px] font-semibold text-violet-400">{i + 1}</span>
            <div className="text-sm leading-relaxed">
              {i < pos.step ? <Typed text={s} n={Infinity} /> : <Typed text={s} n={pos.n} />}
              {i === pos.step && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-violet-400 align-middle" />}
            </div>
          </motion.div>
        ))}
        {pos.step >= steps.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-violet-400" />讲解完成 · 已记录 AIRequest（结构化上下文 + Prompt/策略版本）
          </motion.div>
        )}
      </div>
    </motion.aside>
  )
}
