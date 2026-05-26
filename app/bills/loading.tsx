export default function BillsLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 60px' }}>
      <style>{`
        @keyframes sk-pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sk { background: var(--ivd); border-radius: 2px; animation: sk-pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Back link */}
        <div className="sk" style={{ height: 13, width: 90, marginBottom: 16 }} />

        {/* Page header: title left, status cards right */}
        <header style={{
          marginTop: 18,
          display: 'grid', gridTemplateColumns: '1fr auto',
          alignItems: 'end', gap: 32,
          paddingBottom: 28, borderBottom: '0.5px solid var(--bd)',
          marginBottom: 24,
        }}>
          <div>
            <div className="sk" style={{ height: 56, width: 360, marginBottom: 14 }} />
            <div className="sk" style={{ height: 14, width: 420, marginBottom: 6 }} />
            <div className="sk" style={{ height: 14, width: 320 }} />
          </div>
          {/* Status cards */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[72, 72, 72, 72].map((w, i) => (
              <div key={i} className="sk" style={{ width: w, height: 64, borderRadius: 4 }} />
            ))}
          </div>
        </header>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div className="sk" style={{ flex: 1, height: 40 }} />
          <div className="sk" style={{ width: 160, height: 40 }} />
          <div className="sk" style={{ width: 200, height: 40 }} />
        </div>

        {/* Result count */}
        <div className="sk" style={{ height: 11, width: 80, marginBottom: 10 }} />
        <div style={{ height: '0.5px', background: 'var(--bd)', marginBottom: 0 }} />

        {/* Bill rows: gridTemplateColumns: '110px 1fr 280px 110px' */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 280px 110px',
            gap: 24,
            padding: '20px 14px 20px 6px',
            borderBottom: '0.5px solid var(--bd)',
            alignItems: 'center',
          }}>
            {/* Col 1: status badge */}
            <div className="sk" style={{ height: 26, width: 56, borderRadius: 2 }} />
            {/* Col 2: title + meta */}
            <div>
              <div className="sk" style={{ height: 18, width: `${60 + (i % 4) * 10}%`, marginBottom: 8 }} />
              <div className="sk" style={{ height: 12, width: 200 }} />
            </div>
            {/* Col 3: vote bar */}
            <div className="sk" style={{ height: 32 }} />
            {/* Col 4: date */}
            <div className="sk" style={{ height: 14, width: 64, marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </main>
  )
}
