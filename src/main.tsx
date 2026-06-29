import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { PanelAdmin } from './PanelAdmin'
import { CustomerView } from './CustomerView'
import './styles.css'

function isCustomerRoute(hash: string): boolean {
  const stripped = hash.replace(/^#/, '').replace(/^\//, '')
  return stripped.startsWith('pedido')
}

function App() {
  const [isCustomer, setIsCustomer] = useState<boolean>(() =>
    isCustomerRoute(window.location.hash),
  )

  useEffect(() => {
    const onHashChange = () => setIsCustomer(isCustomerRoute(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return isCustomer ? <CustomerView /> : <PanelAdmin />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
