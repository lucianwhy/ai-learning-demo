import type { InventoryLedger, PackageType } from "@/data/types"

export const PKG_NAME: Record<PackageType, string> = { month: "月卡", quarter: "季卡", year: "年卡" }
export const PKG_LIST: PackageType[] = ["month", "quarter", "year"]

export function availableOf(ledger: InventoryLedger[], orgId: string, pkg: PackageType) {
  for (let i = ledger.length - 1; i >= 0; i--) {
    const l = ledger[i]
    if (l.orgId === orgId && l.packageType === pkg) return l.after
  }
  return 0
}

export interface InvStat {
  allocated: number
  assigned: number
  frozen: number
  recovered: number
  returned: number
  available: number
}

/** 库存守恒：可用 = 累计拨付 + 返还 − 已分配 − 冻结 − 回收/扣减（由台账计算，非前端数字） */
export function inventoryOf(ledger: InventoryLedger[], orgId: string, pkg: PackageType): InvStat {
  const s: InvStat = { allocated: 0, assigned: 0, frozen: 0, recovered: 0, returned: 0, available: 0 }
  for (const l of ledger) {
    if (l.orgId !== orgId || l.packageType !== pkg) continue
    if (l.op === "总部拨付" || l.op === "总部追加") s.allocated += l.change
    else if (l.op === "分配给学生") s.assigned -= l.change
    else if (l.op === "冻结") s.frozen -= l.change
    else if (l.op === "解冻") s.frozen -= l.change
    else if (l.op === "回收" || l.op === "扣减") s.recovered -= l.change
    else if (l.op === "权益作废返还") s.returned += l.change
  }
  s.available = s.allocated + s.returned - s.assigned - s.frozen - s.recovered
  return s
}

let tx = 1000
export function nextTx() {
  tx += 1
  return `TX${Date.now().toString().slice(-8)}${tx}`
}

export function makeLedger(
  ledger: InventoryLedger[],
  e: Omit<InventoryLedger, "before" | "after" | "transactionId"> & { transactionId?: string },
): InventoryLedger {
  const before = availableOf(ledger, e.orgId, e.packageType)
  return { ...e, transactionId: e.transactionId ?? nextTx(), before, after: before + e.change }
}
