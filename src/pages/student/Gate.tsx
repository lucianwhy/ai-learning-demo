import { motion } from "motion/react"
import { ArrowRight, CheckCircle2, Loader2, Lock, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/border-beam"
import { PKG_NAME } from "@/engine/inventory"
import { activeEntitlement, isFeatureOn, useStore } from "@/store/useStore"

export default function Gate() {
  const s = useStore()
  const nav = useNavigate()
  const st = s.students.find((x) => x.id === s.currentStudentId)
  const org = s.orgs.find((o) => o.id === st?.orgId)
  const ent = activeEntitlement(s, s.currentStudentId)
  const L = s.learning[s.currentStudentId]
  const checks = useMemo(() => [
    { name: "已认证", ok: true, detail: `账号 ${st?.account ?? "-"} · 会话有效` },
    { name: "账号有效", ok: st?.status === "启用", detail: st?.status === "启用" ? "学生账号启用中" : "账号已停用" },
    { name: "角色拥有动作权限", ok: true, detail: "role=student · action=learning.create_task" },
    { name: "机构数据范围允许", ok: org?.status === "启用", detail: `${org?.name ?? "-"} · ${org?.status}` },
    { name: "功能开关通过", ok: isFeatureOn(s.flags, "subject_math", org?.id), detail: `数学${org?.subjects.includes("physics") ? " / 物理 / 化学" : "（机构仅采购数学）"}` },
    { name: "所需权益有效", ok: !!ent, detail: ent ? `${PKG_NAME[ent.packageType]} · ${ent.id} · 至 ${ent.expireAt}` : "未找到有效学习卡权益" },
    { name: "配额足够", ok: !!ent, detail: ent ? "AI讲题配额充足" : "—" },
  ], [st, org, ent, s.flags])
  const [shown, setShown] = useState(0)
  useEffect(() => {
    setShown(0)
    const t = setInterval(() => setShown((n) => (n >= checks.length ? n : n + 1)), 320)
    return () => clearInterval(t)
  }, [s.currentStudentId, checks.length])
  const allOk = checks.every((c) => c.ok)
  const finished = shown >= checks.length
  useEffect(() => { if (finished && allOk) s.markVisited(`gate:${s.currentStudentId}`) }, [finished, allOk])
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <Card className="relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">学生登录 · 服务端权益校验 <Badge variant="outline">{st?.name}</Badge></CardTitle>
          <CardDescription>已认证 ∧ 账号有效 ∧ 角色权限 ∧ 机构范围 ∧ 功能开关 ∧ 权益有效 ∧ 配额足够（演示引擎模拟服务端判定）</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {checks.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i < shown ? 1 : 0.35, x: 0 }} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5 ring-1 ring-foreground/5">
              {i >= shown ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : c.ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-destructive" />}
              <span className="w-36 text-sm font-medium">{c.name}</span>
              <span className="truncate text-xs text-muted-foreground">{i < shown ? c.detail : "校验中…"}</span>
            </motion.div>
          ))}
        </CardContent>
        {finished && allOk && <BorderBeam size={140} duration={5} colorFrom="#34d399" colorTo="#818cf8" />}
      </Card>
      {finished && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {allOk ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="text-sm text-muted-foreground">校验通过，进入自主学习</div>
              <Button size="lg" onClick={() => nav(L?.diagnosed ? "/s/home" : "/s/diagnosis")}>{L?.diagnosed ? "进入首页" : "开始范围确认与首次诊断"}<ArrowRight data-icon="inline-end" /></Button>
            </div>
          ) : (
            <Alert variant="destructive">
              <Lock />
              <AlertTitle>无法创建新的受限学习任务</AlertTitle>
              <AlertDescription>机构有库存 ≠ 学生已有权益。请联系所属机构校长为你分配学习卡；历史学习记录仍可查看。</AlertDescription>
            </Alert>
          )}
        </motion.div>
      )}
    </div>
  )
}
