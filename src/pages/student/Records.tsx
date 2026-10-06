import { CalendarDays, CheckCircle2, Clock, History, ListChecks, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, Stat, SubjectBadge, TaskTypeBadge, fmtDT } from "@/components/app/bits"
import { KP, SUBJECTS } from "@/data/knowledge"
import type { TaskType } from "@/data/types"
import { fmtMD, weekday } from "@/engine/date"
import { useLearning } from "@/store/useStore"

export default function Records() {
  const L = useLearning()
  const [tab, setTab] = useState("sessions")
  const byDay = useMemo(() => {
    const m: Record<string, typeof L.sessions> = {}
    for (const s of L.sessions) (m[s.date] ??= []).push(s)
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14)
  }, [L.sessions])
  const totalMin = L.sessions.reduce((a, b) => a + b.minutes, 0)
  const acc = L.attempts.length ? Math.round((L.attempts.filter((a) => a.correct).length / L.attempts.length) * 100) : 0
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="学习过程全记录" icon={History} title="学习记录" desc="每次学习、每次作答都独立保存，作为掌握度判断与计划重排的依据。" />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="累计学习" value={Math.round(totalMin / 60)} suffix="小时" icon={Clock} hint={`${totalMin} 分钟`} />
        <Stat label="学习天数" value={new Set(L.sessions.map((s) => s.date)).size} suffix="天" icon={CalendarDays} color="var(--chem)" hint={`连续 ${L.streak} 天`} />
        <Stat label="作答次数" value={L.attempts.length} suffix="次" icon={ListChecks} color="var(--physics)" hint="诊断/练习/验证/检测/学案" />
        <Stat label="总正确率" value={acc} suffix="%" icon={CheckCircle2} color="var(--st-mastered)" />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList><TabsTrigger value="sessions">学习日志</TabsTrigger><TabsTrigger value="attempts">作答记录</TabsTrigger></TabsList>
      </Tabs>
      {tab === "sessions" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {byDay.map(([date, list]) => (
            <Card key={date} size="sm">
              <CardHeader><CardTitle>{fmtMD(date)} · 周{weekday(date)}</CardTitle><CardDescription>{list.length} 项 · {list.reduce((a, b) => a + b.minutes, 0)} 分钟</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-2">
                {list.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full" style={{ background: SUBJECTS[s.subject].color }} />
                    {s.kind === "diagnostic" ? <Badge variant="outline">诊断</Badge> : <TaskTypeBadge type={s.kind as TaskType} />}
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{s.minutes}′</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>学科</TableHead><TableHead>知识点</TableHead><TableHead>题目</TableHead><TableHead>类型</TableHead><TableHead>作答</TableHead><TableHead>用时</TableHead><TableHead>结果</TableHead></TableRow></TableHeader>
              <TableBody>
                {[...L.attempts].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-muted-foreground">{fmtDT(a.at)}</TableCell>
                    <TableCell><SubjectBadge subject={a.subject} /></TableCell>
                    <TableCell>{KP[a.knowledgeId].name}</TableCell>
                    <TableCell className="font-mono text-xs">{a.questionId}</TableCell>
                    <TableCell><Badge variant="outline">{a.mode}</Badge></TableCell>
                    <TableCell>{a.answer}</TableCell>
                    <TableCell className="text-muted-foreground">{a.durationSec}s</TableCell>
                    <TableCell>{a.correct ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-destructive" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
