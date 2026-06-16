"use client";

import { useState, useEffect } from "react";
import type {
  Match, StandingRow, Lineup, XIPlayer, BenchPlayer, PlayerPos, MatchStats,
} from "@/lib/match-data";
import { TEAMS, TEAM_COLOR } from "@/lib/match-data";
import { POS, resolveLineups, resolveStats } from "@/lib/sample-detail";
import Flag from "./Flag";
import { IconBall, IconChevronLeft, IconWhistle } from "./Icons";

// Solid panel — bez backdrop-filter (overlay se animuje transformem).
function panel(extra: React.CSSProperties = {}): React.CSSProperties {
  return { background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 22, ...extra };
}
function evBubble(bg: string): React.CSSProperties {
  return { width: 32, height: 32, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", flex: "0 0 auto" };
}

// ── Pomocné: iniciály / barvy klubových odznaků ──────────────────────────────
function crestInitials(c: string): string {
  const w = c.split(/[\s'-]+/).filter(Boolean);
  return (w.length === 1 ? w[0].slice(0, 3) : w.map((x) => x[0]).join("").slice(0, 3)).toUpperCase();
}
function crestHue(c: string): number {
  let h = 0;
  for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
function avatarLetters(name: string): string {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  return (parts[parts.length - 1] ?? name).slice(0, 2).toUpperCase();
}

// ── Karta hráče (Sestavy) ────────────────────────────────────────────────────
function PlayerCard({
  name, num, pos, club, teamColor, subMinute, photo, clubLogo,
}: {
  name: string; num?: number | string | null; pos: PlayerPos; club: string;
  teamColor: string; subMinute?: number | null; photo?: string | null; clubLogo?: string | null;
}) {
  const p = POS[pos];
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showPhoto = !!photo && !photoFailed;
  const showLogo = !!clubLogo && !logoFailed;
  return (
    <div style={{ ...panel({ borderRadius: 15 }), display: "flex", alignItems: "center", gap: 12, padding: "9px 12px" }}>
      <div style={{ position: "relative", flex: "0 0 auto" }}>
        <div style={{ position: "relative", width: 46, height: 46, borderRadius: "50%", overflow: "hidden",
          background: `linear-gradient(150deg, ${teamColor}cc, ${teamColor}44)`, display: "grid", placeItems: "center",
          boxShadow: `0 0 0 1.5px ${teamColor}99, 0 0 14px ${teamColor}66` }}>
          {showPhoto ? (
            <img src={photo!} alt="" loading="lazy"
              onError={() => setPhotoFailed(true)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: .5 }}>{avatarLetters(name)}</span>
          )}
        </div>
        {subMinute != null ? (
          <span style={{ position: "absolute", bottom: -2, right: -3, width: 18, height: 18, borderRadius: 9,
            background: "#052e16", border: "1.5px solid #4ade80", display: "grid", placeItems: "center" }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M5 9V1" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M2 4.5L5 1L8 4.5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <span style={{ position: "absolute", bottom: -2, right: -3, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 9,
            background: "#0c0c0e", border: "1px solid rgba(255,255,255,.16)", display: "grid", placeItems: "center",
            fontSize: 10, fontWeight: 800, color: "#cfd3da", fontVariantNumeric: "tabular-nums" }}>{num ?? "—"}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 750, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
          <span style={{ flex: "0 0 auto", fontSize: 9, fontWeight: 800, letterSpacing: .6, color: p.color,
            padding: "2.5px 7px", borderRadius: 999, background: `${p.color}1f`, border: `1px solid ${p.color}40`,
            textTransform: "uppercase" }}>{p.label}</span>
          {subMinute != null && (
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#4ade80",
              flex: "0 0 auto", fontVariantNumeric: "tabular-nums" }}>{subMinute}′</span>
          )}
        </div>
        {club && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
            {showLogo ? (
              <img src={clubLogo!} alt="" loading="lazy"
                onError={() => setLogoFailed(true)}
                style={{ width: 16, height: 16, flex: "0 0 auto", objectFit: "contain" }} />
            ) : (
              <span style={{ width: 16, height: 16, borderRadius: 4, flex: "0 0 auto", display: "grid", placeItems: "center",
                fontSize: 6.5, fontWeight: 800, color: "#fff", background: `hsl(${crestHue(club)} 42% 34%)` }}>{crestInitials(club)}</span>
            )}
            <span style={{ fontSize: 12, color: "#9aa0aa", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{club}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Statistiky: donut + pruh ─────────────────────────────────────────────────
function DonutStat({ label, h, a, ch, ca }: { label: string; h: number; a: number; ch: string; ca: string }) {
  const total = h + a || 1, hp = h / total;
  const R = 34, C = 2 * Math.PI * R, SW = 9, S = 88;
  const homeLen = hp * C, awayLen = (1 - hp) * C;
  const fmt = (v: number) => (Number.isInteger(v) ? v : v.toFixed(1));
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: ch, fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "right" }}>{fmt(h)}</span>
      <div style={{ position: "relative", width: S, height: S, flex: "0 0 auto" }}>
        <svg width={S} height={S} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={SW} />
          <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke={ca} strokeWidth={SW}
            strokeDasharray={`${awayLen} ${C}`} strokeDashoffset={-homeLen} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${ca}aa)` }} />
          <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke={ch} strokeWidth={SW}
            strokeDasharray={`${homeLen} ${C}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${ch}aa)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", padding: 5 }}>
          <span style={{ lineHeight: 1.1, color: "#9aa0aa", fontWeight: 700, fontSize: 10 }}>{label}</span>
        </div>
      </div>
      <span style={{ fontSize: 18, fontWeight: 800, color: ca, fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "left" }}>{fmt(a)}</span>
    </div>
  );
}
function StatBar({ label, h, a, ch, ca }: { label: string; h: number; a: number; ch: string; ca: string }) {
  const total = h + a || 1, hp = (h / total) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: ch, fontVariantNumeric: "tabular-nums", minWidth: 32 }}>{h}</span>
        <span style={{ fontSize: 11.5, color: "#80858f", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: ca, fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>{a}</span>
      </div>
      <div style={{ display: "flex", height: 3, gap: 2 }}>
        <div style={{ width: `${hp}%`, background: ch, borderRadius: 2 }} />
        <div style={{ flex: 1, background: ca, borderRadius: 2 }} />
      </div>
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#71757f" }}>{children}</div>;
}

// ── Události ─────────────────────────────────────────────────────────────────
function EventIcon({ ev }: { ev: Match["events"][0] }) {
  if (ev.type === "goal") return <IconBall size={32} style={{ boxShadow: "0 0 10px rgba(255,255,255,.15)" }} />;
  if (ev.type === "yellow") return (
    <div style={evBubble("rgba(245,197,24,.16)")}>
      <span style={{ width: 11, height: 15, borderRadius: 2, background: "#f5c518", display: "block", boxShadow: "0 0 8px rgba(245,197,24,.5)" }} />
    </div>
  );
  if (ev.type === "red") return (
    <div style={evBubble("rgba(224,39,58,.18)")}>
      <span style={{ width: 11, height: 15, borderRadius: 2, background: "#e0273a", display: "block", boxShadow: "0 0 8px rgba(224,39,58,.6)" }} />
    </div>
  );
  return (
    <div style={evBubble("rgba(100,190,130,.12)")}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M8.5 17V9" stroke="#4ade80" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M6 11.5L8.5 9L11 11.5" stroke="#4ade80" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.5 7v8" stroke="#f87171" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M13 12.5L15.5 15L18 12.5" stroke="#f87171" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
function eventLabel(ev: Match["events"][0]): { title: string; sub: string } {
  if (ev.type === "goal")   return { title: "Gól",          sub: ev.assist ? `asistence ${ev.assist}` : "" };
  if (ev.type === "yellow") return { title: "Žlutá karta",  sub: "" };
  if (ev.type === "red")    return { title: "Červená karta", sub: "" };
  return { title: "Střídání", sub: ev.off ? `za ${ev.off}` : "" };
}

function Timeline({ match }: { match: Match }) {
  if (match.status === "upcoming" || match.events.length === 0) {
    return (
      <div style={{ ...panel(), padding: "26px 18px", textAlign: "center", color: "#9aa0aa" }}>
        <IconWhistle size={30} stroke="#6b7280" />
        <div style={{ marginTop: 10, fontWeight: 650, color: "#cfd3da", fontSize: 15 }}>
          {match.status === "upcoming" ? "Zápas zatím nezačal" : "Zatím žádné události"}
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Výkop {match.kickoff} · {match.stadium}</div>
      </div>
    );
  }
  const evs = [...match.events].sort((a, b) => b.minute - a.minute);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {evs.map((ev, i) => {
        const lab = eventLabel(ev);
        const left = ev.team === "h";
        return (
          <div key={i} style={{ display: "flex", justifyContent: left ? "flex-start" : "flex-end" }}>
            <div style={{ ...panel({ borderRadius: 16 }), padding: "11px 13px", maxWidth: "82%",
              display: "flex", alignItems: "center", gap: 11, flexDirection: left ? "row" : "row-reverse" }}>
              <EventIcon ev={ev} />
              <div style={{ textAlign: left ? "left" : "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexDirection: left ? "row" : "row-reverse" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{ev.minute}′</span>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: "#f3f4f6" }}>{ev.player}</span>
                </div>
                <div style={{ fontSize: 12, color: "#80858f", marginTop: 1 }}>
                  {lab.title}{lab.sub ? ` · ${lab.sub}` : ""}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupImpact({ match, groupRows }: { match: Match; groupRows: StandingRow[] | null }) {
  if (!match.group || !groupRows || groupRows.length === 0) return null;
  const inMatch = [match.home, match.away];
  return (
    <div style={{ ...panel(), padding: 14, marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "#cfd3da", marginBottom: 10, letterSpacing: .3 }}>
        Skupina {match.group} — aktuální pořadí
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 28px 40px 28px",
        fontSize: 11, color: "#71757f", fontWeight: 700, padding: "0 8px 7px" }}>
        <span /><span />
        <span style={{ textAlign: "center" }}>Z</span>
        <span style={{ textAlign: "center" }}>Skóre</span>
        <span style={{ textAlign: "center" }}>B</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {groupRows.map((r, i) => {
          const hl = inMatch.includes(r.code);
          const col = TEAM_COLOR[r.code];
          return (
            <div key={r.code} style={{ display: "grid", gridTemplateColumns: "20px 1fr 28px 40px 28px",
              alignItems: "center", padding: "8px", borderRadius: 11,
              background: hl ? `${col}26` : "transparent",
              border: hl ? `1px solid ${col}55` : "1px solid transparent" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: i < 2 ? "var(--accent)" : "#80858f" }}>{i + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Flag code={r.code} size={20} />
                <span style={{ fontSize: 13.5, fontWeight: hl ? 750 : 600, color: hl ? "#fff" : "#cfd3da" }}>
                  {TEAMS[r.code]?.name ?? r.code}
                </span>
              </div>
              <span style={{ fontSize: 12.5, textAlign: "center", color: "#9aa0aa", fontVariantNumeric: "tabular-nums" }}>{r.p}</span>
              <span style={{ fontSize: 12.5, textAlign: "center", color: "#9aa0aa", fontVariantNumeric: "tabular-nums" }}>{r.gf}:{r.ga}</span>
              <span style={{ fontSize: 13.5, textAlign: "center", fontWeight: 800, color: "#fff" }}>{r.pts}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, color: "#71757f" }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }} /> postup do osmifinále
      </div>
    </div>
  );
}

// ── Sestavy ──────────────────────────────────────────────────────────────────
// Řazení hráčů podle role: brankář → obránci → záložníci → útočníci.
const POS_ORDER: Record<PlayerPos, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
function byRole<T extends { pos: PlayerPos }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]);
}

function TeamLineup({ match, side, data }: { match: Match; side: "h" | "a"; data: Lineup }) {
  const [showBench, setShowBench] = useState(false);
  const code = side === "h" ? match.home : match.away;
  const tc = TEAM_COLOR[code] || "#7a7f88";

  const subEvents = match.events.filter((e) => e.type === "sub" && e.team === side);
  const bench = data.bench || [];
  const activeSubs = bench
    .filter((bp) => subEvents.some((se) => se.player === bp.name))
    .map((bp) => ({ ...bp, minute: subEvents.find((se) => se.player === bp.name)!.minute }));
  const inactiveBench = bench.filter((bp) => !subEvents.some((se) => se.player === bp.name));

  if (data.xi.length === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 2px 12px" }}>
        <Flag code={code} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{TEAMS[code]?.name ?? code}</div>
          <div style={{ fontSize: 11.5, color: "#80858f", fontWeight: 600 }}>Základní sestava</div>
        </div>
        {data.form && (
          <span style={{ fontSize: 12.5, fontWeight: 800, color: tc, padding: "4px 11px", borderRadius: 999,
            background: `${tc}22`, border: `1px solid ${tc}55`, letterSpacing: .5, fontVariantNumeric: "tabular-nums" }}>{data.form}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {byRole(data.xi).map((p: XIPlayer, i) => (
          <PlayerCard key={i} name={p.name} num={p.num} pos={p.pos} club={p.club} teamColor={tc} photo={p.photo} clubLogo={p.clubLogo} />
        ))}
      </div>

      {activeSubs.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 10px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M5 12V4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 6L5 4L7 6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 2v8" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 8l2 2 2-2" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 10, color: "#71757f", fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>Střídající hráči</span>
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {activeSubs.map((bp, i) => (
              <PlayerCard key={`sub-${i}`} name={bp.name} pos={bp.pos} club={bp.club} teamColor={tc} subMinute={bp.minute} photo={bp.photo} clubLogo={bp.clubLogo} />
            ))}
          </div>
        </>
      )}

      {inactiveBench.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowBench((s) => !s)} style={{
            width: "100%", padding: "11px 14px", borderRadius: 13, fontFamily: "inherit",
            background: showBench ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.11)", cursor: "pointer", color: "#9aa0aa",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Náhradníci
            <span style={{ background: "rgba(255,255,255,.1)", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{inactiveBench.length}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              style={{ marginLeft: 2, transform: showBench ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .22s" }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showBench && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
              {byRole(inactiveBench).map((bp: BenchPlayer, i) => (
                <PlayerCard key={`bench-${i}`} name={bp.name} num="—" pos={bp.pos} club={bp.club} teamColor={tc} photo={bp.photo} clubLogo={bp.clubLogo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Lineups({ match }: { match: Match }) {
  const lineups = resolveLineups(match);
  if (!lineups) {
    return (
      <div style={{ ...panel(), padding: "26px 18px", textAlign: "center", color: "#9aa0aa", fontSize: 14 }}>
        Sestavy budou dostupné před výkopem.
      </div>
    );
  }
  return (
    <div>
      <TeamLineup match={match} side="h" data={lineups.home} />
      <TeamLineup match={match} side="a" data={lineups.away} />
    </div>
  );
}

// ── Statistiky tab ───────────────────────────────────────────────────────────
function StatsTab({ match }: { match: Match }) {
  const s: MatchStats | null = resolveStats(match);
  if (!s) {
    return (
      <div style={{ ...panel(), padding: "26px 18px", textAlign: "center", color: "#9aa0aa", fontSize: 14 }}>
        Statistiky budou dostupné po výkopu.
      </div>
    );
  }
  const ch = TEAM_COLOR[match.home], ca = TEAM_COLOR[match.away];
  const legend = (code: typeof match.home, color: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Flag code={code} size={19} />
      <span style={{ fontSize: 12.5, fontWeight: 750, color: "#cfd3da" }}>{TEAMS[code]?.short ?? code}</span>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        {legend(match.home, ch)}
        <span style={{ width: 1, height: 16, background: "rgba(255,255,255,.12)" }} />
        {legend(match.away, ca)}
      </div>
      {s.donuts.length > 0 && (
        <div style={{ ...panel(), padding: "16px 12px 20px" }}>
          <div style={{ padding: "0 4px" }}><SectionLabel>Klíčové statistiky</SectionLabel></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 24, columnGap: 8, marginTop: 20 }}>
            {s.donuts.map(([label, h, a]) => <DonutStat key={label} label={label} h={h} a={a} ch={ch} ca={ca} />)}
          </div>
        </div>
      )}
      {s.bars.length > 0 && (
        <div style={{ ...panel(), padding: "16px 16px 18px" }}>
          <SectionLabel>Detailní statistiky</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 14 }}>
            {s.bars.map(([label, h, a]) => <StatBar key={label} label={label} h={h} a={a} ch={ch} ca={ca} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function RedDotInline() {
  return <span style={{ width: 9, height: 12, borderRadius: 2, background: "#e0273a", display: "inline-block",
    marginLeft: 6, verticalAlign: "middle", boxShadow: "0 0 6px rgba(224,39,58,.6)" }} />;
}
function Scorer({ ev, right }: { ev: Match["events"][0]; right?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, flexDirection: right ? "row-reverse" : "row" }}>
      <IconBall size={13} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#dfe2e7" }}>{ev.player}</span>
      <span style={{ fontSize: 12, color: "#80858f" }}>{ev.minute}′</span>
    </div>
  );
}

type Props = { match: Match; onClose: () => void; closing: boolean; groupRows?: StandingRow[] | null };

export default function MatchDetail({ match, onClose, closing, groupRows = null }: Props) {
  const [tab, setTab] = useState<"events" | "lineups" | "stats">("events");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const visible = entered && !closing;
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  const ch = TEAM_COLOR[match.home];
  const ca = TEAM_COLOR[match.away];
  const homeScorers = match.events.filter((e) => e.type === "goal" && e.team === "h");
  const awayScorers = match.events.filter((e) => e.type === "goal" && e.team === "a");
  const tabs = [["events", "Události"], ["lineups", "Sestavy"], ["stats", "Statistiky"]] as const;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "#09090b",
      display: "flex", flexDirection: "column", willChange: "transform",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform .42s cubic-bezier(.2,.7,.2,1)" }}>

      <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px 12px", position: "sticky", top: 0, zIndex: 5,
        background: "linear-gradient(to bottom, rgba(9,9,11,.98), rgba(9,9,11,.7))" }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: "50%",
          display: "grid", placeItems: "center", background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.12)", cursor: "pointer", padding: 0 }}>
          <IconChevronLeft size={20} stroke="#fff" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6" }}>Detail zápasu</span>
        {match.group && <span style={{ marginLeft: "auto", fontSize: 12, color: "#71757f", fontWeight: 600 }}>Sk. {match.group}</span>}
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" as never }} className="noscroll">
        <div style={{ position: "relative", padding: "8px 18px 22px", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "-25%", top: "-10%", width: "75%", height: 260,
            pointerEvents: "none", background: `radial-gradient(circle at 40% 40%, ${ch}40, transparent 65%)`,
            filter: "blur(60px)", opacity: "var(--glow-opacity)" as never }} />
          <div style={{ position: "absolute", right: "-25%", top: "-10%", width: "75%", height: 260,
            pointerEvents: "none", background: `radial-gradient(circle at 60% 40%, ${ca}40, transparent 65%)`,
            filter: "blur(60px)", opacity: "var(--glow-opacity)" as never }} />

          <div style={{ position: "relative" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              {match.status === "live" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
                  borderRadius: 999, background: "rgba(217,30,54,.16)", border: "1px solid rgba(255,80,110,.35)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4d6a",
                    boxShadow: "0 0 8px #ff4d6a", animation: "pulse 1.3s infinite" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ff7a90", letterSpacing: .3 }}>
                    {match.minute ? `${match.minute}′ ` : ""}ŽIVĚ
                  </span>
                </div>
              )}
              {match.status === "finished" && (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#9aa0aa", letterSpacing: .6 }}>KONEC</span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11 }}>
                <Flag code={match.home} size={72} />
                <span style={{ fontSize: 15, fontWeight: 750, color: "#fff", textAlign: "center" }}>
                  {home.name}{match.reds.h && <RedDotInline />}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {match.status === "upcoming"
                  ? <span style={{ fontSize: 30, fontWeight: 800, color: "#6b7280" }}>VS</span>
                  : <span style={{ fontSize: 54, fontWeight: 860, color: "#fff", letterSpacing: 1, lineHeight: 1,
                      fontVariantNumeric: "tabular-nums", textShadow: "0 4px 30px rgba(0,0,0,.5)" }}>
                      {match.score.h}<span style={{ color: "#52555c", margin: "0 6px" }}>:</span>{match.score.a}
                    </span>}
                <span style={{ fontSize: 11.5, color: "#80858f", fontWeight: 600 }}>
                  {match.status === "upcoming" ? `Výkop ${match.kickoff}` : ""}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11 }}>
                <Flag code={match.away} size={72} />
                <span style={{ fontSize: 15, fontWeight: 750, color: "#fff", textAlign: "center" }}>
                  {away.name}{match.reds.a && <RedDotInline />}
                </span>
              </div>
            </div>

            {(homeScorers.length > 0 || awayScorers.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                  {homeScorers.map((e, i) => <Scorer key={i} ev={e} />)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                  {awayScorers.map((e, i) => <Scorer key={i} ev={e} right />)}
                </div>
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#71757f" }}>
              {[match.stadium, match.city].filter(Boolean).join(", ")}
            </div>
          </div>
        </div>

        <div style={{ position: "sticky", top: 0, zIndex: 4, padding: "8px 18px 0",
          background: "linear-gradient(to bottom, #09090b 60%, transparent)" }}>
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            {tabs.map(([k, label]) => {
              const on = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "12px 4px 13px",
                  background: "none", border: "none", cursor: "pointer", position: "relative",
                  fontSize: 13.5, fontWeight: on ? 750 : 600, color: on ? "#fff" : "#7e828c" }}>
                  {label}
                  {on && <span style={{ position: "absolute", left: "18%", right: "18%", bottom: -1, height: 3,
                    borderRadius: 3, background: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "16px 18px 90px" }}>
          {tab === "events"  && <><Timeline match={match} /><GroupImpact match={match} groupRows={groupRows} /></>}
          {tab === "lineups" && <Lineups match={match} />}
          {tab === "stats"   && <StatsTab match={match} />}
        </div>
      </div>
    </div>
  );
}
