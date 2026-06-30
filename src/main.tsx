import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { PanelAdmin } from './PanelAdmin'
import { CustomerView } from './CustomerView'
import { MarketplaceLanding } from './MarketplaceLanding'
import { SuperAdminPanel } from './SuperAdminPanel'
import { parseHash, type Route } from './router'
import './styles.css'

function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  switch (route.kind) {
    case 'admin':
      return <PanelAdmin slug={route.slug} />
    case 'customer':
      return <CustomerView slug={route.slug} />
    case 'superadmin':
      return <SuperAdminPanel />
    case 'landing':
      return <MarketplaceLanding />
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
