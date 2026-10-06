import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, ArrowRight, Ban, Building2, CalendarClock, Check, CreditCard, Database, FileSpreadsheet, GraduationCap, Layers, Loader2, Package, Receipt, Repeat, ShieldCheck, Upload, UserPlus, Users, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BorderBeam } from "@/components/ui/border-beam"
import { NumberTicker } from "@/components/ui/number-ticker"
import { PageHeader, Stat, SubjectBadge, fmtDT } from "@/components/app/bits"
import { LedgerTable } from "@/components/app/LedgerTable"
import { KP } from "@/data/knowledge"
import type { PackageType, StudentAccount } from "@/data/types"
import { diffDays, todayISO, uid } from "@/engine/date"
import { PKG_LIST, PKG_NAME, inventoryOf } from "@/engine/inventory"
import { subjectAvg } from "@/engine/mastery"
import { cn } from "@/lib/utils"
import { type StoreState, activeEntitlement, useStore } from "@/store/useStore"

const PKG_COLOR: Record<PackageType, string> = { month: "#818cf8", quarter: "#f59e0b", year: "#10b981" }

function useOrg() {
  const s = useStore()
  const org = s.orgs.find((o) => o.id === s.principalOrgId) ?? s.orgs[0]
  const principal = s.principals.find((p) => p.id === org.principalId)
  const students = s.students.filter((x) => x.orgId === org.id)
  return { s, org, principal, students }
}

export function studentStats(s: StoreState, st: StudentAccount) {
  const L = s.learning[st.id]
  if (L?.diagnosed) {
    const variants = L.evidence.filter((e) => e.type === "变式验证")
    const mastery = Math.round((subjectAvg(L.mastery, "math") + subjectAvg(L.mastery, "physics") + subjectAvg(L.mastery, "chemistry")) / 3)
    return {
      mastery,
      completion: L.tasks.length ? Math.round((L.tasks.filter((t) => t.status === "done").length / L.tasks.length) * 100) : 0,
      weak: Object.values(L.mastery).filter((m) => m.status === "weak" && !m.notLearned).length,
      risk: L.errors.some((e) => e.risk) || s.riskQueue.some((r) => r.studentId === st.id && r.status !== "已反馈"),
      verifyRate: variants.length ? Math.round((variants.filter((e) => e.to === "mastered").length / variants.length) * 100) : 0,
      lastActive: L.evidence.map((e) => e.at).sort().at(-1) ?? st.createdAt,
      live: true,
    }
  }
  if (st.seedStats) return { ...st.seedStats, risk: st.seedStats.risk || s.riskQueue.some((r) => r.studentId === st.id && r.status !== "已反馈"), live: false }
  return { mastery: 0, completion: 0, weak: 0, risk: false, verifyRate: 0, lastActive: st.createdAt, live: false }
}

export function OrgBanner() {
  const { org, principal } = useOrg()
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline"><Building2 data-icon="inline-start" />{org.name}</Badge>
      <span>校长 {principal?.name ?? "未绑定"} · 编码 {org.code} · 服务期 {org.servicePeriod}</span>
      {org.status === "停用" && <Badge variant="destructive">机构已停用 · 只读</Badge>}
      <span className="ml-auto flex items-center gap-1"><ShieldCheck className="size-3.5 text-emerald-500" />数据范围：仅本机构（tenant_id = {org.id}）</span>
    </div>
  )
}

export function InvCard({ orgId, pkg, i }: { orgId: string; pkg: PackageType; i: number }) {
  const ledger = useStore((s) => s.ledger)
  const inv = inventoryOf(ledger, orgId, pkg)
  const total = Math.max(1, inv.allocated + inv.returned)
  const segs = [
    { k: "已分配", v: inv.assigned, c: PKG_COLOR[pkg] },
    { k: "冻结", v: inv.frozen, c: "#38bdf8" },
    { k: "回收", v: inv.recovered, c: "#fb923c" },
    { k: "可用", v: inv.available, c: "color-mix(in oklch, var(--foreground) 15%, transparent)" },
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={cn("relative overflow-hidden rounded-2xl bg-card p-5 ring-1 backdrop-blur-xl", inv.available === 0 ? "ring-destructive/40" : "ring-foreground/10")}>
      <div className="pointer-events-none absolute -top-14 -right-14 size-40 rounded-full opacity-25 blur-3xl" style={{ background: PKG_COLOR[pkg] }} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium"><CreditCard className="size-4" style={{ color: PKG_COLOR[pkg] }} />{PKG_NAME[pkg]}</div>
        {inv.available === 0 ? <Badge variant="destructive">库存为 0 · 不可分配</Badge> : inv.available < 15 ? <Badge className="bg-amber-500/15 text-amber-500">库存偏低</Badge> : <Badge variant="outline">充足</Badge>}
      </div>
      <div className="mt-3 flex items-baseline gap-1"><span className="text-xs text-muted-foreground">可用</span><span className={cn("text-4xl font-semibold tabular-nums", inv.available === 0 && "text-destructive")}><NumberTicker value={inv.available} className={cn(inv.available === 0 ? "text-destructive" : "text-foreground dark:text-foreground")} /></span><span className="text-sm text-muted-foreground">张</span></div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
        {segs.map((sg) => <motion.div key={sg.k} initial={{ width: 0 }} animate={{ width: `${(sg.v / total) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ background: sg.c }} />)}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px]">
        {[["累计拨付", inv.allocated], ["已分配", inv.assigned], ["冻结", inv.frozen], ["回收", inv.recovered], ["可用", inv.available]].map(([k, v]) => (
          <div key={k as string}><div className="text-muted-foreground">{k}</div><div className="mt-0.5 font-semibold tabular-nums">{v}</div></div>
        ))}
      </div>
    </motion.div>
  )
}

const masteryChart = { mastery: { label: "掌握度", color: "var(--math)" }, completion: { label: "完成率", color: "var(--chem)" } } satisfies ChartConfig

export function POverview() {
  const { s, org, students } = useOrg()
  const nav = useNavigate()
  const today = todayISO()
  const ents = s.entitlements.filter((e) => e.orgId === org.id)
  const valid = ents.filter((e) => e.status === "有效" && e.expireAt >= today)
  const expiring = valid.filter((e) => diffDays(today, e.expireAt) <= 30).sort((a, b) => a.expireAt.localeCompare(b.expireAt))
  const stats = students.filter((x) => x.status === "启用").map((st) => ({ st, ...studentStats(s, st) }))
  const risk = stats.filter((x) => x.risk)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="机构校长端" icon={Building2} title="机构概览" desc="学生、权益、卡库存与学情一屏掌握。库存数字全部由不可覆盖的流水台账计算。" />
      <OrgBanner />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="学生账号" value={students.length} suffix="人" icon={Users} hint={`启用 ${students.filter((x) => x.status === "启用").length} · 停用 ${students.filter((x) => x.status === "停用").length}`} />
        <Stat label="有效权益" value={valid.length} suffix="个" icon={ShieldCheck} color="var(--st-mastered)" hint={`覆盖率 ${students.length ? Math.round((valid.length / students.length) * 100) : 0}%`} />
        <Stat label="30 天内到期" value={expiring.length} suffix="个" icon={CalendarClock} color="var(--st-pending)" hint="提前续卡避免中断" />
        <Stat label="风险学生" value={risk.length} suffix="人" icon={AlertTriangle} color="var(--destructive)" hint="连续失败 · 教师关注中" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">{org.packages.map((p, i) => <InvCard key={p} orgId={org.id} pkg={p} i={i} />)}</div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>学生学情分布</CardTitle><CardDescription>掌握度与任务完成率（本机构）</CardDescription><CardAction><Button variant="outline" size="sm" onClick={() => nav("/p/learning")}>查看学情<ArrowRight data-icon="inline-end" /></Button></CardAction></CardHeader>
          <CardContent>
            <ChartContainer config={masteryChart} className="aspect-auto h-[240px] w-full">
              <BarChart data={stats.map((x) => ({ name: x.st.name, mastery: x.mastery, completion: x.completion }))} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="mastery" fill="var(--color-mastery)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completion" fill="var(--color-completion)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-5">
          <Card size="sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-destructive" />风险学生</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {risk.length === 0 && <div className="text-sm text-muted-foreground">暂无风险学生</div>}
              {risk.map((x) => {
                const r = s.riskQueue.find((y) => y.studentId === x.st.id)
                return <div key={x.st.id} className="flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-destructive" /><span className="font-medium">{x.st.name}</span><span className="text-xs text-muted-foreground">{x.st.grade}</span><span className="ml-auto truncate text-xs text-muted-foreground">{r ? `${KP[r.knowledgeId].name} · 连续失败 ${r.failures} 次` : `薄弱 ${x.weak} 个`}</span></div>
              })}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="size-4 text-amber-500" />即将到期</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {expiring.length === 0 && <div className="text-sm text-muted-foreground">30 天内无到期权益</div>}
              {expiring.map((e) => <div key={e.id} className="flex items-center gap-2 text-sm"><Badge variant="outline">{PKG_NAME[e.packageType]}</Badge><span>{s.students.find((x) => x.id === e.studentId)?.name}</span><span className="ml-auto text-xs text-amber-500">剩 {diffDays(today, e.expireAt)} 天 · {e.expireAt}</span></div>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function PStudents() {
  const { s, org, students } = useOrg()
  const [name, setName] = useState("张一鸣")
  const [grade, setGrade] = useState("初三")
  const [batch, setBatch] = useState("宋雨晴\n顾北辰\n唐若溪")
  const today = todayISO()
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="机构校长端" icon={Users} title="学生账号" desc="创建/导入本机构学生，启用/停用不删除历史学习记录。"
        actions={<>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}><Upload data-icon="inline-start" />批量导入</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>批量导入学生</DialogTitle><DialogDescription>每行一个姓名（演示：模拟 Excel 导入），默认年级初三。</DialogDescription></DialogHeader>
              <textarea className="min-h-32 w-full rounded-lg border bg-transparent p-3 text-sm outline-none" value={batch} onChange={(e) => setBatch(e.target.value)} />
              <DialogFooter><DialogClose render={<Button variant="outline" />}>取消</DialogClose><DialogClose render={<Button onClick={() => { const n = s.importStudents(org.id, batch.split("\n").map((x) => x.trim()).filter(Boolean)); toast.success(`已导入 ${n} 名学生`) }} />}><FileSpreadsheet data-icon="inline-start" />导入</DialogClose></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger render={<Button />}><UserPlus data-icon="inline-start" />新建学生</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>新建学生账号</DialogTitle><DialogDescription>学生自动归属本机构：{org.name}</DialogDescription></DialogHeader>
              <FieldGroup>
                <Field><FieldLabel>姓名</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field><FieldLabel>年级</FieldLabel>
                  <Select value={grade} onValueChange={(v) => v && setGrade(v as string)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{["五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                </Field>
              </FieldGroup>
              <DialogFooter><DialogClose render={<Button variant="outline" />}>取消</DialogClose><DialogClose render={<Button onClick={() => { const r = s.createStudent(org.id, name, grade); r.ok ? toast.success(r.msg, { description: "下一步：为其分配学习卡" }) : toast.error(r.msg) }} />}>创建</DialogClose></DialogFooter>
            </DialogContent>
          </Dialog>
        </>} />
      <OrgBanner />
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>姓名</TableHead><TableHead>账号</TableHead><TableHead>年级</TableHead><TableHead>学段</TableHead><TableHead>权益</TableHead><TableHead>到期</TableHead><TableHead>创建时间</TableHead><TableHead>状态</TableHead><TableHead className="text-right">启用</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.map((st) => {
                const e = activeEntitlement(s, st.id)
                return (
                  <TableRow key={st.id}>
                    <TableCell className="font-medium">{st.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{st.account}</TableCell>
                    <TableCell>{st.grade}</TableCell><TableCell>{st.stage}</TableCell>
                    <TableCell>{e ? <Badge style={{ background: `color-mix(in oklch, ${PKG_COLOR[e.packageType]} 18%, transparent)`, color: PKG_COLOR[e.packageType] }}>{PKG_NAME[e.packageType]}</Badge> : <Badge variant="outline" className="text-muted-foreground">未分配</Badge>}</TableCell>
                    <TableCell className="text-xs">{e ? `${e.expireAt}（${diffDays(today, e.expireAt)} 天）` : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDT(st.createdAt)}</TableCell>
                    <TableCell><Badge variant={st.status === "启用" ? "secondary" : "destructive"}>{st.status}</Badge></TableCell>
                    <TableCell className="text-right"><Switch checked={st.status === "启用"} onCheckedChange={() => { s.toggleStudent(st.id); toast(`${st.name} 已${st.status === "启用" ? "停用（历史记录保留）" : "启用"}`) }} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function PInventory() {
  const { s, org } = useOrg()
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="机构校长端 · 只读" icon={Package} title="卡库存" desc="可用 = 累计拨付 + 返还 − 已分配 − 冻结 − 回收。库存只能由总部拨付增加，校长不可自行增加。" />
      <OrgBanner />
      <div className="grid gap-4 lg:grid-cols-3">{org.packages.map((p, i) => <InvCard key={p} orgId={org.id} pkg={p} i={i} />)}</div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="size-4" />本机构库存流水</CardTitle><CardDescription>每笔变动有 transaction_id、before/change/after，只追加不覆盖</CardDescription></CardHeader>
        <CardContent><LedgerTable rows={s.ledger.filter((l) => l.orgId === org.id)} showOrg={false} highlight={s.lastTxn?.ledgerTx} /></CardContent>
      </Card>
    </div>
  )
}

const CHECKS = [
  { k: "scope", t: "机构范围 / 状态校验", d: "student.org_id = principal.org_id ∧ 机构启用" },
  { k: "pkg", t: "套餐授权校验", d: "总部已授权该机构使用此卡类型" },
  { k: "idem", t: "幂等校验", d: "idempotency_key 未被处理" },
  { k: "inv", t: "库存校验", d: "available > 0（服务端锁定库存行）" },
  { k: "commit", t: "原子事务提交", d: "库存扣减 + 权益创建 + 流水写入" },
]
const FAIL_AT: Record<string, number> = { TENANT_SCOPE_DENIED: 0, ORG_DISABLED: 0, PACKAGE_NOT_ALLOWED: 1, DUPLICATE_REQUEST: 2, INVENTORY_INSUFFICIENT: 3, ENTITLEMENT_EXISTS: 3 }

export function PAssign() {
  const { s, org, students } = useOrg()
  const enabled = students.filter((x) => x.status === "启用")
  const firstFree = enabled.find((x) => !activeEntitlement(s, x.id)) ?? enabled[0]
  const [sid, setSid] = useState<string | undefined>(firstFree?.id)
  const [pkg, setPkg] = useState<PackageType>(org.packages.includes("month") ? "month" : org.packages[0])
  const [phase, setPhase] = useState<{ step: number; fail?: number; code?: string; msg?: string; done?: boolean; idem?: string } | null>(null)
  const [lastIdem, setLastIdem] = useState<string | null>(null)
  const st = students.find((x) => x.id === (sid ?? firstFree?.id))
  const inv = inventoryOf(s.ledger, org.id, pkg)

  const run = (idem: string) => {
    if (!st) return
    const before = inventoryOf(useStore.getState().ledger, org.id, pkg).available
    const r = useStore.getState().assignEntitlement(org.id, st.id, pkg, idem)
    setLastIdem(idem)
    const failAt = r.ok ? undefined : FAIL_AT[r.code ?? ""] ?? 0
    const stop = failAt ?? CHECKS.length - 1
    setPhase({ step: 0, idem })
    for (let i = 1; i <= stop + 1; i++) {
      setTimeout(() => {
        if (i <= stop) setPhase({ step: i, idem })
        else {
          setPhase({ step: stop, fail: failAt, code: r.code, msg: r.msg, done: true, idem })
          if (r.ok) toast.success(r.msg, { description: `库存 ${before} → ${before - 1} · 流水已写入` })
          else toast.error(r.msg, { description: r.code })
        }
      }, i * 420)
    }
  }
  const txn = s.lastTxn
  const ent = txn && s.entitlements.find((e) => e.id === txn.entitlementId)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="机构校长端" icon={Layers} title="分配权益" desc="一次分配 = 一个原子事务：库存扣减、权益创建、流水记录同时成功或同时失败；重复提交不会重复扣卡。" />
      <OrgBanner />
      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>分配学习卡</CardTitle><CardDescription>选择学生与卡类型</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field><FieldLabel>学生</FieldLabel>
              <Select items={enabled.map((x) => ({ value: x.id, label: `${x.name} · ${x.grade}` }))} value={st?.id ?? ""} onValueChange={(v) => { setSid(v as string); setPhase(null) }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{enabled.map((x) => { const e = activeEntitlement(s, x.id); return <SelectItem key={x.id} value={x.id}>{x.name} · {x.grade}{e ? `（已有${PKG_NAME[e.packageType]}）` : "（未分配）"}</SelectItem> })}</SelectContent>
              </Select>
            </Field>
            <div className="flex flex-col gap-2">
              <FieldLabel>卡类型</FieldLabel>
              {PKG_LIST.map((p) => {
                const allowed = org.packages.includes(p)
                const a = inventoryOf(s.ledger, org.id, p).available
                return (
                  <button key={p} onClick={() => { setPkg(p); setPhase(null) }} className={cn("flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition", pkg === p ? "bg-primary/10 ring-primary/60" : "ring-foreground/10 hover:ring-foreground/25", !allowed && "opacity-50")}>
                    <CreditCard className="size-5" style={{ color: PKG_COLOR[p] }} />
                    <div className="flex-1"><div className="text-sm font-medium">{PKG_NAME[p]}</div><div className="text-xs text-muted-foreground">{allowed ? `可用库存 ${a} 张` : "总部未授权本机构"}</div></div>
                    {allowed && a === 0 && <Badge variant="destructive">库存 0</Badge>}
                    {pkg === p && <Check className="size-4 text-primary" />}
                  </button>
                )
              })}
            </div>
            {org.packages.includes(pkg) && inv.available === 0 && (
              <Alert variant="destructive"><Ban /><AlertTitle>{PKG_NAME[pkg]}库存不足</AlertTitle><AlertDescription>可用库存为 0。前端仅做提示，最终由服务端拒绝；请联系总部追加拨付。</AlertDescription></Alert>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button size="lg" className="w-full" disabled={!st || (!!phase && !phase.done)} onClick={() => run(`idem-${uid("as")}`)}>
              {phase && !phase.done ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}确认分配 · 提交原子事务
            </Button>
            <Button variant="ghost" size="sm" className="w-full" disabled={!lastIdem || (!!phase && !phase.done)} onClick={() => run(lastIdem!)}><Repeat data-icon="inline-start" />模拟重复提交（同一幂等键）</Button>
          </CardFooter>
        </Card>
        <Card className="relative overflow-hidden">
          <CardHeader><CardTitle>事务执行可视化</CardTitle><CardDescription>{st?.name} · {PKG_NAME[pkg]} · {phase?.idem ?? "等待提交"}</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {CHECKS.map((c, i) => {
                const active = phase && phase.step === i && !phase.done
                const failed = phase?.done && phase.fail === i
                const passed = phase && (i < phase.step || (phase.done && phase.fail === undefined && i <= phase.step))
                return (
                  <motion.div key={c.k} animate={{ scale: active ? 1.01 : 1 }} className={cn("flex items-center gap-3 rounded-xl p-3 ring-1 transition-colors", failed ? "bg-destructive/10 ring-destructive/50" : passed ? "bg-emerald-500/8 ring-emerald-500/30" : active ? "bg-primary/10 ring-primary/50" : "ring-foreground/5")}>
                    <div className={cn("grid size-8 place-items-center rounded-full", failed ? "bg-destructive text-white" : passed ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {failed ? <X className="size-4" /> : passed ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : i + 1}
                    </div>
                    <div className="flex-1"><div className="text-sm font-medium">{c.t}</div><div className="text-xs text-muted-foreground">{c.d}</div></div>
                    {failed && <Badge variant="destructive" className="font-mono">{phase?.code}</Badge>}
                  </motion.div>
                )
              })}
            </div>
            <AnimatePresence mode="wait">
              {phase?.done && phase.fail === undefined && txn && (
                <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Database className="size-3.5" />库存</div><div className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums">{txn.before}<ArrowRight className="size-4 text-emerald-500" /><span className="text-emerald-500">{txn.after}</span></div></div>
                  <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />权益</div><div className="mt-1 font-mono text-sm">{txn.entitlementId}</div><div className="text-xs text-muted-foreground">有效至 {ent?.expireAt}</div></div>
                  <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Receipt className="size-3.5" />流水</div><div className="mt-1 font-mono text-sm text-primary">{txn.ledgerTx}</div><div className="text-xs text-muted-foreground">op = 分配给学生 · change −1</div></div>
                </motion.div>
              )}
              {phase?.done && phase.fail !== undefined && (
                <motion.div key="fail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Alert variant="destructive"><Ban /><AlertTitle>服务端拒绝 · {phase.code}</AlertTitle><AlertDescription>{phase.msg}。事务已回滚：库存未扣减、未创建权益、未写入扣减流水。</AlertDescription></Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          {phase && !phase.done && <BorderBeam size={160} duration={3} colorFrom="#6366f1" colorTo="#10b981" />}
        </Card>
      </div>
    </div>
  )
}

export function PRecords() {
  const { s, org } = useOrg()
  const today = todayISO()
  const ents = s.entitlements.filter((e) => e.orgId === org.id)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="机构校长端" icon={Receipt} title="权益记录" desc="每个权益可追溯到来源拨付批次、分配人与对应流水。" />
      <OrgBanner />
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>权益 ID</TableHead><TableHead>学生</TableHead><TableHead>卡类型</TableHead><TableHead>来源批次</TableHead><TableHead>分配人</TableHead><TableHead>分配时间</TableHead><TableHead>有效期</TableHead><TableHead>学科</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
            <TableBody>
              {ents.map((e) => (
                <TableRow key={e.id} className={cn(e.id === s.lastTxn?.entitlementId && "bg-emerald-500/10")}>
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell className="font-medium">{s.students.find((x) => x.id === e.studentId)?.name}</TableCell>
                  <TableCell>{PKG_NAME[e.packageType]}</TableCell>
                  <TableCell className="font-mono text-xs">{e.sourceAllocation}</TableCell>
                  <TableCell>{e.assignedBy}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDT(e.assignedAt)}</TableCell>
                  <TableCell className="text-xs">{e.effectiveAt.slice(0, 10)} ~ {e.expireAt}</TableCell>
                  <TableCell><div className="flex gap-1">{e.subjects.map((x) => <SubjectBadge key={x} subject={x} className="h-5 px-1.5 text-[10px]" />)}</div></TableCell>
                  <TableCell><Badge variant={e.status === "有效" && e.expireAt >= today ? "secondary" : "outline"}>{e.expireAt < today ? "已到期" : e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function PLearning() {
  const { s, org, students } = useOrg()
  const rows = useMemo(() => students.filter((x) => x.status === "启用").map((st) => ({ st, ...studentStats(s, st) })), [s, students])
  const Bar_ = ({ v, c }: { v: number; c: string }) => (
    <div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} /></div><span className="w-8 text-xs tabular-nums">{v}%</span></div>
  )
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="机构校长端" icon={GraduationCap} title="本机构学情" desc="任务完成、掌握度、变式验证与风险——仅本机构数据，带「实时」标记的为真实学习引擎数据。" />
      <OrgBanner />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="平均掌握度" value={Math.round(rows.reduce((a, b) => a + b.mastery, 0) / Math.max(1, rows.length))} suffix="%" icon={GraduationCap} />
        <Stat label="平均完成率" value={Math.round(rows.reduce((a, b) => a + b.completion, 0) / Math.max(1, rows.length))} suffix="%" icon={Check} color="var(--chem)" />
        <Stat label="变式验证通过率" value={Math.round(rows.reduce((a, b) => a + b.verifyRate, 0) / Math.max(1, rows.length))} suffix="%" icon={ShieldCheck} color="var(--st-mastered)" />
        <Stat label="风险学生" value={rows.filter((r) => r.risk).length} suffix="人" icon={AlertTriangle} color="var(--destructive)" />
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>学生</TableHead><TableHead>年级</TableHead><TableHead>掌握度</TableHead><TableHead>任务完成率</TableHead><TableHead>变式通过率</TableHead><TableHead>薄弱点</TableHead><TableHead>风险</TableHead><TableHead>最近活跃</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.st.id}>
                  <TableCell className="font-medium">{r.st.name}{r.live && <Badge className="ml-2 bg-emerald-500/15 text-emerald-500">实时</Badge>}</TableCell>
                  <TableCell>{r.st.grade}</TableCell>
                  <TableCell><Bar_ v={r.mastery} c="var(--math)" /></TableCell>
                  <TableCell><Bar_ v={r.completion} c="var(--chem)" /></TableCell>
                  <TableCell><Bar_ v={r.verifyRate} c="var(--physics)" /></TableCell>
                  <TableCell>{r.weak}</TableCell>
                  <TableCell>{r.risk ? <Badge variant="destructive">风险</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDT(r.lastActive)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground">{org.name} · 共 {rows.length} 名在读学生</div>
    </div>
  )
}
