# Simulation Agent Portal

Single-page React application for an **AI-assisted diagnosis simulation and insights** workflow: natural language → DRL authoring → Git PR orchestration → CSV verification → large-scale simulation sizing/execution → fixed-query insights dashboards. The UI targets a **Samsung OneUI–inspired glass** look with optional **dark (default)** and **light** themes.

---

## Table of contents

1. [What this codebase does](#1-what-this-codebase-does)
2. [Technology stack](#2-technology-stack)
3. [Quick start](#3-quick-start)
4. [Repository layout](#4-repository-layout)
5. [Runtime processes](#5-runtime-processes)
6. [Frontend deep dive](#6-frontend-deep-dive)
7. [Themes (dark / light)](#7-themes-dark--light)
8. [Styling system](#8-styling-system)
9. [Icons (`lucide-react`)](#9-icons-lucide-react)
10. [Workflow phases](#10-workflow-phases)
11. [Chat orchestration](#11-chat-orchestration)
12. [Backend API](#12-backend-api)
13. [Environment variables](#13-environment-variables)
14. [Data shapes & optional typing](#14-data-shapes--optional-typing)
15. [How-to recipes](#15-how-to-recipes)
16. [Testing ideas](#16-testing-ideas)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. What this codebase does

| Capability | UX surface | Backend today |
|------------|------------|----------------|
| **Rule generation** | Chat + reasoning table + editable DRL; “Accept & continue” | `POST /api/rules/generate` — OpenAI if key set; else mocks |
| **Pull request** | PR stub UI + merge/reject | `POST /api/github/prepare-pr` — stub (wire Octokit/Git host) |
| **Verification** | CSV paste/upload + KPI table | `POST /api/verify/run` — stub (wire Drools) |
| **Large simulation** | Filters, sizing card, progress poll | `/api/simulation/*` — in-memory job stub |
| **Insights** | Recharts KPIs + line/bar/pie | `GET /api/insights/chart-data` — fixed JSON |

The **chat rail** always drives contextual actions per phase (and supports `/rule`, `/pr`, etc.).

---

## 2. Technology stack

| Layer | Choice |
|-------|--------|
| UI | React 19, JavaScript (JSX), Vite 8 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| API server | Express 5 (`server/index.js`), `node --watch` (Node 18+) |
| AI (optional) | `openai` SDK, JSON-shaped rule responses |

---

## 3. Quick start

```bash
npm install
npm run dev
```

- **Client:** http://localhost:5173 — Vite dev server  
- **API:** http://localhost:3001 — Express (proxied via Vite `/api` → see `vite.config.js`)

Production build:

```bash
npm run build    # emits dist/ — static client only
npm run preview  # serve client build (API not started)
```

> **Note:** `npm run dev` starts **both** client and API via `concurrently`. For production you must deploy API separately and configure the client `fetch` base URL or proxy.

---

## 4. Repository layout

```
ax/
├── index.html                 # Shell; inline script syncs theme from localStorage (FOUC avoidance)
├── package.json               # Scripts: dev, build, lint; deps
├── vite.config.js             # React plugin + /api → localhost:3001 proxy
├── eslint.config.js           # Flat ESLint for JS/JSX
├── .env.example               # OPENAI_* and PORT hints
├── server/
│   └── index.js               # Express app: routes, mocks, optional OpenAI
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx               # StrictMode → ThemeProvider → App
    ├── App.jsx                # Layout, phase routing, chat orchestration
    ├── index.css              # Layout + components (uses CSS variables from theme.css)
    ├── theme.css              # html[data-theme="dark"|"light"] tokens + body/ambient/brand overrides
    ├── api/
    │   └── client.js          # Thin fetch wrappers to /api/*
    ├── context/
    │   ├── PortalContext.jsx  # Workflow state + chat transcript
    │   └── ThemeContext.jsx   # Theme mode + persistence (localStorage `portal-theme`)
    ├── components/
    │   ├── AgentChat.jsx      # Right rail chat composer + bubbles
    │   ├── PhaseRail.jsx      # Left nav with Lucide icons
    │   ├── ThemeToggle.jsx    # Sun/Moon toggle
    │   ├── ThinkingStream.jsx # “Thinking process” list
    │   └── WorkflowProgress.jsx # Top horizontal stepper
    ├── workspace/
    │   ├── RuleGeneration.jsx
    │   ├── PullRequestFlow.jsx
    │   ├── Verification.jsx
    │   ├── LargeSimulation.jsx
    │   └── InsightsDashboard.jsx # Recharts; reads theme for axis/tooltip colors
    └── utils/
        └── thinking.js        # Animated thinking-line helpers used by orchestration timing
```

**Rule of thumb:**  
- **`App.jsx`** = wiring + orchestration.  
- **`workspace/*`** = main canvas for each phase.  
- **`components/*`** = shared chrome.  
- **`server/index.js`** = all HTTP contracts for mocks/real backends.

---

## 5. Runtime processes

| Script | Runs |
|--------|------|
| `npm run dev` | `vite` + `node --watch server/index.js` |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | API only |

Vite **`server.proxy['/api']`** forwards browser requests to `http://localhost:3001`, so frontend code uses **relative URLs** (`/api/...`) in `src/api/client.js`.

---

## 6. Frontend deep dive

### 6.1 Entry and providers

`main.jsx` wraps the tree:

```text
StrictMode → ThemeProvider → App
```

- **`ThemeProvider`** sets `document.documentElement.dataset.theme` and syncs `localStorage` key **`portal-theme`** (`dark` | `light`).
- **`PortalProvider`** is inside `App.jsx` (default export wraps `AppInner`) and holds workflow + chat state.

### 6.2 `App.jsx` responsibilities

1. **Layout:** `app-shell` grid — `PhaseRail` | `main.workspace` | `AgentChat`.
2. **Header:** `WorkflowProgress` + title row + `ThemeToggle` + status pills.
3. **Body:** Renders **one** `workspace/*` component based on `state.phase`.
4. **`handleSend`:** Routes user messages by `state.phase` and optional **slash commands** (`/rule`, `/pr`, `/verify`, `/sim`, `/insights`).
5. **Thinking UI:** Uses rotating labels + `replaySteps` after API returns (see `utils/thinking.js`).
6. **Side effects:** `bootInsights()` when entering insights; simulation polling lives in `LargeSimulation.jsx`.

### 6.3 `PortalContext` state (high level)

Key fields in `PortalState`:

- `phase`, `chat[]`, `reasoningRows[]`, `drl`, `ruleAccepted`
- `prUrl`, `prBranch`, `prMerged`
- `verificationDraft`, `verificationCsv`, `verificationSummary`
- `simulationFilters`, `jobId`

Mutations are **stable callbacks** (`useCallback`) exposed from `usePortal()`.

### 6.4 API client

`src/api/client.js` — every function is a `fetch` to `/api/...` with JSON body/parse. **To point at another host** in production, either:

- Set Vite `define` + env for full base URL, or  
- Use a reverse proxy so `/api` stays same-origin.

---

## 7. Themes (dark / light)

### 7.1 User-facing behavior

- **Toggle:** Sun/Moon button in the workspace header (`ThemeToggle.jsx`).
- **Persistence:** `localStorage['portal-theme']`.
- **First paint:** `index.html` inline script sets `data-theme` before React hydrates to reduce flash.

### 7.2 Implementation files

| File | Role |
|------|------|
| `src/theme.css` | All **`html[data-theme="dark"]`** and **`html[data-theme="light"]`** CSS custom properties, **body** backgrounds, **ambient glow**, **brand mark** gradients, and gradient tokens (`--primary-fill`, `--wf-bar-fill`, …) |
| `src/index.css` | Layout, components; references `var(--text)`, `var(--line)`, `var(--glass)`, etc. |

### 7.3 Dark theme note

Dark mode is the **original deep blue** aesthetic (reverted from the interim “more white” pass): navy gradients, cyan accent `--accent-2: #00d2ff`, etc.

### 7.4 Adding a new token

1. Define `--my-token` in **both** `html[data-theme='dark']` and `html[data-theme='light']` in `theme.css`.
2. Use `var(--my-token)` in `index.css` (or in a component-specific class).

### 7.5 Chart theme bridge

`InsightsDashboard.jsx` calls `useTheme()` to pick axis stroke, tooltip background, and bar/line colors so charts stay legible in light mode.

---

## 8. Styling system

- **Global:** `index.css` imported from `main.jsx`; `@import './theme.css'` at top of `index.css`.
- **Utility patterns:**  
  - `.glass-panel` / `.glass-inset` — frosted surfaces  
  - `.workspace-grid`, `.section-head`, `.pill`, `.primary` / `.ghost` buttons  
  - `.icon-inline` / `.icon-inline.accent` — Lucide color hookup to theme tokens  
- **Responsive:** Grid collapse for chat under `1280px` (see `.app-shell` media query).

**To restyle a screen:** prefer editing **workspace** markup classes + `index.css`; avoid inline styles except Recharts (which needs JS values).

---

## 9. Icons (`lucide-react`)

Icons are **tree-shaken** per import. Conventions used here:

- **Phase rail:** one icon per workflow step (`Code2`, `GitBranch`, `FileCheck`, `Cloud`, `BarChart3`).
- **Headers:** `section-title-row` + `className="icon-inline accent"`.
- **Buttons:** `btn-with-icon` wrapper + `btn-icon` on the Lucide element.
- **Chat:** role icons in bubble meta; `Sparkles` in header.

**To swap an icon:** change the import in the specific file; keep `size` / `strokeWidth` consistent for visual rhythm.

---

## 10. Workflow phases

Phase ids are **string literals** repeated in a few places; keep them in sync when extending the flow:

`rule-generation` | `pull-request` | `verification` | `simulation` | `insights`

**Files to touch when adding a phase:**

1. `src/context/PortalContext.jsx` — default `phase` value if needed.
2. `src/components/PhaseRail.jsx` — add step entry + icon.
3. `src/components/WorkflowProgress.jsx` — extend `PHASE_ORDER` + `LABELS`.
4. `src/App.jsx` — render new workspace (`switch`/`handleSend`/title helpers).
5. Optionally `server/index.js` — new routes.
6. `README.md` — document the phase.

---

## 11. Chat orchestration

Behavior is **centralized** in `App.jsx` → `handleSend`:

| Phase | Typical message | Action |
|-------|-----------------|--------|
| `rule-generation` | Any text | `generateRule([...])` |
| `pull-request` | “prepare” / “pr” | `preparePr({ drlContent })` |
| `verification` | “run” / “verify” | `runVerification(draft)` |
| `simulation` | “recommend” / “start” | `recommendSimulation` / `startLargeSimulation` |
| `insights` | “refresh” | `bootInsights()` |

Slash commands jump phase without running the phase-specific API unless the user sends another message.

**To add a chat trigger:** add a branch in `handleSend` and/or extend keyword regexes.

---

## 12. Backend API

All implemented in **`server/index.js`** (single file for discoverability).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/rules/generate` | Body: `{ messages: [{role, content}] }`. Returns reasoning table + DRL + thinking steps. |
| POST | `/api/github/prepare-pr` | Body: `{ drlContent, branchName?, enterprise? }`. Returns PR stub + thinking steps. |
| POST | `/api/verify/run` | Body: `{ csv: string }`. Returns KPI-style aggregates. |
| POST | `/api/simulation/recommend` | Sizing card JSON. |
| POST | `/api/simulation/start` | Creates in-memory job; returns `jobId`. |
| GET | `/api/simulation/status/:jobId` | Progress + stages. |
| GET | `/api/insights/chart-data` | Fixed bundle for charts. |

**CORS:** enabled for all origins (`cors()`).

**To add a route:** register `app.post/get` in `server/index.js`, mirror a function in `src/api/client.js`, then call from React.

---

## 13. Environment variables

| Variable | Used by | Description |
|---------|---------|-------------|
| `OPENAI_API_KEY` | `server/index.js` | When set, rule generation calls OpenAI. |
| `OPENAI_MODEL` | Server | Defaults to `gpt-4o-mini`. |
| `PORT` | Server | Defaults to `3001`. |

See `.env.example`. Vite-side env vars use `import.meta.env` if you introduce `VITE_*` keys later.

---

## 14. Data shapes & optional typing

The app is plain **JavaScript**. Phase ids are string literals wired through context and components (see §10). Payload shapes mirror what **`src/api/client.js`** parses and **`server/index.js`** returns.

Keep **API responses** aligned across server and client — if a route’s JSON shape changes, update **`client.js`**, consumers, and the handler in **`server/index.js`**. Optionally add **JSDoc `@typedef`** in `client.js` or a thin `docs/api-shapes.md` if you want editor hints without TypeScript.

---

## 15. How-to recipes

### 15.1 Change default theme

- **HTML:** `index.html` `data-theme` on `<html>`.
- **Script fallback:** Same file’s `localStorage` sync.
- **React initial state:** `ThemeContext.jsx` `readStored()`.

### 15.2 Wire real GitHub PR creation

Replace `prepare-pr` handler body with Octokit (`@octokit/rest`): create branch, push blob, open PR. Keep the same JSON response shape the UI expects (`thinkingSteps`, `pr.title`, `pr.prUrl`, …).

### 15.3 Wire real Drools verification

Implement JVM microservice or `child_process` to a CLI that accepts CSV → runs KieSession → emits JSON KPIs; have `POST /api/verify/run` proxy or call it.

### 15.4 Replace Athena simulation stub

Persist jobs in Redis/Postgres; run workers; expose real status SSE or polling — keep **`GET /api/simulation/status/:jobId`** contract stable or update `pollSimulation()` + `LargeSimulation.jsx`.

### 15.5 Add SQL-backed insights

Replace `GET /api/insights/chart-data` internals with DB queries producing the same JSON keys the dashboard expects (`InsightsDataset`-style bundles). Optionally split into `insights/trend.js`, `insights/overlap.js`, etc., and assemble in the route handler.

### 15.6 Add a feature flag

Simplest pattern: `import.meta.env.VITE_FLAG === 'true'` around render branches; server-side flags via `process.env`.

---

## 16. Testing ideas

- **Smoke:** Playwright — load page, toggle theme, switch phases, send chat in rule phase.
- **API:** Supertest against Express app (export `app` from `server/index.js` without `listen` for testability).
- **Contract:** Snapshot JSON responses for mock endpoints.

---

## 17. Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `/api` 404 in browser | API not running or Vite proxy misconfigured |
| Flash of wrong theme | `index.html` script missing or `ThemeProvider` out of sync |
| OpenAI 500 | Malformed JSON from model — server strips ``` fences; adjust prompt in `generateRuleWithAi` |
| Charts unreadable in light | Confirm `InsightsDashboard` `useTheme()` stroke colors |

---

## License / ownership

Private project scaffold — extend this README with team-specific onboarding (internal Git URLs, deployment targets, SSO) as needed.
