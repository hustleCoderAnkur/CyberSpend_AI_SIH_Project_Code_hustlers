import { useEffect, useState } from 'react'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import WhatIf from './pages/WhatIf'
import Sidebar from './components/Sidebar'
import RiskAnalysis from './pages/RiskAnalysis'
import Dashboard from './pages/Dashboard'
import Assets from './pages/assets'
import Vulnerabilities from './pages/Vulnerabilities'
import Controls from './pages/controls'
import Optimizer from './pages/Optimizer'
import Compliance from './pages/Compliance'
import CompanyDataImport from './pages/CompanyDataImport'

const IMPORT_STORAGE_KEY = 'cyberspend_import_completed'

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const [checking, setChecking] = useState(true)
  const [importCompleted, setImportCompleted] = useState(false)

  useEffect(() => {
    const completed =
      localStorage.getItem(IMPORT_STORAGE_KEY) === 'true'

    setImportCompleted(completed)
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-secondary)',
        }}
      >
        <span className="text-sm font-semibold uppercase tracking-wider">
          Loading...
        </span>
      </div>
    )
  }

  if (!importCompleted) {
    return <Navigate to="/" replace />
  }

  return children
}

function ApplicationLayout() {
  return (
    <div
      className="flex min-h-screen"
      style={{
        background: 'var(--bg-base)',
      }}
    >
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vulnerabilities"
            element={
              <ProtectedRoute>
                <Vulnerabilities />
              </ProtectedRoute>
            }
          />

          <Route
            path="/controls"
            element={
              <ProtectedRoute>
                <Controls />
              </ProtectedRoute>
            }
          />

          <Route
            path="/risk-analysis"
            element={
              <ProtectedRoute>
                <RiskAnalysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/optimizer"
            element={
              <ProtectedRoute>
                <Optimizer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/what-if"
            element={
              <ProtectedRoute>
                <WhatIf />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <Compliance />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Import is the entry point and does not require access */}
        <Route
          path="/"
          element={<CompanyDataImport />}
        />

        {/* Everything else goes through the application layout */}
        <Route
          path="*"
          element={<ApplicationLayout />}
        />
      </Routes>
    </HashRouter>
  )
}