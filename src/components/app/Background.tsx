export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -top-40 -left-32 size-[42rem] animate-float rounded-full blur-[120px]" style={{ background: "var(--glow-1)" }} />
      <div className="absolute top-1/3 -right-40 size-[36rem] animate-float rounded-full blur-[120px] [animation-delay:-2s]" style={{ background: "var(--glow-2)" }} />
      <div className="absolute -bottom-48 left-1/3 size-[34rem] animate-float rounded-full blur-[130px] [animation-delay:-4s]" style={{ background: "var(--glow-3)" }} />
      <div className="grid-bg absolute inset-0" />
    </div>
  )
}
