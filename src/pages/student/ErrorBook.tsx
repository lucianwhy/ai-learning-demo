import { motion } from "motion/react"
import { AlertTriangle, ArrowRight, BookX, CheckCircle2, Clock, PenLine, ShieldCheck, XCircle } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MasteryBadge, PageHeader, Stat, SubjectBadge, fmtDT } from "@/components/app/bits"
import { RichText } from "@/components/app/Tex"
import { KP, SUBJECTS, SUBJECT_LIST } from "@/data/knowledge"
import { Q } from "@/data/questions"
import type { ErrorRecord } from "@/data/types"
import { cn } from "@/lib/utils"
import { useLearning } from "@/store/useStore"

const STATUS_STYLE: Record<ErrorRecord["status"], string> = {
  待订正: "bg-st-weak/15 text-st-weak",
  待验证: "bg-st-pending/15 text-st-pending",
  已验证: "bg-st-mastered/15 text-st-mastered",
  验证失败: "bg-destructive/15 text-destructive",
}

export default function ErrorBook() {
  const L = useLearning()
  const nav = useNavigate()
  const [subject, setSubject] = useState("all")
  const [status, setStatus] = useState("all")
  const list = L.errors.filter((e) => (subject === "all" || e.subject === subject) && (status === "all" || e.status === status || (status === "risk" && e.risk)))
  const count = (st: string) => L.errors.filter((e) => e.status === st).length
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="错题 → 错因 → 订正 → 变式验证" icon={BookX} title="错题本" desc="每道错题都保留完整证据链：原始作答、错因、订正、变式验证。订正不直接判定掌握，必须通过不同题目的独立验证。" />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="待订正" value={count("待订正")} icon={PenLine} color="var(--st-weak)" hint="先识别错因再订正" />
        <Stat label="待验证" value={count("待验证")} icon={Clock} color="var(--st-pending)" hint="已订正，等待变式验证" />
        <Stat label="已验证" value={count("已验证")} icon={ShieldCheck} color="var(--st-mastered)" hint="变式独立验证通过" />
        <Stat label="风险错题" value={L.errors.filter((e) => e.risk).length} icon={AlertTriangle} color="var(--destructive)" hint="连续失败，已进入教师关注" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup variant="outline" size="sm" value={[subject]} onValueChange={(v: string[]) => v[0] && setSubject(v[0])}>
          <ToggleGroupItem value="all">全部学科</ToggleGroupItem>
          {SUBJECT_LIST.map((s) => <ToggleGroupItem key={s} value={s}>{SUBJECTS[s].name}</ToggleGroupItem>)}
        </ToggleGroup>
        <Tabs value={status} onValueChange={(v) => setStatus(v as string)}>
          <TabsList>
            {["all", "待订正", "待验证", "已验证", "risk"].map((s) => <TabsTrigger key={s} value={s}>{s === "all" ? "全部" : s === "risk" ? "风险" : s}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>
      {list.length === 0 ? (
        <Empty className="border"><EmptyHeader><EmptyMedia variant="icon"><CheckCircle2 /></EmptyMedia><EmptyTitle>这里很干净</EmptyTitle><EmptyDescription>当前筛选下没有错题。</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((e, i) => {
            const q = Q[e.questionId]
            const k = KP[e.knowledgeId]
            const attempts = L.attempts.filter((a) => e.attemptIds.includes(a.id))
            const task = L.tasks.find((t) => t.errorId === e.id && t.status !== "done")
            const timeline = [
              ...attempts.map((a) => ({ at: a.at, kind: "作答", ok: a.correct, text: `${a.mode} · 选 ${a.answer}` })),
              ...e.corrections.map((c) => ({ at: c.at, kind: "订正", ok: true, text: `${c.errorType} · ${c.note}` })),
              ...e.verifications.map((v) => ({ at: v.at, kind: "变式验证", ok: v.correct, text: `${v.questionId} · ${v.correct ? "通过" : "未通过"}` })),
            ].sort((a, b) => a.at.localeCompare(b.at))
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn("h-full", e.risk && "ring-destructive/40")}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <SubjectBadge subject={e.subject} />
                      <Badge className={STATUS_STYLE[e.status]}>{e.status}</Badge>
                      {e.errorType && <Badge variant="outline">错因：{e.errorType}</Badge>}
                      {e.risk && <Badge variant="destructive"><AlertTriangle data-icon="inline-start" />风险 · 教师关注</Badge>}
                    </div>
                    <CardTitle className="mt-1">{k.name}</CardTitle>
                    <CardDescription>{k.chapter} · 首次出错 {fmtDT(e.createdAt)}</CardDescription>
                    <CardAction><MasteryBadge status={L.mastery[e.knowledgeId].status} /></CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed ring-1 ring-foreground/5">
                      {q.context && <div className="mb-1 text-xs text-muted-foreground">【{q.context.label}】{q.context.text}</div>}
                      <RichText text={q.stem} />
                      <div className="mt-2 text-xs text-muted-foreground">正确答案：<span className="font-semibold text-emerald-500">{q.answer}</span></div>
                    </div>
                    <div className="relative flex flex-col gap-2.5 pl-5">
                      <div className="absolute top-1 bottom-1 left-[7px] w-px bg-border" />
                      {timeline.map((t, j) => (
                        <div key={j} className="relative flex items-start gap-2 text-xs">
                          <span className={cn("absolute -left-5 mt-0.5 grid size-3.5 place-items-center rounded-full ring-2 ring-background", t.ok ? "bg-emerald-500" : "bg-destructive")} />
                          <span className="w-[72px] shrink-0 whitespace-nowrap text-muted-foreground">{fmtDT(t.at)}</span>
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{t.kind}</Badge>
                          <span className="flex-1">{t.text}</span>
                          {t.ok ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-destructive" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <span className="text-xs text-muted-foreground">作答 {attempts.length} 次 · 订正 {e.corrections.length} 次 · 验证 {e.verifications.length} 次</span>
                    {task ? (
                      <Button size="sm" onClick={() => nav(`/s/today?task=${task.id}`)}>{task.type === "correction" ? "去订正" : "去变式验证"}<ArrowRight data-icon="inline-end" /></Button>
                    ) : e.status === "已验证" ? (
                      <span className="text-xs text-emerald-500">✓ 已纳入延迟复习</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">已排入后续计划</span>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
      <div className="text-xs text-muted-foreground">共 {L.errors.length} 道错题 · 覆盖 {new Set(L.errors.map((e) => e.knowledgeId)).size} 个知识点 · {SUBJECT_LIST.map((s) => `${SUBJECTS[s].name} ${L.errors.filter((e) => e.subject === s).length}`).join(" / ")}</div>
    </div>
  )
}
