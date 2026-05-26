export default function MemberDetailLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sk { background: rgba(0,0,0,0.09); border-radius: 2px; animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="sk" style={{ width: 120, height: 14, marginBottom: 32 }} />
        {/* Profile header 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, marginBottom: 40 }}>
          <div className="sk" style={{ aspectRatio: '3/4', borderRadius: 12 }} />
          <div style={{ paddingTop: 8 }}>
            <div className="sk" style={{ width: 120, height: 36, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[60, 80, 50].map((w, i) => <div key={i} className="sk" style={{ width: w, height: 26, borderRadius: 20 }} />)}
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              {[3].map((_, i) => (
                <div key={i}>
                  <div className="sk" style={{ width: 60, height: 32, marginBottom: 6 }} />
                  <div className="sk" style={{ width: 40, height: 12 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bd)', marginBottom: 28 }}>
          {[70, 70, 50].map((w, i) => <div key={i} className="sk" style={{ width: w, height: 36, margin: '0 2px' }} />)}
        </div>
        {/* Content rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--bd)' }}>
            <div className="sk" style={{ width: 40, height: 20 }} />
            <div className="sk" style={{ flex: 1, height: 20 }} />
            <div className="sk" style={{ width: 60, height: 20 }} />
          </div>
        ))}
      </div>
    </main>
  )
}
