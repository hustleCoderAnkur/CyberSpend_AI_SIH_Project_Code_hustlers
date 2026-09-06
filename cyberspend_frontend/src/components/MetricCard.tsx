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
      className="group flex min-h-32 flex-col justify-between border-2 px-4 py-4 transition-colors duration-150"
      style={{
        borderColor: 'var(--border-strong)',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
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
          className="text-[12.5px] font-bold uppercase tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </span>

        {accent && (
          <span
            className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
          />
        )}
      </div>

      <div className="mt-3">
        <div
          className="font-data text-[28px] font-bold leading-none tracking-tight"
          style={{
            color: accent ?? 'var(--text-primary)',
          }}
        >
          {value}
        </div>

        {sublabel && (
          <div
            className="mt-2.5 text-[12px] leading-tight"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}