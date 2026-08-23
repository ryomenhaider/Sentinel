export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[],
) {
  if (!data.length) return
  const cols =
    columns ||
    (Object.keys(data[0]) as (keyof T)[]).map((k) => ({ key: k, label: String(k) }))
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = cols.map((c) => c.label).join(',')
  const rows = data.map((row) => cols.map((c) => escape(row[c.key])).join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
