import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Server,
  Bug,
  Settings2,
  Activity,
  Wallet,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
  },
  {
    to: '/assets',
    label: 'Assets',
    icon: Server,
  },
  {
    to: '/vulnerabilities',
    label: 'Vulnerabilities',
    icon: Bug,
  },
  {
    to: '/controls',
    label: 'Security Controls',
    icon: Settings2,
  },
  {
    to: '/risk-analysis',
    label: 'Risk Analysis',
    icon: Activity,
  },
  {
    to: '/optimizer',
    label: 'Investment Optimizer',
    icon: Wallet,
  },
  {
    to: '/what-if',
    label: 'What If Simulator',
    icon: SlidersHorizontal,
  },
  {
    to: '/compliance',
    label: 'Compliance',
    icon: ShieldCheck,
  },
]

export default function Sidebar() {
  return (
    <aside
      className="flex h-screen w-64 shrink-0 flex-col border-r-2"
      style={{
        borderColor: 'var(--border-strong)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Brand */}
      <div
        className="flex h-16 shrink-0 items-center border-b-2 px-5"
        style={{
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center text-sm font-bold"
            style={{
              background: 'var(--accent-action)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            C
          </div>

          <div className="flex flex-col">
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              CyberSpend AI
            </span>

            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{
                color: 'var(--text-tertiary)',
              }}
            >
              Cyber Risk Platform
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div
          className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider"
          style={{
            color: 'var(--text-tertiary)',
          }}
        >
          Platform
        </div>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 border-l-4 px-3 py-2.5',
                  'text-[14px] transition-colors duration-150',
                  isActive
                    ? 'font-bold'
                    : 'font-medium',
                ].join(' ')
              }
              style={({ isActive }) => ({
                color: isActive
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',

                background: isActive
                  ? 'var(--bg-surface-raised)'
                  : 'transparent',

                borderColor: isActive
                  ? 'var(--border-strong)'
                  : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    style={{
                      opacity: isActive ? 1 : 0.75,
                    }}
                  />

                  <span className="truncate">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* System Status */}
      <div className="px-3 pb-4">
        <div
          className="border-2 p-3"
          style={{
            borderColor: 'var(--border-strong)',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0"
              style={{
                background: 'var(--risk-safe)',
                borderRadius: '9999px',
              }}
            />

            <span
              className="text-[12px] font-bold"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Risk Engine Active
            </span>
          </div>

          <p
            className="mt-1.5 text-[10.5px] leading-relaxed"
            style={{
              color: 'var(--text-tertiary)',
            }}
          >
            Security data is processed by the
            Cyber Risk Engine.
          </p>
        </div>
      </div>
    </aside>
  )
}