import {
  Activity, AlertTriangle, BarChart3, BookOpenCheck, Boxes, Building2, ClipboardCheck, Cog, CreditCard, FileClock, FileText, Gauge, GraduationCap, Home, Layers, LayoutDashboard,
  ListChecks, Network, NotebookPen, Package, ReceiptText, ScrollText, ShieldCheck, Sparkles, ToggleRight, UserCog, Users, Workflow,
} from "lucide-react"
import type { ComponentType } from "react"
import type { Role } from "@/data/types"

export interface NavItem { title: string; url: string; icon: ComponentType<{ className?: string }> }

export const ROLE_META: Record<Role, { name: string; short: string; home: string; color: string; desc: string; icon: ComponentType<{ className?: string }> }> = {
  student: { name: "学生端", short: "学生", home: "/s/home", color: "var(--math)", desc: "诊断 → 计划 → 今日任务 → 订正 → 变式验证 → 重排", icon: GraduationCap },
  teacher: { name: "教师介入端", short: "教师", home: "/t/risk", color: "var(--chem)", desc: "轻量兜底：风险学生、待人工确认、反馈", icon: ShieldCheck },
  principal: { name: "机构校长端", short: "校长", home: "/p/overview", color: "var(--physics)", desc: "学生账号、卡库存、权益分配、本机构学情", icon: Building2 },
  admin: { name: "总部总后台", short: "总部", home: "/a/overview", color: "oklch(0.7 0.2 310)", desc: "机构、套餐、拨卡流水、功能开关、AI Gateway、策略", icon: LayoutDashboard },
}

export const NAV: Record<Role, { group: string; items: NavItem[] }[]> = {
  student: [
    {
      group: "自主学习",
      items: [
        { title: "首页", url: "/s/home", icon: Home },
        { title: "今日学习", url: "/s/today", icon: ListChecks },
        { title: "我的学案", url: "/s/worksheets", icon: FileText },
        { title: "错题本", url: "/s/errors", icon: NotebookPen },
        { title: "学习记录", url: "/s/records", icon: FileClock },
        { title: "我的报告", url: "/s/report", icon: BarChart3 },
        { title: "设置", url: "/s/settings", icon: Cog },
      ],
    },
  ],
  teacher: [
    { group: "轻量介入", items: [{ title: "风险关注队列", url: "/t/risk", icon: AlertTriangle }, { title: "待人工确认", url: "/t/manual", icon: ClipboardCheck }] },
  ],
  principal: [
    {
      group: "机构管理",
      items: [
        { title: "机构概览", url: "/p/overview", icon: Gauge },
        { title: "学生账号", url: "/p/students", icon: Users },
        { title: "卡库存", url: "/p/inventory", icon: Boxes },
        { title: "分配权益", url: "/p/assign", icon: CreditCard },
        { title: "权益记录", url: "/p/records", icon: ReceiptText },
        { title: "本机构学情", url: "/p/learning", icon: Activity },
      ],
    },
  ],
  admin: [
    { group: "运营", items: [{ title: "总览", url: "/a/overview", icon: LayoutDashboard }, { title: "机构管理", url: "/a/orgs", icon: Building2 }, { title: "套餐定义", url: "/a/packages", icon: Package }, { title: "卡库存拨付", url: "/a/inventory", icon: Boxes }, { title: "库存/权益流水", url: "/a/ledger", icon: ReceiptText }] },
    { group: "学习引擎", items: [{ title: "学科×学段策略", url: "/a/strategy", icon: Layers }, { title: "AI Gateway", url: "/a/ai", icon: Sparkles }, { title: "内容题库审核", url: "/a/content", icon: BookOpenCheck }, { title: "功能开关", url: "/a/flags", icon: ToggleRight }] },
    { group: "系统", items: [{ title: "异步任务", url: "/a/jobs", icon: Workflow }, { title: "审计日志", url: "/a/audit", icon: ScrollText }] },
  ],
}

export const EXTRA_TITLES: Record<string, string> = { "/s/diagnosis": "首次诊断", "/s/plan": "30天学习计划", "/s/gate": "权益校验" }
export { Network, UserCog }
