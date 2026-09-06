interface MetricCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: string
}

export default function MetricCard({
  label,
  value,
  sublabel,
  accent,
}: MetricCardProps) {
  return (
    <div
      className="group flex min-h-[112px] flex-col justify-between rounded-lg border px-4 py-3.5 transition-colors duration-150"
      style={{
        borderColor: 'var(--border-hairline)',
        background: 'var(--bg-surface)',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'var(--bg-surface-hover)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'var(--bg-surface)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-[12px] font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </span>

        {accent && (
          <span
            className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
          />
        )}
      </div>

      <div className="mt-3">
        <div
          className="font-data text-[22px] font-medium leading-none tracking-tight"
          style={{
            color: accent ?? 'var(--text-primary)',
          }}
        >
          {value}
        </div>

        {sublabel && (
          <div
            className="mt-2 text-[11.5px] leading-tight"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}