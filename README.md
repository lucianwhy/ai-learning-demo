# AI数理化自主学习平台 · PRD V1.4 前端交互演示

纯前端交互演示：覆盖学生 / 教师 / 校长 / 总部（运营）四端，并内置招商「演示向导」。数据全部在浏览器内模拟（zustand + localStorage），无后端、无真实账号。

## 在线演示

- Live demo：http://60.205.142.254/learn-demo/

## 技术栈

- React 19 + TypeScript + Vite
- React Router（HashRouter，便于子路径部署）
- Tailwind CSS 4 + shadcn/ui
- Zustand（持久化到 localStorage）
- Recharts / KaTeX / Motion 等

## 本地运行

```bash
npm i
npm run dev
```

其他常用命令：

```bash
npm run build                       # 产物在 dist/
npm run preview                     # 本地预览构建结果
VITE_BASE=/sub/path/ npm run build  # 部署到子路径（HashRouter，无需服务端路由配置）
```

## 功能入口

| 入口 | 说明 |
|------|------|
| `#/` | 角色选择 + 「启动招商演示向导」（全链路演示，可「自动完成」） |
| `#/s/*` | 学生端 |
| `#/t/*` | 教师端 |
| `#/p/*` | 校长端 |
| `#/a/*` | 总部（运营）端 |

设置页或演示向导中可「重置演示数据」。`screenshots/` 目录存放界面截图，便于 README / 招商材料引用。

## 说明

- 本仓库为 **private** 演示仓，便于客户 pitch；如需对外分享可在 GitHub 仓库设置中改为 Public。
- 仓库内不含 `.env` 与密钥；演示数据均为前端模拟。
