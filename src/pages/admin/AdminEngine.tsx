import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Bot, CheckCircle2, Cpu, DollarSign, FileCheck2, GitCompare, Grid3x3, Layers, ListTodo, Lock, Route, RotateCw, ScrollText, Search, ShieldCheck, Timer, ToggleRight, XCircle, Zap } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader, Stat, SubjectBadge, fmtDT } from "@/components/app/bits"
import { KP, SUBJECTS, SUBJECT_LIST } from "@/data/knowledge"
import type { AIRequestLog, FeatureFlag, StrategyPolicy, SubjectStageStrategy } from "@/data/types"
import { cn } from "@/lib/utils"
import { isFeatureOn, useStore } from "@/store/useStore"

const STATUS_STYLE: Record<AIRequestLog["status"], string> = {
  成功: "bg-emerald-500/15 text-emerald-500",
  "校验失败·已回退题库": "bg-amber-500/15 text-amber-500",
  "超时·已重试": "bg-sky-500/15 text-sky-400",
  失败: "bg-destructive/15 text-destructive",
}

const PROMPTS = [
  { key: "explain.math.junior", ver: "v3.2", prev: "v3.1", status: "已发布", scene: "AI讲题" },
  { key: "explain.phy.junior", ver: "v3.0", prev: "v2.4", status: "已发布", scene: "AI讲题" },
  { key: "variant.math.junior", ver: "v2.3", prev: "v2.2", status: "已发布", scene: "变式生成" },
  { key: "variant.chem.junior", ver: "v2.1", prev: "v2.0", status: "灰度 20%", scene: "变式生成" },
  { key: "variant.math.senior", ver: "v1.0", prev: "—", status: "灰度 5%", scene: "变式生成" },
]

export function AAI() {
  const s = useStore()
  const [sel, setSel] = useState(s.aiLogs.find((l) => l.status === "校验失败·已回退题库")?.id ?? s.aiLogs[0]?.id)
  const [tab, setTab] = useState("log")
  const log = s.aiLogs.find((l) => l.id === sel)
  const withV = s.aiLogs.filter((l) => l.validations)
  const checks = withV.flatMap((l) => l.validations!)
  const passRate = checks.length ? Math.round((checks.filter((v) => v.pass).length / checks.length) * 100) : 0
  const blocked = withV.filter((l) => l.validations!.some((v) => !v.pass)).length
  const cost = s.aiLogs.reduce((a, b) => a + b.costCny, 0)
  const avgLat = Math.round(s.aiLogs.reduce((a, b) => a + b.latencyMs, 0) / Math.max(1, s.aiLogs.length))
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台 · 统一 AI Gateway" icon={Bot} title="AI 网关" desc="所有 AI 调用经统一网关：模型别名路由、Prompt 版本、预算控制、结构化上下文与质量门禁。AI 输出不直接改写掌握度。" />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="调用次数（近 3 日）" value={s.aiLogs.length} suffix="次" icon={Zap} color="#a78bfa" />
        <Stat label="质量门禁校验通过率" value={passRate} suffix="%" icon={ShieldCheck} color="var(--st-mastered)" hint={`${checks.length} 项校验 · 拦截 ${blocked} 次 → 回退正式题库`} />
        <Stat label="平均延迟" value={avgLat} suffix="ms" icon={Timer} color="var(--physics)" />
        <Stat label="成本" value={cost} decimals={3} suffix="元" icon={DollarSign} color="var(--chem)" hint="月预算 ¥3,000 · 已用 41%" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {s.providers.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="relative overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-foreground/10 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Cpu className="size-4 text-violet-400" /><span className="font-medium">{p.vendor}</span></div>
              <span className={cn("flex items-center gap-1.5 text-xs", p.status === "正常" ? "text-emerald-500" : "text-amber-500")}><span className={cn("size-1.5 animate-pulse rounded-full", p.status === "正常" ? "bg-emerald-500" : "bg-amber-500")} />{p.status}</span>
            </div>
            <div className="mt-2 font-mono text-xs text-muted-foreground">alias: <span className="text-foreground">{p.alias}</span> · {p.role}</div>
            <div className="mt-3 flex justify-between text-xs"><span className="text-muted-foreground">P50 延迟</span><span className="tabular-nums">{p.latencyMs} ms</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">单价 /1k tokens</span><span className="tabular-nums">¥{p.costPer1k}</span></div>
          </motion.div>
        ))}
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList><TabsTrigger value="log">调用日志</TabsTrigger><TabsTrigger value="route">路由与 Prompt</TabsTrigger><TabsTrigger value="budget">预算</TabsTrigger></TabsList>
      </Tabs>
      {tab === "log" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Card>
            <CardContent>
              <Table className="text-xs">
                <TableHeader><TableRow><TableHead>请求 ID</TableHead><TableHead>时间</TableHead><TableHead>场景</TableHead><TableHead>学科/知识点</TableHead><TableHead>模型 · 路由</TableHead><TableHead className="text-right">延迟</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[...s.aiLogs].sort((a, b) => b.at.localeCompare(a.at)).map((l) => (
                    <TableRow key={l.id} onClick={() => setSel(l.id)} className={cn("cursor-pointer", sel === l.id && "bg-primary/10")}>
                      <TableCell className="font-mono text-primary">{l.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDT(l.at)}</TableCell>
                      <TableCell>{l.scene}</TableCell>
                      <TableCell><span style={{ color: SUBJECTS[l.context.subject].color }}>{SUBJECTS[l.context.subject].name}</span> · {KP[l.context.knowledgeId]?.name ?? l.context.knowledgeId}</TableCell>
                      <TableCell className="max-w-52 whitespace-normal">{l.model}<div className="truncate text-[10px] text-muted-foreground">{l.route} · {l.promptVersion}</div></TableCell>
                      <TableCell className="text-right tabular-nums">{l.latencyMs}ms</TableCell>
                      <TableCell><Badge className={STATUS_STYLE[l.status]}>{l.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <AnimatePresence mode="wait">
            {log && (
              <motion.div key={log.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Card className="xl:sticky xl:top-20">
                  <CardHeader>
                    <CardTitle className="font-mono">{log.id}</CardTitle>
                    <CardDescription>{log.scene} · {fmtDT(log.at)} · 学生 {s.students.find((x) => x.id === log.studentId)?.name ?? log.studentId}</CardDescription>
                    <CardAction><Badge className={STATUS_STYLE[log.status]}>{log.status}</Badge></CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div>
                      <div className="mb-2 text-xs font-medium text-muted-foreground">结构化上下文（学习引擎 → Gateway）</div>
                      <div className="rounded-xl bg-muted/50 p-3 font-mono text-[11px] leading-relaxed ring-1 ring-foreground/5">
                        <span className="text-muted-foreground">{"{"}</span>
                        {Object.entries(log.context).map(([k, v]) => (
                          <div key={k} className="pl-3"><span className="text-sky-400">"{k}"</span>: <span className={typeof v === "number" ? "text-amber-400" : "text-emerald-400"}>{typeof v === "number" ? v : `"${v}"`}</span>,</div>
                        ))}
                        <div className="pl-3"><span className="text-sky-400">"promptVersion"</span>: <span className="text-emerald-400">"{log.promptVersion}"</span>,</div>
                        <div className="pl-3"><span className="text-sky-400">"strategyVersion"</span>: <span className="text-emerald-400">"{log.strategyVersion}"</span></div>
                        <span className="text-muted-foreground">{"}"}</span>
                      </div>
                    </div>
                    {log.validations ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground"><span>质量门禁</span><span>{log.validations.filter((v) => v.pass).length}/{log.validations.length} 通过</span></div>
                        {log.validations.map((v) => (
                          <div key={v.check} className={cn("flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs", v.pass ? "bg-emerald-500/5" : "bg-destructive/10 ring-1 ring-destructive/30")}>
                            {v.pass ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />}
                            <div><div className="font-medium">{v.check}</div><div className="text-muted-foreground">{v.detail}</div></div>
                          </div>
                        ))}
                        {log.validations.some((v) => !v.pass) && <Alert className="mt-1"><ShieldCheck /><AlertTitle>已拦截，未下发给学生</AlertTitle><AlertDescription>门禁未通过 → 回退正式题库同知识点变式，调用与失败原因完整留痕。</AlertDescription></Alert>}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">讲解类输出：经安全与学科表达校验后流式返回；标记「不计入掌握度」。</div>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">tokens</div><div className="font-semibold">{log.tokens}</div></div>
                      <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">延迟</div><div className="font-semibold">{log.latencyMs}ms</div></div>
                      <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">成本</div><div className="font-semibold">¥{log.costCny.toFixed(4)}</div></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {tab === "route" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Route className="size-4" />场景路由</CardTitle><CardDescription>业务只调用模型别名，Gateway 负责主备切换与降级</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[["AI讲题", "tutor-explain", "通义千问", "豆包"], ["变式生成", "variant-gen", "DeepSeek", "正式题库回退"], ["解析辅助", "tutor-explain", "通义千问", "豆包"], ["质量评测", "quality-judge", "文心一言（降级）", "规则校验"]].map(([scene, alias, main, backup]) => (
                <div key={scene} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="w-20 justify-center">{scene}</Badge><ArrowRight className="size-4 text-muted-foreground" />
                  <code className="rounded bg-violet-500/15 px-2 py-0.5 text-xs text-violet-400">{alias}</code><ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-medium">{main}</span><span className="text-xs text-muted-foreground">备：{backup}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-4" />Prompt 版本</CardTitle><CardDescription>版本化发布、灰度与回滚</CardDescription></CardHeader>
            <CardContent>
              <Table className="text-xs"><TableHeader><TableRow><TableHead>Prompt</TableHead><TableHead>场景</TableHead><TableHead>当前</TableHead><TableHead>上一版</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
                <TableBody>{PROMPTS.map((p) => <TableRow key={p.key}><TableCell className="font-mono">{p.key}</TableCell><TableCell>{p.scene}</TableCell><TableCell className="font-mono text-primary">{p.ver}</TableCell><TableCell className="font-mono text-muted-foreground">{p.prev}</TableCell><TableCell><Badge variant={p.status === "已发布" ? "secondary" : "outline"}>{p.status}</Badge></TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
      {tab === "budget" && (
        <Card>
          <CardHeader><CardTitle>预算控制</CardTitle><CardDescription>平台月预算 ¥3,000 · 按机构与场景分配，超限自动降级到低成本模型或题库</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[["星海教育", 1200, 612], ["启明学堂", 400, 133], ["博雅培优", 600, 238], ["平台教研（解析辅助）", 800, 247]].map(([n, b, u]) => (
              <div key={n as string} className="flex items-center gap-4 text-sm"><span className="w-44">{n}</span><Progress value={((u as number) / (b as number)) * 100} className="flex-1" /><span className="w-36 text-right tabular-nums text-muted-foreground">¥{u} / ¥{b}</span></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const POLICY_LABEL: Record<keyof StrategyPolicy, string> = {
  diagnostic: "诊断方式", questionTypes: "题型", difficulty: "难度", knowledgeCard: "知识卡呈现", errorTypes: "错因体系", explanation: "讲解方式", variant: "变式规则", mastery: "掌握判定", remediation: "补弱规则", review: "复习间隔", assessment: "阶段检测",
}
const STAGES = ["小学", "初中", "高中"] as const
const STATUS_C: Record<SubjectStageStrategy["status"], string> = { 已发布: "bg-emerald-500/15 text-emerald-500", 灰度: "bg-amber-500/15 text-amber-500", 草稿: "bg-muted text-muted-foreground" }

export function AStrategy() {
  const s = useStore()
  const [a, setA] = useState("math-junior")
  const [b, setB] = useState<string | null>("math-primary")
  const [pickB, setPickB] = useState(false)
  const A = s.strategies.find((x) => x.id === a)!
  const B = b ? s.strategies.find((x) => x.id === b) : undefined
  const click = (id: string) => { if (pickB) { setB(id === a ? null : id); setPickB(false) } else setA(id) }
  const val = (v: string | string[]) => (Array.isArray(v) ? v.join(" / ") : v)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台 · SubjectStageStrategy" icon={Grid3x3} title="学科 × 学段策略矩阵" desc="同一个学习闭环，不同学科与学段使用不同的诊断、讲解、变式、掌握判定与补弱策略。策略版本化，所有 AI 调用与补弱事件都记录策略版本。"
        actions={<Button variant={pickB ? "default" : "outline"} onClick={() => setPickB(!pickB)}><GitCompare data-icon="inline-start" />{pickB ? "点击矩阵选择对比项…" : "选择对比项"}</Button>} />
      <Card>
        <CardContent>
          <div className="grid grid-cols-[120px_repeat(3,minmax(0,1fr))] gap-3">
            <div />
            {STAGES.map((st) => <div key={st} className="text-center text-sm font-medium text-muted-foreground">{st}</div>)}
            {SUBJECT_LIST.map((sub) => (
              <div key={sub} className="contents">
                <div className="flex items-center gap-2 text-sm font-medium"><span className="size-2.5 rounded-full" style={{ background: SUBJECTS[sub].color }} />{SUBJECTS[sub].name}</div>
                {STAGES.map((st) => {
                  const x = s.strategies.find((y) => y.subject === sub && y.stage === st)
                  if (!x) return <div key={st} className="grid place-items-center rounded-xl border border-dashed text-xs text-muted-foreground">V1 不适用</div>
                  const isA = x.id === a, isB = x.id === b
                  return (
                    <motion.button key={st} whileHover={{ y: -2 }} onClick={() => click(x.id)}
                      className={cn("relative flex flex-col gap-1.5 overflow-hidden rounded-xl p-3 text-left ring-1 transition", isA ? "ring-2" : isB ? "ring-2 ring-fuchsia-500/70" : "ring-foreground/10 hover:ring-foreground/25")}
                      style={isA ? { boxShadow: `0 0 0 2px ${SUBJECTS[sub].color}, 0 0 30px -6px ${SUBJECTS[sub].color}`, background: `color-mix(in oklch, ${SUBJECTS[sub].color} 10%, transparent)` } : undefined}>
                      <div className="flex items-center justify-between"><span className="font-mono text-xs">{x.id}@{x.version}</span><Badge className={STATUS_C[x.status]}>{x.status}</Badge></div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{x.policy.variant}</div>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="rounded bg-muted px-1.5 py-0.5">掌握 ≥{x.params.masteryThreshold}%</span>
                        <span className="rounded bg-muted px-1.5 py-0.5">变式 ×{x.params.variantsRequired}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5">复习 {x.params.reviewDays.join("/")}d</span>
                      </div>
                      {(isA || isB) && <span className={cn("absolute top-0 right-0 rounded-bl-lg px-1.5 text-[10px] font-bold text-white", isA ? "bg-primary" : "bg-fuchsia-500")}>{isA ? "A" : "B"}</span>}
                    </motion.button>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="size-4" />{B ? "策略对比" : "策略详情"}</CardTitle>
          <CardDescription>{A.gradeScope} · {A.textbookScope}{B ? `　vs　${B.gradeScope} · ${B.textbookScope}` : ""} · 差异项高亮</CardDescription>
          {B && <CardAction><Button size="sm" variant="ghost" onClick={() => setB(null)}>取消对比</Button></CardAction>}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead className="w-28">维度</TableHead><TableHead><span className="mr-1.5 rounded bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">A</span>{SUBJECTS[A.subject].name} · {A.stage} <span className="font-mono text-xs text-muted-foreground">{A.version}</span></TableHead>{B && <TableHead><span className="mr-1.5 rounded bg-fuchsia-500 px-1.5 text-[10px] font-bold text-white">B</span>{SUBJECTS[B.subject].name} · {B.stage} <span className="font-mono text-xs text-muted-foreground">{B.version}</span></TableHead>}</TableRow></TableHeader>
            <TableBody>
              {(Object.keys(POLICY_LABEL) as (keyof StrategyPolicy)[]).map((k) => {
                const diff = B && val(A.policy[k]) !== val(B.policy[k])
                return (
                  <TableRow key={k}>
                    <TableCell className="align-top text-xs font-medium text-muted-foreground">{POLICY_LABEL[k]}</TableCell>
                    <TableCell className={cn("align-top text-sm whitespace-normal", diff && "bg-primary/5")}>{Array.isArray(A.policy[k]) ? <div className="flex flex-wrap gap-1">{(A.policy[k] as string[]).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div> : (A.policy[k] as string)}</TableCell>
                    {B && <TableCell className={cn("align-top text-sm whitespace-normal", diff && "bg-fuchsia-500/5")}>{Array.isArray(B.policy[k]) ? <div className="flex flex-wrap gap-1">{(B.policy[k] as string[]).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div> : (B.policy[k] as string)}</TableCell>}
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell className="text-xs font-medium text-muted-foreground">关键参数</TableCell>
                {[A, B].filter(Boolean).map((x) => <TableCell key={x!.id} className="font-mono text-xs">mastery≥{x!.params.masteryThreshold} · variants={x!.params.variantsRequired} · downgrade@{x!.params.failToDowngrade} · risk@{x!.params.failToRisk} · review=[{x!.params.reviewDays.join(",")}]</TableCell>)}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function AFlags() {
  const s = useStore()
  const orgs = s.orgs.filter((o) => o.status === "启用")
  const groups: FeatureFlag["group"][] = ["功能", "学科", "扩展位"]
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={ToggleRight} title="功能开关" desc="平台级 → 机构级 → 学科级三层开关。平台强制关闭（force_off）时下层不可开启；灰度仅对显式开启的机构生效。" />
      <Alert><Lock /><AlertTitle>判定顺序</AlertTitle><AlertDescription>force_off → 机构覆盖 → 平台默认；前端仅隐藏入口，最终以服务端判定为准（如 AI 讲题按钮、学科切换会即时响应）。</AlertDescription></Alert>
      {groups.map((g) => (
        <Card key={g}>
          <CardHeader><CardTitle>{g}{g === "扩展位" && <span className="ml-2 text-xs font-normal text-muted-foreground">V1 仅预留能力码</span>}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>开关</TableHead><TableHead>平台级</TableHead>{orgs.map((o) => <TableHead key={o.id} className="text-center">{o.name.split(" · ")[0]}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {s.flags.filter((f) => f.group === g).map((f) => {
                  const locked = f.platform === "force_off"
                  return (
                    <TableRow key={f.key}>
                      <TableCell className="whitespace-normal"><div className="flex items-center gap-1.5 font-medium">{locked && <Lock className="size-3.5 text-destructive" />}{f.name}</div><div className="max-w-64 text-xs text-muted-foreground">{f.desc}</div></TableCell>
                      <TableCell>
                        <ToggleGroup size="sm" variant="outline" value={[f.platform]} onValueChange={(v: string[]) => { if (v[0]) { s.setFlagPlatform(f.key, v[0] as FeatureFlag["platform"]); toast(`「${f.name}」平台级 → ${v[0]}`) } }}>
                          <ToggleGroupItem value="on">开</ToggleGroupItem><ToggleGroupItem value="gray">灰度</ToggleGroupItem><ToggleGroupItem value="off">关</ToggleGroupItem><ToggleGroupItem value="force_off" className="data-[pressed]:text-destructive">强制关</ToggleGroupItem>
                        </ToggleGroup>
                      </TableCell>
                      {orgs.map((o) => {
                        const ov = f.orgOverrides[o.id]
                        const eff = isFeatureOn(s.flags, f.key, o.id)
                        return (
                          <TableCell key={o.id} className="text-center">
                            <Tooltip>
                              <TooltipTrigger render={<div className="inline-flex flex-col items-center gap-1" />}>
                                <Select items={[{ value: "inherit", label: "继承" }, { value: "on", label: "开启" }, { value: "off", label: "关闭" }]} value={ov === undefined ? "inherit" : ov ? "on" : "off"} disabled={locked} onValueChange={(v) => s.setFlagOrg(f.key, o.id, v === "inherit" ? null : v === "on")}>
                                  <SelectTrigger size="sm" className="w-24">{locked ? <Lock /> : null}<SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="inherit">继承</SelectItem><SelectItem value="on">开启</SelectItem><SelectItem value="off">关闭</SelectItem></SelectContent>
                                </Select>
                                <span className={cn("text-[10px]", eff ? "text-emerald-500" : "text-muted-foreground")}>{eff ? "● 生效" : "○ 关闭"}</span>
                              </TooltipTrigger>
                              <TooltipContent>{locked ? "平台强制关闭，机构不可开启" : `生效值：${eff ? "开启" : "关闭"}`}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AContent() {
  const s = useStore()
  const set = (id: string, status: "已发布" | "已停用") => { useStore.setState((x) => ({ content: x.content.map((c) => (c.id === id ? { ...c, status, reviewer: "周敬", version: c.version } : c)) })); toast.success(status === "已发布" ? "审核通过并发布" : "已停用（历史作答引用保留）") }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={FileCheck2} title="内容与题库审核" desc="教研录入、PDF 导入（OCR）与 AI 生成内容都必须审核后发布；题目版本化，已作答记录引用历史版本。" />
      <div className="grid gap-4 md:grid-cols-4">
        {(["已发布", "待审核", "草稿", "已停用"] as const).map((st, i) => <Stat key={st} label={st} value={s.content.filter((c) => c.status === st).length} icon={FileCheck2} color={["var(--st-mastered)", "var(--st-pending)", "var(--muted-foreground)", "var(--destructive)"][i]} />)}
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>类型</TableHead><TableHead>标题</TableHead><TableHead>学科</TableHead><TableHead>来源</TableHead><TableHead>版本</TableHead><TableHead>审核人</TableHead><TableHead>更新</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {s.content.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell><TableCell>{c.kind}</TableCell><TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell><SubjectBadge subject={c.subject} /></TableCell>
                  <TableCell><Badge variant="outline" className={cn(c.source === "AI生成" && "text-violet-400")}>{c.source}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{c.version}</TableCell><TableCell>{c.reviewer ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDT(c.updatedAt)}</TableCell>
                  <TableCell><Badge variant={c.status === "已发布" ? "secondary" : c.status === "已停用" ? "destructive" : "outline"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right">{c.status === "待审核" || c.status === "草稿" ? <Button size="xs" onClick={() => set(c.id, "已发布")}>审核发布</Button> : c.status === "已发布" ? <Button size="xs" variant="ghost" onClick={() => set(c.id, "已停用")}>停用</Button> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function AJobs() {
  const s = useStore()
  const retry = (id: string) => {
    useStore.setState((x) => ({ jobs: x.jobs.map((j) => (j.id === id ? { ...j, status: "运行中" as const, retries: j.retries + 1 } : j)) }))
    setTimeout(() => { useStore.setState((x) => ({ jobs: x.jobs.map((j) => (j.id === id ? { ...j, status: "成功" as const } : j)) })); toast.success(`${id} 重试成功`) }, 1800)
  }
  const C: Record<string, string> = { 成功: "bg-emerald-500/15 text-emerald-500", 运行中: "bg-sky-500/15 text-sky-400", "失败·可重试": "bg-destructive/15 text-destructive", 排队中: "bg-muted text-muted-foreground" }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={ListTodo} title="异步任务" desc="AI 变式生成、拍照批改 OCR、学案 PDF、计划重排、内容导入均为可重试的异步任务，失败不丢数据。" />
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>任务 ID</TableHead><TableHead>类型</TableHead><TableHead>创建时间</TableHead><TableHead>详情</TableHead><TableHead>重试</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {s.jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono text-xs text-primary">{j.id}</TableCell><TableCell>{j.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDT(j.createdAt)}</TableCell><TableCell className="text-sm">{j.detail}</TableCell>
                  <TableCell className="tabular-nums">{j.retries}</TableCell>
                  <TableCell><Badge className={C[j.status]}>{j.status === "运行中" && <RotateCw className="animate-spin" data-icon="inline-start" />}{j.status}</Badge></TableCell>
                  <TableCell className="text-right">{j.status === "失败·可重试" && <Button size="xs" variant="outline" onClick={() => retry(j.id)}><RotateCw data-icon="inline-start" />重试</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function AAudit() {
  const s = useStore()
  const [q, setQ] = useState("")
  const list = useMemo(() => [...s.audit].sort((a, b) => b.at.localeCompare(a.at)).filter((a) => !q || `${a.actor}${a.action}${a.target}${a.detail}`.includes(q)), [s.audit, q])
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={ScrollText} title="审计日志" desc="机构、账号、库存、权益、开关、策略与越权拒绝等关键操作全部留痕，不可删除。"
        actions={<div className="relative"><Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="搜索操作人 / 动作 / 对象" value={q} onChange={(e) => setQ(e.target.value)} /></div>} />
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>操作人</TableHead><TableHead>角色</TableHead><TableHead>动作</TableHead><TableHead>对象</TableHead><TableHead>详情</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDT(a.at)}</TableCell>
                  <TableCell className="font-medium">{a.actor}</TableCell><TableCell><Badge variant="outline">{a.role}</Badge></TableCell>
                  <TableCell><Badge className={cn(a.action.includes("拒绝") || a.action.includes("拦截") ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")}>{a.action}</Badge></TableCell>
                  <TableCell>{a.target}</TableCell><TableCell className="max-w-md text-sm whitespace-normal text-muted-foreground">{a.detail}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
