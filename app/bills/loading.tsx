export default function BillsLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sk { background: var(--ivd); border-radius: 2px; animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Status cards strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[80, 60, 60, 60, 60].map((w, i) => (
            <div key={i} className="sk" style={{ width: w, height: 64 }} />
          ))}
        </div>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="sk" style={{ flex: 1, height: 40 }} />
          <div className="sk" style={{ width: 200, height: 40 }} />
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 280px 110px', gap: 24, padding: '20px 14px 20px 6px', borderBottom: '0.5px solid var(--bd)' }}>
            <div className="sk" style={{ height: 24, width: 60 }} />
            <div>
              <div className="sk" style={{ height: 20, marginBottom: 8, width: `${70 + (i % 3) * 10}%` }} />
              <div className="sk" style={{ height: 12, width: 160 }} />
            </div>
            <div className="sk" style={{ height: 32 }} />
            <div className="sk" style={{ height: 20, marginLeft: 'auto', width: 60 }} />
          </div>
        ))}
      </div>
    </main>
  )
}
