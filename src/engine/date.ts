export const DAY_MS = 86400000
export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export function iso(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}
export function todayISO() {
  return iso(new Date())
}
export function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00")
  d.setDate(d.getDate() + n)
  return iso(d)
}
export function diffDays(a: string, b: string) {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / DAY_MS)
}
export function at(isoDate: string, hh: number, mm = 0) {
  return `${isoDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`
}
export function nowISO() {
  const d = new Date()
  return `${iso(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}
const WEEK = ["日", "一", "二", "三", "四", "五", "六"]
export function fmtMD(isoDate: string) {
  const d = new Date(isoDate.slice(0, 10) + "T00:00:00")
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
export function weekday(isoDate: string) {
  return "周" + WEEK[new Date(isoDate.slice(0, 10) + "T00:00:00").getDay()]
}
export function fmtTime(isoDT: string) {
  return isoDT.slice(11, 16)
}
let counter = 0
export function uid(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`
}
