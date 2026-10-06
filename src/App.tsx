import { useEffect } from "react"
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/app/AppShell"
import type { Role } from "@/data/types"
import { useStore } from "@/store/useStore"
import Landing from "@/pages/Landing"
import Gate from "@/pages/student/Gate"
import Home from "@/pages/student/Home"
import Diagnosis from "@/pages/student/Diagnosis"
import Plan from "@/pages/student/Plan"
import Today from "@/pages/student/Today"
import ErrorBook from "@/pages/student/ErrorBook"
import Report from "@/pages/student/Report"
import Worksheets from "@/pages/student/Worksheets"
import Records from "@/pages/student/Records"
import Settings from "@/pages/student/Settings"
import { TeacherManual, TeacherRisk } from "@/pages/teacher/Teacher"
import { PAssign, PInventory, PLearning, POverview, PRecords, PStudents } from "@/pages/principal/Principal"
import { AOverview, AOrgs, APackages, AInventory, ALedger } from "@/pages/admin/AdminOps"
import { AAI, AStrategy, AFlags, AContent, AJobs, AAudit } from "@/pages/admin/AdminEngine"

const PREFIX: Record<string, Role> = { s: "student", t: "teacher", p: "principal", a: "admin" }

function RouteSync() {
  const loc = useLocation()
  useEffect(() => {
    const seg = loc.pathname.split("/")[1]
    const role = PREFIX[seg]
    const S = useStore.getState()
    if (role && S.role !== role) S.setRole(role)
    if (role) S.markVisited(`${role}:${loc.pathname}`)
    window.scrollTo({ top: 0 })
  }, [loc.pathname])
  return null
}

function Shelled() {
  return (
    <AppShell>
      <Routes>
        <Route path="/s/gate" element={<Gate />} />
        <Route path="/s/home" element={<Home />} />
        <Route path="/s/diagnosis" element={<Diagnosis />} />
        <Route path="/s/plan" element={<Plan />} />
        <Route path="/s/today" element={<Today />} />
        <Route path="/s/worksheets" element={<Worksheets />} />
        <Route path="/s/errors" element={<ErrorBook />} />
        <Route path="/s/records" element={<Records />} />
        <Route path="/s/report" element={<Report />} />
        <Route path="/s/settings" element={<Settings />} />
        <Route path="/t/risk" element={<TeacherRisk />} />
        <Route path="/t/manual" element={<TeacherManual />} />
        <Route path="/p/overview" element={<POverview />} />
        <Route path="/p/students" element={<PStudents />} />
        <Route path="/p/inventory" element={<PInventory />} />
        <Route path="/p/assign" element={<PAssign />} />
        <Route path="/p/records" element={<PRecords />} />
        <Route path="/p/learning" element={<PLearning />} />
        <Route path="/a/overview" element={<AOverview />} />
        <Route path="/a/orgs" element={<AOrgs />} />
        <Route path="/a/packages" element={<APackages />} />
        <Route path="/a/inventory" element={<AInventory />} />
        <Route path="/a/ledger" element={<ALedger />} />
        <Route path="/a/strategy" element={<AStrategy />} />
        <Route path="/a/ai" element={<AAI />} />
        <Route path="/a/flags" element={<AFlags />} />
        <Route path="/a/content" element={<AContent />} />
        <Route path="/a/jobs" element={<AJobs />} />
        <Route path="/a/audit" element={<AAudit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <TooltipProvider>
      <HashRouter>
        <RouteSync />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/*" element={<Shelled />} />
        </Routes>
      </HashRouter>
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  )
}
