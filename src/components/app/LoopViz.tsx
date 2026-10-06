import { AnimatePresence, motion } from "motion/react"
import { BookOpen, CalendarRange, ClipboardCheck, Eraser, Gauge, ListTodo, PencilLine, RefreshCcw, ScanLine, ShieldCheck, Stethoscope } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export const LOOP_STEPS = [
  { name: "诊断", icon: Stethoscope, desc: "知识点级诊断，形成可追溯的薄弱点与起点" },
  { name: "30天计划", icon: CalendarRange, desc: "按前置关系与每日预算生成，版本化留痕" },
  { name: "今日任务", icon: ListTodo, desc: "优先级 + 依赖 + 时间预算，超出顺延" },
  { name: "知识卡", icon: BookOpen, desc: "学科差异化：公式步骤 / 实验单位 / 方程现象" },
  { name: "练习/学案", icon: PencilLine, desc: "在线作答与纸质学案进入同一证据体系" },
  { name: "批改", icon: ScanLine, desc: "自动判分；拍照识别不确定进入人工确认" },
  { name: "订正", icon: Eraser, desc: "错因识别 + 订正，订正不直接判定掌握" },
  { name: "变式验证", icon: ShieldCheck, desc: "不同题目独立验证同一能力" },
  { name: "阶段检测", icon: ClipboardCheck, desc: "高权重证据，确认阶段效果" },
  { name: "更新掌握度", icon: Gauge, desc: "只由证据驱动，AI 讲解不计入" },
  { name: "重排计划", icon: RefreshCcw, desc: "生成新版本，历史版本不被覆盖" },
]

export function LoopViz({ size = 440, current = 7, autoplay = true, className }: { size?: number; current?: number; autoplay?: boolean; className?: string }) {
  const [focus, setFocus] = useState(current)
  const [hover, setHover] = useState<number | null>(null)
  useEffect(() => setFocus(current), [current])
  useEffect(() => {
    if (!autoplay || hover !== null) return
    const t = setInterval(() => setFocus((f) => (f + 1) % LOOP_STEPS.length), 2400)
    return () => clearInterval(t)
  }, [autoplay, hover])
  const shown = hover ?? focus
  const c = size / 2
  const R = size * 0.38
  const node = size * 0.105
  const pos = (i: number) => {
    const a = ((-90 + (i * 360) / LOOP_STEPS.length) * Math.PI) / 180
    return { x: c + R * Math.cos(a), y: c + R * Math.sin(a) }
  }
  const circ = 2 * Math.PI * R
  const progress = (current + 0.5) / LOOP_STEPS.length
  const S = LOOP_STEPS[shown]
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id="loop-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--math)" />
            <stop offset="50%" stopColor="oklch(0.7 0.2 300)" />
            <stop offset="100%" stopColor="var(--chem)" />
          </linearGradient>
          <radialGradient id="core-grad">
            <stop offset="0%" stopColor="color-mix(in oklch, var(--primary) 45%, transparent)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={c} cy={c} r={R * 0.78} fill="url(#core-grad)" />
        <circle cx={c} cy={c} r={R} fill="none" stroke="color-mix(in oklch, var(--foreground) 10%, transparent)" strokeWidth={2} strokeDasharray="2 6" />
        <motion.circle cx={c} cy={c} r={R} fill="none" stroke="url(#loop-grad)" strokeWidth={3} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - progress) }} transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }} filter="url(#glow)" />
        {/* 流动彗星 */}
        <g>
          <circle r={5} fill="white" filter="url(#glow)">
            <animateMotion dur="7s" repeatCount="indefinite" path={`M ${c} ${c - R} A ${R} ${R} 0 1 1 ${c - 0.01} ${c - R}`} />
          </circle>
          <circle r={9} fill="color-mix(in oklch, var(--primary) 40%, transparent)">
            <animateMotion dur="7s" begin="-0.12s" repeatCount="indefinite" path={`M ${c} ${c - R} A ${R} ${R} 0 1 1 ${c - 0.01} ${c - R}`} />
          </circle>
        </g>
        <circle cx={c} cy={c} r={R * 0.52} fill="none" stroke="color-mix(in oklch, var(--primary) 25%, transparent)" strokeWidth={1}>
          <animate attributeName="r" values={`${R * 0.48};${R * 0.56};${R * 0.48}`} dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
      {LOOP_STEPS.map((st, i) => {
        const p = pos(i)
        const done = i < current
        const isCur = i === current
        const active = i === shown
        const Icon = st.icon
        return (
          <button key={st.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: p.x, top: p.y }}>
            <motion.div animate={{ scale: active ? 1.18 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn("relative grid place-items-center rounded-2xl ring-1 backdrop-blur-xl transition-colors", done ? "bg-primary/20 text-primary ring-primary/40" : isCur ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white ring-white/30" : "bg-card text-muted-foreground ring-foreground/10")}
              style={{ width: node, height: node, boxShadow: isCur ? "0 0 32px -2px oklch(0.65 0.25 300 / 70%)" : active ? "0 0 24px -6px var(--primary)" : undefined }}>
              {isCur && <span className="absolute inset-0 animate-ping rounded-2xl bg-fuchsia-500/30" />}
              <Icon className="size-[42%]" />
              <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-background text-[9px] font-semibold ring-1 ring-foreground/15">{i + 1}</span>
            </motion.div>
            <span className={cn("text-[11px] font-medium whitespace-nowrap", isCur ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground")}>{st.name}</span>
          </button>
        )
      })}
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex w-[44%] flex-col items-center text-center">
          <div className="text-[10px] tracking-[0.25em] text-primary uppercase">Learning Engine</div>
          <AnimatePresence mode="wait">
            <motion.div key={shown} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex flex-col items-center gap-1">
              <div className="mt-1 text-lg font-semibold">
                <span className="text-muted-foreground">{shown + 1}.</span> {S.name}
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">{S.desc}</div>
              {shown === current && <div className="mt-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-medium text-fuchsia-400 ring-1 ring-fuchsia-500/30">你当前在这一步</div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
