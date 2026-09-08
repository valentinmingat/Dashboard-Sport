import { useState } from 'react'
import { StoreProvider } from './lib/store'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import Weight from './pages/Weight'
import Settings from './pages/Settings'

const PAGES = {
  dashboard: Dashboard,
  journal: Journal,
  weight: Weight,
  settings: Settings,
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const Page = PAGES[tab]

  return (
    <StoreProvider>
      <div className="safe-top mx-auto min-h-screen max-w-md pb-24">
        <Page onNavigate={setTab} />
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </StoreProvider>
  )
}
