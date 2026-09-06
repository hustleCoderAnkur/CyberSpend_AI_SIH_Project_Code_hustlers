interface PlaceholderProps {
  title: string
  description: string
}

export default function Placeholder({
  title,
  description,
}: PlaceholderProps) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-7 lg:px-8">
        {/* Header */}
        <header>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h1>

          <p
            className="mt-1 text-sm"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </p>
        </header>

        {/* Placeholder */}
        <section
          className="mt-6 flex min-h-[280px] items-center justify-center rounded-lg border border-dashed"
          style={{
            borderColor:
              'var(--border-hairline)',
            background: 'var(--bg-surface)',
          }}
        >
          <div className="text-center">
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border"
              style={{
                borderColor:
                  'var(--border-hairline)',
                background:
                  'var(--bg-base)',
                color:
                  'var(--text-tertiary)',
              }}
            >
              <span className="text-sm">—</span>
            </div>

            <p
              className="mt-3 text-[13px] font-medium"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              Coming soon
            </p>

            <p
              className="mt-1 text-[11px]"
              style={{
                color: 'var(--text-tertiary)',
              }}
            >
              This section is not available in the
              current prototype.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}