import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InventoryLedger, LedgerOp } from "@/data/types"
import { PKG_NAME } from "@/engine/inventory"
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"
import { fmtDT } from "./bits"

const OP_STYLE: Record<LedgerOp, string> = {
  总部拨付: "bg-indigo-500/15 text-indigo-400",
  总部追加: "bg-violet-500/15 text-violet-400",
  冻结: "bg-sky-500/15 text-sky-400",
  解冻: "bg-cyan-500/15 text-cyan-400",
  回收: "bg-orange-500/15 text-orange-400",
  扣减: "bg-orange-500/15 text-orange-400",
  分配给学生: "bg-emerald-500/15 text-emerald-500",
  权益作废返还: "bg-teal-500/15 text-teal-400",
}

export function LedgerTable({ rows, showOrg = true, limit = 60, highlight }: { rows: InventoryLedger[]; showOrg?: boolean; limit?: number; highlight?: string }) {
  const orgs = useStore((s) => s.orgs)
  const students = useStore((s) => s.students)
  const list = [...rows].reverse().slice(0, limit)
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead>transaction_id</TableHead><TableHead>时间</TableHead>{showOrg && <TableHead>机构</TableHead>}<TableHead>卡类型</TableHead><TableHead>操作</TableHead>
          <TableHead className="text-right">before</TableHead><TableHead className="text-right">change</TableHead><TableHead className="text-right">after</TableHead>
          <TableHead>操作人</TableHead><TableHead>批次 / 对象</TableHead><TableHead>幂等键</TableHead><TableHead>原因</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map((l, i) => (
          <motion.tr key={l.transactionId} initial={i < 3 ? { opacity: 0, backgroundColor: "rgba(16,185,129,0.25)" } : false} animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 1.6 }}
            className={cn("border-b transition-colors hover:bg-muted/50", l.transactionId === highlight && "bg-emerald-500/10 ring-1 ring-emerald-500/40 ring-inset")}>
            <TableCell className="font-mono text-[11px] text-primary">{l.transactionId}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDT(l.occurredAt)}</TableCell>
            {showOrg && <TableCell className="max-w-36 truncate">{orgs.find((o) => o.id === l.orgId)?.name}</TableCell>}
            <TableCell>{PKG_NAME[l.packageType]}</TableCell>
            <TableCell><Badge className={OP_STYLE[l.op]}>{l.op}</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{l.before}</TableCell>
            <TableCell className={cn("text-right font-semibold tabular-nums", l.change > 0 ? "text-emerald-500" : "text-rose-400")}>{l.change > 0 ? `+${l.change}` : l.change}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{l.after}</TableCell>
            <TableCell className="whitespace-nowrap">{l.operator}</TableCell>
            <TableCell className="whitespace-nowrap font-mono text-[11px]">{l.studentId ? `→ ${students.find((x) => x.id === l.studentId)?.name ?? l.studentId}` : l.allocationId ?? "-"}</TableCell>
            <TableCell className="max-w-32 truncate font-mono text-[10px] text-muted-foreground">{l.idempotencyKey}</TableCell>
            <TableCell className="max-w-48 truncate text-muted-foreground" title={l.reason}>{l.reason}</TableCell>
          </motion.tr>
        ))}
      </TableBody>
    </Table>
  )
}
