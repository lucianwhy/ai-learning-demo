import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, CalendarRange, GitCompareArrows, History, Lock, Minus, MoveRight, Plus, Route } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PageHeader, SubjectBadge, TaskTypeBadge, fmtDT } from "@/components/app/bits"
import { SUBJECTS } from "@/data/knowledge"
import type { PlanChange } from "@/data/types"
import { addDays, fmtMD, weekday } from "@/engine/date"
import { cn } from "@/lib/utils"
import { todayDayOf, useLearning } from "@/store/useStore"

const KIND: Record<PlanChange["kind"], { label: string; color: string; icon: typeof Plus }> = {
  added: { label: "新增", color: "var(--st-mastered)", icon: Plus },
  moved: { label: "调整", color: "var(--st-pending)", icon: MoveRight },
  removed: { label: "移除", color: "var(--st-weak)", icon: Minus },
  kept: { label: "保留", color: "var(--muted-foreground)", icon: Minus },
}

export default function Plan() {
  const L = useLearning()
  const nav = useNavigate()
  const plan = L?.plan
  const [ver, setVer] = useState(plan?.activeVersion ?? 1)
  const [diff, setDiff] = useState(true)
  const today = L ? todayDayOf(L) : 1
  const [day, setDay] = useState(today)
  const pv = plan?.versions.find((v) => v.version === ver)
  const changedDays = useMemo(() => {
    const m: Record<number, PlanChange["kind"][]> = {}
    for (const c of pv?.changes ?? []) {
      const d = c.toDay ?? c.fromDay
      if (d) (m[d] ??= []).push(c.kind)
      if (c.kind === "moved" && c.fromDay) (m[c.fromDay] ??= []).push("removed")
    }
    return m
  }, [pv])
  if (!plan || !pv) return (
    <Empty><EmptyHeader><EmptyTitle>还没有学习计划</EmptyTitle><EmptyDescription>完成首次诊断后自动生成 30 天计划。</EmptyDescription></EmptyHeader><Button onClick={() => nav("/s/diagnosis")}>去诊断</Button></Empty>
  )
  const items = pv.items.filter((i) => i.day === day)
  const dayChanges = (pv.changes ?? []).filter((c) => c.toDay === day || c.fromDay === day)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow={`LearningPlan · ${plan.id}`} icon={CalendarRange} title="30 天学习计划" desc={`目标：${plan.goal} · 起始 ${plan.startDate} · 每日预算 ${L.dailyBudgetMin} 分钟 · 计划版本化，重排不覆盖历史`}
        actions={<>
          <ToggleGroup variant="outline" value={[String(ver)]} onValueChange={(v: string[]) => v[0] && setVer(Number(v[0]))}>
            {plan.versions.map((v) => <ToggleGroupItem key={v.version} value={String(v.version)}>V{v.version}{v.version > 1 ? " 重排后" : ""}{v.version === plan.activeVersion ? " ·当前" : ""}</ToggleGroupItem>)}
          </ToggleGroup>
          <label className="flex items-center gap-2 text-sm"><Switch checked={diff} onCheckedChange={setDiff} />显示差异</label>
          <Button onClick={() => nav("/s/today")}>去今日学习<ArrowRight data-icon="inline-end" /></Button>
        </>} />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">V{pv.version} · {pv.trigger}</CardTitle>
            <CardDescription>{pv.summary}</CardDescription>
            <CardAction className="flex items-center gap-3 text-xs text-muted-foreground">
              {(["math", "physics", "chemistry"] as const).map((s) => <span key={s} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: SUBJECTS[s].color }} />{SUBJECTS[s].name}</span>)}
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = i + 1
                const date = addDays(plan.startDate, i)
                const its = pv.items.filter((x) => x.day === d)
                const frozen = d < pv.frozenBeforeDay
                const ch = diff ? changedDays[d] : undefined
                const kind = ch?.includes("added") ? "added" : ch?.includes("moved") ? "moved" : ch?.includes("removed") ? "removed" : undefined
                const isToday = d === today
                return (
                  <motion.button key={d} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.012 }} onClick={() => setDay(d)}
                    className={cn("relative flex min-h-[92px] flex-col gap-1.5 rounded-xl p-2 text-left ring-1 transition", d === day ? "bg-primary/15 ring-primary" : "bg-muted/30 ring-foreground/10 hover:ring-foreground/30", frozen && "opacity-60", d < today && "bg-muted/10")}
                    style={kind ? { boxShadow: `0 0 0 1.5px ${KIND[kind].color}, 0 0 18px -6px ${KIND[kind].color}` } : undefined}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={cn("font-semibold", isToday && "text-primary")}>D{d}</span>
                      <span className="text-muted-foreground">{fmtMD(date).replace("月", "/").replace("日", "")}</span>
                    </div>
                    {isToday && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 text-[9px] font-semibold text-primary-foreground">今天</span>}
                    <div className="flex flex-col gap-1">
                      {its.slice(0, 3).map((it) => (
                        <div key={it.id} className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                          <span className="size-1.5 shrink-0 rounded-full" style={{ background: SUBJECTS[it.subject].color }} />
                          <span className="truncate">{it.title.split(" · ")[1] ?? it.title}</span>
                        </div>
                      ))}
                      {its.length > 3 && <span className="text-[10px] text-muted-foreground">+{its.length - 3}</span>}
                    </div>
                    {frozen && <Lock className="absolute right-1.5 bottom-1.5 size-3 text-muted-foreground" />}
                    {kind && <span className="absolute right-1.5 bottom-1.5 rounded px-1 text-[9px] font-medium" style={{ color: KIND[kind].color, background: `color-mix(in oklch, ${KIND[kind].color} 15%, transparent)` }}>{KIND[kind].label}</span>}
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>第 {day} 天 · {fmtMD(addDays(plan.startDate, day - 1))} {weekday(addDays(plan.startDate, day - 1))}</CardTitle>
            <CardDescription>{day < pv.frozenBeforeDay ? "历史计划（已发生，不被重排覆盖）" : `${items.length} 个计划项 · ${items.reduce((a, b) => a + b.minutes, 0)} 分钟`}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {items.map((it, i) => (
                <motion.div key={it.id + ver} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5">
                  <div className="flex flex-wrap items-center gap-1.5"><SubjectBadge subject={it.subject} /><TaskTypeBadge type={it.type} /><span className="ml-auto text-[11px] text-muted-foreground">{it.minutes} 分钟</span></div>
                  <div className="mt-2 text-sm font-medium">{it.title}</div>
                  <div className="mt-2 flex gap-2 rounded-lg bg-background/60 p-2 text-xs text-muted-foreground ring-1 ring-foreground/5">
                    <Route className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span><b className="text-foreground">生成原因：</b>{it.reason}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {dayChanges.length > 0 && diff && (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="text-xs font-medium text-muted-foreground">本日在 V{pv.version} 中的变化</div>
                {dayChanges.map((c, i) => <ChangeRow key={i} c={c} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitCompareArrows className="size-4 text-primary" />版本差异 · V{Math.max(1, pv.version - 1)} → V{pv.version}</CardTitle>
            <CardDescription>{pv.version === 1 ? "首版计划，无差异" : `重排从第 ${pv.frozenBeforeDay} 天开始；之前的计划与学习记录不被覆盖`}</CardDescription>
            <CardAction className="flex gap-2">
              {(["added", "moved", "removed"] as const).map((k) => <Badge key={k} variant="outline" style={{ color: KIND[k].color }}>{KIND[k].label} {pv.changes.filter((c) => c.kind === k).length}</Badge>)}
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {pv.changes.slice(0, 14).map((c, i) => <ChangeRow key={i} c={c} />)}
            {!pv.changes.length && <div className="text-sm text-muted-foreground">首版由诊断生成。</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-4" />版本留痕</CardTitle><CardDescription>PlanVersion 只增不改</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-0">
            {[...plan.versions].reverse().map((v, i, arr) => (
              <button key={v.version} onClick={() => setVer(v.version)} className="relative flex gap-3 pb-4 text-left">
                {i < arr.length - 1 && <span className="absolute top-6 bottom-0 left-[11px] w-px bg-border" />}
                <span className={cn("relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold ring-1", v.version === ver ? "bg-primary text-primary-foreground ring-primary" : "bg-muted ring-border")}>V{v.version}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{v.trigger}{v.version === plan.activeVersion && <Badge className="ml-2" variant="secondary">生效中</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{fmtDT(v.createdAt)} · {v.changes.length} 处变化</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.summary}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ChangeRow({ c }: { c: PlanChange }) {
  const K = KIND[c.kind]
  return (
    <div className="flex gap-2.5 rounded-xl bg-muted/30 p-2.5 ring-1 ring-foreground/5">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md" style={{ color: K.color, background: `color-mix(in oklch, ${K.color} 15%, transparent)` }}><K.icon className="size-3" /></span>
      <div className="min-w-0 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-foreground">{c.title}</span>
          <span className="text-muted-foreground">{c.kind === "moved" ? `D${c.fromDay} → D${c.toDay}` : c.kind === "added" ? `→ D${c.toDay}` : `D${c.fromDay} 移除`}</span>
        </div>
        <div className="mt-0.5 text-muted-foreground">{c.reason}</div>
      </div>
    </div>
  )
}
