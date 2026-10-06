import type { KnowledgePoint, MasteryStatus, SubjectId, TaskType } from "./types"

const r = String.raw

export const SUBJECTS: Record<SubjectId, { id: SubjectId; name: string; short: string; grade: string; chapter: string; color: string; tagline: string }> = {
  math: { id: "math", name: "数学", short: "数", grade: "初三", chapter: "二次函数", color: "var(--math)", tagline: "步骤推理 · 公式方法 · 变式训练" },
  physics: { id: "physics", name: "物理", short: "物", grade: "初二/初三", chapter: "浮力 · 欧姆定律", color: "var(--physics)", tagline: "实验情境 · 单位换算 · 图像分析" },
  chemistry: { id: "chemistry", name: "化学", short: "化", grade: "初三", chapter: "质量守恒 · 化学方程式", color: "var(--chem)", tagline: "方程式 · 实验现象 · 装置识别" },
}

export const SUBJECT_LIST: SubjectId[] = ["math", "physics", "chemistry"]

export const MASTERY_META: Record<MasteryStatus, { label: string; color: string; desc: string; order: number }> = {
  undiagnosed: { label: "未诊断", color: "var(--st-undiagnosed)", desc: "尚无学习证据", order: 0 },
  weak: { label: "薄弱", color: "var(--st-weak)", desc: "诊断或作答证据显示未掌握", order: 1 },
  learning: { label: "学习中", color: "var(--st-learning)", desc: "已进入知识学习与练习", order: 2 },
  pending: { label: "待验证", color: "var(--st-pending)", desc: "订正完成，需变式题独立验证", order: 3 },
  mastered: { label: "已掌握", color: "var(--st-mastered)", desc: "通过独立验证 / 阶段检测", order: 5 },
  review: { label: "需复习", color: "var(--st-review)", desc: "按遗忘曲线到期复习", order: 4 },
}
export const MASTERY_ORDER: MasteryStatus[] = ["undiagnosed", "weak", "learning", "pending", "mastered", "review"]

export const TASK_META: Record<TaskType, { label: string; color: string }> = {
  learn: { label: "知识学习", color: "var(--chart-5)" },
  practice: { label: "练习", color: "var(--chart-1)" },
  correction: { label: "订正", color: "var(--st-weak)" },
  variant: { label: "变式验证", color: "var(--st-pending)" },
  stage: { label: "阶段检测", color: "var(--chart-4)" },
  worksheet: { label: "纸质学案", color: "var(--chart-3)" },
  review: { label: "延迟复习", color: "var(--st-review)" },
  remediate: { label: "补弱", color: "var(--st-weak)" },
}

export const KNOWLEDGE: KnowledgePoint[] = [
  // ───────── 数学 · 初三 · 人教版 · 二次函数 ─────────
  {
    id: "m1", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "21 一元二次方程", name: "一元二次方程的解法",
    prerequisites: [], summary: "配方法、公式法、因式分解法是解一元二次方程的三种基本方法。",
    formulas: [r`x=\dfrac{-b\pm\sqrt{b^2-4ac}}{2a}`],
    extra: { steps: ["化为一般式 ax²+bx+c=0", "判断能否因式分解", "否则用公式法，先算 Δ"] },
  },
  {
    id: "m2", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "21 一元二次方程", name: "根的判别式",
    prerequisites: ["m1"], summary: "Δ=b²−4ac 决定一元二次方程实数根的个数；注意二次项系数 a≠0 的隐含条件。",
    formulas: [r`\Delta=b^2-4ac`, r`\Delta>0 \Leftrightarrow \text{两个不等实根}`, r`\Delta=0 \Leftrightarrow \text{两个相等实根}`, r`\Delta<0 \Leftrightarrow \text{无实根}`],
    extra: { steps: ["确认是一元二次方程：a ≠ 0", "写出 a、b、c（含符号）", "按题意列 Δ 的不等式", "取交集，别漏 a ≠ 0"], pitfalls: ["忽略二次项系数不为 0", "“有实数根”应取 Δ ≥ 0"] },
  },
  {
    id: "m3", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "21 一元二次方程", name: "根与系数的关系",
    prerequisites: ["m1"], summary: "韦达定理：两根之和与两根之积可直接由系数表示。",
    formulas: [r`x_1+x_2=-\dfrac{b}{a}`, r`x_1x_2=\dfrac{c}{a}`, r`x_1^2+x_2^2=(x_1+x_2)^2-2x_1x_2`],
    extra: { steps: ["先确认 Δ ≥ 0", "写出两根和与积", "把目标式变形为和与积的组合"] },
  },
  {
    id: "m4", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "二次函数的概念",
    prerequisites: [], summary: "形如 y=ax²+bx+c（a≠0）的函数叫二次函数。",
    formulas: [r`y=ax^2+bx+c\ (a\neq0)`],
  },
  {
    id: "m5", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "y=ax² 的图像与性质",
    prerequisites: ["m4"], summary: "a 决定开口方向与大小，顶点在原点，对称轴为 y 轴。",
    formulas: [r`a>0\ \text{开口向上},\ a<0\ \text{开口向下}`],
  },
  {
    id: "m6", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "顶点式与图像平移",
    prerequisites: ["m5"], summary: "y=a(x−h)²+k 的顶点为 (h,k)；“左加右减，上加下减”。",
    formulas: [r`y=a(x-h)^2+k`, r`\text{顶点}(h,k)`],
    extra: { steps: ["把解析式化为顶点式", "读出 h、k（注意 h 的符号）", "按平移规律写新解析式"] },
  },
  {
    id: "m7", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "y=ax²+bx+c 的图像与性质",
    prerequisites: ["m6"], summary: "通过配方或公式求对称轴与顶点，判断增减性与最值。",
    formulas: [r`x=-\dfrac{b}{2a}`, r`\left(-\dfrac{b}{2a},\ \dfrac{4ac-b^2}{4a}\right)`],
    extra: { steps: ["求对称轴 x = −b/2a", "代入求顶点纵坐标", "结合 a 的符号判断最值与增减性"] },
  },
  {
    id: "m8", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "二次函数与一元二次方程",
    prerequisites: ["m7", "m2"], summary: "抛物线与 x 轴交点的横坐标就是对应方程的根，交点个数由 Δ 决定。",
    formulas: [r`ax^2+bx+c=0 \Leftrightarrow y=0`],
  },
  {
    id: "m9", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "二次函数的实际应用（最值）",
    prerequisites: ["m7"], summary: "建立利润/面积等二次函数模型，利用顶点求最值，注意自变量取值范围。",
    formulas: [r`W=(x-\text{进价})\cdot\text{销量}`],
  },
  {
    id: "m10", subject: "math", grade: "初三", textbook: "人教版九年级上", chapter: "22 二次函数", name: "待定系数法求解析式",
    prerequisites: ["m6"], summary: "根据已知条件选择一般式、顶点式或交点式求解析式。",
    formulas: [r`y=a(x-x_1)(x-x_2)`],
  },

  // ───────── 物理 · 初二 浮力 / 初三 欧姆定律 ─────────
  {
    id: "p1", subject: "physics", grade: "初二", textbook: "人教版八年级下", chapter: "9 压强", name: "压强",
    prerequisites: [], summary: "压强表示压力的作用效果。", formulas: [r`p=\dfrac{F}{S}`],
    extra: { units: ["Pa = N/m²", "1 cm² = 10⁻⁴ m²"] },
  },
  {
    id: "p2", subject: "physics", grade: "初二", textbook: "人教版八年级下", chapter: "9 压强", name: "液体压强",
    prerequisites: ["p1"], summary: "液体压强只与液体密度和深度有关。", formulas: [r`p=\rho g h`],
    extra: { units: ["ρ：kg/m³", "h：m（深度，从液面向下量）"], experiment: "U 形管压强计探究液体内部压强" },
  },
  {
    id: "p3", subject: "physics", grade: "初二", textbook: "人教版八年级下", chapter: "10 浮力", name: "浮力与称重法",
    prerequisites: ["p2"], summary: "浮力来源于上下表面压力差；称重法 F浮 = G − F示。", formulas: [r`F_{\text{浮}}=G-F_{\text{示}}`],
    extra: { experiment: "弹簧测力计分别在空气中、水中称量同一物体", units: ["N"] },
  },
  {
    id: "p4", subject: "physics", grade: "初二", textbook: "人教版八年级下", chapter: "10 浮力", name: "阿基米德原理",
    prerequisites: ["p3"], summary: "浸在液体中的物体受到的浮力等于它排开液体所受的重力。",
    formulas: [r`F_{\text{浮}}=G_{\text{排}}=\rho_{\text{液}}\,g\,V_{\text{排}}`],
    extra: { units: ["ρ液：kg/m³", "V排：m³（1 cm³ = 10⁻⁶ m³）", "g = 10 N/kg"], experiment: "溢水杯 + 弹簧测力计验证 F浮 = G排", pitfalls: ["cm³ 未换算成 m³", "“浸没”时 V排 = V物，“漂浮”时 V排 < V物"] },
  },
  {
    id: "p5", subject: "physics", grade: "初二", textbook: "人教版八年级下", chapter: "10 浮力", name: "物体的浮沉条件",
    prerequisites: ["p4"], summary: "比较 F浮 与 G，或比较 ρ物 与 ρ液 判断浮沉。",
    formulas: [r`\rho_{\text{物}}<\rho_{\text{液}}\Rightarrow\text{上浮/漂浮}`, r`\text{漂浮}:\ F_{\text{浮}}=G`],
    extra: { experiment: "盐水选种、潜水艇模型" },
  },
  {
    id: "p6", subject: "physics", grade: "初三", textbook: "人教版九年级", chapter: "16 电压 电阻", name: "电流、电压与电阻",
    prerequisites: [], summary: "电压是形成电流的原因，电阻是导体对电流的阻碍作用，与电压电流无关。", formulas: [r`1\,\text{k}\Omega=10^3\,\Omega`],
    extra: { units: ["I：A", "U：V", "R：Ω"] },
  },
  {
    id: "p7", subject: "physics", grade: "初三", textbook: "人教版九年级", chapter: "17 欧姆定律", name: "欧姆定律",
    prerequisites: ["p6"], summary: "导体中的电流与两端电压成正比，与电阻成反比。", formulas: [r`I=\dfrac{U}{R}`],
    extra: { experiment: "控制变量法探究 I 与 U、R 的关系（I–U 图像为过原点直线）", units: ["同一导体、同一时刻"] },
  },
  {
    id: "p8", subject: "physics", grade: "初三", textbook: "人教版九年级", chapter: "17 欧姆定律", name: "串并联电路的电阻",
    prerequisites: ["p7"], summary: "串联总电阻等于各电阻之和；串联分压与电阻成正比。",
    formulas: [r`R_{\text{串}}=R_1+R_2`, r`\dfrac{1}{R_{\text{并}}}=\dfrac{1}{R_1}+\dfrac{1}{R_2}`],
  },
  {
    id: "p9", subject: "physics", grade: "初三", textbook: "人教版九年级", chapter: "17 欧姆定律", name: "伏安法测电阻",
    prerequisites: ["p7"], summary: "用电压表测 U、电流表测 I，由 R=U/I 求电阻；滑动变阻器用于多次测量求平均。",
    formulas: [r`R=\dfrac{U}{I}`], extra: { experiment: "电路连接：电流表串联、电压表并联，闭合开关前滑片置于阻值最大处" },
  },
  {
    id: "p10", subject: "physics", grade: "初三", textbook: "人教版九年级", chapter: "17 欧姆定律", name: "动态电路分析",
    prerequisites: ["p8"], summary: "滑片移动或开关通断引起电阻变化，按“局部→整体→局部”分析电表示数变化。",
    formulas: [r`R\uparrow\Rightarrow I\downarrow`],
  },

  // ───────── 化学 · 初三 ─────────
  {
    id: "c1", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "4 自然界的水", name: "化学式与化合价",
    prerequisites: [], summary: "化合物中正负化合价代数和为零。", formulas: [r`\ce{Fe2O3}:\ \overset{+3}{\ce{Fe}}\ \overset{-2}{\ce{O}}`],
  },
  {
    id: "c2", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "5 化学方程式", name: "质量守恒定律",
    prerequisites: [], summary: "参加反应的各物质质量总和等于生成的各物质质量总和；反应前后原子种类、数目、质量不变。",
    formulas: [r`m(\text{反应物})=m(\text{生成物})`],
    extra: { experiment: "红磷燃烧前后质量测定（密闭锥形瓶 + 气球）", phenomenon: "红磷燃烧产生大量白烟，气球先胀大后变瘪，天平保持平衡" },
  },
  {
    id: "c3", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "5 化学方程式", name: "化学方程式的意义",
    prerequisites: ["c1", "c2"], summary: "表示反应物、生成物、反应条件及各物质的质量比与粒子个数比。",
    formulas: [r`\ce{2H2 + O2 ->[点燃] 2H2O}`],
  },
  {
    id: "c4", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "5 化学方程式", name: "化学方程式的配平",
    prerequisites: ["c3"], summary: "以原子守恒为依据：最小公倍数法、奇数配偶法、观察法（得失氧法）。",
    formulas: [r`\ce{Fe2O3 + 3CO ->[高温] 2Fe + 3CO2}`],
    extra: { steps: ["找出现次数最多 / 原子数最大的元素", "用最小公倍数确定系数", "最后配单质，检查每种原子"], pitfalls: ["改动化学式下标来“配平”", "忘记标注反应条件与 ↑ ↓"] },
  },
  {
    id: "c5", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "5 化学方程式", name: "利用化学方程式的计算",
    prerequisites: ["c4"], summary: "设、写、找、列、求、答；相对分子质量要乘化学计量数。",
    formulas: [r`\ce{2KMnO4 ->[\Delta] K2MnO4 + MnO2 + O2 ^}`],
  },
  {
    id: "c6", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "2 我们周围的空气", name: "氧气的实验室制取",
    prerequisites: ["c4"], summary: "加热高锰酸钾或分解过氧化氢制氧气；排水法或向上排空气法收集。",
    formulas: [r`\ce{2H2O2 ->[MnO2] 2H2O + O2 ^}`],
    extra: { apparatus: "固固加热型：试管口略向下倾斜、管口塞棉花", phenomenon: "带火星的木条复燃", experiment: "先撤导管、后熄灭酒精灯" },
  },
  {
    id: "c7", subject: "chemistry", grade: "初三", textbook: "人教版九年级上", chapter: "6 碳和碳的氧化物", name: "二氧化碳的制取与性质",
    prerequisites: ["c4"], summary: "大理石与稀盐酸反应制 CO₂；CO₂ 使澄清石灰水变浑浊。",
    formulas: [r`\ce{CaCO3 + 2HCl -> CaCl2 + H2O + CO2 ^}`],
    extra: { apparatus: "固液常温型，向上排空气法收集", phenomenon: "澄清石灰水变浑浊" },
  },
]

export const KP: Record<string, KnowledgePoint> = Object.fromEntries(KNOWLEDGE.map((k) => [k.id, k]))
export const kpOf = (subject: SubjectId) => KNOWLEDGE.filter((k) => k.subject === subject)
/** 直接后继（以该知识点为前置的知识点） */
export const successorsOf = (id: string) => KNOWLEDGE.filter((k) => k.prerequisites.includes(id))
