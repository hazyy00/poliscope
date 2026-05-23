export default function MembersLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sk { background: var(--ivd); border-radius: 2px; animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Search bar */}
        <div className="sk" style={{ height: 44, marginBottom: 32, borderRadius: 4 }} />
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i}>
              <div className="sk" style={{ width: '100%', aspectRatio: '3/4', marginBottom: 8 }} />
              <div className="sk" style={{ height: 16, width: '70%', marginBottom: 6 }} />
              <div className="sk" style={{ height: 12, width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
