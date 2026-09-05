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
    to: '/',
    label: '',
    icon: LayoutGrid,
  },
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
      className="flex h-full w-60 shrink-0 flex-col border-r"
      style={{
        borderColor: 'var(--border-hairline)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-sm text-sm font-semibold"
          style={{
            background: 'var(--accent-action)',
            color: '#0A0F1C',
          }}
        >
          C
        </div>

        <span
          className="text-[15px] font-semibold tracking-tight"
          style={{
            color: 'var(--text-primary)',
          }}
        >
          CyberSpend AI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV_ITEMS.map(
          ({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors ${isActive ? 'font-medium' : ''
                }`
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
              <Icon
                size={16}
                strokeWidth={1.75}
              />

              {label}
            </NavLink>
          ),
        )}
      </nav>

      {/* System status */}
      <div
        className="mx-3 mb-4 rounded-md border px-3 py-3"
        style={{
          borderColor:
            'var(--border-hairline-soft)',
        }}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span
            className="text-[11px] font-medium"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            Risk Engine Active
          </span>
        </div>

        <p
          className="text-[11px] leading-snug"
          style={{
            color: 'var(--text-tertiary)',
          }}
        >
          Company security data is processed by
          the Cyber Risk Engine.
        </p>
      </div>
    </aside>
  )
}