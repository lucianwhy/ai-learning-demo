import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, BrainCircuit, CheckCircle2, Clock, Loader2, RotateCcw, Sparkles, Stethoscope, Timer, Wand2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Particles } from "@/components/ui/particles"
import { Progress } from "@/components/ui/progress"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { KnowledgeGraph, MasteryLegend } from "@/components/app/KnowledgeGraph"
import { MasteryBadge, PageHeader, SubjectBadge } from "@/components/app/bits"
import { RichText } from "@/components/app/Tex"
import { KP, SUBJECT_LIST, SUBJECTS, kpOf } from "@/data/knowledge"
import { Q } from "@/data/questions"
import { CHAPTERS, TEXTBOOKS, scopeFrom } from "@/data/seed-learning"
import type { DiagnosticAttempt, SubjectId } from "@/data/types"
import { nowISO } from "@/engine/date"
import { cn } from "@/lib/utils"
import { useLearning, useStore } from "@/store/useStore"

const POOL: Record<SubjectId, string[]> = { math: ["qm2a", "qm7a", "qm6a", "qm3a"], physics: ["qp4a", "qp7a", "qp3a", "qp8a"], chemistry: ["qc4a", "qc2a", "qc6a"] }
type Phase = "scope" | "quiz" | "analyzing" | "result"

export default function Diagnosis() {
  const L = useLearning()
  const [phase, setPhase] = useState<Phase>(L?.diagnosed ? "result" : "scope")
  return (
    <AnimatePresence mode="wait">
      <motion.div key={phase} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
        {phase === "scope" && <ScopeStep onNext={() => setPhase("quiz")} />}
        {phase === "quiz" && <QuizStep onDone={() => setPhase("analyzing")} />}
        {phase === "analyzing" && <Analyzing onDone={() => setPhase("result")} />}
        {phase === "result" && <Result onRedo={() => setPhase("scope")} />}
      </motion.div>
    </AnimatePresence>
  )
}

function ScopeStep({ onNext }: { onNext: () => void }) {
  const L = useLearning()
  const confirmScope = useStore((s) => s.confirmScope)
  const setBudget = useStore((s) => s.setBudget)
  const [tb, setTb] = useState<Record<SubjectId, string>>(L?.scope?.textbook ?? { math: "人教版", physics: "人教版", chemistry: "人教版" })
  const [ch, setCh] = useState<Record<SubjectId, string>>(L?.scope?.currentChapter ?? { math: "21 一元二次方程", physics: "10 浮力", chemistry: "5 化学方程式" })
  const preview = useMemo(() => scopeFrom(tb, ch, nowISO()), [tb, ch])
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Step 1 / 3 · DiagnosticScope" icon={Stethoscope} title="确认诊断范围" desc="诊断不按年级随机抽题：由教材版本 + 当前章节 + 已学范围 + 前置知识确定。未学章节不会被判为薄弱。" />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          {SUBJECT_LIST.map((sid) => (
            <Card key={sid}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><SubjectBadge subject={sid} />{SUBJECTS[sid].grade}</CardTitle>
                <CardAction>
                  <ToggleGroup variant="outline" size="sm" value={[tb[sid]]} onValueChange={(v: string[]) => v[0] && setTb({ ...tb, [sid]: v[0] })}>
                    {TEXTBOOKS.map((t) => <ToggleGroupItem key={t} value={t}>{t}</ToggleGroupItem>)}
                  </ToggleGroup>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="text-xs text-muted-foreground">当前学到的章节（之后的章节记为「未学」）</div>
                <div className="flex flex-wrap gap-2">
                  {CHAPTERS[sid].map((c) => {
                    const on = c === ch[sid]
                    const learned = parseInt(c) <= parseInt(ch[sid])
                    return (
                      <button key={c} onClick={() => setCh({ ...ch, [sid]: c })} className={cn("relative rounded-lg px-3 py-1.5 text-xs ring-1 transition", on ? "text-white ring-transparent" : learned ? "bg-muted/60 ring-foreground/10" : "border border-dashed border-muted-foreground/30 text-muted-foreground ring-0")}>
                        {on && <motion.span layoutId={`ch-${sid}`} className="absolute inset-0 -z-10 rounded-lg" style={{ background: SUBJECTS[sid].color }} />}
                        {c}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="relative h-fit">
          <CardHeader>
            <CardTitle>范围预览</CardTitle>
            <CardDescription>{preview.version} · 可追溯</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20"><div className="text-2xl font-semibold">{preview.coveredKps.length}</div><div className="text-xs text-muted-foreground">纳入诊断知识点</div></div>
              <div className="rounded-xl bg-muted/50 p-3 ring-1 ring-foreground/10"><div className="text-2xl font-semibold">{preview.notLearnedKps.length}</div><div className="text-xs text-muted-foreground">未学 · 不判薄弱</div></div>
            </div>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {preview.notLearnedKps.map((k) => <Badge key={k} variant="outline" className="border-dashed">{KP[k].name}</Badge>)}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">每日学习时间预算</div>
              <ToggleGroup variant="outline" value={[String(L?.dailyBudgetMin ?? 45)]} onValueChange={(v: string[]) => v[0] && setBudget(Number(v[0]) as 30 | 45 | 60)}>
                {["30", "45", "60"].map((m) => <ToggleGroupItem key={m} value={m}>{m} 分钟</ToggleGroupItem>)}
              </ToggleGroup>
              <div className="text-xs text-muted-foreground">计划编排参数：超出预算的低优先级任务自动顺延，不堆积。</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={() => { confirmScope(tb, ch); onNext() }}>确认范围，开始诊断<ArrowRight data-icon="inline-end" /></Button>
          </CardFooter>
          <BorderBeam size={100} duration={8} />
        </Card>
      </div>
    </div>
  )
}

function QuizStep({ onDone }: { onDone: () => void }) {
  const L = useLearning()
  const complete = useStore((s) => s.completeDiagnostic)
  const qs = useMemo(() => {
    const covered = L?.scope?.coveredKps ?? []
    return SUBJECT_LIST.flatMap((sid) => POOL[sid].filter((q) => covered.includes(Q[q].knowledgeId)).slice(0, 2))
  }, [L?.scope])
  const [i, setI] = useState(0)
  const [sel, setSel] = useState<string | null>(null)
  const [answers, setAnswers] = useState<DiagnosticAttempt[]>([])
  const [sec, setSec] = useState(0)
  const [total, setTotal] = useState(0)
  const start = useRef(Date.now())
  useEffect(() => {
    const t = setInterval(() => { setSec(Math.floor((Date.now() - start.current) / 1000)); setTotal((x) => x + 1) }, 1000)
    return () => clearInterval(t)
  }, [])
  const q = Q[qs[i]]
  const next = () => {
    if (!sel) return
    const a = [...answers, { questionId: q.id, answer: sel, correct: sel === q.answer, durationSec: Math.max(3, sec) }]
    setAnswers(a)
    setSel(null)
    start.current = Date.now()
    setSec(0)
    if (i + 1 >= qs.length) { complete(a, total); onDone() } else setI(i + 1)
  }
  if (!q) return null
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader eyebrow="Step 2 / 3 · 首次诊断" title={`第 ${i + 1} / ${qs.length} 题`} desc="每题独立计时；诊断记录题目、答案、正确性、耗时、知识点映射与诊断批次。" actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums"><Timer data-icon="inline-start" />本题 {sec}s</Badge>
          <Badge variant="outline" className="tabular-nums"><Clock data-icon="inline-start" />总计 {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}</Badge>
        </div>
      } />
      <Progress value={((i) / qs.length) * 100} />
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          <QuestionBody qid={q.id} selected={sel} onSelect={setSel} />
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-end"><Button size="lg" disabled={!sel} onClick={next}>{i + 1 >= qs.length ? "提交诊断" : "下一题"}<ArrowRight data-icon="inline-end" /></Button></div>
    </div>
  )
}

export function QuestionBody({ qid, selected, onSelect, reveal, disabled }: { qid: string; selected: string | null; onSelect: (k: string) => void; reveal?: boolean; disabled?: boolean }) {
  const q = Q[qid]
  const kp = KP[q.knowledgeId]
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectBadge subject={q.subject} />
          <Badge variant="outline">{kp.name}</Badge>
          <Badge variant="outline">难度 {"★".repeat(q.difficulty)}</Badge>
          <span className="ml-auto text-[11px] text-muted-foreground">{q.id} · {q.version} · {q.source}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {q.context && (
          <div className="rounded-xl p-3 text-sm ring-1" style={{ background: `color-mix(in oklch, ${SUBJECTS[q.subject].color} 8%, transparent)`, borderColor: SUBJECTS[q.subject].color }}>
            <div className="mb-1 text-xs font-medium" style={{ color: SUBJECTS[q.subject].color }}>{q.context.label}</div>
            <div className="text-muted-foreground">{q.context.text}</div>
          </div>
        )}
        <div className="text-base leading-loose"><RichText text={q.stem} /></div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {q.options.map((o) => {
            const isSel = selected === o.key
            const right = reveal && o.key === q.answer
            const wrong = reveal && isSel && o.key !== q.answer
            return (
              <motion.button key={o.key} whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: 0.98 }} disabled={disabled} onClick={() => onSelect(o.key)}
                className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition-colors", isSel ? "bg-primary/15 ring-primary" : "bg-muted/40 ring-foreground/10 hover:ring-foreground/25", right && "bg-emerald-500/15 ring-emerald-500", wrong && "bg-destructive/15 ring-destructive")}>
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold", isSel ? "bg-primary text-primary-foreground" : "bg-background ring-1 ring-foreground/10", right && "bg-emerald-500 text-white", wrong && "bg-destructive text-white")}>{o.key}</span>
                <RichText text={o.text} />
              </motion.button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const ANALYZE = ["读取作答、耗时与诊断批次", "映射 QuestionKnowledgeMap → 知识点", "沿 KnowledgePrerequisite 前置关系推断", "排除未学章节（DiagnosticScope）", "按 SubjectStageStrategy 计算掌握状态", "生成知识点级诊断结果"]

function Analyzing({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 650)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { if (n > ANALYZE.length) onDone() }, [n, onDone])
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-8">
      <Particles className="absolute inset-0" quantity={120} color="#a78bfa" ease={40} vx={0.1} />
      <div className="relative grid size-44 place-items-center">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="absolute inset-0 rounded-full ring-2 ring-violet-500/40" animate={{ scale: [1, 1.6], opacity: [0.7, 0] }} transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.8 }} />
        ))}
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-3 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#a855f7,#ec4899,#10b981,#6366f1)] opacity-80 blur-md" />
        <div className="relative grid size-32 place-items-center rounded-full bg-background/90 ring-1 ring-white/10 backdrop-blur">
          <BrainCircuit className="size-14 text-violet-400" />
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold">AI 分析中<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>…</motion.span></div>
        <div className="mt-1 text-sm text-muted-foreground">确定性规则判定掌握状态 · AI 只负责解读，不直接写入掌握度</div>
      </div>
      <div className="relative flex w-full max-w-md flex-col gap-2">
        {ANALYZE.map((t, i) => (
          <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= n ? 1 : 0.25, x: 0 }} className="flex items-center gap-3 rounded-xl bg-card/70 px-3 py-2 text-sm ring-1 ring-foreground/10 backdrop-blur">
            {i < n ? <CheckCircle2 className="size-4 text-emerald-500" /> : i === n ? <Loader2 className="size-4 animate-spin text-violet-400" /> : <span className="size-4 rounded-full ring-1 ring-foreground/20" />}
            {t}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Result({ onRedo }: { onRedo: () => void }) {
  const L = useLearning()
  const gen = useStore((s) => s.generatePlanFromDiagnosis)
  const nav = useNavigate()
  const [tab, setTab] = useState<SubjectId>("math")
  const [sel, setSel] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  if (!L?.diagnostic) return null
  const d = L.diagnostic
  const correct = d.attempts.filter((a) => a.correct).length
  const all = Object.values(L.mastery)
  const weak = all.filter((m) => m.status === "weak")
  const mastered = all.filter((m) => m.status === "mastered")
  const notLearned = all.filter((m) => m.notLearned)
  const selK = sel ? KP[sel] : null
  const doGen = () => {
    setGenerating(true)
    setTimeout(() => {
      const v = gen()
      toast.success(L.plan ? `计划已重排为 V${v}（历史版本保留）` : "30 天学习计划已生成（V1），今日任务已下发")
      nav("/s/plan")
    }, 2600)
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow={`诊断结果 · ${d.batch} · ${d.scope.version}`} icon={Sparkles} title="知识点级诊断结果" desc="不是一个总分：每个知识点都有状态、证据与前置关系。点击节点查看依据。"
        actions={<>
          <Button variant="outline" onClick={onRedo}><RotateCcw data-icon="inline-start" />重新诊断</Button>
          <ShimmerButton background="linear-gradient(110deg,#4f46e5,#7c3aed,#c026d3)" className="px-5 py-2.5 text-sm font-medium" onClick={doGen}><Wand2 className="mr-2 size-4" />{L.plan ? "按诊断重排计划" : "生成30天计划"}</ShimmerButton>
        </>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["正确率", `${Math.round((correct / d.attempts.length) * 100)}%`, `${correct}/${d.attempts.length} 题`], ["薄弱知识点", weak.length, "进入补弱"], ["已掌握", mastered.length, "含前置推断"], ["未学 · 不判薄弱", notLearned.length, "按进度新授"], ["诊断用时", `${Math.floor(d.totalSec / 60)}′${d.totalSec % 60}″`, "逐题计时"]].map(([a, b, c], i) => (
          <motion.div key={a as string} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 backdrop-blur-xl">
            <div className="text-xs text-muted-foreground">{a}</div>
            <div className="mt-1 text-2xl font-semibold">{b}</div>
            <div className="text-[11px] text-muted-foreground">{c}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="relative">
          <CardHeader>
            <CardTitle>知识图谱 · 前置关系</CardTitle>
            <CardDescription><MasteryLegend /></CardDescription>
            <CardAction>
              <Tabs value={tab} onValueChange={(v) => { setTab(v as SubjectId); setSel(null) }}>
                <TabsList>{SUBJECT_LIST.map((s) => <TabsTrigger key={s} value={s}>{SUBJECTS[s].name}</TabsTrigger>)}</TabsList>
              </Tabs>
            </CardAction>
          </CardHeader>
          <CardContent>
            <KnowledgeGraph subject={tab} mastery={L.mastery} height={420} highlight={sel ?? undefined} onSelect={setSel} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>{selK ? selK.name : "诊断解读"}</CardTitle><CardDescription>{selK ? `${selK.textbook} · ${selK.chapter}` : "由规则判定，AI 仅生成文字解读"}</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {selK ? (
                <>
                  <MasteryBadge status={L.mastery[selK.id].status} notLearned={L.mastery[selK.id].notLearned} />
                  <div className="text-muted-foreground">{selK.summary}</div>
                  <div className="text-xs text-muted-foreground">前置：{selK.prerequisites.map((p) => KP[p].name).join("、") || "无"}</div>
                  <div className="flex flex-col gap-1.5">
                    {L.evidence.filter((e) => e.knowledgeId === selK.id).slice(0, 4).map((e) => (
                      <div key={e.id} className="rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs"><b>{e.type}</b> · {e.note}</div>
                    ))}
                    {!L.evidence.some((e) => e.knowledgeId === selK.id) && <div className="text-xs text-muted-foreground">{L.mastery[selK.id].notLearned ? "未学章节：不纳入诊断，不判薄弱" : "范围内未抽测，等待学习证据"}</div>}
                  </div>
                </>
              ) : (
                SUBJECT_LIST.map((sid) => {
                  const w = kpOf(sid).filter((k) => L.mastery[k.id].status === "weak")
                  return (
                    <div key={sid} className="flex flex-col gap-1.5">
                      <SubjectBadge subject={sid} />
                      <div className="text-xs leading-relaxed text-muted-foreground">
                        {w.length ? <>薄弱：{w.map((k) => `「${k.name}」`).join("")}。{w[0] && KP[w[0].id] && <>其中「{w[0].name}」是后续知识的前置，计划将优先补齐。</>}</> : "范围内暂无薄弱点。"}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
          <Alert>
            <Sparkles />
            <AlertTitle>诊断范围可追溯</AlertTitle>
            <AlertDescription>
              {SUBJECT_LIST.map((s) => `${SUBJECTS[s].name}：${d.scope.textbook[s]} · 学到「${d.scope.currentChapter[s]}」`).join("；")}
            </AlertDescription>
          </Alert>
        </div>
      </div>
      <AnimatePresence>
        {generating && <GenerateOverlay />}
      </AnimatePresence>
    </div>
  )
}

function GenerateOverlay() {
  const steps = ["读取诊断结果与掌握度", "按知识前置关系拓扑排序", "套用每日学习时间预算", "插入阶段检测（第 7/14/21/28 天）", "为每个计划项写入生成原因", "保存 PlanVersion · 下发今日任务"]
  const [n, setN] = useState(0)
  useEffect(() => { const t = setInterval(() => setN((x) => x + 1), 400); return () => clearInterval(t) }, [])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-[420px] overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3"><Wand2 className="size-5 text-violet-400" /><div className="font-semibold">正在生成 30 天学习计划</div></div>
        <div className="mt-4 flex flex-col gap-2">
          {steps.map((s, i) => (
            <div key={s} className={cn("flex items-center gap-2 text-sm transition-opacity", i > n && "opacity-30")}>
              {i < n ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Loader2 className={cn("size-4", i === n && "animate-spin text-violet-400")} />}{s}
            </div>
          ))}
        </div>
        <BorderBeam size={120} duration={3} colorFrom="#a855f7" colorTo="#10b981" />
      </motion.div>
    </motion.div>
  )
}
