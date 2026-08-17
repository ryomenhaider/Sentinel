import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Overview from './pages/Overview'
import Anomalies from './pages/Anomalies'
import Forecasts from './pages/Forecasts'
import Portfolio from './pages/Portfolio'
import Sentiment from './pages/Sentiment'
import { COLORS, SANS } from './theme'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function Content() {
  const location = useLocation()
  return (
    <main style={{ flex: 1, minWidth: 0, padding: '24px 28px 44px' }}>
      <div
        key={location.pathname}
        className="page-enter"
        style={{ maxWidth: '1440px', margin: '0 auto' }}
      >
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/sentiment" element={<Sentiment />} />
        </Routes>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div
        className="app-shell"
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: COLORS.bg,
          fontFamily: SANS,
          fontSize: '13px',
        }}
      >
        <Navbar />
        <Content />
      </div>
    </BrowserRouter>
  )
}