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
      className="flex h-screen w-60 shrink-0 flex-col border-r"
      style={{
        borderColor: 'var(--border-hairline)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Brand */}
      <div
        className="flex h-16 shrink-0 items-center border-b px-5"
        style={{
          borderColor: 'var(--border-hairline-soft)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
            style={{
              background: 'var(--accent-action)',
              color: 'var(--text-inverse)',
            }}
          >
            C
          </div>

          <div className="flex flex-col">
            <span
              className="text-sm font-semibold tracking-tight"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              CyberSpend AI
            </span>

            <span
              className="text-[10px]"
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
          className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: 'var(--text-tertiary)',
          }}
        >
          Platform
        </div>

        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-md px-3 py-2',
                  'text-[13px] transition-colors duration-150',
                  isActive
                    ? 'font-medium'
                    : 'font-normal',
                ].join(' ')
              }
              style={({ isActive }) => ({
                color: isActive
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',

                background: isActive
                  ? 'var(--bg-surface-raised)'
                  : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.7}
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
          className="rounded-lg border p-3"
          style={{
            borderColor: 'var(--border-hairline-soft)',
            background: 'var(--bg-base)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: 'var(--risk-safe)',
              }}
            />

            <span
              className="text-[11px] font-medium"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Risk Engine Active
            </span>
          </div>

          <p
            className="mt-1.5 text-[10px] leading-relaxed"
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