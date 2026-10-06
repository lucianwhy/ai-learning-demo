import type { Question } from "./types"

const r = String.raw

export const QUESTIONS: Question[] = [
  // ───── 数学 ─────
  {
    id: "qm2a", version: "v3", subject: "math", knowledgeId: "m2", type: "single", difficulty: 2, source: "人教版九上 习题21.2 改编",
    stem: r`关于 $x$ 的一元二次方程 $x^2-4x+k=0$ 有两个**不相等**的实数根，则 $k$ 的取值范围是`,
    options: [
      { key: "A", text: r`$k<4$` }, { key: "B", text: r`$k>4$` }, { key: "C", text: r`$k\le 4$` }, { key: "D", text: r`$k\ge 4$` },
    ],
    answer: "A",
    explanation: [
      r`题目条件「两个不相等的实数根」对应 $\Delta>0$（严格大于，不能取等号）。`,
      r`确定系数：$a=1,\ b=-4,\ c=k$。`,
      r`计算判别式：$\Delta=b^2-4ac=(-4)^2-4\cdot1\cdot k=16-4k$。`,
      r`列不等式 $16-4k>0$，解得 $k<4$，故选 A。`,
      r`易错提醒：若题目是「有实数根」，应取 $\Delta\ge0$，此时答案为 $k\le4$。`,
    ],
  },
  {
    id: "qm2b", version: "v2", subject: "math", knowledgeId: "m2", type: "single", difficulty: 3, source: "变式 · 含参二次项系数", variantOf: "qm2a",
    stem: r`若关于 $x$ 的一元二次方程 $kx^2-2x+1=0$ 有实数根，则 $k$ 的取值范围是`,
    options: [
      { key: "A", text: r`$k\le 1$` }, { key: "B", text: r`$k<1$` }, { key: "C", text: r`$k\le 1$ 且 $k\ne 0$` }, { key: "D", text: r`$k<1$ 且 $k\ne 0$` },
    ],
    answer: "C",
    explanation: [
      r`「一元二次方程」隐含条件：二次项系数 $k\ne0$。`,
      r`「有实数根」对应 $\Delta\ge0$：$\Delta=(-2)^2-4k=4-4k\ge0$，得 $k\le1$。`,
      r`两个条件取交集：$k\le1$ 且 $k\ne0$，故选 C。`,
    ],
  },
  {
    id: "qm2c", version: "v1", subject: "math", knowledgeId: "m2", type: "single", difficulty: 2, source: "变式 · 无实根", variantOf: "qm2a",
    stem: r`若关于 $x$ 的方程 $x^2+2x+m=0$ 没有实数根，则 $m$ 的取值范围是`,
    options: [
      { key: "A", text: r`$m>1$` }, { key: "B", text: r`$m<1$` }, { key: "C", text: r`$m\ge 1$` }, { key: "D", text: r`$m\le 1$` },
    ],
    answer: "A",
    explanation: [r`没有实数根 $\Leftrightarrow \Delta<0$。`, r`$\Delta=2^2-4m=4-4m<0$，解得 $m>1$，故选 A。`],
  },
  {
    id: "qm7a", version: "v2", subject: "math", knowledgeId: "m7", type: "single", difficulty: 2, source: "人教版九上 22.1.4 例题改编",
    stem: r`抛物线 $y=2x^2-8x+5$ 的顶点坐标是`,
    options: [
      { key: "A", text: r`$(2,\,-3)$` }, { key: "B", text: r`$(-2,\,-3)$` }, { key: "C", text: r`$(2,\,3)$` }, { key: "D", text: r`$(-2,\,29)$` },
    ],
    answer: "A",
    explanation: [
      r`对称轴 $x=-\dfrac{b}{2a}=-\dfrac{-8}{2\times2}=2$。`,
      r`把 $x=2$ 代入：$y=2\times4-16+5=-3$。`,
      r`也可配方：$y=2(x-2)^2-3$，顶点 $(2,-3)$，故选 A。`,
    ],
  },
  {
    id: "qm7b", version: "v1", subject: "math", knowledgeId: "m7", type: "single", difficulty: 3, source: "变式 · 最值", variantOf: "qm7a",
    stem: r`关于抛物线 $y=-x^2+6x-4$，下列说法正确的是`,
    options: [
      { key: "A", text: r`对称轴为 $x=3$，最大值为 $5$` }, { key: "B", text: r`对称轴为 $x=-3$，最大值为 $5$` },
      { key: "C", text: r`对称轴为 $x=3$，最小值为 $5$` }, { key: "D", text: r`对称轴为 $x=3$，最大值为 $-4$` },
    ],
    answer: "A",
    explanation: [r`$a=-1<0$，开口向下，有最大值。`, r`对称轴 $x=-\dfrac{6}{2\times(-1)}=3$。`, r`最大值 $y=-9+18-4=5$，故选 A。`],
  },
  {
    id: "qm6a", version: "v1", subject: "math", knowledgeId: "m6", type: "single", difficulty: 2, source: "人教版九上 22.1.3",
    stem: r`将抛物线 $y=x^2$ 先向左平移 $2$ 个单位，再向下平移 $3$ 个单位，得到的抛物线是`,
    options: [
      { key: "A", text: r`$y=(x+2)^2-3$` }, { key: "B", text: r`$y=(x-2)^2-3$` }, { key: "C", text: r`$y=(x+2)^2+3$` }, { key: "D", text: r`$y=(x-2)^2+3$` },
    ],
    answer: "A",
    explanation: [r`平移规律「左加右减（作用于 $x$），上加下减（作用于整体）」。`, r`向左 2：$y=(x+2)^2$；再向下 3：$y=(x+2)^2-3$。`],
  },
  {
    id: "qm3a", version: "v1", subject: "math", knowledgeId: "m3", type: "single", difficulty: 3, source: "人教版九上 21.2.4",
    stem: r`若 $x_1,x_2$ 是方程 $x^2-3x-1=0$ 的两个根，则 $x_1^2+x_2^2$ 的值为`,
    options: [{ key: "A", text: "$7$" }, { key: "B", text: "$11$" }, { key: "C", text: "$9$" }, { key: "D", text: "$10$" }],
    answer: "B",
    explanation: [r`由韦达定理：$x_1+x_2=3,\ x_1x_2=-1$。`, r`$x_1^2+x_2^2=(x_1+x_2)^2-2x_1x_2=9+2=11$。`],
  },
  {
    id: "qm9a", version: "v1", subject: "math", knowledgeId: "m9", type: "single", difficulty: 4, source: "中考真题改编",
    stem: r`某商品进价 $40$ 元/件，当售价为 $x$ 元时，每天可售出 $(100-x)$ 件。要使每天利润最大，售价及最大利润分别为`,
    options: [{ key: "A", text: "70 元，900 元" }, { key: "B", text: "60 元，800 元" }, { key: "C", text: "70 元，2100 元" }, { key: "D", text: "50 元，500 元" }],
    answer: "A",
    explanation: [r`利润 $W=(x-40)(100-x)=-x^2+140x-4000$。`, r`对称轴 $x=70$，此时 $W=30\times30=900$。`],
  },

  // ───── 物理 ─────
  {
    id: "qp4a", version: "v4", subject: "physics", knowledgeId: "p4", type: "single", difficulty: 2, source: "人教版八下 10.2 改编",
    context: { label: "实验情境", text: "用细线系住一个铁块，将其完全浸没在盛满水的溢水杯中，用小桶收集溢出的水。" },
    stem: r`已知铁块体积为 $200\ \text{cm}^3$，则它浸没在水中时受到的浮力为（$g=10\ \text{N/kg}$，$\rho_{\text{水}}=1.0\times10^3\ \text{kg/m}^3$）`,
    options: [{ key: "A", text: r`$2\ \text{N}$` }, { key: "B", text: r`$0.2\ \text{N}$` }, { key: "C", text: r`$20\ \text{N}$` }, { key: "D", text: r`$2\times10^6\ \text{N}$` }],
    answer: "A",
    explanation: [
      r`「浸没」说明 $V_{\text{排}}=V_{\text{物}}=200\ \text{cm}^3$。`,
      r`单位换算：$200\ \text{cm}^3=200\times10^{-6}\ \text{m}^3=2\times10^{-4}\ \text{m}^3$。`,
      r`由阿基米德原理：$F_{\text{浮}}=\rho_{\text{水}}gV_{\text{排}}=1.0\times10^3\times10\times2\times10^{-4}=2\ \text{N}$。`,
      r`易错：未换算单位会得到 $2\times10^6\ \text{N}$，明显不符合生活常识。`,
    ],
  },
  {
    id: "qp4b", version: "v2", subject: "physics", knowledgeId: "p4", type: "single", difficulty: 3, source: "变式 · 称重法求体积", variantOf: "qp4a",
    context: { label: "实验情境", text: "弹簧测力计下挂一金属块，在空气中示数为 5.4 N；将金属块浸没在水中，示数变为 3.4 N。" },
    stem: r`该金属块的体积为（$g=10\ \text{N/kg}$）`,
    options: [{ key: "A", text: r`$200\ \text{cm}^3$` }, { key: "B", text: r`$20\ \text{cm}^3$` }, { key: "C", text: r`$340\ \text{cm}^3$` }, { key: "D", text: r`$2\ \text{cm}^3$` }],
    answer: "A",
    explanation: [
      r`称重法：$F_{\text{浮}}=G-F_{\text{示}}=5.4-3.4=2\ \text{N}$。`,
      r`$V_{\text{排}}=\dfrac{F_{\text{浮}}}{\rho_{\text{水}}g}=\dfrac{2}{1.0\times10^3\times10}=2\times10^{-4}\ \text{m}^3=200\ \text{cm}^3$。`,
      r`浸没时 $V_{\text{物}}=V_{\text{排}}=200\ \text{cm}^3$。`,
    ],
  },
  {
    id: "qp4c", version: "v1", subject: "physics", knowledgeId: "p4", type: "single", difficulty: 2, source: "变式 · 漂浮", variantOf: "qp4a",
    stem: r`一木块漂浮在水面上，排开水的体积为 $3\times10^{-4}\ \text{m}^3$，木块受到的浮力为（$g=10\ \text{N/kg}$）`,
    options: [{ key: "A", text: r`$3\ \text{N}$` }, { key: "B", text: r`$0.3\ \text{N}$` }, { key: "C", text: r`$30\ \text{N}$` }, { key: "D", text: r`$300\ \text{N}$` }],
    answer: "A",
    explanation: [r`$F_{\text{浮}}=\rho_{\text{水}}gV_{\text{排}}=1.0\times10^3\times10\times3\times10^{-4}=3\ \text{N}$。`],
  },
  {
    id: "qp3a", version: "v1", subject: "physics", knowledgeId: "p3", type: "single", difficulty: 1, source: "人教版八下 10.1",
    context: { label: "实验情境", text: "弹簧测力计在空气中称得物体重 8 N，物体浸没在水中时示数为 5 N。" },
    stem: r`物体受到的浮力为`,
    options: [{ key: "A", text: r`$3\ \text{N}$` }, { key: "B", text: r`$5\ \text{N}$` }, { key: "C", text: r`$8\ \text{N}$` }, { key: "D", text: r`$13\ \text{N}$` }],
    answer: "A",
    explanation: [r`称重法：$F_{\text{浮}}=G-F_{\text{示}}=8-5=3\ \text{N}$。`],
  },
  {
    id: "qp5a", version: "v1", subject: "physics", knowledgeId: "p5", type: "single", difficulty: 3, source: "人教版八下 10.3",
    stem: r`将质量为 $0.6\ \text{kg}$、体积为 $1\times10^{-3}\ \text{m}^3$ 的物体放入足量水中，静止时（$g=10\ \text{N/kg}$）`,
    options: [{ key: "A", text: r`漂浮，$F_{\text{浮}}=6\ \text{N}$` }, { key: "B", text: r`悬浮，$F_{\text{浮}}=10\ \text{N}$` }, { key: "C", text: r`沉底，$F_{\text{浮}}=6\ \text{N}$` }, { key: "D", text: r`漂浮，$F_{\text{浮}}=10\ \text{N}$` }],
    answer: "A",
    explanation: [r`$\rho_{\text{物}}=\dfrac{0.6}{1\times10^{-3}}=600\ \text{kg/m}^3<\rho_{\text{水}}$，物体漂浮。`, r`漂浮时 $F_{\text{浮}}=G=mg=6\ \text{N}$。`],
  },
  {
    id: "qp7a", version: "v2", subject: "physics", knowledgeId: "p7", type: "single", difficulty: 2, source: "人教版九年级 17.2",
    context: { label: "实验数据", text: "定值电阻 R 两端电压 U = 6 V 时，电流表示数 I = 0.3 A。" },
    stem: r`当电阻两端电压增大到 $9\ \text{V}$ 时，它的电阻和通过它的电流分别为`,
    options: [{ key: "A", text: r`$20\ \Omega,\ 0.45\ \text{A}$` }, { key: "B", text: r`$30\ \Omega,\ 0.3\ \text{A}$` }, { key: "C", text: r`$20\ \Omega,\ 0.3\ \text{A}$` }, { key: "D", text: r`$30\ \Omega,\ 0.45\ \text{A}$` }],
    answer: "A",
    explanation: [r`$R=\dfrac{U}{I}=\dfrac{6}{0.3}=20\ \Omega$，电阻是导体本身性质，不随电压改变。`, r`$I'=\dfrac{U'}{R}=\dfrac{9}{20}=0.45\ \text{A}$。`],
  },
  {
    id: "qp7b", version: "v1", subject: "physics", knowledgeId: "p7", type: "single", difficulty: 2, source: "变式 · 电阻的性质", variantOf: "qp7a",
    stem: r`某导体两端电压为 $3\ \text{V}$ 时，通过的电流为 $0.2\ \text{A}$；当它两端电压为 $0$ 时，其电阻为`,
    options: [{ key: "A", text: r`$15\ \Omega$` }, { key: "B", text: r`$0\ \Omega$` }, { key: "C", text: r`$0.6\ \Omega$` }, { key: "D", text: "无法确定" }],
    answer: "A",
    explanation: [r`$R=\dfrac{U}{I}=\dfrac{3}{0.2}=15\ \Omega$。`, r`电阻由材料、长度、横截面积、温度决定，与电压、电流无关，电压为 0 时仍为 $15\ \Omega$。`],
  },
  {
    id: "qp8a", version: "v1", subject: "physics", knowledgeId: "p8", type: "single", difficulty: 2, source: "人教版九年级 17.4",
    stem: r`电阻 $R_1=10\ \Omega$、$R_2=20\ \Omega$ 串联接在 $6\ \text{V}$ 电源上，$R_1$ 两端电压为`,
    options: [{ key: "A", text: r`$2\ \text{V}$` }, { key: "B", text: r`$4\ \text{V}$` }, { key: "C", text: r`$3\ \text{V}$` }, { key: "D", text: r`$6\ \text{V}$` }],
    answer: "A",
    explanation: [r`$I=\dfrac{U}{R_1+R_2}=\dfrac{6}{30}=0.2\ \text{A}$。`, r`$U_1=IR_1=0.2\times10=2\ \text{V}$（串联分压与电阻成正比）。`],
  },

  // ───── 化学 ─────
  {
    id: "qc4a", version: "v3", subject: "chemistry", knowledgeId: "c4", type: "single", difficulty: 2, source: "人教版九上 课题2 如何正确书写化学方程式",
    context: { label: "实验现象", text: "高炉炼铁：红棕色粉末逐渐变为黑色，生成的气体使澄清石灰水变浑浊。" },
    stem: r`配平化学方程式 $\ce{\square Fe2O3 + \square CO ->[高温] \square Fe + \square CO2}$，各物质化学计量数依次为`,
    options: [{ key: "A", text: "1、3、2、3" }, { key: "B", text: "1、2、2、2" }, { key: "C", text: "2、3、4、3" }, { key: "D", text: "1、3、2、2" }],
    answer: "A",
    explanation: [
      r`得失氧法：每个 $\ce{CO}$ 夺得 1 个 O 变成 $\ce{CO2}$。`,
      r`$\ce{Fe2O3}$ 含 3 个 O，需要 3 个 $\ce{CO}$，生成 3 个 $\ce{CO2}$。`,
      r`Fe 原子守恒：生成 2 个 Fe。`,
      r`$\ce{Fe2O3 + 3CO ->[高温] 2Fe + 3CO2}$，检查：Fe 2=2，C 3=3，O 6=6 ✓`,
    ],
  },
  {
    id: "qc4b", version: "v2", subject: "chemistry", knowledgeId: "c4", type: "single", difficulty: 2, source: "变式 · 最小公倍数法", variantOf: "qc4a",
    context: { label: "实验现象", text: "铝在空气中表面生成一层致密的氧化铝薄膜。" },
    stem: r`配平 $\ce{\square Al + \square O2 -> \square Al2O3}$，化学计量数依次为`,
    options: [{ key: "A", text: "4、3、2" }, { key: "B", text: "2、3、1" }, { key: "C", text: "4、3、1" }, { key: "D", text: "2、1、1" }],
    answer: "A",
    explanation: [r`O 原子：左边 2 个、右边 3 个，最小公倍数为 6。`, r`$\ce{O2}$ 系数 3，$\ce{Al2O3}$ 系数 2，则 Al 为 4。`, r`$\ce{4Al + 3O2 -> 2Al2O3}$ ✓`],
  },
  {
    id: "qc4c", version: "v1", subject: "chemistry", knowledgeId: "c4", type: "single", difficulty: 3, source: "变式 · 有机物燃烧", variantOf: "qc4a",
    stem: r`配平 $\ce{\square C2H5OH + \square O2 ->[点燃] \square CO2 + \square H2O}$，化学计量数依次为`,
    options: [{ key: "A", text: "1、3、2、3" }, { key: "B", text: "1、2、2、3" }, { key: "C", text: "2、6、4、3" }, { key: "D", text: "1、3、2、2" }],
    answer: "A",
    explanation: [r`先配 C、H：1 个 $\ce{C2H5OH}$ 生成 2 个 $\ce{CO2}$、3 个 $\ce{H2O}$。`, r`右边 O：$2\times2+3=7$，左边已有 1 个 O，需 $\ce{O2}$ 提供 6 个，即 3 个 $\ce{O2}$。`],
  },
  {
    id: "qc2a", version: "v2", subject: "chemistry", knowledgeId: "c2", type: "single", difficulty: 2, source: "人教版九上 课题1 质量守恒定律",
    context: { label: "实验现象", text: "某物质在氧气中完全燃烧，产物只有二氧化碳和水。" },
    stem: r`关于该物质的组成，下列说法正确的是`,
    options: [{ key: "A", text: "只含碳、氢两种元素" }, { key: "B", text: "一定含碳、氢、氧三种元素" }, { key: "C", text: "一定含碳、氢元素，可能含氧元素" }, { key: "D", text: "无法判断" }],
    answer: "C",
    explanation: [r`反应前后元素种类不变：产物含 C、H、O。`, r`O 可能来自氧气，所以只能确定一定含 C、H，可能含 O，选 C。`],
  },
  {
    id: "qc2b", version: "v1", subject: "chemistry", knowledgeId: "c2", type: "single", difficulty: 4, source: "变式 · 定量判断", variantOf: "qc2a",
    stem: r`$4.6\ \text{g}$ 某物质在氧气中完全燃烧，生成 $8.8\ \text{g}\ \ce{CO2}$ 和 $5.4\ \text{g}\ \ce{H2O}$，则该物质`,
    options: [{ key: "A", text: "只含碳、氢元素" }, { key: "B", text: "含碳、氢、氧三种元素" }, { key: "C", text: "一定含碳、氢，可能含氧" }, { key: "D", text: "无法确定" }],
    answer: "B",
    explanation: [r`$m(\text{C})=8.8\times\dfrac{12}{44}=2.4\ \text{g}$，$m(\text{H})=5.4\times\dfrac{2}{18}=0.6\ \text{g}$。`, r`$2.4+0.6=3.0\ \text{g}<4.6\ \text{g}$，差值 $1.6\ \text{g}$ 为氧元素，故含 C、H、O。`],
  },
  {
    id: "qc5a", version: "v1", subject: "chemistry", knowledgeId: "c5", type: "single", difficulty: 3, source: "人教版九上 课题3",
    stem: r`加热分解 $31.6\ \text{g}$ 高锰酸钾，完全反应后可得到氧气的质量为（$\ce{KMnO4}$ 相对分子质量 158）`,
    options: [{ key: "A", text: r`$3.2\ \text{g}$` }, { key: "B", text: r`$6.4\ \text{g}$` }, { key: "C", text: r`$1.6\ \text{g}$` }, { key: "D", text: r`$32\ \text{g}$` }],
    answer: "A",
    explanation: [r`$\ce{2KMnO4 ->[\Delta] K2MnO4 + MnO2 + O2 ^}$`, r`$\dfrac{316}{31.6\ \text{g}}=\dfrac{32}{x}$，解得 $x=3.2\ \text{g}$。`],
  },
  {
    id: "qc6a", version: "v1", subject: "chemistry", knowledgeId: "c6", type: "single", difficulty: 1, source: "人教版九上 课题3 制取氧气",
    context: { label: "装置图", text: "固固加热型发生装置：酒精灯、铁架台、试管（管口塞一团棉花）、导管、集气瓶（排水法）。" },
    stem: r`用高锰酸钾制取氧气时，试管口要略向下倾斜，目的是`,
    options: [{ key: "A", text: "防止冷凝水回流使试管炸裂" }, { key: "B", text: "便于氧气排出" }, { key: "C", text: "防止高锰酸钾粉末进入导管" }, { key: "D", text: "使药品受热更均匀" }],
    answer: "A",
    explanation: [r`加热时药品中的水分变为水蒸气，在管口冷凝成水。`, r`管口略向下倾斜可防止冷凝水回流到热的试管底部使试管炸裂；塞棉花才是为了防止粉末进入导管。`],
  },
  {
    id: "qc6b", version: "v1", subject: "chemistry", knowledgeId: "c6", type: "single", difficulty: 2, source: "变式 · 实验操作顺序", variantOf: "qc6a",
    context: { label: "装置图", text: "高锰酸钾制氧气，排水法收集，导管伸入水槽中的集气瓶。" },
    stem: r`实验结束时，应先把导管移出水面，再熄灭酒精灯，目的是`,
    options: [{ key: "A", text: "防止水槽中的水倒吸使试管炸裂" }, { key: "B", text: "防止氧气逸散" }, { key: "C", text: "节约酒精" }, { key: "D", text: "防止集气瓶破裂" }],
    answer: "A",
    explanation: [r`若先熄灭酒精灯，试管内温度降低、气压减小，水槽中的水会沿导管倒吸入热试管，使试管炸裂。`],
  },
  {
    id: "qc5b", version: "v1", subject: "chemistry", knowledgeId: "c5", type: "single", difficulty: 2, source: "变式 · 电解水计算", variantOf: "qc5a",
    stem: r`电解 $18\ \text{g}$ 水，最多可得到氢气的质量为`,
    options: [{ key: "A", text: r`$2\ \text{g}$` }, { key: "B", text: r`$1\ \text{g}$` }, { key: "C", text: r`$16\ \text{g}$` }, { key: "D", text: r`$4\ \text{g}$` }],
    answer: "A",
    explanation: [r`$\ce{2H2O ->[通电] 2H2 ^ + O2 ^}$，质量比 $36:4$。`, r`$\dfrac{36}{18\ \text{g}}=\dfrac{4}{x}$，解得 $x=2\ \text{g}$。`],
  },
]

export const Q: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))
export const DIAGNOSTIC_SET = ["qm2a", "qm7a", "qp4a", "qp7a", "qc4a", "qc2a"]
export const questionsOfKp = (kid: string) => QUESTIONS.filter((q) => q.knowledgeId === kid)
/** 为知识点选取主练习题与变式题（不同题目/不同表述验证同一能力） */
export function pickPractice(kid: string) {
  const qs = questionsOfKp(kid)
  return qs.find((q) => !q.variantOf) ?? qs[0]
}
export function pickVariant(kid: string, exclude: string[]) {
  const qs = questionsOfKp(kid).filter((q) => !exclude.includes(q.id))
  return qs.find((q) => q.variantOf) ?? qs[0]
}
