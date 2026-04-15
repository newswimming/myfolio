import type { TrendsResponse } from '../types'

const API_BASE = 'https://script-trend-bias-analyzer.onrender.com'

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const raw = await res.text()

  let data: any = {}
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error(raw || `HTTP ${res.status}`)
    }
  }

  if (!res.ok) {
    throw new Error(data.detail || data.message || `HTTP ${res.status}`)
  }

  return data as T
}

export async function fetchTrends(
  notes: string,
  daysBack: number = 30
): Promise<TrendsResponse> {
  return postJson<TrendsResponse>(`${API_BASE}/themes-and-trends`, {
    notes,
    days_back: daysBack,
  })
}