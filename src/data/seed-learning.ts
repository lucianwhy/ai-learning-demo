import { addDays, at, todayISO } from "@/engine/date"
import { replay } from "@/engine/mastery"
import { generatePlan } from "@/engine/plan"
import { KNOWLEDGE, KP } from "./knowledge"
import { Q } from "./questions"
import type {
  Attempt, DiagnosticScope, ErrorRecord, LearningState, LearningTask, MasteryEvidence, MasteryStatus, RemediationEvent, StudySession, Worksheet,
} from "./types"

export const DEMO_STUDENT_ID = "stu-lxz"

export const TEXTBOOKS = ["人教版", "北师大版", "苏科版", "沪教版"]
export const CHAPTERS = {
  math: ["21 一元二次方程", "22 二次函数", "23 旋转", "24 圆"],
  physics: ["9 压强", "10 浮力", "16 电压 电阻", "17 欧姆定律", "18 电功率"],
  chemistry: ["2 我们周围的空气", "4 自然界的水", "5 化学方程式", "6 碳和碳的氧化物"],
}

export function scopeFrom(textbook: DiagnosticScope["textbook"], currentChapter: DiagnosticScope["currentChapter"], at: string): DiagnosticScope {
  const num = (c: string) => parseInt(c, 10)
  const covered: string[] = []
  const notLearned: string[] = []
  for (const k of KNOWLEDGE) {
    if (num(k.chapter) <= num(currentChapter[k.subject])) covered.push(k.id)
    else notLearned.push(k.id)
  }
  return { version: "scope-rule@v1.4.2", textbook, currentChapter, coveredKps: covered, notLearnedKps: notLearned, confirmedAt: at }
}

let n = 0
const id = (p: string) => `${p}-s${++n}`

export function emptyLearning(studentId: string): LearningState {
  return {
    studentId, diagnosed: false, dailyBudgetMin: 45, mastery: replay([]), evidence: [], attempts: [], errors: [], remediations: [],
    plan: null, tasks: [], worksheets: [], sessions: [], streak: 0, feedback: [],
  }
}

/** 构建演示学生「林小舟」：已进行到 30 天计划第 9 天 */
export function buildDemoLearning(): LearningState {
  const today = todayISO()
  const start = addDays(today, -8)
  const D = (d: number) => addDays(start, d - 1)
  const scope = scopeFrom(
    { math: "人教版", physics: "人教版", chemistry: "人教版" },
    { math: "22 二次函数", physics: "17 欧姆定律", chemistry: "5 化学方程式" },
    at(D(1), 19, 2),
  )
  const evidence: MasteryEvidence[] = []
  const ev = (day: number, hh: number, kid: string, type: MasteryEvidence["type"], from: MasteryStatus, to: MasteryStatus, delta: number, note: string, counts = true) =>
    evidence.push({ id: id("ev"), knowledgeId: kid, subject: KP[kid].subject, type, from, to, scoreDelta: delta, note, at: at(D(day), hh, (evidence.length * 7) % 60), countsForMastery: counts })

  // Day1 诊断（知识点层面结果）
  const diag: [string, MasteryStatus, number, string][] = [
    ["m1", "mastered", 85, "前置推断：判别式题目中公式法步骤正确"], ["m2", "weak", 35, "诊断题 qm2a 错选 C：混淆 Δ>0 与 Δ≥0"], ["m3", "learning", 55, "关联推断"],
    ["m4", "mastered", 90, "概念题正确"], ["m5", "mastered", 82, "图像判断正确"], ["m6", "weak", 42, "顶点式符号错误"], ["m7", "weak", 40, "诊断题 qm7a 错选 B：对称轴符号错误"],
    ["p1", "mastered", 88, "压强公式应用正确"], ["p2", "learning", 60, "液体压强部分正确"], ["p3", "weak", 45, "称重法步骤缺失"], ["p4", "weak", 30, "诊断题 qp4a 错选 D：cm³ 未换算"],
    ["p6", "mastered", 86, "概念正确"], ["p7", "mastered", 80, "诊断题 qp7a 正确"], ["p8", "learning", 55, "串联规律部分正确"],
    ["c1", "mastered", 84, "化合价正确"], ["c2", "mastered", 80, "诊断题 qc2a 正确"], ["c3", "learning", 58, "意义理解部分正确"], ["c4", "weak", 32, "诊断题 qc4a 错选 D：O 原子未守恒"], ["c6", "learning", 52, "装置题部分正确"],
  ]
  for (const [kid, st, sc, note] of diag) ev(1, 19, kid, "诊断", "undiagnosed", st, sc, note)

  ev(2, 19, "m6", "知识学习", "weak", "learning", 8, "完成知识卡「顶点式与平移」")
  ev(2, 20, "p3", "知识学习", "weak", "learning", 8, "完成知识卡「浮力与称重法」")
  ev(2, 20, "c4", "知识学习", "weak", "learning", 8, "完成知识卡「化学方程式的配平」")
  ev(3, 19, "m6", "作答", "learning", "pending", 12, "专项练习 3/3 正确，待变式验证")
  ev(3, 19, "p3", "作答", "learning", "pending", 10, "专项练习 2/2 正确，待变式验证")
  ev(3, 20, "c4", "作答", "learning", "weak", -8, "配平练习 qc4a 再次错误，进入订正")
  ev(4, 19, "m6", "变式验证", "pending", "mastered", 15, "变式题 qm6a 独立作答正确")
  ev(4, 19, "p3", "变式验证", "pending", "mastered", 14, "变式题 qp3a 独立作答正确")
  ev(4, 20, "c6", "作答", "learning", "weak", -6, "qc6a 错选 C：混淆管口倾斜与塞棉花的作用")
  ev(4, 20, "c6", "订正", "weak", "pending", 0, "错因：审题不清；订正不直接判定掌握", false)
  ev(4, 21, "m6", "纸质学案", "mastered", "mastered", 3, "学案「顶点式与平移」拍照批改 3/3")
  ev(5, 19, "c4", "订正", "weak", "pending", 0, "错因：改动化学式下标来配平（概念不清）", false)
  ev(5, 19, "c6", "变式验证", "pending", "mastered", 14, "变式题 qc6b 独立作答正确")
  ev(5, 20, "m7", "知识学习", "weak", "learning", 8, "完成知识卡「y=ax²+bx+c 的图像与性质」")
  ev(5, 20, "p2", "作答", "learning", "pending", 9, "液体压强练习 2/2 正确")
  ev(5, 21, "c4", "纸质学案", "pending", "pending", -2, "配平专项学案批改 2/3")
  ev(6, 19, "c4", "变式验证", "pending", "weak", -8, "变式题 qc4c 错误（第 2 次失败）→ 降难 + 回退前置「化学方程式的意义」")
  ev(6, 20, "m7", "作答", "learning", "learning", -4, "qm7b 计算失误")
  ev(6, 20, "m7", "订正", "learning", "pending", 0, "错因：计算失误，重算顶点纵坐标", false)
  ev(6, 21, "p8", "知识学习", "learning", "learning", 4, "完成知识卡「串并联电路的电阻」")
  ev(4, 21, "p7", "延迟复习", "mastered", "mastered", 2, "延迟复习（间隔 3 天）：独立作答正确，保持已掌握")
  ev(4, 21, "c2", "延迟复习", "mastered", "mastered", 2, "延迟复习（间隔 3 天）：保持已掌握")
  ev(5, 21, "p1", "延迟复习", "mastered", "mastered", 2, "延迟复习（间隔 3 天）：保持已掌握")
  ev(6, 21, "m4", "延迟复习", "mastered", "mastered", 2, "延迟复习（间隔 3 天）：保持已掌握")
  ev(6, 21, "c1", "延迟复习", "mastered", "review", -10, "延迟复习（间隔 3 天）：化合价判断错误 → 状态回退为需复习")
  ev(7, 19, "m6", "阶段检测", "mastered", "mastered", 5, "阶段检测①：保持已掌握")
  ev(7, 19, "p3", "阶段检测", "mastered", "mastered", 4, "阶段检测①：保持已掌握")
  ev(7, 19, "c3", "阶段检测", "learning", "mastered", 16, "阶段检测①：全对，判定掌握")
  ev(7, 19, "p2", "阶段检测", "pending", "mastered", 10, "阶段检测①：独立作答正确")
  ev(7, 20, "p8", "阶段检测", "learning", "weak", -10, "阶段检测①：串联分压计算错误（qp8a）")
  ev(8, 19, "m7", "变式验证", "pending", "mastered", 14, "变式题 qm7a 独立作答正确")
  ev(8, 19, "p4", "知识学习", "weak", "learning", 8, "完成知识卡「阿基米德原理」")
  ev(8, 20, "p4", "作答", "learning", "weak", -6, "qp4a 错选 D：体积单位未换算")
  ev(8, 20, "c3", "补弱", "mastered", "mastered", 2, "回退前置复学「化学方程式的意义」")
  ev(8, 20, "c4", "补弱", "weak", "learning", 6, "降难练习 2/2 正确")
  ev(8, 21, "c4", "订正", "learning", "pending", 0, "第二次订正：用最小公倍数法重配", false)
  ev(8, 21, "m3", "作答", "learning", "pending", 10, "韦达定理练习正确，待变式验证")
  ev(9, 8, "m2", "知识学习", "weak", "learning", 8, "完成知识卡「根的判别式」")

  const mastery = replay(evidence)
  mastery["c7"] = { ...mastery["c7"], notLearned: true }
  const d1Mastery = replay(evidence, D(1))
  d1Mastery["c7"] = { ...d1Mastery["c7"], notLearned: true }
  const d7Mastery = replay(evidence, D(7))

  const v1 = generatePlan({
    mastery: d1Mastery, startDate: start, version: 1, trigger: "首次诊断", createdAt: at(D(1), 19, 12), budgetMin: 45, notLearned: scope.notLearnedKps,
    summary: "依据首次诊断：数学 3 个、物理 2 个、化学 1 个薄弱知识点，按前置关系排序生成",
  })
  const v2 = generatePlan({
    mastery: d7Mastery, startDate: start, version: 2, trigger: "阶段检测①完成", createdAt: at(D(7), 20, 35), fromDay: 8, prev: v1, budgetMin: 45,
    summary: "阶段检测①：「化学方程式的意义」「液体压强」判定掌握；「串并联电路的电阻」检测失败转为薄弱，插入补弱并重排第 8–30 天",
    pinned: {
      9: [
        { subject: "math", knowledgeId: "m2", type: "learn" },
        { subject: "math", knowledgeId: "m2", type: "practice" },
        { subject: "physics", knowledgeId: "p4", type: "stage" },
      ],
    },
  })

  const attempts: Attempt[] = []
  const att = (day: number, hh: number, qid: string, kid: string, answer: string, correct: boolean, mode: Attempt["mode"], sec: number) => {
    const a: Attempt = { id: id("att"), questionId: qid, knowledgeId: kid, subject: KP[kid].subject, answer, correct, durationSec: sec, at: at(D(day), hh, (attempts.length * 11) % 60), mode }
    attempts.push(a)
    return a.id
  }
  const diagAtt = [
    att(1, 19, "qm2a", "m2", "C", false, "诊断", 74), att(1, 19, "qm7a", "m7", "B", false, "诊断", 96), att(1, 19, "qp4a", "p4", "D", false, "诊断", 88),
    att(1, 19, "qp7a", "p7", "A", true, "诊断", 61), att(1, 19, "qc4a", "c4", "D", false, "诊断", 102), att(1, 19, "qc2a", "c2", "C", true, "诊断", 45),
  ]
  const a_c4_1 = att(3, 20, "qc4a", "c4", "D", false, "练习", 80)
  const a_c4_v = att(6, 19, "qc4c", "c4", "B", false, "变式验证", 95)
  const a_m7 = att(6, 20, "qm7b", "m7", "D", false, "练习", 70)
  const a_m7_v = att(8, 19, "qm7a", "m7", "A", true, "变式验证", 58)
  const a_p8 = att(7, 20, "qp8a", "p8", "B", false, "阶段检测", 66)
  const a_p4 = att(8, 20, "qp4a", "p4", "D", false, "练习", 83)
  const a_c6 = att(4, 20, "qc6a", "c6", "C", false, "练习", 40)
  const a_c6_v = att(5, 19, "qc6b", "c6", "A", true, "变式验证", 35)
  att(3, 19, "qm6a", "m6", "A", true, "练习", 50)
  att(4, 19, "qp3a", "p3", "A", true, "变式验证", 42)
  att(8, 21, "qm3a", "m3", "B", true, "练习", 90)
  att(7, 19, "qm6a", "m6", Q["qm6a"].answer, true, "阶段检测", 55)
  att(7, 19, "qp3a", "p3", Q["qp3a"].answer, true, "阶段检测", 61)
  att(7, 19, "qc2b", "c2", Q["qc2b"].answer, true, "阶段检测", 48)

  const errors: ErrorRecord[] = [
    { id: "err-p4", questionId: "qp4a", knowledgeId: "p4", subject: "physics", attemptIds: [diagAtt[2], a_p4], corrections: [], verifications: [], status: "待订正", risk: false, createdAt: at(D(8), 20, 30) },
    {
      id: "err-c4", questionId: "qc4a", knowledgeId: "c4", subject: "chemistry", attemptIds: [diagAtt[4], a_c4_1], errorType: "概念不清",
      corrections: [
        { at: at(D(5), 19, 10), errorType: "概念不清", note: "配平时把 CO₂ 写成 CO₃ 来凑 O 原子——不能改下标，只能改系数", answer: "A" },
        { at: at(D(8), 21, 5), errorType: "概念不清", note: "回退学习「化学方程式的意义」后，用得失氧法重新配平", answer: "A" },
      ],
      verifications: [{ id: "vv-c4-1", questionId: "qc4c", answer: "B", correct: false, at: at(D(6), 19, 30) }],
      status: "待验证", risk: false, createdAt: at(D(3), 20, 20),
    },
    {
      id: "err-m7", questionId: "qm7b", knowledgeId: "m7", subject: "math", attemptIds: [a_m7], errorType: "计算失误",
      corrections: [{ at: at(D(6), 20, 40), errorType: "计算失误", note: "代入 x=3：−9+18−4=5，之前把 −x² 算成 +9", answer: "A" }],
      verifications: [{ id: "vv-m7-1", questionId: "qm7a", answer: "A", correct: true, at: at(D(8), 19, 20) }],
      status: "已验证", risk: false, createdAt: at(D(6), 20, 20),
    },
    { id: "err-p8", questionId: "qp8a", knowledgeId: "p8", subject: "physics", attemptIds: [a_p8], corrections: [], verifications: [], status: "待订正", risk: false, createdAt: at(D(7), 20, 15) },
    {
      id: "err-c6", questionId: "qc6a", knowledgeId: "c6", subject: "chemistry", attemptIds: [a_c6], errorType: "审题不清",
      corrections: [{ at: at(D(4), 20, 50), errorType: "审题不清", note: "管口向下是防冷凝水回流；塞棉花才是防粉末进入导管", answer: "A" }],
      verifications: [{ id: "vv-c6-1", questionId: "qc6b", answer: "A", correct: true, at: at(D(5), 19, 40) }],
      status: "已验证", risk: false, createdAt: at(D(4), 20, 30),
    },
  ]
  void a_c4_v; void a_m7_v; void a_c6_v

  const remediations: RemediationEvent[] = [
    { id: id("rem"), knowledgeId: "c4", subject: "chemistry", level: 1, trigger: "首次错误（qc4a）", action: "错因识别 → 知识卡回看 → 订正", strategyVersion: "chem-junior@v1.2", at: at(D(3), 20, 25) },
    { id: id("rem"), knowledgeId: "c4", subject: "chemistry", level: 2, trigger: "变式验证失败（第 2 次）", action: "降难 2→1 + 回退前置「化学方程式的意义」再学习", strategyVersion: "chem-junior@v1.2", at: at(D(6), 19, 35) },
    { id: id("rem"), knowledgeId: "p4", subject: "physics", level: 1, trigger: "首次错误（qp4a 单位换算）", action: "错因识别 → 单位换算知识回看 → 订正", strategyVersion: "phy-junior@v1.1", at: at(D(8), 20, 35) },
  ]

  const T = (t: Partial<LearningTask> & Pick<LearningTask, "id" | "type" | "subject" | "knowledgeId" | "title" | "priority" | "source" | "minutes" | "completionRule">): LearningTask => ({
    date: today, dependsOn: [], status: "todo", ...t,
  })
  const tasks: LearningTask[] = [
    T({ id: "t1", type: "learn", subject: "math", knowledgeId: "m2", title: "知识卡 · 根的判别式", priority: "P0", source: "计划", minutes: 12, completionRule: "阅读知识卡并完成要点自检", status: "done", planItemId: "v2-d9-m2-learn", result: { at: at(today, 8, 32), summary: "已完成知识卡学习", nextAction: "进入专项练习" } }),
    T({ id: "t2", type: "practice", subject: "math", knowledgeId: "m2", title: "专项练习 · 根的判别式", priority: "P0", source: "计划", minutes: 15, completionRule: "独立作答；错题须订正并通过变式验证", dependsOn: ["t1"], questionId: "qm2c", planItemId: "v2-d9-m2-practice" }),
    T({ id: "t3", type: "correction", subject: "physics", knowledgeId: "p4", title: "错题订正 · 阿基米德原理", priority: "P0", source: "错题订正", minutes: 10, completionRule: "选择错因 + 订正 + 变式独立验证", questionId: "qp4a", errorId: "err-p4" }),
    T({ id: "t4", type: "variant", subject: "chemistry", knowledgeId: "c4", title: "变式验证 · 化学方程式的配平", priority: "P1", source: "错题订正", minutes: 8, completionRule: "不同题目独立作答正确", questionId: "qc4b", errorId: "err-c4" }),
    T({ id: "t5", type: "review", subject: "physics", knowledgeId: "p7", title: "延迟复习 · 欧姆定律", priority: "P1", source: "复习", minutes: 8, completionRule: "已掌握后第 7 天独立验证；失败则状态回退", questionId: "qp7b" }),
    T({ id: "t6", type: "stage", subject: "physics", knowledgeId: "p4", title: "阶段检测 · 浮力", priority: "P1", source: "阶段检测", minutes: 20, completionRule: "3 题全部独立作答，高权重证据", dependsOn: ["t3"], planItemId: "v2-d9-p4-stage" }),
    T({ id: "t7", type: "worksheet", subject: "math", knowledgeId: "m7", title: "纸质学案 · 二次函数图像与性质", priority: "P2", source: "计划", minutes: 20, completionRule: "打印作答 → 拍照上传 → 批改回写证据" }),
  ]

  const worksheets: Worksheet[] = [
    { id: "ws-1", title: "二次函数图像与性质 · 学案", subject: "math", knowledgeIds: ["m6", "m7"], questionIds: ["qm6a", "qm7a", "qm7b"], taskId: "t7", status: "待完成", createdAt: at(today, 7, 0) },
    { id: "ws-2", title: "浮力 · 称重法与阿基米德原理", subject: "physics", knowledgeIds: ["p3", "p4"], questionIds: ["qp3a", "qp4a", "qp4c"], status: "待回收", createdAt: at(D(8), 18, 0) },
    {
      id: "ws-3", title: "化学方程式配平专项", subject: "chemistry", knowledgeIds: ["c4"], questionIds: ["qc4a", "qc4b", "qc4c"], status: "已批改", createdAt: at(D(5), 7, 0), gradedAt: at(D(5), 21, 10), accuracy: 67,
      grading: [{ questionId: "qc4a", recognized: "A", result: "正确" }, { questionId: "qc4b", recognized: "A", result: "正确" }, { questionId: "qc4c", recognized: "B", result: "错误" }],
    },
    {
      id: "ws-4", title: "欧姆定律基础", subject: "physics", knowledgeIds: ["p7", "p8"], questionIds: ["qp7a", "qp7b", "qp8a"], status: "需订正", createdAt: at(D(7), 7, 0), gradedAt: at(D(7), 21, 30), accuracy: 50,
      grading: [{ questionId: "qp7a", recognized: "A", result: "正确" }, { questionId: "qp7b", recognized: "?", result: "待人工确认" }, { questionId: "qp8a", recognized: "B", result: "错误" }],
    },
    {
      id: "ws-5", title: "顶点式与图像平移", subject: "math", knowledgeIds: ["m6"], questionIds: ["qm6a", "qm7a"], status: "已批改", createdAt: at(D(4), 7, 0), gradedAt: at(D(4), 21, 0), accuracy: 100,
      grading: [{ questionId: "qm6a", recognized: "A", result: "正确" }, { questionId: "qm7a", recognized: "A", result: "正确" }],
    },
  ]

  // 学习时长（近 16 周）
  const sessions: StudySession[] = []
  let seed = 7
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const subs = ["math", "physics", "chemistry"] as const
  for (let i = 111; i >= 1; i--) {
    const d = addDays(today, -i)
    const p = i <= 8 ? 1 : i < 40 ? 0.72 : 0.5
    if (rand() > p) continue
    const k = 1 + Math.floor(rand() * 3)
    for (let j = 0; j < k; j++) {
      const s = subs[Math.floor(rand() * 3)]
      sessions.push({ id: id("ss"), date: d, minutes: 10 + Math.floor(rand() * 28), subject: s, title: s === "math" ? "二次函数专项" : s === "physics" ? "浮力 / 欧姆定律" : "化学方程式", kind: "practice" })
    }
  }
  sessions.push({ id: id("ss"), date: today, minutes: 12, subject: "math", title: "知识卡 · 根的判别式", kind: "learn" })

  return {
    studentId: DEMO_STUDENT_ID,
    diagnosed: true,
    diagnostic: {
      id: "diag-1", batch: `DX-${D(1).replaceAll("-", "")}-01`, at: at(D(1), 19, 10), totalSec: 466, scope,
      attempts: [
        { questionId: "qm2a", answer: "C", correct: false, durationSec: 74 }, { questionId: "qm7a", answer: "B", correct: false, durationSec: 96 },
        { questionId: "qp4a", answer: "D", correct: false, durationSec: 88 }, { questionId: "qp7a", answer: "A", correct: true, durationSec: 61 },
        { questionId: "qc4a", answer: "D", correct: false, durationSec: 102 }, { questionId: "qc2a", answer: "C", correct: true, durationSec: 45 },
      ],
    },
    scope,
    dailyBudgetMin: 60,
    mastery,
    evidence,
    attempts,
    errors,
    remediations,
    plan: { id: "plan-lxz-1", startDate: start, days: 30, goal: "期中考试前补齐二次函数、浮力、化学方程式薄弱点", dailyCapacityMin: 45, versions: [v1, v2], activeVersion: 2 },
    tasks,
    worksheets,
    sessions,
    streak: 12,
    feedback: [{ id: "fb-1", at: at(D(7), 21, 40), teacher: "王老师（物理）", text: "串联分压的比例关系再看一遍知识卡，系统已安排补弱，不用等我批改可以直接继续。", knowledgeId: "p8" }],
  }
}
