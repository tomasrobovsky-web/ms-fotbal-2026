import BottomNav from "@/components/BottomNav";

export default function StadionyPage() {
  return (
    <div style={{ minHeight: "100dvh", width: "100%", display: "flex", justifyContent: "center",
      background: "#050506", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", position: "relative",
        background: "#09090b", borderLeft: "1px solid rgba(255,255,255,.05)",
        borderRight: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ padding: "max(14px, env(safe-area-inset-top)) 18px 110px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "100dvh" }}>
          <span style={{ fontSize: 52, marginBottom: 16 }}>🏟️</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f3f4f6", marginBottom: 8 }}>Stadiony</h1>
          <p style={{ color: "#71757f", fontSize: 14 }}>Tato sekce se připravuje.</p>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
