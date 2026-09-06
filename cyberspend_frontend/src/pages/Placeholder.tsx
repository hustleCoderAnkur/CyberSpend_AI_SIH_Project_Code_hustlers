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
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-8">
        {/* Page header */}
        <header className="mb-8">
          <p
            className="font-data text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Security intelligence
          </p>

          <h1
            className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>

          <p
            className="mt-3 max-w-2xl text-sm leading-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {description}
          </p>
        </header>

        {/* Placeholder */}
        <section
          className="panel flex min-h-[360px] items-center justify-center"
        >
          <div className="px-6 py-12 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center border-2"
              style={{
                borderColor: 'var(--border-strong)',
                background: 'var(--bg-base)',
                color: 'var(--text-secondary)',
              }}
            >
              <span
                className="font-data text-lg font-semibold"
                aria-hidden="true"
              >
                —
              </span>
            </div>

            <div className="mt-6">
              <span
                className="inline-flex border px-2.5 py-1 font-data text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  borderColor: 'var(--border-hairline)',
                  background: 'var(--bg-surface-raised)',
                  color: 'var(--text-secondary)',
                }}
              >
                Prototype
              </span>

              <h2
                className="mt-4 text-base font-extrabold"
                style={{ color: 'var(--text-primary)' }}
              >
                Coming soon
              </h2>

              <p
                className="mx-auto mt-2 max-w-md text-xs leading-5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                This section is not available in the current
                prototype.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}