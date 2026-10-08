import { useEffect, useState } from 'react'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Sidebar from './components/Sidebar'
import CompanyDataImport from './pages/CompanyDataImport'
import Dashboard from './pages/Dashboard'
import Assets from './pages/assets'
import Vulnerabilities from './pages/Vulnerabilities'
import Controls from './pages/controls'
import RiskAnalysis from './pages/RiskAnalysis'
import Optimizer from './pages/Optimizer'
import WhatIf from './pages/WhatIf'
import Compliance from './pages/Compliance'

const IMPORT_STORAGE_KEY = 'cyberspend_import_completed'

function LoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background: 'var(--bg-base)',
        color: 'var(--text-secondary)',
      }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--border-hairline)',
            borderTopColor: 'var(--text-primary)',
          }}
        />

        <p className="text-sm font-semibold uppercase tracking-wider">
          Loading
        </p>
      </div>
    </div>
  )
}

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const [checking, setChecking] = useState(true)
  const [importCompleted, setImportCompleted] = useState(false)

  useEffect(() => {
    const checkImportStatus = () => {
      const completed =
        localStorage.getItem(IMPORT_STORAGE_KEY) === 'true'

      setImportCompleted(completed)
      setChecking(false)
    }

    checkImportStatus()

    window.addEventListener(
      'cyberspend-import-completed',
      checkImportStatus,
    )

    window.addEventListener(
      'storage',
      checkImportStatus,
    )

    return () => {
      window.removeEventListener(
        'cyberspend-import-completed',
        checkImportStatus,
      )

      window.removeEventListener(
        'storage',
        checkImportStatus,
      )
    }
  }, [])

  if (checking) {
    return <LoadingScreen />
  }

  if (!importCompleted) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
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

      <main
        className="min-w-0 flex-1 overflow-y-auto"
        style={{
          background: 'var(--bg-base)',
        }}
      >
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
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
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
        <Route
          path="/"
          element={<CompanyDataImport />}
        />

        <Route
          path="*"
          element={<ApplicationLayout />}
        />
      </Routes>
    </HashRouter>
  )
}