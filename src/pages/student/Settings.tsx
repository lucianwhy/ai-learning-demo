import { Clock, CreditCard, Moon, RotateCcw, Settings2, Sun, UserPlus, Users } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useTheme } from "@/components/theme-provider"
import { PageHeader, SubjectBadge } from "@/components/app/bits"
import { PKG_NAME } from "@/engine/inventory"
import { activeEntitlement, useLearning, useStore } from "@/store/useStore"

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const s = useStore()
  const L = useLearning()
  const nav = useNavigate()
  const student = s.students.find((x) => x.id === s.currentStudentId)
  const org = s.orgs.find((o) => o.id === student?.orgId)
  const ent = activeEntitlement(s, s.currentStudentId)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="账号 · 偏好 · 演示控制" icon={Settings2} title="设置" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>外观</CardTitle><CardDescription>默认深色，支持浅色主题</CardDescription></CardHeader>
          <CardContent>
            <ToggleGroup variant="outline" value={[theme === "light" ? "light" : "dark"]} onValueChange={(v: string[]) => v[0] && setTheme(v[0] as "light" | "dark")}>
              <ToggleGroupItem value="dark"><Moon />深色</ToggleGroupItem>
              <ToggleGroupItem value="light"><Sun />浅色</ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="size-4" />每日学习预算</CardTitle><CardDescription>今日任务按预算编排，超出部分自动顺延，不堆积</CardDescription></CardHeader>
          <CardContent>
            <ToggleGroup variant="outline" value={[String(L.dailyBudgetMin)]} onValueChange={(v: string[]) => { if (v[0]) { s.setBudget(Number(v[0]) as 30 | 45 | 60); toast(`每日预算已调整为 ${v[0]} 分钟`) } }}>
              {[30, 45, 60].map((m) => <ToggleGroupItem key={m} value={String(m)}>{m} 分钟</ToggleGroupItem>)}
            </ToggleGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-4" />我的权益</CardTitle><CardDescription>{org?.name} · {student?.grade}</CardDescription>
            <CardAction>{ent ? <Badge className="bg-emerald-500/15 text-emerald-500">{ent.status}</Badge> : <Badge variant="destructive">无有效权益</Badge>}</CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {ent ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">卡类型</span>{PKG_NAME[ent.packageType]}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">有效期</span>{ent.effectiveAt} 至 {ent.expireAt}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">开通学科</span><span className="flex gap-1">{ent.subjects.map((x) => <SubjectBadge key={x} subject={x} />)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">来源批次</span><span className="font-mono text-xs">{ent.sourceAllocation}</span></div>
              </>
            ) : <div className="text-muted-foreground">请联系所在机构校长分配学习卡。</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4" />演示学生切换</CardTitle><CardDescription>每个学生拥有独立的学习状态（以 student_id 为根）</CardDescription></CardHeader>
          <CardContent>
            <Select items={s.students.map((x) => ({ value: x.id, label: `${x.name} · ${s.orgs.find((o) => o.id === x.orgId)?.name} · ${x.grade}` }))} value={s.currentStudentId} onValueChange={(v) => { if (v) { s.switchStudent(v as string); toast("已切换学生") } }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {s.students.filter((x) => x.status === "启用").map((x) => <SelectItem key={x.id} value={x.id}>{x.name} · {s.orgs.find((o) => o.id === x.orgId)?.name} · {x.grade}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 ring-destructive/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="size-4" />演示数据</CardTitle><CardDescription>所有状态保存在本地浏览器（localStorage）。演示前可一键恢复初始数据。</CardDescription></CardHeader>
          <CardFooter className="gap-2">
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" />}><RotateCcw data-icon="inline-start" />重置演示数据</DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>重置全部演示数据？</DialogTitle><DialogDescription>将恢复所有角色（学生/校长/总部）的初始种子数据，包括库存流水与审计日志。</DialogDescription></DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
                  <DialogClose render={<Button variant="destructive" onClick={() => { s.resetAll(); toast.success("演示数据已重置"); nav("/s/home") }} />}>确认重置</DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => { s.resetStudentFresh(); toast("当前学生已清空，从诊断开始"); nav("/s/diagnosis") }}><UserPlus data-icon="inline-start" />当前学生从零开始（诊断）</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
