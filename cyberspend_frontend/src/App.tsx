import { HashRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <HashRouter>
      <div
        className="flex h-screen"
        style={{ background: 'var(--bg-base)' }}
      >
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <Routes>

            <Route
              path="/"
              element={<CompanyDataImport />}
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Asset Management */}
            <Route
              path="/assets"
              element={<Assets />}
            />

            {/* Vulnerability Management */}
            <Route
              path="/vulnerabilities"
              element={<Vulnerabilities />}
            />

            {/* Security Controls */}
            <Route
              path="/controls"
              element={<Controls />}
            />

            {/* Remaining modules */}
            <Route
              path="/risk-analysis"
              element={<RiskAnalysis />}
            />

            <Route
              path="/optimizer"
              element={<Optimizer />}
            />

            <Route
              path="/what-if"
              element={<WhatIf />}
            />

            <Route
              path="/compliance"
              element={<Compliance />}
            />

          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}