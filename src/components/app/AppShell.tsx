import { AnimatePresence, motion } from "motion/react"
import { Check, ChevronsUpDown, Flame, LogOut, Moon, Sparkles, Sun, Wand2 } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { SUBJECT_LIST, SUBJECTS } from "@/data/knowledge"
import type { Role } from "@/data/types"
import { diffDays, todayISO } from "@/engine/date"
import { PKG_NAME } from "@/engine/inventory"
import { cn } from "@/lib/utils"
import { activeEntitlement, isFeatureOn, useStore } from "@/store/useStore"
import { Background } from "./Background"
import { SUBJECT_ICON } from "./bits"
import { DemoGuide } from "./DemoGuide"
import { EXTRA_TITLES, NAV, ROLE_META } from "./nav"

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 shadow-lg shadow-indigo-500/30">
        <Sparkles className="size-5 text-white" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      {!compact && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">智学引擎 · 数理化</span>
          <span className="truncate text-[11px] text-muted-foreground">AI 自主学习平台</span>
        </div>
      )}
    </div>
  )
}

export function RoleSwitcher() {
  const role = useStore((s) => s.role)
  const setRole = useStore((s) => s.setRole)
  const nav = useNavigate()
  const M = ROLE_META[role]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <span className="size-2 rounded-full" style={{ background: M.color }} />
        {M.name}
        <ChevronsUpDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>切换角色（共享同一演示数据）</DropdownMenuLabel>
          {(Object.keys(ROLE_META) as Role[]).map((r) => {
            const R = ROLE_META[r]
            return (
              <DropdownMenuItem key={r} onClick={() => { setRole(r); nav(R.home) }}>
                <R.icon />
                <div className="flex flex-col">
                  <span>{R.name}</span>
                  <span className="text-[11px] text-muted-foreground">{R.desc}</span>
                </div>
                {r === role && <Check className="ml-auto" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SubjectSwitcher() {
  const subject = useStore((s) => s.subject)
  const setSubject = useStore((s) => s.setSubject)
  const flags = useStore((s) => s.flags)
  const orgId = useStore((s) => s.students.find((x) => x.id === s.currentStudentId)?.orgId)
  return (
    <div className="relative flex items-center rounded-full bg-muted/70 p-1 ring-1 ring-foreground/10">
      {SUBJECT_LIST.map((sid) => {
        const Icon = SUBJECT_ICON[sid]
        const on = isFeatureOn(flags, `subject_${sid === "chemistry" ? "chemistry" : sid}`, orgId)
        return (
          <button key={sid} disabled={!on} onClick={() => setSubject(sid)} className={cn("relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40", subject === sid ? "text-white" : "text-muted-foreground hover:text-foreground")}>
            {subject === sid && <motion.span layoutId="subject-pill" className="absolute inset-0 -z-10 rounded-full shadow-lg" style={{ background: SUBJECTS[sid].color, boxShadow: `0 6px 20px -6px ${SUBJECTS[sid].color}` }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <Icon className="size-3.5" />
            {SUBJECTS[sid].name}
          </button>
        )
      })}
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const dark = theme === "dark" || (theme === "system" && document.documentElement.classList.contains("dark"))
  return (
    <Button variant="ghost" size="icon-sm" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="切换主题">
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}

function StudentChips() {
  const s = useStore()
  const L = s.learning[s.currentStudentId]
  const st = s.students.find((x) => x.id === s.currentStudentId)
  const ent = activeEntitlement(s, s.currentStudentId)
  const left = ent ? diffDays(todayISO(), ent.expireAt) : 0
  return (
    <>
      <div className="hidden items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-500 ring-1 ring-orange-500/20 lg:flex">
        <Flame className="size-3.5" /> 连续 {L?.streak ?? 0} 天
      </div>
      {ent ? (
        <Badge className="hidden bg-gradient-to-r from-amber-400 to-orange-500 text-white lg:inline-flex">{PKG_NAME[ent.packageType]} · 剩余 {left} 天</Badge>
      ) : (
        <Badge variant="destructive">无有效权益</Badge>
      )}
      <Avatar className="size-8 ring-2 ring-primary/40">
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs text-white">{st?.name.slice(-2) ?? "学生"}</AvatarFallback>
      </Avatar>
    </>
  )
}

function OrgChip({ admin }: { admin?: boolean }) {
  const s = useStore()
  const org = s.orgs.find((o) => o.id === s.principalOrgId)
  const pr = s.principals.find((p) => p.id === org?.principalId)
  if (admin)
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="hidden lg:inline-flex">平台超级管理员 · 赵敏</Badge>
        <Avatar className="size-8 ring-2 ring-fuchsia-500/40"><AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-xs text-white">总部</AvatarFallback></Avatar>
      </div>
    )
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="hidden max-w-56 truncate lg:inline-flex">{org?.name}</Badge>
      <Avatar className="size-8 ring-2 ring-amber-500/40"><AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-xs text-white">{pr?.name.slice(-2) ?? "校长"}</AvatarFallback></Avatar>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const role = useStore((s) => s.role)
  const subject = useStore((s) => s.subject)
  const logout = useStore((s) => s.logout)
  const loc = useLocation()
  const nav = useNavigate()
  const groups = NAV[role]
  const title = EXTRA_TITLES[loc.pathname] ?? groups.flatMap((g) => g.items).find((i) => loc.pathname.startsWith(i.url))?.title ?? ""
  return (
    <SidebarProvider data-subject={subject}>
      <Background />
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader className="p-3">
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          {groups.map((g) => (
            <SidebarGroup key={g.group}>
              <SidebarGroupLabel>{ROLE_META[role].name} · {g.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {g.items.map((it) => {
                    const active = loc.pathname.startsWith(it.url) || (it.url === "/s/today" && loc.pathname === "/s/plan") || (it.url === "/s/home" && loc.pathname === "/s/diagnosis")
                    return (
                      <SidebarMenuItem key={it.url}>
                        <SidebarMenuButton isActive={active} tooltip={it.title} render={<Link to={it.url} />} className="relative">
                          {active && <motion.span layoutId={`nav-active-${role}`} className="absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-primary/25 to-primary/5 ring-1 ring-primary/30" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                          <it.icon />
                          <span>{it.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="退出到角色选择" onClick={() => { logout(); nav("/") }}>
                <LogOut />
                <span>退出到角色选择</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/60 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="text-muted-foreground">{ROLE_META[role].name}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate font-medium">{title}</span>
          </div>
          <div className="mx-auto">{role === "student" && <SubjectSwitcher />}</div>
          <div className="flex items-center gap-2">
            {role === "student" && <StudentChips />}
            {role === "principal" && <OrgChip />}
            {role === "admin" && <OrgChip admin />}
            {role === "teacher" && <Badge variant="outline">王老师 · 星海教育</Badge>}
            <GuideFab />
            <ThemeToggle />
            <RoleSwitcher />
          </div>
        </header>
        <main className="relative flex-1 px-4 py-6 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(4px)" }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[1400px]">
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>
      <DemoGuide />
    </SidebarProvider>
  )
}

function GuideFab() {
  const open = useStore((s) => s.guideOpen)
  const setOpen = useStore((s) => s.setGuideOpen)
  return (
    <motion.button whileHover={{ scale: 1.04 }} onClick={() => setOpen(!open)} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white shadow-lg shadow-violet-500/30", open ? "bg-gradient-to-r from-indigo-500/60 to-fuchsia-500/60" : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500")}>
      <Wand2 className="size-3.5" /> 演示向导
      {!open && <span className="absolute -top-0.5 -right-0.5 flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-fuchsia-400 opacity-75" /><span className="relative inline-flex size-2.5 rounded-full bg-fuchsia-500" /></span>}
    </motion.button>
  )
}
