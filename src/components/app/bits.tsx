import { motion } from "motion/react"
import type { ComponentType, ReactNode } from "react"
import { Atom, FlaskConical, Sigma } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { MASTERY_META, SUBJECTS, TASK_META } from "@/data/knowledge"
import type { MasteryStatus, SubjectId, TaskType } from "@/data/types"
import { cn } from "@/lib/utils"

export const SUBJECT_ICON: Record<SubjectId, ComponentType<{ className?: string; style?: React.CSSProperties }>> = { math: Sigma, physics: Atom, chemistry: FlaskConical }

export function SubjectBadge({ subject, className }: { subject: SubjectId; className?: string }) {
  const Icon = SUBJECT_ICON[subject]
  return (
    <Badge variant="outline" className={cn("gap-1 border-transparent", className)} style={{ color: SUBJECTS[subject].color, background: `color-mix(in oklch, ${SUBJECTS[subject].color} 14%, transparent)` }}>
      <Icon data-icon="inline-start" />
      {SUBJECTS[subject].name}
    </Badge>
  )
}

export function MasteryBadge({ status, notLearned, className }: { status: MasteryStatus; notLearned?: boolean; className?: string }) {
  if (notLearned)
    return (
      <Badge variant="outline" className={cn("border-dashed", className)}>
        未学 · 不判薄弱
      </Badge>
    )
  const m = MASTERY_META[status]
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-transparent", className)} style={{ color: m.color, background: `color-mix(in oklch, ${m.color} 14%, transparent)` }}>
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </Badge>
  )
}

export function TaskTypeBadge({ type, className }: { type: TaskType; className?: string }) {
  const m = TASK_META[type]
  return (
    <Badge variant="outline" className={cn("border-transparent", className)} style={{ color: m.color, background: `color-mix(in oklch, ${m.color} 14%, transparent)` }}>
      {m.label}
    </Badge>
  )
}

export function ProgressRing({ value, size = 120, stroke = 10, color = "var(--primary)", children, track = "color-mix(in oklch, var(--foreground) 8%, transparent)" }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; track?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const id = `rg-${Math.round(size)}-${stroke}`
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="var(--chem)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={`url(#${id})`} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * Math.min(100, value)) / 100 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px color-mix(in oklch, ${color} 60%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function PageHeader({ title, desc, eyebrow, actions, icon: Icon }: { title: ReactNode; desc?: ReactNode; eyebrow?: string; actions?: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <div className="text-xs font-medium tracking-[0.2em] text-primary uppercase">{eyebrow}</div>}
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          {Icon && (
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Icon className="size-5" />
            </span>
          )}
          {title}
        </h1>
        {desc && <p className="max-w-3xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, suffix, decimals = 0, hint, icon: Icon, color = "var(--primary)", className }: { label: string; value: number; suffix?: string; decimals?: number; hint?: ReactNode; icon?: ComponentType<{ className?: string; style?: React.CSSProperties }>; color?: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-foreground/10 backdrop-blur-xl", className)}>
      <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-30 blur-2xl" style={{ background: color }} />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        {Icon && <Icon className="size-4" style={{ color }} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1 text-3xl font-semibold tracking-tight">
        <NumberTicker value={value} decimalPlaces={decimals} className="text-foreground dark:text-foreground" />
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

export function Glow({ className, color = "var(--primary)" }: { className?: string; color?: string }) {
  return <div className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} style={{ background: `color-mix(in oklch, ${color} 35%, transparent)` }} />
}

export function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2">
      {pulse && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: color }} />}
      <span className="relative inline-flex size-2 rounded-full" style={{ background: color }} />
    </span>
  )
}

export function fmtDT(s: string) {
  return s.replace("T", " ").slice(5, 16)
}
