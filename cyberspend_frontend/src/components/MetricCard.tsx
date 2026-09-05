interface MetricCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: string
}

export default function MetricCard({ label, value, sublabel, accent }: MetricCardProps) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-md border px-4 py-3.5"
      style={{ borderColor: 'var(--border-hairline)', background: 'var(--bg-surface)' }}
    >
      <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span
        className="font-data text-[22px] font-medium leading-none"
        style={{ color: accent ?? 'var(--text-primary)' }}
      >
        {value}
      </span>
      {sublabel && (
        <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
