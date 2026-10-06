import { motion } from "motion/react"
import { ArrowRight, Moon, ShieldCheck, Sun, Wand2 } from "lucide-react"
import { useNavigate } from "react-router"
import { Background } from "@/components/app/Background"
import { Logo } from "@/components/app/AppShell"
import { LoopViz } from "@/components/app/LoopViz"
import { ROLE_META } from "@/components/app/nav"
import { useTheme } from "@/components/theme-provider"
import { AuroraText } from "@/components/ui/aurora-text"
import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import { MagicCard } from "@/components/ui/magic-card"
import { Particles } from "@/components/ui/particles"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import type { Role } from "@/data/types"
import { useStore } from "@/store/useStore"

const ROLE_POINTS: Record<Role, string[]> = {
  student: ["范围确认 → 知识点级诊断", "30 天计划 · 版本可追溯", "错题 → 订正 → 变式独立验证"],
  teacher: ["连续失败 / 风险学生队列", "拍照批改不确定项人工确认", "反馈不等同于掌握"],
  principal: ["月/季/年卡库存由台账计算", "原子分配：扣卡 + 开权益 + 流水", "本机构学情 · 租户隔离"],
  admin: ["机构 / 校长 / 套餐 / 拨卡", "三级功能开关 · AI Gateway", "学科 × 学段策略 · 审计日志"],
}

export default function Landing() {
  const nav = useNavigate()
  const login = useStore((s) => s.login)
  const setGuide = useStore((s) => s.setGuideOpen)
  const switchStudent = useStore((s) => s.switchStudent)
  const { theme, setTheme } = useTheme()
  const dark = theme !== "light"
  const enter = (r: Role) => {
    login(r)
    if (r === "student") { switchStudent("stu-lxz"); nav("/s/gate") } else nav(ROLE_META[r].home)
  }
  return (
    <div className="relative min-h-svh overflow-hidden">
      <Background />
      <Particles className="absolute inset-0 -z-0" quantity={90} color={dark ? "#a5b4fc" : "#6366f1"} ease={70} />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground ring-1 ring-foreground/10 md:inline">PRD V1.4 · 冻结基线 · 前端交互演示</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="切换主题">{dark ? <Sun /> : <Moon />}</Button>
        </div>
      </header>
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 pt-4 pb-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/25">
            <ShieldCheck className="size-3.5" /> 证据驱动 · 不是课程列表 + 题库 + AI 聊天
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl leading-[1.15] font-semibold tracking-tight md:text-6xl">
            让系统决定<br />
            <AuroraText colors={["#818cf8", "#c084fc", "#f472b6", "#34d399"]}>下一步学什么</AuroraText>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-xl text-base leading-relaxed text-muted-foreground">
            AI 数理化自主学习平台：诊断 → 30 天计划 → 今日任务 → 练习/学案 → 订正 → 变式独立验证 → 阶段检测 → 掌握度更新 → 计划重排。每一次状态变化都有可追溯的学习证据。
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center gap-3">
            <ShimmerButton background="linear-gradient(110deg,#4f46e5,#9333ea,#db2777)" className="px-6 py-3 text-sm font-medium shadow-2xl shadow-violet-500/30" onClick={() => { login("admin"); setGuide(true); nav("/a/overview") }}>
              <Wand2 className="mr-2 size-4" /> 启动招商演示向导
            </ShimmerButton>
            <Button variant="outline" size="lg" onClick={() => enter("student")}>直接体验学生端<ArrowRight data-icon="inline-end" /></Button>
          </motion.div>
          <div className="mt-2 grid max-w-lg grid-cols-3 gap-3">
            {[["11 步", "冻结决策闭环"], ["4 端", "共享一套设计系统"], ["7 套", "学科×学段策略"]].map(([a, b]) => (
              <div key={a} className="rounded-xl bg-card/60 p-3 ring-1 ring-foreground/10 backdrop-blur">
                <div className="text-xl font-semibold">{a}</div>
                <div className="text-xs text-muted-foreground">{b}</div>
              </div>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.8 }} className="hidden justify-center lg:flex">
          <LoopViz size={460} current={7} />
        </motion.div>
      </section>
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">选择角色登录</h2>
            <p className="text-sm text-muted-foreground">四端共享同一份模拟数据：总部拨的卡，校长能分配；学生学的证据，校长与总部能回看。</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(ROLE_META) as Role[]).map((r, i) => {
            const R = ROLE_META[r]
            return (
              <motion.div key={r} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }} className="h-full">
                <MagicCard className="h-full cursor-pointer rounded-2xl" gradientFrom={i % 2 ? "#f59e0b" : "#818cf8"} gradientTo={i % 2 ? "#ec4899" : "#34d399"}>
                  <button className="relative flex h-full w-full flex-col gap-4 p-5 text-left" onClick={() => enter(r)}>
                    <div className="flex items-center justify-between">
                      <div className="grid size-11 place-items-center rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${R.color}, color-mix(in oklch, ${R.color} 50%, black))` }}>
                        <R.icon className="size-5" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold">{R.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{R.desc}</div>
                    </div>
                    <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      {ROLE_POINTS[r].map((p) => (
                        <li key={p} className="flex items-center gap-2"><span className="size-1 rounded-full" style={{ background: R.color }} />{p}</li>
                      ))}
                    </ul>
                  </button>
                  {i === 0 && <BorderBeam size={120} duration={7} colorFrom="#818cf8" colorTo="#34d399" />}
                </MagicCard>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
