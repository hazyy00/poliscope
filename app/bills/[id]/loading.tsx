export default function BillDetailLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 0 80px' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sk { background: rgba(0,0,0,0.09); border-radius: 2px; animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px' }}>
        {/* Back link */}
        <div className="sk" style={{ width: 120, height: 14, marginBottom: 16 }} />
        {/* Header 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 48, marginBottom: 36, paddingBottom: 30, borderBottom: '0.5px solid var(--bd)' }}>
          <div>
            <div className="sk" style={{ width: 60, height: 24, marginBottom: 16 }} />
            <div className="sk" style={{ width: '90%', height: 36, marginBottom: 8 }} />
            <div className="sk" style={{ width: '70%', height: 36, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="sk" style={{ width: 100, height: 14 }} />
              <div className="sk" style={{ width: 100, height: 14 }} />
            </div>
          </div>
          <div className="sk" style={{ height: 80, borderRadius: 4 }} />
        </div>
        {/* Vote section */}
        <div className="sk" style={{ height: 200, marginBottom: 40 }} />
        <div className="sk" style={{ height: 160 }} />
      </div>
    </main>
  )
}
