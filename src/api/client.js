async function api(path, init) {
  const r = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!r.ok) {
    const err = await r.text()
    throw new Error(err || `${r.status}`)
  }
  return r.json()
}

export function generateRule(messages) {
  return api('/api/rules/generate', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}

export function preparePr(payload) {
  return api('/api/github/prepare-pr', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function runVerification(csv) {
  return api('/api/verify/run', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  })
}

export function recommendSimulation(filters) {
  return api('/api/simulation/recommend', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  })
}

export function startLargeSimulation(filters) {
  return api('/api/simulation/start', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  })
}

export function pollSimulation(jobId) {
  return api(`/api/simulation/status/${encodeURIComponent(jobId)}`)
}

export function insightsChartData() {
  return api('/api/insights/chart-data')
}
