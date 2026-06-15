import Image from "next/image";

export default function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 4px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Image src="/assets/trophy.png" alt="FIFA World Cup" width={44} height={44}
          style={{ height: 44, width: "auto", filter: "drop-shadow(0 0 10px rgba(165,217,255,.35))" }} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontWeight: 850, fontSize: 13, letterSpacing: 1.5,
            color: "rgba(255,255,255,.5)", textTransform: "uppercase" }}>FIFA</span>
          <span style={{ fontWeight: 850, fontSize: 17, letterSpacing: -0.5, color: "#fff" }}>
            Mistrovství světa{" "}
            <span style={{ textShadow: "0 0 14px var(--accent-glow)", color: "rgb(165,217,255)" }}>2026</span>
          </span>
        </div>
      </div>
    </div>
  );
}
