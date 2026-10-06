import { AnimatePresence, motion } from "motion/react"
import {
  AlertTriangle, ArrowRight, Bot, BookOpen, CalendarRange, Check, CheckCircle2, ChevronRight, Clock, FileText, FlaskConical, GitBranch, Lightbulb, ListChecks, Lock, PartyPopper, Ruler, ShieldCheck, Sparkles, TrendingDown, XCircle,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Input } from "@/components/ui/input"
import { useSidebar } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AITutorPanel } from "@/components/app/AITutorPanel"
import { MasteryBadge, PageHeader, SubjectBadge, TaskTypeBadge } from "@/components/app/bits"
import { Tex } from "@/components/app/Tex"
import { KP, MASTERY_META, SUBJECTS, successorsOf } from "@/data/knowledge"
import { Q, pickPractice, pickVariant } from "@/data/questions"
import type { ErrorType, LearningTask, MasteryStatus } from "@/data/types"
import { cn } from "@/lib/utils"
import { computeQueue, isFeatureOn, questionsForStage, useLearning, useStore } from "@/store/useStore"
import { QuestionBody } from "./Diagnosis"

const ERROR_TYPES: ErrorType[] = ["概念不清", "公式记错", "计算失误", "审题不清", "单位换算", "漏考虑条件", "方法不会"]
const SUGGEST: Record<string, ErrorType> = { m2: "漏考虑条件", p4: "单位换算", c4: "概念不清", p8: "公式记错", m7: "计算失误" }

export default function Today() {
  const L = useLearning()
  const setBudget = useStore((s) => s.setBudget)
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const queue = L ? computeQueue(L) : []
  const firstActionable = queue.find((q) => q.task.status !== "done" && q.task.status !== "failed" && !q.locked)?.task.id
  const selected = params.get("task") ?? firstActionable ?? queue[0]?.task.id
  const [ai, setAi] = useState<string | null>(null)
  const { setOpen } = useSidebar()
  useEffect(() => { if (ai) setOpen(false) }, [ai])
  if (!L?.plan) return (
    <Card><CardHeader><CardTitle>还没有今日任务</CardTitle><CardDescription>完成首次诊断并生成 30 天计划后，引擎会下发今日任务。</CardDescription></CardHeader><CardFooter><Button onClick={() => nav("/s/diagnosis")}>去诊断</Button></CardFooter></Card>
  )
  const task = L.tasks.find((t) => t.id === selected)
  const totalMin = queue.reduce((a, b) => a + b.task.minutes, 0)
  const doneMin = queue.filter((q) => q.task.status === "done").reduce((a, b) => a + b.task.minutes, 0)
  const select = (id: string) => { setParams({ task: id }); setAi(null) }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="今日任务引擎 · 优先级 / 依赖 / 状态 / 完成条件" icon={ListChecks} title="今日学习" desc="任务由学习引擎按证据生成：计划项 + 错题订正 + 复习 + 阶段检测。超出每日预算的低优先级任务自动顺延，不堆积。"
        actions={<>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" />每日预算</div>
          <ToggleGroup variant="outline" size="sm" value={[String(L.dailyBudgetMin)]} onValueChange={(v: string[]) => { if (v[0]) { setBudget(Number(v[0]) as 30 | 45 | 60); toast(`每日预算调整为 ${v[0]} 分钟，队列已重新编排`) } }}>
            {["30", "45", "60"].map((m) => <ToggleGroupItem key={m} value={m}>{m}′</ToggleGroupItem>)}
          </ToggleGroup>
          <Button variant="outline" onClick={() => nav("/s/plan")}><CalendarRange data-icon="inline-start" />30 天计划</Button>
        </>} />
      <div className={cn("grid items-start gap-5", ai ? "xl:grid-cols-[280px_minmax(0,1fr)_380px]" : "xl:grid-cols-[340px_minmax(0,1fr)]")}>
        <Card size="sm" className="xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>任务队列 · {queue.length} 项</CardTitle>
            <CardDescription>已完成 {doneMin}′ / 预计 {totalMin}′ · 预算 {L.dailyBudgetMin}′</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <div className="relative mb-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all" style={{ width: `${Math.min(100, (doneMin / Math.max(totalMin, L.dailyBudgetMin)) * 100)}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-amber-400" style={{ left: `${Math.min(100, (L.dailyBudgetMin / Math.max(totalMin, L.dailyBudgetMin)) * 100)}%` }} />
            </div>
            {queue.map(({ task: t, locked, deferred }, i) => {
              const sel = t.id === selected
              const depIdx = t.dependsOn.map((d) => queue.findIndex((q) => q.task.id === d) + 1).filter(Boolean)
              return (
                <motion.button key={t.id} layout onClick={() => select(t.id)} className={cn("relative flex items-start gap-2.5 rounded-xl p-2.5 text-left ring-1 transition", sel ? "bg-primary/12 ring-primary/60" : "ring-transparent hover:bg-muted/50", deferred && "opacity-55")}>
                  {sel && <motion.span layoutId="queue-sel" className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" />}
                  <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold", t.status === "done" ? "bg-emerald-500 text-white" : t.status === "failed" ? "bg-destructive text-white" : locked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
                    {t.status === "done" ? <Check className="size-3.5" /> : t.status === "failed" ? <XCircle className="size-3.5" /> : locked ? <Lock className="size-3" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("truncate text-sm font-medium", t.status === "done" && "text-muted-foreground line-through")}>{t.title.split(" · ")[1] ?? t.title}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <TaskTypeBadge type={t.type} className="h-4 px-1.5 text-[10px]" />
                      <span className="text-[10px]" style={{ color: SUBJECTS[t.subject].color }}>{SUBJECTS[t.subject].name}</span>
                      <Badge variant={t.priority === "P0" ? "destructive" : "outline"} className="h-4 px-1.5 text-[10px]">{t.priority}</Badge>
                      <span className="text-[10px] text-muted-foreground">{t.minutes}′ · {t.source}</span>
                    </div>
                    {(depIdx.length > 0 || deferred) && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {depIdx.length > 0 && <span className="mr-2">依赖 #{depIdx.join(", #")}</span>}
                        {deferred && <span className="text-amber-500">超出预算 · 顺延至明日</span>}
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </CardContent>
        </Card>
        {task ? <Runner key={task.id} task={task} onAI={setAi} aiOpen={!!ai} onNext={(id) => id && select(id)} /> : <div />}
        <AnimatePresence>{ai && task && <AITutorPanel key={ai} qid={ai} taskType={task.type} onClose={() => setAi(null)} />}</AnimatePresence>
      </div>
    </div>
  )
}

const TRACK: MasteryStatus[] = ["weak", "learning", "pending", "mastered"]
function MasteryTracker({ kid }: { kid: string }) {
  const L = useLearning()
  const m = L.mastery[kid]
  const cur = m.status === "review" ? "review" : m.status === "undiagnosed" ? "weak" : m.status
  return (
    <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1 ring-1 ring-foreground/5">
      {(cur === "review" ? (["mastered", "review", "learning", "pending"] as MasteryStatus[]) : TRACK).map((s, i, arr) => (
        <div key={s} className="flex items-center gap-1">
          <div className="relative px-2.5 py-1 text-[11px] font-medium" style={{ color: s === cur ? "white" : MASTERY_META[s].color }}>
            {s === cur && <motion.span layoutId={`mt-${kid}`} className="absolute inset-0 -z-0 rounded-full" style={{ background: MASTERY_META[s].color, boxShadow: `0 0 16px ${MASTERY_META[s].color}` }} transition={{ type: "spring", stiffness: 200, damping: 22 }} />}
            <span className="relative z-10">{MASTERY_META[s].label}</span>
          </div>
          {i < arr.length - 1 && <ChevronRight className="size-3 text-muted-foreground/50" />}
        </div>
      ))}
    </div>
  )
}

type Step = "card" | "question" | "practiceOk" | "reason" | "correct" | "variant" | "mastered" | "remediation" | "review" | "stage" | "worksheet" | "done"

function Runner({ task, onAI, aiOpen, onNext }: { task: LearningTask; onAI: (qid: string | null) => void; aiOpen: boolean; onNext: (id?: string) => void }) {
  const s = useStore()
  const L = s.learning[s.currentStudentId]
  const nav = useNavigate()
  const kp = KP[task.knowledgeId]
  const queue = computeQueue(L)
  const locked = queue.find((q) => q.task.id === task.id)?.locked
  const initial: Step = task.status === "done" || task.status === "failed" ? "done" : task.type === "learn" || task.type === "practice" || task.type === "remediate" ? "card" : task.type === "correction" ? "reason" : task.type === "variant" ? "variant" : task.type === "review" ? "review" : task.type === "stage" ? "stage" : "worksheet"
  const [step, setStep] = useState<Step>(initial)
  const [sel, setSel] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | undefined>(task.errorId)
  const [errType, setErrType] = useState<ErrorType | null>(null)
  const [note, setNote] = useState("")
  const [result, setResult] = useState<{ level?: number; version?: number; correct?: boolean } | null>(null)
  const [stageAns, setStageAns] = useState<Record<string, string>>({})
  const t0 = useRef(Date.now())
  const orgId = s.students.find((x) => x.id === s.currentStudentId)?.orgId
  const aiOn = isFeatureOn(s.flags, "ai_explain", orgId)
  const err = L.errors.find((e) => e.id === errorId)
  const practiceQid = task.questionId ?? pickPractice(task.knowledgeId)?.id
  const originalQid = err?.questionId ?? practiceQid
  const variantQid = useMemo(() => {
    if (task.type === "variant" && task.questionId) return task.questionId
    const used = [originalQid, ...(err?.verifications.map((v) => v.questionId) ?? []), ...(err ? [] : [practiceQid])].filter(Boolean) as string[]
    return pickVariant(task.knowledgeId, used)?.id
  }, [task.id, errorId, step === "variant"])
  const aiVariant = isFeatureOn(s.flags, "ai_variant", orgId) && task.subject === "math"
  const [validations, setValidations] = useState<{ check: string; pass: boolean; detail: string }[] | null>(null)
  useEffect(() => {
    if (step === "variant" && aiVariant && !validations) setValidations(s.addAIValidationLog(task.knowledgeId, `${kp.name}·独立变式验证（不同表述，非数字替换）`))
    t0.current = Date.now()
    setSel(null)
  }, [step])
  const sec = () => Math.max(3, Math.round((Date.now() - t0.current) / 1000))
  const currentQid = step === "question" || step === "review" ? practiceQid : step === "reason" || step === "correct" ? originalQid : step === "variant" ? variantQid : undefined
  const nextTaskId = () => computeQueue(useStore.getState().learning[s.currentStudentId]).find((q) => q.task.status !== "done" && q.task.status !== "failed" && !q.locked && q.task.id !== task.id)?.task.id

  const head = (
    <CardHeader>
      <div className="flex flex-wrap items-center gap-2">
        <SubjectBadge subject={task.subject} /><TaskTypeBadge type={task.type} />
        <Badge variant={task.priority === "P0" ? "destructive" : "outline"}>{task.priority}</Badge>
        <span className="text-xs text-muted-foreground">来源：{task.source}{task.planItemId ? ` · ${task.planItemId}` : ""}</span>
      </div>
      <CardTitle className="mt-2 text-lg">{task.title}</CardTitle>
      <CardDescription>完成条件：{task.completionRule} · 预计 {task.minutes} 分钟</CardDescription>
      <CardAction className="flex flex-col items-end gap-2">
        <MasteryTracker kid={task.knowledgeId} />
        {currentQid && (
          <Tooltip>
            <TooltipTrigger render={<Button size="sm" variant={aiOpen ? "secondary" : "outline"} disabled={!aiOn} onClick={() => onAI(aiOpen ? null : currentQid)} className="gap-1.5" />}>
              <Bot data-icon="inline-start" />{aiOpen ? "收起 AI 讲题" : "AI 讲题"}
            </TooltipTrigger>
            <TooltipContent>{aiOn ? "从当前题目进入，不计入掌握度" : "功能已被总部/机构开关关闭"}</TooltipContent>
          </Tooltip>
        )}
      </CardAction>
    </CardHeader>
  )

  if (locked && step !== "done")
    return (
      <Card>{head}<CardContent><Alert><Lock /><AlertTitle>依赖任务未完成</AlertTitle><AlertDescription>需先完成：{task.dependsOn.map((d) => L.tasks.find((x) => x.id === d)?.title).join("、")}。依赖由学习引擎定义，保证先学后练。</AlertDescription></Alert></CardContent></Card>
    )

  return (
    <Card className="relative min-h-[520px]">
      {head}
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
            {step === "card" && (
              <>
                <KnowledgeCard kid={task.type === "remediate" ? task.knowledgeId : task.knowledgeId} />
                <div className="flex justify-end gap-2">
                  {task.type === "learn" ? (
                    <Button size="lg" onClick={() => { s.finishLearn(task.id); toast.success("知识学习完成", { description: `「${kp.name}」状态 → 学习中（知识学习证据）` }); onNext(nextTaskId()) }}>完成学习<Check data-icon="inline-end" /></Button>
                  ) : (
                    <Button size="lg" onClick={() => { if (task.type === "remediate") s.finishLearn(task.id); setStep("question") }}>{task.type === "remediate" ? "降难练习" : "开始练习"}<ArrowRight data-icon="inline-end" /></Button>
                  )}
                </div>
              </>
            )}

            {step === "question" && practiceQid && (
              <>
                <StepHint n={1} text={task.type === "remediate" ? "降难练习：回退前置知识点，难度下调 1 级" : "独立作答：结果将作为正式作答证据保存（每次 attempt 独立保存）"} />
                <QuestionBody qid={practiceQid} selected={sel} onSelect={setSel} />
                <div className="flex justify-end">
                  <Button size="lg" disabled={!sel} onClick={() => {
                    const r = s.answerPractice(task.id, practiceQid, sel!, sec())
                    if (task.type === "remediate") {
                      s.completeTask(task.id, r.correct ? "降难练习正确" : "降难练习错误", r.correct ? "回到原知识点进行新变式验证" : "已记录，进入后续重排", r.correct)
                      toast(r.correct ? "补弱练习通过，返回原知识点变式验证" : "补弱练习未通过，已记录证据")
                      onNext(nextTaskId())
                      return
                    }
                    if (r.correct) setStep("practiceOk")
                    else { setErrorId(r.errorId); setStep("reason"); toast.error("回答错误，已生成错题记录", { description: "首次错误 → 错因识别 → 讲解/回看 → 订正 → 独立变式验证" }) }
                  }}>提交答案</Button>
                </div>
              </>
            )}

            {step === "practiceOk" && (
              <ResultBlock ok title="回答正确 · 已产生作答证据" desc={`「${kp.name}」状态 → 待验证。按策略，练习正确仍需用不同题目独立验证后才判定掌握。`}>
                <Button size="lg" onClick={() => setStep("variant")}>进入变式独立验证<ShieldCheck data-icon="inline-end" /></Button>
              </ResultBlock>
            )}

            {step === "reason" && originalQid && (
              <>
                <StepHint n={2} text="错因识别：选择本题的主要错误原因（AI 推荐仅供参考，由你确认）" />
                <QuestionBody qid={originalQid} selected={L.attempts.filter((a) => a.questionId === originalQid).at(-1)?.answer ?? null} onSelect={() => {}} reveal disabled />
                <div className="flex flex-wrap gap-2">
                  {ERROR_TYPES.map((e) => (
                    <button key={e} onClick={() => setErrType(e)} className={cn("relative rounded-full px-3.5 py-1.5 text-sm ring-1 transition", errType === e ? "bg-destructive/15 text-destructive ring-destructive" : "bg-muted/40 ring-foreground/10 hover:ring-foreground/30")}>
                      {e}{SUGGEST[task.knowledgeId] === e && <span className="ml-1.5 rounded bg-violet-500/20 px-1 text-[10px] text-violet-400">AI 推荐</span>}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end"><Button size="lg" disabled={!errType} onClick={() => setStep("correct")}>下一步：知识回看与订正<ArrowRight data-icon="inline-end" /></Button></div>
              </>
            )}

            {step === "correct" && originalQid && (
              <>
                <StepHint n={3} text="针对性知识回看 → 订正：重新作答原题并写下订正要点（订正不直接判定掌握）" />
                <div className="grid gap-3 rounded-xl bg-primary/5 p-3 ring-1 ring-primary/15 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary"><Lightbulb className="size-3.5" />知识回看 · {kp.name}</div>
                    {kp.formulas.slice(0, 2).map((f) => <Tex key={f} display>{f}</Tex>)}
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {(kp.extra?.pitfalls ?? kp.extra?.steps ?? []).map((p) => <div key={p} className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />{p}</div>)}
                  </div>
                </div>
                <QuestionBody qid={originalQid} selected={sel} onSelect={setSel} />
                <Input placeholder="订正要点，例如：「有两个不相等实根」应取 Δ>0，不能取等号" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex items-center justify-end gap-3">
                  {sel && sel !== Q[originalQid].answer && <span className="text-xs text-destructive">订正答案仍不正确，再想想</span>}
                  <Button size="lg" disabled={!sel || sel !== Q[originalQid].answer} onClick={() => {
                    s.submitCorrection(errorId!, errType ?? "概念不清", note || "已理解正确解法", sel!)
                    toast("订正已保存", { description: "状态 → 待验证。下一步：不同题目的变式独立验证" })
                    setStep("variant")
                  }}>提交订正<ArrowRight data-icon="inline-end" /></Button>
                </div>
              </>
            )}

            {step === "variant" && variantQid && (
              <>
                <StepHint n={4} text="变式独立验证：不同题目 / 不同表述验证同一能力，独立作答，结果决定掌握度" />
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs ring-1 ring-foreground/5">
                  {aiVariant ? (
                    <>
                      <Sparkles className="size-3.5 text-violet-400" /><span className="font-medium">AI 受控生成</span>
                      <span className="text-muted-foreground">引擎先确定目标能力与约束 → AI Gateway 生成 → 质量门禁</span>
                      <Badge className="ml-auto bg-emerald-500/15 text-emerald-500">门禁 {validations?.filter((v) => v.pass).length ?? 6}/{validations?.length ?? 6} 通过</Badge>
                    </>
                  ) : (
                    <><BookOpen className="size-3.5 text-primary" /><span className="font-medium">正式题库优先匹配</span><span className="text-muted-foreground">{variantQid} · {Q[variantQid].version} · 与原题不同表述</span></>
                  )}
                </div>
                {aiVariant && validations && (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {validations.map((v, i) => (
                      <motion.div key={v.check} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />{v.check}
                      </motion.div>
                    ))}
                  </div>
                )}
                <QuestionBody qid={variantQid} selected={sel} onSelect={setSel} />
                <div className="flex justify-end">
                  <Button size="lg" disabled={!sel} onClick={() => {
                    const r = s.verifyVariant(task.id, errorId, variantQid, sel!, sec())
                    setResult(r)
                    if (r.correct) {
                      setStep("mastered")
                      toast.success("已根据证据更新掌握度，后续计划已重排", { description: `「${kp.name}」→ 已掌握 · 计划 V${r.version}（旧版本保留）` })
                    } else {
                      setStep("remediation")
                      toast.error(r.level === 3 ? "连续失败：已标记风险并进入教师关注队列" : "变式验证未通过：触发多级补弱", { description: `计划已重排为 V${r.version}，失败任务不会消失` })
                    }
                  }}>提交验证</Button>
                </div>
              </>
            )}

            {step === "mastered" && (
              <MasteredCelebration kid={task.knowledgeId} version={result?.version} onPlan={() => nav("/s/plan")} onNext={() => onNext(nextTaskId())} />
            )}

            {step === "remediation" && (
              <RemediationLadder level={result?.level ?? 1} kid={task.knowledgeId} onNext={() => onNext(nextTaskId())} />
            )}

            {step === "review" && practiceQid && (
              <>
                <StepHint n={1} text="延迟复习：已掌握后按间隔（3/7/14 天）独立验证；失败则依据新证据回退状态" />
                <QuestionBody qid={practiceQid} selected={sel} onSelect={setSel} />
                <div className="flex justify-end">
                  <Button size="lg" disabled={!sel} onClick={() => {
                    const r = s.answerReview(task.id, practiceQid, sel!, sec())
                    setResult(r)
                    if (r.correct) toast.success("复习保持 +1", { description: "保持证据已写入，下次间隔 14 天" })
                    else toast.error("复习失败：已掌握 → 需复习", { description: `计划已重排为 V${r.version}` })
                    setStep("done")
                  }}>提交</Button>
                </div>
              </>
            )}

            {step === "stage" && (
              <StageTest task={task} answers={stageAns} setAnswers={setStageAns} onSubmit={() => {
                const r = s.submitStage(task.id, stageAns)
                toast.success(`阶段检测 ${r.correct}/${r.total}，已触发计划重排`, { description: `高权重证据已写入 · 计划 V${r.version}` })
                setStep("done")
              }} />
            )}

            {step === "worksheet" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/5">
                  <FileText className="size-10 text-emerald-500" />
                  <div className="flex-1">
                    <div className="font-medium">纸质学案已生成，绑定本任务与题目版本</div>
                    <div className="text-sm text-muted-foreground">打印/下载 ≠ 完成。线下作答后拍照上传，批改结果回写同一证据体系。</div>
                  </div>
                </div>
                <div className="flex justify-end"><Button size="lg" onClick={() => nav("/s/worksheets?ws=ws-1")}>去「我的学案」打印与拍照批改<ArrowRight data-icon="inline-end" /></Button></div>
              </div>
            )}

            {step === "done" && (
              <ResultBlock ok={task.status === "done" && task.result?.correct !== false} title={task.result?.summary ?? "任务已完成"} desc={`后续动作：${task.result?.nextAction ?? "—"}`}>
                <Button variant="outline" onClick={() => nav("/s/plan")}>查看计划变化</Button>
                <Button onClick={() => onNext(nextTaskId())}>下一个任务<ArrowRight data-icon="inline-end" /></Button>
              </ResultBlock>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      {(step === "variant" || step === "mastered") && <BorderBeam size={140} duration={6} colorFrom="#a855f7" colorTo="#10b981" />}
    </Card>
  )
}

function StepHint({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{n}</span>{text}
    </div>
  )
}

function ResultBlock({ ok, title, desc, children }: { ok: boolean; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className={cn("grid size-16 place-items-center rounded-2xl", ok ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive")}>
        {ok ? <CheckCircle2 className="size-8" /> : <XCircle className="size-8" />}
      </motion.div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="max-w-md text-sm text-muted-foreground">{desc}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

export function KnowledgeCard({ kid }: { kid: string }) {
  const k = KP[kid]
  const color = SUBJECTS[k.subject].color
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 ring-1" style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${color} 14%, transparent), transparent 60%)`, boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${color} 30%, transparent)` }}>
      <div className="absolute -top-10 -right-10 size-40 rounded-full blur-3xl" style={{ background: `color-mix(in oklch, ${color} 30%, transparent)` }} />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs" style={{ color }}><BookOpen className="size-4" />知识卡 · {k.textbook} · {k.chapter}</div>
        <div className="text-xl font-semibold">{k.name}</div>
        <div className="text-sm text-muted-foreground">{k.summary}</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-background/60 p-3 ring-1 ring-foreground/5">
            <div className="mb-1 text-xs font-medium text-muted-foreground">{k.subject === "chemistry" ? "化学方程式 / 用语" : "核心公式"}</div>
            {k.formulas.map((f) => <Tex key={f} display>{f}</Tex>)}
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-background/60 p-3 text-sm ring-1 ring-foreground/5">
            {k.subject === "math" && k.extra?.steps && (
              <><div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><GitBranch className="size-3.5" />步骤模板 · 题型方法</div>
                {k.extra.steps.map((s, i) => <div key={s} className="flex gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: color }}>{i + 1}</span>{s}</div>)}</>
            )}
            {k.subject === "physics" && (
              <>{k.extra?.experiment && <div><div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><FlaskConical className="size-3.5" />实验情境</div><div className="mt-1">{k.extra.experiment}</div></div>}
                {k.extra?.units && <div><div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Ruler className="size-3.5" />单位与换算</div><div className="mt-1 flex flex-wrap gap-1">{k.extra.units.map((u) => <Badge key={u} variant="outline">{u}</Badge>)}</div></div>}</>
            )}
            {k.subject === "chemistry" && (
              <>{k.extra?.phenomenon && <div><div className="text-xs font-medium text-muted-foreground">🔬 实验现象</div><div className="mt-1">{k.extra.phenomenon}</div></div>}
                {k.extra?.apparatus && <div><div className="text-xs font-medium text-muted-foreground">⚗️ 装置要点</div><div className="mt-1">{k.extra.apparatus}</div></div>}
                {k.extra?.steps && <div><div className="text-xs font-medium text-muted-foreground">配平方法</div>{k.extra.steps.map((s, i) => <div key={s} className="mt-1 text-xs">{i + 1}. {s}</div>)}</div>}</>
            )}
            {k.extra?.pitfalls && <div className="mt-1 flex flex-col gap-1 border-t pt-2">{k.extra.pitfalls.map((p) => <div key={p} className="flex gap-1.5 text-xs text-amber-500"><AlertTriangle className="mt-0.5 size-3 shrink-0" />{p}</div>)}</div>}
            {!k.extra && (
              <>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><GitBranch className="size-3.5" />知识关联</div>
                <div className="text-xs">前置：{k.prerequisites.length ? k.prerequisites.map((p) => KP[p].name).join("、") : "无（起点知识）"}</div>
                <div className="text-xs">后续：{successorsOf(kid).map((x) => x.name).join("、") || "—"}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">呈现模板：{SUBJECTS[k.subject].name}·初中策略 · 学完后进入独立练习</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MasteredCelebration({ kid, version, onPlan, onNext }: { kid: string; version?: number; onPlan: () => void; onNext: () => void }) {
  const flow: MasteryStatus[] = ["weak", "pending", "mastered"]
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, 2)), 700); return () => clearInterval(t) }, [])
  return (
    <div className="relative flex flex-col items-center gap-5 overflow-hidden py-8 text-center">
      {Array.from({ length: 26 }).map((_, k) => (
        <motion.span key={k} className="absolute top-1/3 left-1/2 size-2 rounded-full" style={{ background: ["#818cf8", "#34d399", "#f472b6", "#fbbf24"][k % 4] }}
          initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(k) * (120 + (k % 5) * 30), y: Math.sin(k * 1.3) * (90 + (k % 4) * 25), opacity: 0 }} transition={{ duration: 1.6, delay: 1.3, ease: "easeOut" }} />
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.3 }} className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-2xl shadow-emerald-500/40">
        <PartyPopper className="size-10" />
      </motion.div>
      <div className="flex items-center gap-2">
        {flow.map((s, k) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div animate={{ scale: k === i ? 1.15 : 1, opacity: k <= i ? 1 : 0.35 }}><MasteryBadge status={s} className="h-7 px-3 text-sm" /></motion.div>
            {k < flow.length - 1 && <ArrowRight className={cn("size-4 transition-colors", k < i ? "text-emerald-500" : "text-muted-foreground/40")} />}
          </div>
        ))}
      </div>
      <div className="text-xl font-semibold">「{KP[kid].name}」已掌握</div>
      <div className="max-w-md text-sm text-muted-foreground">证据：不同题目的变式独立验证通过。已移除冗余练习、后续任务前移，并新增延迟复习。计划已重排为 <b className="text-foreground">V{version}</b>，历史版本保留。</div>
      <div className="flex gap-2"><Button variant="outline" onClick={onPlan}>查看计划 diff</Button><Button onClick={onNext}>下一个任务<ArrowRight data-icon="inline-end" /></Button></div>
    </div>
  )
}

function RemediationLadder({ level, kid, onNext }: { level: number; kid: string; onNext: () => void }) {
  const prereq = KP[kid].prerequisites[0]
  const levels = [
    { n: 1, title: "首次错误", desc: "错因识别 → 针对性讲解/知识回看 → 订正 → 独立变式验证", icon: Lightbulb },
    { n: 2, title: "再次失败 · 降难 + 回退前置", desc: `难度下调 1 级${prereq ? `，回退前置「${KP[prereq].name}」再学习` : ""} → 新变式验证`, icon: TrendingDown },
    { n: 3, title: "持续失败 · 风险标记", desc: "标记持续薄弱，进入轻量教师关注队列；学生可继续其他学习，无需等待教师", icon: AlertTriangle },
  ]
  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="text-center">
        <div className="text-lg font-semibold">变式验证未通过 → 触发 L{level} 补弱</div>
        <div className="text-sm text-muted-foreground">阈值来自 SubjectStageStrategy（{KP[kid].subject === "math" ? "math" : KP[kid].subject === "physics" ? "phy" : "chem"}-junior）· 失败任务不得简单消失</div>
      </div>
      <div className="relative flex flex-col gap-3">
        {levels.map((l) => {
          const active = l.n === level
          const past = l.n < level
          return (
            <motion.div key={l.n} initial={{ opacity: 0, x: -12 }} animate={{ opacity: l.n <= level ? 1 : 0.4, x: 0 }} transition={{ delay: l.n * 0.15 }}
              className={cn("relative flex items-start gap-3 rounded-2xl p-4 ring-1", active ? (l.n === 3 ? "bg-destructive/10 ring-destructive/50" : "bg-amber-500/10 ring-amber-500/50") : past ? "bg-muted/40 ring-foreground/10" : "ring-foreground/5")}>
              <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? (l.n === 3 ? "bg-destructive text-white" : "bg-amber-500 text-white") : "bg-muted text-muted-foreground")}><l.icon className="size-5" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">L{l.n} · {l.title}{active && <Badge variant="destructive">当前</Badge>}{past && <Badge variant="outline">已执行</Badge>}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l.desc}</div>
              </div>
              {active && <span className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 animate-ping rounded-full bg-amber-500" />}
            </motion.div>
          )
        })}
      </div>
      {level === 2 && prereq && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-muted/40 p-4 text-sm ring-1 ring-foreground/5">
          <Badge variant="outline">{KP[kid].name}</Badge><ArrowRight className="size-4 rotate-180 text-amber-500" /><Badge className="bg-amber-500/15 text-amber-500">回退前置：{KP[prereq].name}</Badge>
          <span className="text-muted-foreground">→ 已插入今日队列「补弱」任务</span>
        </div>
      )}
      <div className="flex justify-center"><Button onClick={onNext}>继续下一个任务<ArrowRight data-icon="inline-end" /></Button></div>
    </div>
  )
}

function StageTest({ task, answers, setAnswers, onSubmit }: { task: LearningTask; answers: Record<string, string>; setAnswers: (a: Record<string, string>) => void; onSubmit: () => void }) {
  const qs = useMemo(() => questionsForStage(task.knowledgeId), [task.knowledgeId])
  return (
    <div className="flex flex-col gap-4">
      <Alert><ShieldCheck /><AlertTitle>阶段检测 · 高权重证据（×2）</AlertTitle><AlertDescription>覆盖「{qs.map((q) => KP[Q[q].knowledgeId].name).join("」「")}」，完成后触发计划重排。</AlertDescription></Alert>
      {qs.map((q, i) => (
        <div key={q} className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">第 {i + 1} 题</div>
          <QuestionBody qid={q} selected={answers[q] ?? null} onSelect={(k) => setAnswers({ ...answers, [q]: k })} />
        </div>
      ))}
      <div className="flex justify-end"><Button size="lg" disabled={Object.keys(answers).length < qs.length} onClick={onSubmit}>提交阶段检测</Button></div>
    </div>
  )
}
