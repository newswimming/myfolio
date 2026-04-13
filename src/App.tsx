import { useState, useEffect } from 'react'
import Welcome from './pages/Welcome'
import NarrativeDashboard from './pages/NarrativeDashboard'

export default function App() {

  const [page, setPage] = useState<'welcome' | 'main'>('welcome')
  const [analysis, setAnalysis] = useState<any>(null)
  const [inputText, setInputText] = useState('')

  const handleStart = (data: any, text: string, mode: string) => {

    const log = {
      timestamp: new Date().toISOString(),
      input: text,
      result: data
    }

    const existing = JSON.parse(localStorage.getItem('story_logs') || '[]')
    localStorage.setItem('story_logs', JSON.stringify([log, ...existing]))

    setAnalysis(data)
    setInputText(text)
    setPage('main')
  }

  // ✅ load shared text
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const text = params.get('text')

    if (text) {
      setInputText(decodeURIComponent(text))
    }
  }, [])

  if (page === 'welcome') {
    return <Welcome onStart={handleStart} />
  }

  return (
    <NarrativeDashboard
      analysis={analysis}
      inputText={inputText}
      onBack={() => setPage('welcome')}
      onUpdate={setAnalysis}
    />
  )
}
