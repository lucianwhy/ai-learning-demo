import { motion } from "motion/react"
import { Activity, ArrowRight, Bot, Building2, CheckCircle2, CreditCard, Filter, KeyRound, LayoutDashboard, Link2, Package, Plus, Receipt, Repeat, ScrollText, Send, Snowflake, Undo2, UserCog, Users, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BorderBeam } from "@/components/ui/border-beam"
import { PageHeader, Stat, SubjectBadge, fmtDT } from "@/components/app/bits"
import { LedgerTable } from "@/components/app/LedgerTable"
import { SUBJECTS, SUBJECT_LIST } from "@/data/knowledge"
import { PACKAGES } from "@/data/seed-platform"
import type { LedgerOp, PackageType, SubjectId } from "@/data/types"
import { todayISO, uid } from "@/engine/date"
import { PKG_LIST, PKG_NAME, availableOf, inventoryOf } from "@/engine/inventory"
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"
import { InvCard } from "../principal/Principal"

const invChart = { assigned: { label: "已分配", color: "#818cf8" }, available: { label: "可用", color: "#34d399" }, frozen: { label: "冻结", color: "#38bdf8" }, recovered: { label: "回收", color: "#fb923c" } } satisfies ChartConfig

export function AOverview() {
  const s = useStore()
  const nav = useNavigate()
  const today = todayISO()
  const validEnts = s.entitlements.filter((e) => e.status === "有效" && e.expireAt >= today)
  const totalAlloc = s.orgs.reduce((a, o) => a + PKG_LIST.reduce((b, p) => b + inventoryOf(s.ledger, o.id, p).allocated, 0), 0)
  const aiCost = s.aiLogs.reduce((a, b) => a + b.costCny, 0)
  const chart = s.orgs.map((o) => {
    const sum = PKG_LIST.map((p) => inventoryOf(s.ledger, o.id, p))
    return { name: o.name.split(" · ")[0], assigned: sum.reduce((a, b) => a + b.assigned, 0), available: sum.reduce((a, b) => a + b.available, 0), frozen: sum.reduce((a, b) => a + b.frozen, 0), recovered: sum.reduce((a, b) => a + b.recovered, 0) }
  })
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={LayoutDashboard} title="平台总览" desc="机构、权益、库存、AI 调用与风险一屏总览。所有库存数字由流水台账实时计算。" />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="合作机构" value={s.orgs.length} suffix="家" icon={Building2} hint={`启用 ${s.orgs.filter((o) => o.status === "启用").length}`} />
        <Stat label="学生账号" value={s.students.length} suffix="人" icon={Users} color="var(--chem)" />
        <Stat label="有效权益" value={validEnts.length} suffix="个" icon={CreditCard} color="var(--st-mastered)" />
        <Stat label="累计拨付" value={totalAlloc} suffix="张" icon={Package} color="var(--physics)" />
        <Stat label="AI 调用（近 3 日）" value={s.aiLogs.length} suffix="次" icon={Bot} color="#a78bfa" hint={`成本 ¥${aiCost.toFixed(3)}`} />
        <Stat label="风险学生" value={s.riskQueue.filter((r) => r.status !== "已反馈").length} suffix="人" icon={Activity} color="var(--destructive)" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>各机构卡库存结构</CardTitle><CardDescription>已分配 / 可用 / 冻结 / 回收（全部卡类型合计）</CardDescription><CardAction><Button size="sm" variant="outline" onClick={() => nav("/a/inventory")}>去拨付<ArrowRight data-icon="inline-end" /></Button></CardAction></CardHeader>
          <CardContent>
            <ChartContainer config={invChart} className="aspect-auto h-[280px] w-full">
              <BarChart data={chart} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={70} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.keys(invChart).map((k, i, arr) => <Bar key={k} dataKey={k} stackId="a" fill={`var(--color-${k})`} radius={i === arr.length - 1 ? [0, 4, 4, 0] : 0} />)}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ScrollText className="size-4" />最新审计</CardTitle><CardAction><Button size="sm" variant="ghost" onClick={() => nav("/a/audit")}>全部</Button></CardAction></CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {[...s.audit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1"><div className="truncate"><span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action}</span> {a.target}</div><div className="truncate text-xs text-muted-foreground">{a.detail}</div></div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDT(a.at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>机构一览</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>机构</TableHead><TableHead>城市</TableHead><TableHead>学科</TableHead><TableHead>校长</TableHead><TableHead>学生</TableHead>{PKG_LIST.map((p) => <TableHead key={p} className="text-right">{PKG_NAME[p]}可用</TableHead>)}<TableHead>状态</TableHead></TableRow></TableHeader>
            <TableBody>
              {s.orgs.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell><TableCell>{o.city}</TableCell>
                  <TableCell><div className="flex gap-1">{o.subjects.map((x) => <SubjectBadge key={x} subject={x} className="h-5 px-1.5 text-[10px]" />)}</div></TableCell>
                  <TableCell>{s.principals.find((p) => p.id === o.principalId)?.name ?? <span className="text-muted-foreground">未绑定</span>}</TableCell>
                  <TableCell>{s.students.filter((x) => x.orgId === o.id).length}</TableCell>
                  {PKG_LIST.map((p) => { const v = o.packages.includes(p) ? availableOf(s.ledger, o.id, p) : null; return <TableCell key={p} className={cn("text-right tabular-nums", v === 0 && "font-semibold text-destructive")}>{v ?? "—"}</TableCell> })}
                  <TableCell><Badge variant={o.status === "启用" ? "secondary" : "destructive"}>{o.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function AOrgs() {
  const s = useStore()
  const hasTest = s.orgs.some((o) => o.name.startsWith("测试机构"))
  const [form, setForm] = useState({ name: hasTest ? `测试机构${s.orgs.length}` : "测试机构", code: `TEST-00${s.orgs.length - 3}`, city: "杭州" })
  const [subjects, setSubjects] = useState<SubjectId[]>(["math", "physics", "chemistry"])
  const [pkgs, setPkgs] = useState<PackageType[]>(["month", "quarter", "year"])
  const [pr, setPr] = useState({ name: "林校长", account: "lin.test@test", phone: "135****0001" })
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={Building2} title="机构管理" desc="创建机构、配置学科/学段/可用套餐、绑定唯一校长账号。停用机构保留历史数据，权限即时生效。"
        actions={
          <Dialog>
            <DialogTrigger render={<Button />}><Plus data-icon="inline-start" />新建机构</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>新建机构</DialogTitle><DialogDescription>演示已预填，可直接创建。</DialogDescription></DialogHeader>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel>机构名称</FieldLabel><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                  <Field><FieldLabel>机构编码</FieldLabel><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
                </div>
                <Field><FieldLabel>城市</FieldLabel><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
                <Field><FieldLabel>开通学科</FieldLabel>
                  <ToggleGroup variant="outline" multiple value={subjects} onValueChange={(v: string[]) => setSubjects(v as SubjectId[])}>{SUBJECT_LIST.map((x) => <ToggleGroupItem key={x} value={x}>{SUBJECTS[x].name}</ToggleGroupItem>)}</ToggleGroup>
                </Field>
                <Field><FieldLabel>可用套餐</FieldLabel>
                  <ToggleGroup variant="outline" multiple value={pkgs} onValueChange={(v: string[]) => setPkgs(v as PackageType[])}>{PKG_LIST.map((x) => <ToggleGroupItem key={x} value={x}>{PKG_NAME[x]}</ToggleGroupItem>)}</ToggleGroup>
                  <FieldDescription>学段：初中 · 学生上限 200 · 服务期 1 年</FieldDescription>
                </Field>
              </FieldGroup>
              <DialogFooter><DialogClose render={<Button variant="outline" />}>取消</DialogClose>
                <DialogClose render={<Button onClick={() => { s.createOrg({ ...form, subjects, stages: ["初中"], packages: pkgs }); toast.success(`已创建机构「${form.name}」`, { description: "下一步：绑定校长账号" }) }} />}>创建机构</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      <div className="grid gap-4 lg:grid-cols-2">
        {s.orgs.map((o, i) => {
          const p = s.principals.find((x) => x.id === o.principalId)
          return (
            <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn("relative h-full overflow-hidden", o.status === "停用" && "opacity-70")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">{o.name}{o.name.startsWith("测试机构") && <Badge className="bg-fuchsia-500/15 text-fuchsia-400">新建</Badge>}</CardTitle>
                  <CardDescription className="font-mono">{o.code} · {o.city} · {o.stages.join("/")}</CardDescription>
                  <CardAction className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{o.status}</span><Switch checked={o.status === "启用"} onCheckedChange={() => { s.toggleOrg(o.id); toast(`${o.name} 已${o.status === "启用" ? "停用" : "启用"}`) }} /></CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="flex flex-wrap gap-1.5">{o.subjects.map((x) => <SubjectBadge key={x} subject={x} />)}{o.packages.map((x) => <Badge key={x} variant="outline">{PKG_NAME[x]}</Badge>)}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><div className="text-muted-foreground">学生</div><div className="font-semibold">{s.students.filter((x) => x.orgId === o.id).length} / {o.studentQuota}</div></div>
                    <div className="col-span-2"><div className="text-muted-foreground">服务期</div><div className="font-semibold">{o.servicePeriod}</div></div>
                  </div>
                  {o.remark && <div className="text-xs text-muted-foreground">备注：{o.remark}</div>}
                </CardContent>
                <CardFooter className="justify-between">
                  {p ? <div className="flex items-center gap-2 text-sm"><UserCog className="size-4 text-primary" />{p.name}<span className="font-mono text-xs text-muted-foreground">{p.account}</span><Badge variant="outline">{p.status}</Badge></div> : <span className="text-sm text-amber-500">未绑定校长</span>}
                  {!p && (
                    <Dialog>
                      <DialogTrigger render={<Button size="sm" />}><Link2 data-icon="inline-start" />绑定校长</DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>创建并绑定校长账号</DialogTitle><DialogDescription>一个校长账号只绑定一个机构，角色：机构管理员。</DialogDescription></DialogHeader>
                        <FieldGroup>
                          <Field><FieldLabel>姓名</FieldLabel><Input value={pr.name} onChange={(e) => setPr({ ...pr, name: e.target.value })} /></Field>
                          <Field><FieldLabel>登录账号</FieldLabel><Input value={pr.account} onChange={(e) => setPr({ ...pr, account: e.target.value })} /></Field>
                          <Field><FieldLabel>手机号</FieldLabel><Input value={pr.phone} onChange={(e) => setPr({ ...pr, phone: e.target.value })} /></Field>
                        </FieldGroup>
                        <DialogFooter><DialogClose render={<Button variant="outline" />}>取消</DialogClose><DialogClose render={<Button onClick={() => { s.bindPrincipal(o.id, pr.name, pr.account, pr.phone); toast.success(`已绑定校长 ${pr.name}`, { description: "已写入审计日志" }) }} />}>创建并绑定</DialogClose></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
                {o.name.startsWith("测试机构") && <BorderBeam size={120} duration={8} />}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function APackages() {
  const s = useStore()
  const colors: Record<PackageType, string> = { month: "#818cf8", quarter: "#f59e0b", year: "#10b981" }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={Package} title="套餐定义" desc="卡类型由总部统一定义：有效期、学科、功能、生效规则与配额。机构只能使用被授权的套餐。" />
      <div className="grid gap-5 lg:grid-cols-3">
        {PACKAGES.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="relative h-full overflow-hidden">
              <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-30 blur-3xl" style={{ background: colors[p.id] }} />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><CreditCard className="size-5" style={{ color: colors[p.id] }} />{p.name}</CardTitle>
                <CardDescription className="font-mono">{p.id} · {p.version}</CardDescription>
                <CardAction><Badge variant="secondary">{p.status}</Badge></CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex items-baseline gap-1"><span className="text-4xl font-semibold">{p.days}</span><span className="text-muted-foreground">天有效期</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">生效规则</span>{p.effectiveRule}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">配额</span>{p.quota}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">学科</span><span className="flex gap-1">{p.subjects.map((x) => <SubjectBadge key={x} subject={x} className="h-5 px-1.5 text-[10px]" />)}</span></div>
                <div className="flex flex-wrap gap-1.5 border-t pt-3">{p.functions.map((f) => <Badge key={f} variant="outline"><CheckCircle2 data-icon="inline-start" className="text-emerald-500" />{f}</Badge>)}</div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">授权机构：{s.orgs.filter((o) => o.packages.includes(p.id)).map((o) => o.name.split(" · ")[0]).join("、")}</CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function AInventory() {
  const s = useStore()
  const defaultOrg = s.orgs.find((o) => o.name.startsWith("测试机构"))?.id ?? "org-xh"
  const [orgId, setOrgId] = useState(defaultOrg)
  const org = s.orgs.find((o) => o.id === orgId) ?? s.orgs[0]
  const [pkg, setPkg] = useState<PackageType>("month")
  const [qty, setQty] = useState(100)
  const [reason, setReason] = useState("招商演示：首批拨付")
  const [idem, setIdem] = useState(() => `idem-${uid("al")}`)
  const [lastIdem, setLastIdem] = useState<string | null>(null)
  const [adj, setAdj] = useState<{ op: "冻结" | "解冻" | "回收"; qty: number; reason: string }>({ op: "冻结", qty: 5, reason: "合同条款待确认" })
  const doAllocate = (key: string) => {
    const r = s.allocate(org.id, pkg, qty, reason, key)
    if (r.ok) { toast.success(r.msg, { description: `幂等键 ${key}` }); setLastIdem(key); setIdem(`idem-${uid("al")}`) }
    else toast.error(r.msg)
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={Wallet} title="机构卡库存拨付" desc="拨付 / 追加 / 冻结 / 回收，每笔生成 allocation 批次与不可覆盖流水。库存不允许为负，重复请求按幂等键拦截。"
        actions={
          <Select items={s.orgs.map((o) => ({ value: o.id, label: o.name }))} value={org.id} onValueChange={(v) => v && setOrgId(v as string)}>
            <SelectTrigger className="w-64"><Building2 /><SelectValue /></SelectTrigger>
            <SelectContent>{s.orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
        } />
      <div className="grid gap-4 lg:grid-cols-3">{org.packages.map((p, i) => <InvCard key={org.id + p} orgId={org.id} pkg={p} i={i} />)}</div>
      <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card className="relative overflow-hidden">
            <CardHeader><CardTitle className="flex items-center gap-2"><Send className="size-4 text-primary" />拨付 / 追加</CardTitle><CardDescription>{org.name}</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field><FieldLabel>卡类型</FieldLabel>
                  <ToggleGroup variant="outline" value={[pkg]} onValueChange={(v: string[]) => v[0] && setPkg(v[0] as PackageType)}>{PKG_LIST.map((p) => <ToggleGroupItem key={p} value={p} disabled={!org.packages.includes(p)}>{PKG_NAME[p]}</ToggleGroupItem>)}</ToggleGroup>
                </Field>
                <Field><FieldLabel>数量</FieldLabel><Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></Field>
                <Field><FieldLabel>原因</FieldLabel><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                <Field><FieldLabel className="flex items-center gap-1.5"><KeyRound className="size-3.5" />幂等键 idempotency_key</FieldLabel><Input className="font-mono text-xs" value={idem} onChange={(e) => setIdem(e.target.value)} /><FieldDescription>同一键重复提交将被服务端拦截，不会重复拨付</FieldDescription></Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" size="lg" disabled={org.status !== "启用"} onClick={() => doAllocate(idem)}><Send data-icon="inline-start" />确认拨付 {PKG_NAME[pkg]} × {qty}</Button>
              <Button className="w-full" variant="ghost" size="sm" disabled={!lastIdem} onClick={() => doAllocate(lastIdem!)}><Repeat data-icon="inline-start" />模拟重复提交（{lastIdem ? lastIdem.slice(0, 18) + "…" : "先拨付一次"}）</Button>
            </CardFooter>
            <BorderBeam size={120} duration={9} />
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Snowflake className="size-4 text-sky-400" />冻结 / 解冻 / 回收</CardTitle><CardDescription>仅作用于未分配库存，已分配权益不受影响</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <ToggleGroup variant="outline" value={[adj.op]} onValueChange={(v: string[]) => v[0] && setAdj({ ...adj, op: v[0] as typeof adj.op })}>
                  <ToggleGroupItem value="冻结"><Snowflake />冻结</ToggleGroupItem><ToggleGroupItem value="解冻">解冻</ToggleGroupItem><ToggleGroupItem value="回收"><Undo2 />回收</ToggleGroupItem>
                </ToggleGroup>
                <div className="grid grid-cols-[100px_1fr] gap-2"><Input type="number" value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: Number(e.target.value) })} /><Input value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} /></div>
              </FieldGroup>
            </CardContent>
            <CardFooter><Button variant="outline" className="w-full" onClick={() => { const r = s.adjust(org.id, pkg, adj.qty, adj.op, adj.reason); r.ok ? toast.success(r.msg) : toast.error(r.msg) }}>执行{adj.op} · {PKG_NAME[pkg]} × {adj.qty}</Button></CardFooter>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="size-4" />{org.name.split(" · ")[0]} · 库存流水</CardTitle><CardDescription>只追加、不覆盖；可追溯到拨付批次与操作人</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto"><LedgerTable rows={s.ledger.filter((l) => l.orgId === org.id)} showOrg={false} /></CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ALedger() {
  const s = useStore()
  const [org, setOrg] = useState("all")
  const [op, setOp] = useState("all")
  const rows = s.ledger.filter((l) => (org === "all" || l.orgId === org) && (op === "all" || l.op === op))
  const checks = useMemo(() => s.orgs.flatMap((o) => o.packages.map((p) => { const inv = inventoryOf(s.ledger, o.id, p); return { o, p, ok: inv.available === availableOf(s.ledger, o.id, p) && inv.available >= 0, v: inv.available } })), [s.ledger, s.orgs])
  const OPS: LedgerOp[] = ["总部拨付", "总部追加", "冻结", "解冻", "回收", "分配给学生", "权益作废返还"]
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="总部总后台" icon={Receipt} title="库存 / 权益流水" desc="平台全量台账：每笔记录 transaction_id、before / change / after、操作人、时间、批次与幂等键。可用库存 = 最后一笔 after，并与分项累计守恒校验。" />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="流水总数" value={s.ledger.length} suffix="笔" icon={Receipt} />
        <Stat label="学生分配" value={s.ledger.filter((l) => l.op === "分配给学生").length} suffix="笔" icon={Users} color="var(--chem)" />
        <Stat label="幂等拦截" value={s.audit.filter((a) => a.action === "重复请求拦截").length} suffix="次" icon={KeyRound} color="var(--physics)" hint="重复请求未产生流水" />
        <div className="relative overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-emerald-500/30 backdrop-blur-xl">
          <div className="text-xs text-muted-foreground">库存守恒校验</div>
          <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-emerald-500"><CheckCircle2 className="size-6" />{checks.filter((c) => c.ok).length}/{checks.length} 通过</div>
          <div className="mt-1 text-xs text-muted-foreground">拨付+返还−分配−冻结−回收 = 最新 after</div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>全量流水</CardTitle><CardDescription>{rows.length} 笔 · 最新在前</CardDescription>
          <CardAction className="flex gap-2">
            <Select items={[{ value: "all", label: "全部机构" }, ...s.orgs.map((o) => ({ value: o.id, label: o.name }))]} value={org} onValueChange={(v) => v && setOrg(v as string)}><SelectTrigger className="w-52"><Filter /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部机构</SelectItem>{s.orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
            <Select items={[{ value: "all", label: "全部操作" }, ...OPS.map((o) => ({ value: o, label: o }))]} value={op} onValueChange={(v) => v && setOp(v as string)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部操作</SelectItem>{OPS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto"><LedgerTable rows={rows} limit={80} highlight={s.lastTxn?.ledgerTx} /></CardContent>
      </Card>
      <Alert><KeyRound /><AlertTitle>防重与追溯</AlertTitle><AlertDescription>所有写操作携带 idempotency_key；分配学生权益在一个事务内完成库存扣减、权益创建与流水写入。流水不可编辑，纠错通过反向流水（如「权益作废返还」）完成。</AlertDescription></Alert>
    </div>
  )
}
