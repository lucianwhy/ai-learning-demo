import { motion } from "motion/react"
import { ArrowRight, CalendarRange, Flame, Lightbulb, MessageSquareQuote, PlayCircle, Stethoscope, Target, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/border-beam"
import { Meteors } from "@/components/ui/meteors"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Progress } from "@/components/ui/progress"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { MasteryBadge, ProgressRing, SubjectBadge, TaskTypeBadge, fmtDT } from "@/components/app/bits"
import { LoopViz } from "@/components/app/LoopViz"
import { KP, SUBJECTS, kpOf } from "@/data/knowledge"
import type { LearningState } from "@/data/types"
import { addDays, weekday } from "@/engine/date"
import { subjectAvg } from "@/engine/mastery"
import { cn } from "@/lib/utils"
import { computeQueue, todayDayOf, useCurrentStudent, useLearning, useStore } from "@/store/useStore"

export function loopStepOf(L: LearningState) {
  if (!L.diagnosed) return 0
  if (!L.plan) return 1
  const q = computeQueue(L).find((x) => x.task.status !== "done" && x.task.status !== "failed" && !x.locked)
  if (!q) return 10
  const map: Record<string, number> = { learn: 3, practice: 4, worksheet: 4, correction: 6, variant: 7, review: 7, stage: 8, remediate: 3 }
  return map[q.task.type] ?? 2
}

export default function Home() {
  const L = useLearning()
  const st = useCurrentStudent()
  const subject = useStore((s) => s.subject)
  const nav = useNavigate()
  if (!L?.diagnosed) return <FreshHome name={st?.name ?? "同学"} />
  const queue = computeQueue(L)
  const doneN = L.tasks.filter((t) => t.status === "done").length
  const inBudget = queue.filter((q) => !q.deferred)
  const pct = Math.round((doneN / Math.max(1, inBudget.length)) * 100)
  const next = queue.find((q) => q.task.status !== "done" && q.task.status !== "failed" && !q.locked && !q.deferred)
  const day = todayDayOf(L)
  const weak = kpOf(subject).filter((k) => ["weak", "pending", "review", "learning"].includes(L.mastery[k.id]?.status)).sort((a, b) => L.mastery[a.id].score - L.mastery[b.id].score)
  const hour = new Date().getHours()
  const hello = hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好"
  const step = loopStepOf(L)
  const recent = [...L.evidence].reverse().slice(0, 5)
  const pv = L.plan?.versions.find((v) => v.version === L.plan?.activeVersion)
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="relative lg:col-span-2">
          <Meteors number={10} />
          <CardContent className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline"><CalendarRange data-icon="inline-start" />30 天计划 · 第 {day} 天</Badge>
                <Badge variant="outline">当前计划 V{L.plan?.activeVersion}</Badge>
                <Badge variant="outline">每日预算 {L.dailyBudgetMin} 分钟</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{hello}，{st?.name} <span className="inline-block animate-bounce">👋</span></h1>
              <p className="max-w-lg text-sm text-muted-foreground">
                引擎根据昨天的证据为你排好了 <b className="text-foreground">{inBudget.length}</b> 个任务（{queue.filter((q) => q.deferred).length} 个超出预算已顺延）。先完成「{next ? next.task.title : "今日任务"}」。
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <ShimmerButton background="linear-gradient(110deg,#4f46e5,#7c3aed,#c026d3)" className="px-7 py-3.5 text-base font-semibold shadow-2xl shadow-violet-600/40" onClick={() => nav("/s/today")}>
                  <PlayCircle className="mr-2 size-5" /> 开始今日学习
                </ShimmerButton>
                <Button variant="ghost" onClick={() => nav("/s/plan")}>查看 30 天计划<ArrowRight data-icon="inline-end" /></Button>
              </div>
            </div>
            {next && (
              <button onClick={() => nav(`/s/today?task=${next.task.id}`)} className="group relative w-full shrink-0 overflow-hidden rounded-2xl bg-background/50 p-4 text-left ring-1 ring-foreground/10 transition hover:ring-primary/40 md:w-72">
                <div className="text-xs text-muted-foreground">继续未完成任务</div>
                <div className="mt-2 flex items-center gap-2"><SubjectBadge subject={next.task.subject} /><TaskTypeBadge type={next.task.type} /></div>
                <div className="mt-2 font-medium">{next.task.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">预计 {next.task.minutes} 分钟 · {next.task.completionRule}</div>
                <div className="mt-3 flex items-center gap-1 text-xs text-primary">继续 <ArrowRight className="size-3 transition group-hover:translate-x-1" /></div>
                <BorderBeam size={80} duration={6} />
              </button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>今日任务完成度</CardTitle>
            <CardDescription>{weekday(addDays(L.plan!.startDate, day - 1))} · 预算内 {inBudget.length} 项</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            <ProgressRing value={pct} size={128} stroke={11}>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-semibold"><NumberTicker value={pct} className="text-foreground dark:text-foreground" />%</div>
                <div className="text-[11px] text-muted-foreground">{doneN}/{inBudget.length} 完成</div>
              </div>
            </ProgressRing>
            <div className="flex flex-1 flex-col gap-2 text-xs">
              {queue.slice(0, 5).map((q) => (
                <div key={q.task.id} className={cn("flex items-center gap-2", q.deferred && "opacity-50")}>
                  <span className={cn("size-1.5 rounded-full", q.task.status === "done" ? "bg-emerald-500" : q.task.status === "failed" ? "bg-destructive" : q.deferred ? "bg-muted-foreground" : "bg-primary")} />
                  <span className={cn("truncate", q.task.status === "done" && "text-muted-foreground line-through")}>{q.task.title}</span>
                  {q.deferred && <Badge variant="outline" className="ml-auto text-[10px]">顺延</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="relative lg:col-span-2">
          <CardHeader>
            <CardTitle>学习决策闭环</CardTitle>
            <CardDescription>系统根据证据持续决定下一步 —— 当前步骤由今日任务队列实时推导</CardDescription>
            <CardAction><Badge className="bg-fuchsia-500/15 text-fuchsia-400">第 {step + 1} / 11 步</Badge></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 xl:flex-row xl:items-center">
            <LoopViz size={420} current={step} />
            <div className="grid w-full flex-1 grid-cols-2 gap-3 xl:grid-cols-1">
              {[
                { k: "学习证据", v: L.evidence.length, s: "条", c: "var(--math)" },
                { k: "独立作答", v: L.attempts.length, s: "次", c: "var(--physics)" },
                { k: "变式验证通过", v: L.evidence.filter((e) => e.type === "变式验证" && e.to === "mastered").length, s: "个", c: "var(--chem)" },
                { k: "计划版本", v: L.plan?.versions.length ?? 0, s: "版", c: "oklch(0.7 0.2 310)" },
              ].map((x) => (
                <div key={x.k} className="relative overflow-hidden rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5">
                  <div className="absolute inset-y-0 left-0 w-1" style={{ background: x.c }} />
                  <div className="text-xs text-muted-foreground">{x.k}</div>
                  <div className="text-2xl font-semibold"><NumberTicker value={x.v} className="text-foreground dark:text-foreground" /><span className="ml-1 text-xs font-normal text-muted-foreground">{x.s}</span></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Flame className="size-4 text-orange-500" />连续学习 {L.streak} 天</CardTitle>
              <CardDescription>本周已学习 {L.sessions.filter((x) => x.date >= addDays(L.plan!.startDate, day - 7)).reduce((a, b) => a + b.minutes, 0)} 分钟</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between gap-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = addDays(L.plan!.startDate, day - 7 + i)
                const has = L.sessions.some((x) => x.date === d)
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} className={cn("grid size-8 place-items-center rounded-lg text-xs", has ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-orange-500/30" : "bg-muted text-muted-foreground")}>
                      {has ? <Flame className="size-3.5" /> : "·"}
                    </motion.div>
                    <span className="text-[10px] text-muted-foreground">{weekday(d).slice(1)}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="size-4" style={{ color: SUBJECTS[subject].color }} />近期薄弱知识点 · {SUBJECTS[subject].name}</CardTitle>
              <CardDescription>按掌握度升序 · 来自真实证据</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {weak.slice(0, 5).map((k) => (
                <div key={k.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm">{k.name}</span>
                      <MasteryBadge status={L.mastery[k.id].status} />
                    </div>
                    <Progress value={L.mastery[k.id].score} className="mt-1.5" />
                  </div>
                </div>
              ))}
              {!weak.length && <div className="text-sm text-muted-foreground">该学科暂无薄弱点 🎉</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-primary" />阶段进度</CardTitle>
            <CardDescription>{pv?.summary}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="relative pt-6">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(day / 30) * 100}%` }} transition={{ duration: 1.2 }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />
              </div>
              {[7, 14, 21, 28].map((d, i) => (
                <div key={d} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${(d / 30) * 100}%` }}>
                  <span className={cn("rounded-full px-1.5 text-[10px]", d <= day ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground")}>检测{["①", "②", "③", "④"][i]}</span>
                  <span className={cn("mt-1 size-3 rounded-full ring-2 ring-background", d <= day ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["math", "physics", "chemistry"] as const).map((sid) => {
                const ks = kpOf(sid)
                const m = ks.filter((k) => L.mastery[k.id]?.status === "mastered").length
                return (
                  <div key={sid} className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5">
                    <div className="flex items-center justify-between"><SubjectBadge subject={sid} /><span className="text-xs text-muted-foreground">均分 {subjectAvg(L.mastery, sid)}</span></div>
                    <div className="mt-2 text-sm"><b className="text-lg">{m}</b><span className="text-muted-foreground"> / {ks.length} 已掌握</span></div>
                    <div className="mt-2 flex gap-0.5">
                      {ks.map((k) => <span key={k.id} title={k.name} className="h-1.5 flex-1 rounded-full" style={{ background: `var(--st-${L.mastery[k.id]?.status ?? "undiagnosed"})`, opacity: L.mastery[k.id]?.notLearned ? 0.25 : 1 }} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="size-4 text-amber-400" />最新学习证据</CardTitle>
            <CardDescription>掌握度变化均可追溯</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recent.map((e) => (
              <div key={e.id} className="flex gap-3 text-xs">
                <div className="mt-1 size-2 shrink-0 rounded-full" style={{ background: `var(--st-${e.to})` }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5"><span className="font-medium text-foreground">{e.type}</span><span className="text-muted-foreground">· {KP[e.knowledgeId].name}</span></div>
                  <div className="truncate text-muted-foreground">{e.note}</div>
                  <div className="text-[10px] text-muted-foreground/70">{fmtDT(e.at)}</div>
                </div>
              </div>
            ))}
            {L.feedback[0] && (
              <div className="mt-1 rounded-xl bg-emerald-500/10 p-3 text-xs ring-1 ring-emerald-500/20">
                <div className="flex items-center gap-1.5 font-medium text-emerald-500"><MessageSquareQuote className="size-3.5" />{L.feedback[0].teacher}</div>
                <div className="mt-1 text-muted-foreground">{L.feedback[0].text}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FreshHome({ name }: { name: string }) {
  const nav = useNavigate()
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <Card className="relative">
        <Meteors number={14} />
        <CardContent className="relative flex flex-col gap-4 py-6">
          <Badge variant="outline" className="w-fit"><Stethoscope data-icon="inline-start" />尚未诊断 · 掌握度全部为「未诊断」</Badge>
          <h1 className="text-3xl font-semibold">欢迎你，{name}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">第一步：确认教材版本与当前章节（未学内容不会被判为薄弱），完成一次知识点级诊断。系统据此生成你的 30 天计划与今日任务。</p>
          <ShimmerButton background="linear-gradient(110deg,#4f46e5,#7c3aed,#c026d3)" className="w-fit px-7 py-3.5 text-base font-semibold" onClick={() => nav("/s/diagnosis")}>
            <Stethoscope className="mr-2 size-5" /> 开始首次诊断
          </ShimmerButton>
        </CardContent>
        <BorderBeam size={160} duration={8} />
      </Card>
      <LoopViz size={400} current={0} />
    </div>
  )
}
