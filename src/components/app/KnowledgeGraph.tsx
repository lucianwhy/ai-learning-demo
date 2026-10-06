import { motion } from "motion/react"
import { useMemo, useState } from "react"
import { KP, MASTERY_META, kpOf } from "@/data/knowledge"
import type { MasteryState, SubjectId } from "@/data/types"
import { cn } from "@/lib/utils"

function depthOf(id: string, memo: Record<string, number>): number {
  if (memo[id] !== undefined) return memo[id]
  const k = KP[id]
  memo[id] = k.prerequisites.length ? 1 + Math.max(...k.prerequisites.map((p) => depthOf(p, memo))) : 0
  return memo[id]
}

export function KnowledgeGraph({ subject, mastery, height = 380, highlight, onSelect }: { subject: SubjectId; mastery: Record<string, MasteryState>; height?: number; highlight?: string; onSelect?: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null)
  const layout = useMemo(() => {
    const ks = kpOf(subject)
    const memo: Record<string, number> = {}
    const cols: Record<number, string[]> = {}
    for (const k of ks) (cols[depthOf(k.id, memo)] ??= []).push(k.id)
    const nCols = Object.keys(cols).length
    const pos: Record<string, { x: number; y: number }> = {}
    for (const [d, ids] of Object.entries(cols)) ids.forEach((id, i) => (pos[id] = { x: ((+d + 0.5) / nCols) * 100, y: ((i + 0.5) / ids.length) * 100 }))
    const edges = ks.flatMap((k) => k.prerequisites.filter((p) => pos[p]).map((p) => ({ from: p, to: k.id })))
    return { ks, pos, edges }
  }, [subject])
  const focus = hover ?? highlight
  const related = (id: string) => !focus || id === focus || KP[focus].prerequisites.includes(id) || KP[id].prerequisites.includes(focus)
  return (
    <div className="relative w-full" style={{ height }}>
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {layout.edges.map((e, i) => {
          const a = layout.pos[e.from]
          const b = layout.pos[e.to]
          const mx = (a.x + b.x) / 2
          const st = mastery[e.from]?.status
          const color = st === "weak" ? "var(--st-weak)" : st === "mastered" ? "var(--st-mastered)" : "color-mix(in oklch, var(--foreground) 35%, transparent)"
          const on = !focus || (related(e.from) && related(e.to) && (e.from === focus || e.to === focus))
          const d = `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
          return (
            <g key={i} opacity={on ? 1 : 0.15}>
              <path d={d} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              <motion.path d={d} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray="4 10" initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -28 }} transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }} />
            </g>
          )
        })}
      </svg>
      {layout.ks.map((k, i) => {
        const m = mastery[k.id]
        const meta = MASTERY_META[m?.status ?? "undiagnosed"]
        const nl = m?.notLearned
        const p = layout.pos[k.id]
        return (
          <motion.button key={k.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: related(k.id) ? 1 : 0.3, scale: 1 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
            onMouseEnter={() => setHover(k.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(k.id)}
            className={cn("absolute flex w-[140px] -translate-x-1/2 -translate-y-1/2 flex-col gap-1 rounded-xl bg-card/90 px-2.5 py-2 text-left ring-1 backdrop-blur-xl transition-shadow", nl && "border border-dashed border-muted-foreground/40 ring-0")}
            style={{ left: `${p.x}%`, top: `${p.y}%`, boxShadow: nl ? undefined : `0 0 0 1px color-mix(in oklch, ${meta.color} 45%, transparent), 0 8px 28px -10px ${meta.color}` }}>
            <div className="flex items-center justify-between gap-1">
              <span className="size-2 shrink-0 rounded-full" style={{ background: nl ? "var(--muted-foreground)" : meta.color, boxShadow: nl ? undefined : `0 0 8px ${meta.color}` }} />
              <span className="text-[10px]" style={{ color: nl ? undefined : meta.color }}>{nl ? "未学" : meta.label}</span>
            </div>
            <div className="line-clamp-2 text-xs leading-snug font-medium">{k.name}</div>
            {!nl && m?.status !== "undiagnosed" && (
              <div className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${m.score}%`, background: meta.color }} /></div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export function MasteryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {Object.entries(MASTERY_META).map(([k, m]) => (
        <span key={k} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: m.color }} />{m.label}</span>
      ))}
      <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-dashed border-muted-foreground" />未学 · 不判薄弱</span>
    </div>
  )
}
