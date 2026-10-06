import { motion } from "motion/react"
import { Activity, BarChart3, CheckCircle2, Download, Repeat, ShieldCheck, Target, TrendingUp, Wrench } from "lucide-react"
import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MasteryBadge, PageHeader, ProgressRing, fmtDT } from "@/components/app/bits"
import { NumberTicker } from "@/components/ui/number-ticker"
import { KNOWLEDGE, KP, MASTERY_META, SUBJECTS, SUBJECT_LIST } from "@/data/knowledge"
import type { SubjectId } from "@/data/types"
import { addDays, fmtMD, todayISO } from "@/engine/date"
import { replay, subjectAvg } from "@/engine/mastery"
import { cn } from "@/lib/utils"
import { todayDayOf, useLearning, useStore } from "@/store/useStore"

const trendConfig = {
  math: { label: "数学", color: "var(--math)" },
  physics: { label: "物理", color: "var(--physics)" },
  chemistry: { label: "化学", color: "var(--chem)" },
} satisfies ChartConfig
const radarConfig = { now: { label: "现在", color: "var(--subject)" }, base: { label: "诊断时", color: "var(--muted-foreground)" } } satisfies ChartConfig

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export default function Report() {
  const L = useLearning()
  const subject = useStore((s) => s.subject)
  const setSubject = useStore((s) => s.setSubject)
  const [sub, setSub] = useState<SubjectId>(subject)
  const day = todayDayOf(L)

  const metrics = useMemo(() => {
    const diag = L.evidence.filter((e) => e.type === "诊断")
    const weakAtDiag = [...new Set(diag.filter((e) => e.to === "weak").map((e) => e.knowledgeId))]
    const improved = weakAtDiag.filter((k) => ["mastered", "pending"].includes(L.mastery[k].status))
    const variants = L.evidence.filter((e) => e.type === "变式验证")
    const reviews = L.evidence.filter((e) => e.type === "延迟复习")
    const stage = L.attempts.filter((a) => a.mode === "阶段检测")
    const studyDays = new Set(L.sessions.filter((s) => L.plan && s.date >= L.plan.startDate).map((s) => s.date)).size
    return [
      { label: "薄弱点改善率", value: pct(improved.length, weakAtDiag.length), sub: `${improved.length}/${weakAtDiag.length} 个诊断薄弱点已转为待验证/已掌握`, icon: TrendingUp, color: "#818cf8" },
      { label: "变式验证通过率", value: pct(variants.filter((e) => e.to === "mastered").length, variants.length), sub: `${variants.length} 次独立变式验证`, icon: ShieldCheck, color: "#34d399" },
      { label: "延迟复习保持率", value: pct(reviews.filter((e) => e.to !== "review").length, reviews.length), sub: `${reviews.length} 次 3/7/14 天间隔复习`, icon: Repeat, color: "#22d3ee" },
      { label: "错题订正完成率", value: pct(L.errors.filter((e) => e.corrections.length).length, L.errors.length), sub: `${L.errors.length} 道错题 · ${L.errors.filter((e) => e.status === "已验证").length} 道已验证`, icon: Wrench, color: "#fbbf24" },
      { label: "阶段检测正确率", value: pct(stage.filter((a) => a.correct).length, stage.length), sub: `${stage.length} 题 · 高权重证据`, icon: Target, color: "#f472b6" },
      { label: "计划执行率", value: Math.min(100, pct(studyDays, Math.max(1, day))), sub: `${Math.min(studyDays, day)}/${day} 天按计划学习`, icon: CheckCircle2, color: "#a78bfa" },
    ]
  }, [L])

  const trend = useMemo(() => {
    if (!L.plan) return []
    return Array.from({ length: day }, (_, i) => {
      const d = addDays(L.plan!.startDate, i)
      const m = replay(L.evidence, `${d}T23:59:59`)
      return { day: fmtMD(d), math: subjectAvg(m, "math"), physics: subjectAvg(m, "physics"), chemistry: subjectAvg(m, "chemistry") }
    })
  }, [L.evidence, day])

  const radar = useMemo(() => {
    const base = L.plan ? replay(L.evidence, `${L.plan.startDate}T23:59:59`) : L.mastery
    return KNOWLEDGE.filter((k) => k.subject === sub).map((k) => ({ kp: k.name.length > 6 ? k.name.slice(0, 6) + "…" : k.name, now: L.mastery[k.id].notLearned ? 0 : L.mastery[k.id].score, base: base[k.id]?.score ?? 0 }))
  }, [L, sub])

  const heat = useMemo(() => {
    const today = todayISO()
    const byDay: Record<string, number> = {}
    for (const s of L.sessions) byDay[s.date] = (byDay[s.date] ?? 0) + s.minutes
    const start = addDays(today, -7 * 16 + 1 - ((new Date(today).getDay() + 6) % 7) + 6)
    return Array.from({ length: 16 }, (_, w) => Array.from({ length: 7 }, (_, d) => { const date = addDays(start, w * 7 + d); return { date, min: date > today ? -1 : byDay[date] ?? 0 } }))
  }, [L.sessions])

  const overall = Math.round(SUBJECT_LIST.reduce((a, s) => a + subjectAvg(L.mastery, s), 0) / 3)
  const statusCount = Object.values(L.mastery).reduce<Record<string, number>>((a, m) => { const k = m.notLearned ? "notLearned" : m.status; a[k] = (a[k] ?? 0) + 1; return a }, {})

  return (
    <div className="flex flex-col gap-5 print-area">
      <PageHeader eyebrow={`学习报告 · 第 ${day} 天 / 30 天`} icon={BarChart3} title="我的报告" desc="以效果指标为先：不只看学了多久，而看薄弱点是否真正被修复、能否在新题上独立做对、过一段时间是否还记得。"
        actions={<Button variant="outline" onClick={() => window.print()}><Download data-icon="inline-start" />导出报告</Button>} />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="relative overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-foreground/10 backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-2xl" style={{ background: m.color }} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">{m.label}<m.icon className="size-4" style={{ color: m.color }} /></div>
            <div className="mt-2 flex items-baseline gap-0.5 text-3xl font-semibold"><NumberTicker value={m.value} className="text-foreground dark:text-foreground" /><span className="text-sm text-muted-foreground">%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1.2, delay: 0.2 + i * 0.06 }} /></div>
            <div className="mt-2 text-[11px] leading-snug text-muted-foreground">{m.sub}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>掌握度趋势</CardTitle><CardDescription>由证据逐日回放计算（AI 讲题不计入）· 第 1 天 → 今天</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="aspect-auto h-[280px] w-full">
              <LineChart data={trend} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {(["math", "physics", "chemistry"] as const).map((k) => <Line key={k} dataKey={k} type="monotone" stroke={`var(--color-${k})`} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card data-subject={sub}>
          <CardHeader>
            <CardTitle>知识点雷达</CardTitle><CardDescription>诊断时 vs 现在</CardDescription>
            <CardAction>
              <ToggleGroup size="sm" variant="outline" value={[sub]} onValueChange={(v: string[]) => { if (v[0]) { setSub(v[0] as SubjectId); setSubject(v[0] as SubjectId) } }}>
                {SUBJECT_LIST.map((s) => <ToggleGroupItem key={s} value={s}>{SUBJECTS[s].name}</ToggleGroupItem>)}
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={radarConfig} className="mx-auto aspect-square h-[280px]">
              <RadarChart data={radar} outerRadius="62%">
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid />
                <PolarAngleAxis dataKey="kp" tick={{ fontSize: 10 }} />
                <Radar dataKey="base" stroke="var(--color-base)" fill="var(--color-base)" fillOpacity={0.12} strokeDasharray="4 4" />
                <Radar dataKey="now" stroke="var(--color-now)" fill="var(--color-now)" fillOpacity={0.35} strokeWidth={2} />
                <ChartLegend content={<ChartLegendContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>综合掌握度</CardTitle><CardDescription>{KNOWLEDGE.length} 个知识点状态分布</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-6">
            <ProgressRing value={overall} size={130} color="var(--math)"><div className="text-3xl font-semibold">{overall}</div><div className="text-xs text-muted-foreground">综合分</div></ProgressRing>
            <div className="flex flex-1 flex-col gap-1.5">
              {(["mastered", "pending", "learning", "review", "weak"] as const).map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm"><MasteryBadge status={s} /><span className="ml-auto font-medium">{statusCount[s] ?? 0}</span></div>
              ))}
              <div className="flex items-center gap-2 text-sm"><MasteryBadge status="undiagnosed" notLearned /><span className="ml-auto font-medium">{statusCount.notLearned ?? 0}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>学习热力图</CardTitle><CardDescription>近 16 周每日学习分钟数 · 连续 {L.streak} 天</CardDescription></CardHeader>
          <CardContent>
            <div className="flex gap-1">
              <div className="mr-1 flex flex-col justify-between py-0.5 text-[10px] text-muted-foreground"><span>一</span><span>四</span><span>日</span></div>
              {heat.map((w, i) => (
                <div key={i} className="flex flex-1 flex-col gap-1">
                  {w.map((c) => (
                    <div key={c.date} title={`${c.date} · ${c.min} 分钟`} className={cn("aspect-square w-full rounded-[4px]", c.min < 0 && "opacity-0")}
                      style={{ background: c.min <= 0 ? "color-mix(in oklch, var(--foreground) 7%, transparent)" : `color-mix(in oklch, #34d399 ${Math.min(100, 20 + c.min * 1.3)}%, transparent)` }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">少{[0, 20, 40, 60].map((m) => <span key={m} className="size-3 rounded-[3px]" style={{ background: m === 0 ? "color-mix(in oklch, var(--foreground) 7%, transparent)" : `color-mix(in oklch, #34d399 ${20 + m * 1.3}%, transparent)` }} />)}多</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="size-4" />证据时间线</CardTitle><CardDescription>每一次状态变化都有可追溯的证据</CardDescription></CardHeader>
          <CardContent className="relative flex max-h-[380px] flex-col gap-3 overflow-y-auto pl-5 scrollbar-thin">
            <div className="absolute top-0 bottom-0 left-[27px] w-px bg-border" />
            {[...L.evidence].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 18).map((e) => (
              <div key={e.id} className="relative flex items-start gap-3 text-sm">
                <span className="absolute -left-[1px] mt-1.5 size-2.5 rounded-full ring-4 ring-background" style={{ background: MASTERY_META[e.to].color }} />
                <div className="ml-5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5"><Badge variant="outline" className="h-4 px-1.5 text-[10px]">{e.type}</Badge><span className="font-medium">{KP[e.knowledgeId].name}</span>
                    {e.from !== e.to && <span className="text-xs text-muted-foreground">{MASTERY_META[e.from].label} → <span style={{ color: MASTERY_META[e.to].color }}>{MASTERY_META[e.to].label}</span></span>}
                    {!e.countsForMastery && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">不计入掌握度</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{e.note}</div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDT(e.at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>多级补弱记录</CardTitle><CardDescription>首次错误 → 再次失败降难/回退前置 → 持续失败风险标记</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {[...L.remediations].reverse().map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5">
                <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white", r.level === 1 ? "bg-sky-500" : r.level === 2 ? "bg-amber-500" : "bg-destructive")}>L{r.level}</div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{KP[r.knowledgeId].name} <span className="text-xs font-normal text-muted-foreground">· {r.trigger}</span></div>
                  <div className="text-xs text-muted-foreground">{r.action}</div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground"><div>{fmtDT(r.at)}</div><div className="font-mono">{r.strategyVersion}</div></div>
              </div>
            ))}
            {!L.remediations.length && <div className="text-sm text-muted-foreground">暂无补弱记录</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
