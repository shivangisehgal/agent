import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Activity, BarChart3, LineChart as LineChartIcon, Loader2, PieChart as PieIcon, Sparkles } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import type { InsightsDataset } from '../types'

const PALETTE = ['#4f8bff', '#00d2ff', '#8b5cf6', '#32d583', '#ffcb6b']
const PALETTE_LIGHT = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#d97706']

export function InsightsDashboard({ data }: { data: InsightsDataset | null }) {
  const { theme } = useTheme()
  const stroke = theme === 'light' ? '#64748b' : '#94a8d4'
  const tipBg = theme === 'light' ? 'rgba(255,255,255,0.96)' : 'rgba(15,29,62,0.92)'
  const tipBorder = theme === 'light' ? '1px solid rgba(15,23,42,0.12)' : '1px solid rgba(255,255,255,0.12)'
  const cursorFill = theme === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)'
  const chartPalette = theme === 'light' ? PALETTE_LIGHT : PALETTE
  const lineStroke = chartPalette[0]
  const barFill = chartPalette[1]

  if (!data)
    return (
      <div className="glass-panel pad-lg">
        <div className="section-title-row">
          <Loader2 size={22} strokeWidth={2} className="icon-inline accent insights-loader" aria-hidden />
          <p className="muted">Loading fixed-query insights bundle…</p>
        </div>
      </div>
    )

  const pieData = data.topRegions.map((r) => ({ name: r.region, value: Math.round(r.pct * 100) }))
  const stats = Object.entries(data.numericConditionStats)[0]?.[1]

  return (
    <div className="workspace-grid stacked">
      <section className="kpi-banner">
        <div className="kpi-card glass-panel">
          <div className="kpi-card-head">
            <Activity size={16} className="icon-inline accent" aria-hidden />
            <div className="eyebrow">Total diagnosed devices</div>
          </div>
          <div className="mega">{data.kpis.totalDiagnosed.toLocaleString()}</div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-card-head">
            <PieIcon size={16} className="icon-inline accent" aria-hidden />
            <div className="eyebrow">Diagnosis rate</div>
          </div>
          <div className="mega">{(data.kpis.diagnosisRate * 100).toFixed(2)}%</div>
          <div className="muted tiny">fraction of reachable fleet window</div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-card-head">
            <LineChartIcon size={16} className="icon-inline accent" aria-hidden />
            <div className="eyebrow">Trend vs prior</div>
          </div>
          <div className="mega positive">+{data.kpis.trendPct}%</div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-card-head">
            <BarChart3 size={16} className="icon-inline accent" aria-hidden />
            <div className="eyebrow">Data completeness</div>
          </div>
          <div className="mega">{(data.kpis.dataCompleteness * 100).toFixed(1)}%</div>
        </div>
      </section>

      <section className="split-two chart-row">
        <div className="glass-panel pad-lg chart-box">
          <div className="section-head tight">
            <div className="section-title-row">
              <LineChartIcon size={18} className="icon-inline accent" aria-hidden />
              <div>
                <div className="eyebrow">Line · SQL-backed</div>
                <h3>Diagnosis trend over time</h3>
                <p className="muted tiny">{data.sqlSourceLabels.diagnosisTrend}</p>
              </div>
            </div>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.diagnosisTrend}>
                <XAxis dataKey="t" stroke={stroke} />
                <YAxis stroke={stroke} />
                <Tooltip contentStyle={{ background: tipBg, border: tipBorder }} />
                <Line type="monotone" dataKey="diagnosed" stroke={lineStroke} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel pad-lg chart-box">
          <div className="section-head tight">
            <div className="section-title-row">
              <BarChart3 size={18} className="icon-inline accent" aria-hidden />
              <div>
                <div className="eyebrow">Bars · SQL-backed</div>
                <h3>Model overlap</h3>
                <p className="muted tiny">{data.sqlSourceLabels.modelOverlap}</p>
              </div>
            </div>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.modelOverlap} layout="vertical" margin={{ left: 32 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="model" stroke={stroke} width={80} />
                <Tooltip cursor={{ fill: cursorFill }} contentStyle={{ background: tipBg, border: tipBorder }} />
                <Bar dataKey="share" fill={barFill} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="split-two chart-row">
        <div className="glass-panel pad-lg chart-box">
          <div className="section-head tight">
            <div className="section-title-row">
              <PieIcon size={18} className="icon-inline accent" aria-hidden />
              <div>
                <div className="eyebrow">Donut · regional mix</div>
                <h3>Top regions</h3>
              </div>
            </div>
          </div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={pieData}
                  nameKey="name"
                  label
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={pieData[i].name} fill={chartPalette[i % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: tipBg, border: tipBorder }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel pad-lg">
          <div className="section-title-row">
            <Sparkles size={18} className="icon-inline accent" aria-hidden />
            <div>
              <div className="eyebrow">Numeric condition fabric</div>
              <h3>Threshold forensics (fixed query)</h3>
            </div>
          </div>
          {stats ? (
            <div className="numeric-grid">
              <div>
                <div className="muted tiny">Min / Median / Max</div>
                <div className="big-line">
                  {stats.min} · {stats.median} · {stats.max}
                </div>
              </div>
              <div className="glass-inset pad-sm">
                <div className="muted tiny">Agent-suggested draft threshold</div>
                <div className="draft">{stats.suggestedThresholdDraft}</div>
              </div>
            </div>
          ) : (
            <p className="muted">No numeric aggregates for this cohort.</p>
          )}
          <div className="glass-inset pad-sm spaced-top">
            <div className="eyebrow">Narrative (AI commentary hook)</div>
            <p>{data.aiNarrative}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
