import { AnimatePresence, motion } from "motion/react"
import { Camera, CheckCircle2, FileText, HelpCircle, Printer, ScanLine, XCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, SubjectBadge, fmtDT } from "@/components/app/bits"
import { RichText } from "@/components/app/Tex"
import { KP, SUBJECTS } from "@/data/knowledge"
import { Q } from "@/data/questions"
import type { WorksheetStatus } from "@/data/types"
import { cn } from "@/lib/utils"
import { useLearning, useStore } from "@/store/useStore"

const ST: Record<WorksheetStatus, string> = { 待完成: "bg-primary/15 text-primary", 待回收: "bg-st-pending/15 text-st-pending", 已批改: "bg-st-mastered/15 text-st-mastered", 需订正: "bg-st-weak/15 text-st-weak" }

export default function Worksheets() {
  const L = useLearning()
  const s = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState("all")
  const [scanning, setScanning] = useState(false)
  const list = L.worksheets.filter((w) => tab === "all" || w.status === tab)
  const w = L.worksheets.find((x) => x.id === params.get("ws")) ?? list[0] ?? L.worksheets[0]
  const student = s.students.find((x) => x.id === s.currentStudentId)
  const grade = () => {
    setScanning(true)
    setTimeout(() => {
      s.gradeWorksheet(w.id)
      setScanning(false)
      toast.success("拍照批改完成，结果已回写证据体系", { description: "低置信度题目已进入「待人工确认」，不伪造正确率" })
    }, 2600)
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="线上生成 · 线下作答 · 拍照回收" icon={FileText} title="我的学案" desc="纸质学案与任务、题目版本绑定。打印/下载不等于完成；拍照批改结果进入同一套作答与掌握度证据。" />
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
            <TabsList className="w-full">{["all", "待完成", "待回收", "需订正", "已批改"].map((t) => <TabsTrigger key={t} value={t}>{t === "all" ? "全部" : t}</TabsTrigger>)}</TabsList>
          </Tabs>
          {list.map((x) => (
            <button key={x.id} onClick={() => setParams({ ws: x.id })} className={cn("flex flex-col gap-2 rounded-2xl bg-card p-4 text-left ring-1 backdrop-blur-xl transition", x.id === w?.id ? "ring-primary/60" : "ring-foreground/10 hover:ring-foreground/25")}>
              <div className="flex items-center gap-2"><SubjectBadge subject={x.subject} /><Badge className={ST[x.status]}>{x.status}</Badge>{x.accuracy !== undefined && <span className="ml-auto text-sm font-semibold">{x.accuracy}%</span>}</div>
              <div className="font-medium">{x.title}</div>
              <div className="text-xs text-muted-foreground">{x.questionIds.length} 题 · 生成于 {fmtDT(x.createdAt)}{x.gradedAt ? ` · 批改 ${fmtDT(x.gradedAt)}` : ""}</div>
            </button>
          ))}
        </div>
        {w && (
          <div className="flex flex-col gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{w.title}</CardTitle>
                <CardDescription>学案编号 {w.id.toUpperCase()} · 绑定任务 {w.taskId ?? "计划项"} · 题目版本 {w.questionIds.map((q) => Q[q].version).join("/")}</CardDescription>
                <CardAction className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Printer data-icon="inline-start" />打印</Button>
                  {w.status === "待完成" && <Button variant="outline" size="sm" onClick={() => { s.markWorksheet(w.id, "待回收"); toast("已标记为线下作答中，完成后拍照上传") }}>已打印，开始作答</Button>}
                  {(w.status === "待完成" || w.status === "待回收") && <Button size="sm" onClick={grade} disabled={scanning}><Camera data-icon="inline-start" />拍照上传批改</Button>}
                </CardAction>
              </CardHeader>
            </Card>
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="print-area relative mx-auto w-full max-w-[720px] overflow-hidden rounded-lg bg-white p-10 text-neutral-900 shadow-2xl shadow-black/40">
                <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-4">
                  <div>
                    <div className="text-xs tracking-widest text-neutral-500">AI 数理化自主学习平台 · 纸质学案</div>
                    <div className="mt-1 text-2xl font-bold">{w.title}</div>
                    <div className="mt-2 text-sm text-neutral-600">姓名：{student?.name}　班级：{student?.grade}　日期：______　用时：______ 分钟</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <QRCodeSVG value={`aidemo://worksheet/${w.id}?sid=${s.currentStudentId}`} size={76} />
                    <span className="text-[9px] text-neutral-500">扫码回传</span>
                  </div>
                </div>
                <div className="mt-3 rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-600">知识点：{w.knowledgeIds.map((k) => KP[k].name).join("、")}　·　{SUBJECTS[w.subject].name}</div>
                <div className="mt-5 flex flex-col gap-6">
                  {w.questionIds.map((qid, i) => {
                    const q = Q[qid]
                    const g = w.grading?.find((x) => x.questionId === qid)
                    return (
                      <div key={qid} className="relative text-[15px] leading-relaxed">
                        <div className="flex gap-2"><b>{i + 1}.</b><div className="flex-1">{q.context && <span className="text-neutral-500">【{q.context.label}】{q.context.text} </span>}<RichText text={q.stem} /></div></div>
                        {q.options && <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 pl-6">{q.options.map((o) => <div key={o.key}>{o.key}. <RichText text={o.text} /></div>)}</div>}
                        <div className="mt-3 ml-6 h-8 border-b border-dashed border-neutral-300 text-sm text-neutral-500">答：{g ? <span className="font-[cursive] text-lg text-blue-700">{g.recognized}</span> : null}</div>
                        {g && (
                          <motion.div initial={{ scale: 2, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ delay: i * 0.25 }} className={cn("absolute top-0 right-0 rounded-md border-2 px-2 py-0.5 text-sm font-bold", g.result === "正确" ? "border-emerald-600 text-emerald-600" : g.result === "错误" ? "border-red-600 text-red-600" : "border-amber-600 text-amber-600")}>
                            {g.result === "正确" ? "✓ 正确" : g.result === "错误" ? "✗ 错误" : "? 待人工确认"}
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <AnimatePresence>
                  {scanning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500/5">
                      <motion.div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent" initial={{ top: "-10%" }} animate={{ top: "100%" }} transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }} />
                      <div className="absolute inset-4 rounded-lg border-2 border-dashed border-emerald-500/70" />
                      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white"><ScanLine className="size-4 animate-pulse" />OCR 识别中 · 版面分析 · 答案比对…</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col gap-3">
                {w.grading ? (
                  <Card size="sm">
                    <CardHeader><CardTitle>批改结果</CardTitle><CardDescription>正确率 {w.accuracy}%（不含待确认题）</CardDescription></CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {w.grading.map((g, i) => (
                        <div key={g.questionId} className="flex items-center gap-2 text-sm">
                          {g.result === "正确" ? <CheckCircle2 className="size-4 text-emerald-500" /> : g.result === "错误" ? <XCircle className="size-4 text-destructive" /> : <HelpCircle className="size-4 text-amber-500" />}
                          第 {i + 1} 题 · 识别「{g.recognized}」<span className="ml-auto text-xs text-muted-foreground">{g.result}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert><Camera /><AlertTitle>如何回收？</AlertTitle><AlertDescription>线下完成后拍照上传，系统识别答案并批改；结果写入作答记录与掌握度证据。识别不确定的题会转为「待人工确认」。</AlertDescription></Alert>
                )}
                {w.grading?.some((g) => g.result === "待人工确认") && (
                  <Alert className="border-amber-500/40"><HelpCircle className="text-amber-500" /><AlertTitle>1 题待人工确认</AlertTitle><AlertDescription>OCR 置信度低于阈值，已推送至教师「待人工确认」队列，确认前不计入正确率。</AlertDescription></Alert>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
