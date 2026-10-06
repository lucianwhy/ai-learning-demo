import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, ChevronDown, RotateCcw, Wand2, X, Zap } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Role } from "@/data/types"
import { cn } from "@/lib/utils"
import { type StoreState, useStore } from "@/store/useStore"
import { ROLE_META } from "./nav"

const TEST_ORG = "测试机构"
const testOrg = (s: StoreState) => s.orgs.find((o) => o.name.startsWith(TEST_ORG))
const testStudent = (s: StoreState) => { const o = testOrg(s); return o ? s.students.find((x) => x.orgId === o.id) : undefined }
const testL = (s: StoreState) => { const st = testStudent(s); return st ? s.learning[st.id] : undefined }

interface Step {
  id: string
  title: string
  role: Role
  route: string
  hint: string
  done: (s: StoreState) => boolean
  prepare?: (s: StoreState) => void
  auto?: (s: StoreState) => void
}

export const GUIDE_STEPS: Step[] = [
  { id: "g1", title: "总部创建「测试机构」", role: "admin", route: "/a/orgs", hint: "机构管理 → 新建机构（表单已预填），设置编码/学科/学段/套餐。", done: (s) => !!testOrg(s),
    auto: (s) => { s.createOrg({ name: "测试机构", code: "TEST-001", city: "杭州", subjects: ["math", "physics", "chemistry"], stages: ["初中"], packages: ["month", "quarter", "year"] }) } },
  { id: "g2", title: "创建并绑定校长账号", role: "admin", route: "/a/orgs", hint: "在机构行点击「绑定校长」，一个校长账号绑定唯一机构，写入审计。", done: (s) => !!testOrg(s)?.principalId,
    auto: (s) => { const o = testOrg(s); if (o) s.bindPrincipal(o.id, "林校长", "lin.test@test", "135****0001") } },
  { id: "g3", title: "向该机构拨付 100 张月卡", role: "admin", route: "/a/inventory", hint: "卡库存拨付 → 选择测试机构 → 月卡 ×100。生成 allocation 批次与不可覆盖流水（含幂等键）。", done: (s) => { const o = testOrg(s); return !!o && s.ledger.some((l) => l.orgId === o.id && l.packageType === "month" && l.change === 100) },
    prepare: (s) => { const o = testOrg(s); if (o) s.setPrincipalOrg(o.id) },
    auto: (s) => { const o = testOrg(s); if (o) s.allocate(o.id, "month", 100, "招商演示：首批拨付", `idem-guide-${Date.now()}`) } },
  { id: "g4", title: "校长登录 · 看到月卡可用库存 100", role: "principal", route: "/p/overview", hint: "切换到校长端，机构概览显示月卡可用 100（由台账计算）。", done: (s) => { const o = testOrg(s); return !!o && s.principalOrgId === o.id && s.guideVisited.includes("principal:/p/overview") },
    prepare: (s) => { const o = testOrg(s); if (o) s.setPrincipalOrg(o.id) } },
  { id: "g5", title: "创建 / 导入 1 名学生", role: "principal", route: "/p/students", hint: "学生账号 → 新建学生（已预填「张一鸣 · 初三」）。", done: (s) => !!testStudent(s),
    prepare: (s) => { const o = testOrg(s); if (o) s.setPrincipalOrg(o.id) },
    auto: (s) => { const o = testOrg(s); if (o) s.createStudent(o.id, "张一鸣", "初三") } },
  { id: "g6", title: "分配 1 张月卡 → 库存 99 + 流水", role: "principal", route: "/p/assign", hint: "原子事务：库存扣减 + 权益创建 + 流水记录，三者同时成功。", done: (s) => { const o = testOrg(s); return !!o && s.ledger.some((l) => l.orgId === o.id && l.op === "分配给学生") },
    prepare: (s) => { const o = testOrg(s); if (o) s.setPrincipalOrg(o.id) },
    auto: (s) => { const o = testOrg(s); const st = testStudent(s); if (o && st) s.assignEntitlement(o.id, st.id, "month", `idem-guide-as-${Date.now()}`) } },
  { id: "g7", title: "学生登录 · 通过权益校验", role: "student", route: "/s/gate", hint: "已认证 ∧ 账号有效 ∧ 机构范围 ∧ 功能开关 ∧ 权益有效 ∧ 配额足够。", done: (s) => { const st = testStudent(s); return !!st && s.currentStudentId === st.id && s.guideVisited.includes(`gate:${st.id}`) },
    prepare: (s) => { const st = testStudent(s); if (st) s.switchStudent(st.id) } },
  { id: "g8", title: "确认教材/章节范围 → 首次诊断", role: "student", route: "/s/diagnosis", hint: "选择人教版 + 当前章节；未学章节不判薄弱。完成 6 题诊断与 AI 分析。", done: (s) => !!testL(s)?.diagnosed,
    prepare: (s) => { const st = testStudent(s); if (st) s.switchStudent(st.id) } },
  { id: "g9", title: "生成 30 天计划和今日任务", role: "student", route: "/s/diagnosis", hint: "在诊断结果页点击「生成30天计划」，每个计划项可追溯生成原因。", done: (s) => !!testL(s)?.plan,
    prepare: (s) => { const st = testStudent(s); if (st) s.switchStudent(st.id) } },
  { id: "g10", title: "完成知识学习 / 练习", role: "student", route: "/s/today", hint: "今日学习按引擎顺序执行：知识卡 → 练习（建议故意答错一次）。", done: (s) => !!testL(s)?.attempts.some((a) => a.mode === "练习"),
    prepare: (s) => { const st = testStudent(s); if (st) s.switchStudent(st.id) } },
  { id: "g11", title: "错题进入订正", role: "student", route: "/s/today", hint: "选择错因 + 订正说明；订正不直接判定掌握。", done: (s) => !!testL(s)?.errors.some((e) => e.corrections.length > 0) || !!testL(s)?.errors.length && !!testL(s)?.attempts.some((a) => a.mode === "变式验证"),
    prepare: (s) => { const st = testStudent(s); if (st) s.switchStudent(st.id) } },
  { id: "g12", title: "不同题目的变式独立验证 → 掌握度更新 → 计划重排", role: "student", route: "/s/today", hint: "变式题通过后掌握度动画更新，自动生成新计划版本（旧版本保留）。", done: (s) => (testL(s)?.plan?.versions.length ?? 0) > 1,
    prepare: (s) => { const st = testStudent(s); if (st) s.switchStudent(st.id) } },
  { id: "g13", title: "校长端查看该学生学情", role: "principal", route: "/p/learning", hint: "本机构学情：任务完成、掌握度、风险——仅限本机构数据。", done: (s) => s.guideVisited.includes("principal:/p/learning"),
    prepare: (s) => { const o = testOrg(s); if (o) s.setPrincipalOrg(o.id) } },
  { id: "g14", title: "总部查看使用记录与 100→99 流水", role: "admin", route: "/a/ledger", hint: "库存/权益流水：transaction_id、before/change/after、操作人、幂等键，可追溯拨付批次。", done: (s) => s.guideVisited.includes("admin:/a/ledger") },
]

export function DemoGuide() {
  const s = useStore()
  const nav = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)
  const doneFlags = GUIDE_STEPS.map((st) => st.done(s))
  const doneCount = doneFlags.filter(Boolean).length
  const currentIdx = doneFlags.findIndex((d) => !d)
  const go = (st: Step) => {
    const S = useStore.getState()
    st.prepare?.(S)
    S.setRole(st.role)
    nav(st.route)
  }
  const auto = (st: Step) => {
    const S = useStore.getState()
    st.auto?.(S)
    toast.success(`已自动完成：${st.title}`)
    go(st)
  }
  return (
    <AnimatePresence>
      {s.guideOpen && (
        <motion.aside initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed right-5 bottom-5 z-50 flex max-h-[min(78vh,760px)] w-[400px] flex-col overflow-hidden rounded-2xl bg-popover/85 shadow-2xl ring-1 shadow-violet-900/30 ring-foreground/10 backdrop-blur-2xl">
          <div className="relative overflow-hidden border-b p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-fuchsia-500/20" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg"><Wand2 className="size-4" /></div>
                <div>
                  <div className="text-sm font-semibold">演示向导 · 招商交付全链路</div>
                  <div className="text-xs text-muted-foreground">PRD 21.7 · 总部 → 校长 → 学生 → 回看流水</div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => s.setGuideOpen(false)} aria-label="关闭"><X /></Button>
            </div>
            <div className="relative mt-3 flex items-center gap-3">
              <Progress value={(doneCount / GUIDE_STEPS.length) * 100} className="flex-1" />
              <span className="text-xs tabular-nums text-muted-foreground">{doneCount}/{GUIDE_STEPS.length}</span>
            </div>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
            {GUIDE_STEPS.map((st, i) => {
              const done = doneFlags[i]
              const current = i === currentIdx
              const open = expanded === st.id || (expanded === null && current)
              const R = ROLE_META[st.role]
              return (
                <div key={st.id} className={cn("relative rounded-xl p-2.5 transition-colors", current && "bg-primary/10 ring-1 ring-primary/30", !current && "hover:bg-muted/50")}>
                  {i < GUIDE_STEPS.length - 1 && <div className={cn("absolute top-10 bottom-[-6px] left-[22px] w-px", done ? "bg-emerald-500/50" : "bg-border")} />}
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => setExpanded(open ? "__none" : st.id)}>
                    <div className={cn("relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-1", done ? "bg-emerald-500 text-white ring-emerald-400" : current ? "bg-primary text-primary-foreground ring-primary" : "bg-muted text-muted-foreground ring-border")}>
                      {done ? <Check className="size-3.5" /> : i + 1}
                      {current && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-sm", done && "text-muted-foreground line-through decoration-emerald-500/50")}>{st.title}</div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]" style={{ color: R.color }}>{R.short}</Badge>
                    <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex flex-col gap-2 pt-2 pl-9">
                          <p className="text-xs leading-relaxed text-muted-foreground">{st.hint}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => go(st)}>前往{R.name}<ArrowRight data-icon="inline-end" /></Button>
                            {st.auto && !done && (
                              <Button size="sm" variant="outline" onClick={() => auto(st)} disabled={i > 0 && !doneFlags[i - 1]}><Zap data-icon="inline-start" />自动完成</Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
            <span>所有步骤真实改变共享演示数据</span>
            <Button variant="ghost" size="sm" onClick={() => { s.resetAll(); toast("演示数据已重置") ; nav("/a/overview"); useStore.getState().setRole("admin"); useStore.getState().setGuideOpen(true) }}><RotateCcw data-icon="inline-start" />重置链路</Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
