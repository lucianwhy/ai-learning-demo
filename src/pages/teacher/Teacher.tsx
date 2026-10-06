import { motion } from "motion/react"
import { AlertTriangle, CheckCircle2, ClipboardCheck, Eye, MessageSquareText, ShieldAlert, XCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PageHeader, Stat, SubjectBadge, fmtDT } from "@/components/app/bits"
import { RichText } from "@/components/app/Tex"
import { KP } from "@/data/knowledge"
import { Q } from "@/data/questions"
import { cn } from "@/lib/utils"
import { type RiskItem, useStore } from "@/store/useStore"

const LEVEL_TEXT: Record<number, string> = { 1: "首次错误", 2: "再次失败 · 已降难/回退前置", 3: "持续失败 · 风险" }

export function TeacherRisk() {
  const s = useStore()
  const list = s.riskQueue
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="教师介入端 · 轻量" icon={ShieldAlert} title="风险与连续失败队列" desc="系统按学科策略阈值自动标记持续薄弱学生。教师只需查看与反馈，学生不必等待教师即可继续其他学习。" />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="待处理风险" value={list.filter((r) => r.status === "待处理").length} icon={AlertTriangle} color="var(--destructive)" hint="连续失败 ≥ 策略阈值" />
        <Stat label="观察中" value={list.filter((r) => r.status === "观察中").length} icon={Eye} color="var(--st-pending)" hint="L2 降难后跟踪" />
        <Stat label="已反馈" value={list.filter((r) => r.status === "已反馈").length} icon={MessageSquareText} color="var(--st-mastered)" hint="反馈同步至学生首页" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((r, i) => <RiskCard key={r.id} r={r} i={i} />)}
      </div>
    </div>
  )
}

function RiskCard({ r, i }: { r: RiskItem; i: number }) {
  const s = useStore()
  const st = s.students.find((x) => x.id === r.studentId)
  const k = KP[r.knowledgeId]
  const [text, setText] = useState(`${st?.name}同学，「${k.name}」我们先回到${k.prerequisites[0] ? `「${KP[k.prerequisites[0]].name}」` : "基础概念"}，把关键步骤写完整。今晚完成系统推送的降难练习，明天课上我再和你过一遍。`)
  const L = s.learning[r.studentId]
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
      <Card className={cn(r.status === "待处理" && "ring-destructive/40")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar><AvatarFallback className="bg-gradient-to-br from-rose-500 to-orange-400 text-white">{st?.name.slice(-2)}</AvatarFallback></Avatar>
            <div>
              <CardTitle>{st?.name} <span className="text-xs font-normal text-muted-foreground">{st?.grade} · {s.orgs.find((o) => o.id === r.orgId)?.name}</span></CardTitle>
              <CardDescription>{fmtDT(r.at)} 触发</CardDescription>
            </div>
          </div>
          <CardAction><Badge variant={r.status === "待处理" ? "destructive" : r.status === "观察中" ? "secondary" : "outline"}>{r.status}</Badge></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2"><SubjectBadge subject={k.subject} /><span className="font-medium">{k.name}</span><span className="text-xs text-muted-foreground">{k.chapter}</span></div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-1 flex-col gap-1">
                <div className={cn("h-1.5 rounded-full", n <= r.level ? (n === 3 ? "bg-destructive" : n === 2 ? "bg-amber-500" : "bg-sky-500") : "bg-muted")} />
                <span className={cn("text-[10px]", n === r.level ? "text-foreground" : "text-muted-foreground")}>L{n} {LEVEL_TEXT[n]}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/5">最近证据：{r.lastEvidence} · 累计失败 {r.failures} 次</div>
          {L && <div className="text-xs text-muted-foreground">该生错题 {L.errors.length} 道 · 风险错题 {L.errors.filter((e) => e.risk).length} 道 · 当前状态：{L.mastery[r.knowledgeId]?.status}</div>}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {r.status === "待处理" && <Button variant="outline" size="sm" onClick={() => { useStore.setState((x) => ({ riskQueue: x.riskQueue.map((y) => (y.id === r.id ? { ...y, status: "观察中" as const } : y)) })); toast("已标记为观察中") }}><Eye data-icon="inline-start" />观察中</Button>}
          <Dialog>
            <DialogTrigger render={<Button size="sm" disabled={r.status === "已反馈"} />}><MessageSquareText data-icon="inline-start" />{r.status === "已反馈" ? "已反馈" : "写反馈"}</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>给 {st?.name} 的反馈</DialogTitle><DialogDescription>反馈将出现在学生首页「老师反馈」，并写入审计日志。</DialogDescription></DialogHeader>
              <textarea className="min-h-28 w-full rounded-lg border bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-ring/50" value={text} onChange={(e) => setText(e.target.value)} />
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
                <DialogClose render={<Button onClick={() => { s.feedbackRisk(r.id, text); toast.success("反馈已发送给学生") }} />}>发送反馈</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export function TeacherManual() {
  const s = useStore()
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="教师介入端 · 轻量" icon={ClipboardCheck} title="待人工确认" desc="拍照批改中识别不确定的题目进入此队列。确认前不计入正确率，确认结果回写学生作答与掌握度证据。" />
      <Alert><ClipboardCheck /><AlertTitle>不伪造正确率</AlertTitle><AlertDescription>OCR 置信度低于 0.75、多选涂改、图片质量差等情况一律转人工，系统不做猜测。</AlertDescription></Alert>
      <div className="grid gap-4 lg:grid-cols-2">
        {s.manualQueue.map((m) => {
          const q = Q[m.questionId]
          const st = s.students.find((x) => x.id === m.studentId)
          return (
            <Card key={m.id} className={cn(m.status !== "待确认" && "opacity-70")}>
              <CardHeader>
                <CardTitle>{st?.name} · {KP[q.knowledgeId].name}</CardTitle>
                <CardDescription>学案 {m.worksheetId} · {fmtDT(m.at)} · {m.reason}</CardDescription>
                <CardAction><Badge variant={m.status === "待确认" ? "secondary" : "outline"}>{m.status}</Badge></CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="rounded-lg bg-muted/40 p-3 text-sm ring-1 ring-foreground/5"><RichText text={q.stem} /></div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">识别结果</div><div className="mt-1 text-lg font-semibold">{m.recognized}</div></div>
                  <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">置信度</div><div className="mt-1 text-lg font-semibold text-amber-500">{m.confidence.toFixed(2)}</div></div>
                  <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">标准答案</div><div className="mt-1 text-lg font-semibold text-emerald-500">{q.answer}</div></div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm" disabled={m.status !== "待确认"} onClick={() => { s.resolveManual(m.id, false); toast("已确认错误，已回写证据") }}><XCircle data-icon="inline-start" />确认错误</Button>
                <Button size="sm" disabled={m.status !== "待确认"} onClick={() => { s.resolveManual(m.id, true); toast.success("已确认正确，已回写证据") }}><CheckCircle2 data-icon="inline-start" />确认正确</Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
