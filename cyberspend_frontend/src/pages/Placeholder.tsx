interface PlaceholderProps {
  title: string
  description: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>
      <div
        className="flex min-h-70 items-center justify-center rounded-lg border border-dashed"
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          Not built yet in this scaffold
        </span>
      </div>
    </div>
  )
}
