export function makeThinkingIds(labels) {
  const base = labels.length ? labels : ['Reasoning internally…']
  const stamp = `${Date.now()}`
  return base.map((label, i) => ({
    id: `t-${stamp}-${i}`,
    label,
    done: false,
  }))
}

export async function revealThinkingSteps(labels, onTick, msPerStep, work) {
  const lines = makeThinkingIds(labels)
  let completed = 0
  const emit = () => {
    onTick(lines.map((l, i) => ({ ...l, done: i < completed })))
  }
  emit()

  let resolved = false
  const iv = window.setInterval(() => {
    if (resolved || completed >= lines.length) return
    completed++
    emit()
  }, msPerStep)

  try {
    const result = await work
    resolved = true
    window.clearInterval(iv)
    onTick(lines.map((l) => ({ ...l, done: true })))
    return result
  } catch (e) {
    resolved = true
    window.clearInterval(iv)
    onTick(lines.map((l) => ({ ...l, done: true })))
    throw e
  }
}
