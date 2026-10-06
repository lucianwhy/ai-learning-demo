import katex from "katex"
import "katex/contrib/mhchem"
import { Fragment, memo, useMemo } from "react"
import { cn } from "@/lib/utils"

export const Tex = memo(function Tex({ children, display = false, className }: { children: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { displayMode: display, throwOnError: false, strict: false })
    } catch {
      return children
    }
  }, [children, display])
  return <span className={cn(display && "tex-display block overflow-x-auto", className)} dangerouslySetInnerHTML={{ __html: html }} />
})

/** 解析 $...$ 公式与 **加粗** 的富文本 */
export const RichText = memo(function RichText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { t: "tex" | "b" | "s"; v: string }[] = []
    const re = /\$([^$]+)\$|\*\*([^*]+)\*\*/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: "s", v: text.slice(last, m.index) })
      if (m[1] !== undefined) out.push({ t: "tex", v: m[1] })
      else out.push({ t: "b", v: m[2] })
      last = m.index + m[0].length
    }
    if (last < text.length) out.push({ t: "s", v: text.slice(last) })
    return out
  }, [text])
  return (
    <span className={className}>
      {parts.map((p, i) => (
        <Fragment key={i}>{p.t === "tex" ? <Tex>{p.v}</Tex> : p.t === "b" ? <strong className="font-semibold text-foreground">{p.v}</strong> : p.v}</Fragment>
      ))}
    </span>
  )
})
