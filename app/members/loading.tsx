export default function MembersLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--m-bg)', padding: '80px 24px 80px' }}>
      <style>{`
        @keyframes sk-pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sk { background: var(--m-faint); animation: sk-pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: 8, marginTop: 28 }}>
          <div className="sk" style={{ height: 72, width: 280, marginBottom: 12 }} />
          <div className="sk" style={{ height: 14, width: 380 }} />
        </div>

        {/* Filter bar */}
        <div style={{ marginBottom: 20, marginTop: 32 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 0.9fr 0.7fr auto',
            gap: 10,
          }}>
            <div className="sk" style={{ height: 46 }} />
            <div className="sk" style={{ height: 46 }} />
            <div className="sk" style={{ height: 46 }} />
            <div className="sk" style={{ height: 46, width: 220 }} />
          </div>
          {/* Count row */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <div className="sk" style={{ height: 12, width: 100 }} />
            <div className="sk" style={{ height: 12, width: 60 }} />
          </div>
        </div>

        {/* Benchmark header */}
        <div className="sk" style={{ height: 42, marginBottom: 14 }} />

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 10,
        }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              background: 'var(--m-panel)',
              border: '1px solid var(--m-faint)',
              padding: 16,
            }}>
              {/* Header: photo + identity */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="sk" style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div className="sk" style={{ height: 22, width: '70%', marginBottom: 10 }} />
                  <div className="sk" style={{ height: 20, width: '60%', borderRadius: 999, marginBottom: 8 }} />
                  <div className="sk" style={{ height: 12, width: '50%' }} />
                </div>
              </div>

              {/* Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="sk" style={{ height: 11, width: 50 }} />
                    <div className="sk" style={{ height: 11, width: 40 }} />
                  </div>
                  <div className="sk" style={{ height: 4, width: '100%' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="sk" style={{ height: 11, width: 40 }} />
                    <div className="sk" style={{ height: 11, width: 35 }} />
                  </div>
                  <div className="sk" style={{ height: 4, width: '100%' }} />
                </div>
              </div>

              {/* Footer: policy areas */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--m-faint)' }}>
                <div className="sk" style={{ height: 10, width: 50, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 5 }}>
                  <div className="sk" style={{ height: 24, width: 60, borderRadius: 2 }} />
                  <div className="sk" style={{ height: 24, width: 55, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
