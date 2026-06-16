import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Flag from "@/components/Flag";
import { IconTable } from "@/components/Icons";
import { TEAMS, type StandingRow, type GroupData } from "@/lib/match-data";
import { getGroups, getThirdPlaces } from "@/lib/standings";

// Čte se za běhu, aby se po refreshi dat (init-data/worker) projevily nové tabulky.
export const dynamic = "force-dynamic";

function rankStyle(kind: "direct" | "play" | "out") {
  if (kind === "direct") return {
    bar: "var(--accent)", num: "var(--accent)",
    tint: "rgba(165,217,255,.07)",
  };
  if (kind === "play") return {
    bar: "var(--accent-2)", num: "var(--accent-2)",
    tint: "rgba(1,64,234,.07)",
  };
  return { bar: "transparent", num: "#71757f", tint: "transparent" };
}

function StandRow({ rank, row, kind, last, showGroup, group }: {
  rank: number; row: StandingRow; kind: "direct" | "play" | "out";
  last: boolean; showGroup?: boolean; group?: string;
}) {
  const team = TEAMS[row.code];
  const rs = rankStyle(kind);
  return (
    <div style={{
      position: "relative", display: "grid",
      gridTemplateColumns: showGroup ? "26px 1fr 30px 52px 34px" : "26px 1fr 52px 34px",
      alignItems: "center", gap: 8, padding: "11px 14px",
      background: rs.tint,
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,.055)",
    }}>
      <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3.5, borderRadius: 3, background: rs.bar }} />
      <span style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: rs.num, fontVariantNumeric: "tabular-nums" }}>
        {rank}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Flag code={row.code} size={28} />
        <span style={{ fontSize: 14.5, fontWeight: 650, color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {team ? team.name : row.code}
        </span>
      </div>
      {showGroup && (
        <span style={{ textAlign: "center", fontSize: 12, fontWeight: 750, color: "#9aa0aa" }}>{group}</span>
      )}
      <span style={{ textAlign: "center", fontSize: 13.5, color: "#c3c6cc", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {row.gf}:{row.ga}
      </span>
      <span style={{ textAlign: "center", fontSize: 15, fontWeight: 850, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
        {row.pts}
      </span>
    </div>
  );
}

function HeadRow({ showGroup }: { showGroup?: boolean }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: showGroup ? "26px 1fr 30px 52px 34px" : "26px 1fr 52px 34px",
      alignItems: "center", gap: 8, padding: "8px 14px 8px",
      fontSize: 10.5, fontWeight: 750, letterSpacing: .8, color: "#6b7280", textTransform: "uppercase",
    }}>
      <span style={{ textAlign: "center" }}>#</span>
      <span>Tým</span>
      {showGroup && <span style={{ textAlign: "center" }}>Sk.</span>}
      <span style={{ textAlign: "center" }}>Skóre</span>
      <span style={{ textAlign: "center" }}>B</span>
    </div>
  );
}

function GroupCard({ data }: { data: GroupData }) {
  const rounds = data.rows[0]?.p ?? 0;
  return (
    <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)",
      borderRadius: 22, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#0b0b0d",
          fontWeight: 850, fontSize: 15, boxShadow: "0 4px 12px var(--accent-glow)" }}>
          {data.group}
        </span>
        <span style={{ fontSize: 15.5, fontWeight: 800, color: "#f3f4f6" }}>Skupina {data.group}</span>
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#71757f", fontWeight: 600 }}>
          {rounds > 0 ? `${rounds}. kolo` : "nezahájeno"}
        </span>
      </div>
      <HeadRow />
      <div>
        {data.rows.map((row, i) => {
          const kind: "direct" | "play" | "out" = i < 2 ? "direct" : i === 2 ? "play" : "out";
          return (
            <StandRow key={row.code} rank={i + 1} row={row} kind={kind} last={i === data.rows.length - 1} />
          );
        })}
      </div>
    </div>
  );
}

function ThirdsTable({ thirds }: { thirds: (StandingRow & { group: string })[] }) {
  const QUAL = 8;
  return (
    <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)",
      borderRadius: 22, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <IconTable size={20} stroke="var(--accent)" sw={2.2} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: "#f3f4f6" }}>Nejlepší týmy z třetích míst</span>
          <span style={{ fontSize: 11.5, color: "#71757f", fontWeight: 600, marginTop: 5 }}>
            Postupuje 8 nejlepších z 12 skupin
          </span>
        </div>
      </div>
      <HeadRow showGroup />
      <div>
        {thirds.map((row, i) => (
          <>
            <StandRow
              key={row.code + row.group}
              rank={i + 1} row={row}
              kind={i < QUAL ? "direct" : "out"}
              showGroup group={row.group}
              last={i === thirds.length - 1}
            />
            {i === QUAL - 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px",
                background: "rgba(165,217,255,.06)" }}>
                <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--accent))" }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "var(--accent)", textTransform: "uppercase" }}>
                  hranice postupu
                </span>
                <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--accent), transparent)" }} />
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)",
      borderRadius: 16, display: "flex", flexWrap: "wrap", gap: "10px 16px",
      padding: "12px 15px", marginBottom: 18 }}>
      {[
        { color: "var(--accent)", label: "Postup (1.–2.)" },
        { color: "var(--accent-2)", label: "Skupina 3. míst" },
        { color: "rgba(255,255,255,.14)", label: "Vyřazení" },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: color, flex: "0 0 auto" }} />
          <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 650 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function SkupinyPage() {
  const groups = await getGroups();
  const thirds = await getThirdPlaces();
  return (
    <div style={{ minHeight: "100dvh", width: "100%", display: "flex", justifyContent: "center",
      position: "relative", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>

      {/* ambient background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
        pointerEvents: "none", background: "#050506" }}>
        <div style={{ position: "absolute", width: 420, height: 420, top: "-8%", left: "-12%",
          borderRadius: "50%", filter: "blur(80px)",
          background: "rgba(165,217,255,.45)", opacity: .5 }} />
        <div style={{ position: "absolute", width: 380, height: 380, bottom: "-10%", right: "-12%",
          borderRadius: "50%", filter: "blur(80px)",
          background: "rgba(1,64,234,.4)", opacity: .45 }} />
        <div style={{ position: "absolute", width: 300, height: 300, top: "40%", left: "55%",
          borderRadius: "50%", filter: "blur(80px)",
          background: "rgba(56,120,255,.18)" }} />
      </div>

      {/* phone container */}
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", position: "relative",
        background: "#09090b", overflow: "hidden", zIndex: 1,
        boxShadow: "0 0 80px rgba(0,0,0,.6)",
        borderLeft: "1px solid rgba(255,255,255,.05)",
        borderRight: "1px solid rgba(255,255,255,.05)" }}>

        {/* in-app ambient top */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 360, height: 280, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(50% 50% at 50% 50%, rgba(165,217,255,.45), transparent 70%)",
          opacity: .95, filter: "blur(30px)" }} />

        <div className="noscroll" style={{ position: "relative", zIndex: 1, height: "100dvh",
          overflowY: "auto", WebkitOverflowScrolling: "touch" as never,
          padding: "max(14px, env(safe-area-inset-top)) 18px 110px" }}>

          <Header />

          {/* Page hero banner */}
          <div style={{ position: "relative", overflow: "hidden", padding: "30px 24px 26px", marginBottom: 18,
            background: "var(--glass-bg)",
            backdropFilter: "blur(26px)", WebkitBackdropFilter: "blur(26px)" as never,
            border: "1px solid var(--glass-border)", borderRadius: 22,
            aspectRatio: "4/3", minHeight: 280, display: "flex", flexDirection: "column" }}>
            {/* rotating field bg */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit",
              clipPath: "inset(0 round 22px)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/field-bg.jpg" alt="" style={{
                position: "absolute", top: "50%", left: "50%",
                height: "150%", width: "auto", maxWidth: "none",
                transform: "translate(-50%, -50%) rotate(90deg)",
                opacity: 0.72, transformOrigin: "center center",
              }} />
            </div>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(165deg, rgba(9,9,11,.38) 0%, rgba(9,9,11,.62) 55%, rgba(9,9,11,.9) 100%)" }} />
            <div style={{ position: "absolute", left: "50%", top: "8%", width: 280, height: 180,
              transform: "translateX(-50%)", pointerEvents: "none", mixBlendMode: "screen",
              background: "radial-gradient(60% 60% at 50% 40%, rgba(165,217,255,.45), transparent 70%)",
              filter: "blur(18px)", opacity: .95 }} />
            <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11.5, fontWeight: 750, letterSpacing: 2.2, color: "#e6e7ea",
                textTransform: "uppercase", textShadow: "0 1px 8px rgba(0,0,0,.6)", display: "block" }}>
                MS 2026 · Skupinová fáze
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <span style={{ fontSize: 46, fontWeight: 860, lineHeight: .9, letterSpacing: -2, color: "#fff",
                    textShadow: "0 2px 16px rgba(0,0,0,.55), 0 0 34px rgba(165,217,255,.45)", display: "block", marginBottom: 8 }}>
                    Skupiny
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 650, color: "#c3c6cc", letterSpacing: -.2,
                    textShadow: "0 1px 8px rgba(0,0,0,.6)", display: "block", marginBottom: 8 }}>
                    12 skupin · 48 týmů · 104 zápasů
                  </span>
                </div>
                <Legend />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {groups.map((g) => (
              <GroupCard key={g.group} data={g} />
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
              <span style={{ fontSize: 11, color: "#71757f", fontWeight: 600 }}>NEJLEPŠÍ TŘETÍ MÍSTA</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
            </div>

            <ThirdsTable thirds={thirds} />
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
