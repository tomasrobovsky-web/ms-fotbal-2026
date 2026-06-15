"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, GroupData, StandingRow } from "@/lib/match-data";
import { NEXT_CZE } from "@/lib/match-data";
import type { CardVariant } from "@/components/MatchCard";
import Header from "@/components/Header";
import HeroCountdown from "@/components/HeroCountdown";
import DatePicker from "@/components/DatePicker";
import MatchCard from "@/components/MatchCard";
import MatchDetail from "@/components/MatchDetail";
import BottomNav from "@/components/BottomNav";

// --- pomocné funkce na práci s daty "YYYY-MM-DD" (ISO se porovnává lexikálně) ---
function pragueToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()); // en-CA -> "YYYY-MM-DD"
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function clamp(v: string, lo: string, hi: string): string {
  return v < lo ? lo : v > hi ? hi : v;
}

function headerLabel(date: string, today: string): string {
  if (date === today) return "Dnešní zápasy";
  if (date === addDays(today, -1)) return "Včerejší zápasy";
  if (date === addDays(today, 1)) return "Zítřejší zápasy";
  const [, m, d] = date.split("-");
  return `Zápasy ${Number(d)}. ${Number(m)}.`;
}

function plural(n: number): string {
  return n === 1 ? "zápas" : n < 5 ? "zápasy" : "zápasů";
}

export default function ZapasyClient({ matches, groups = [] }: { matches: Match[]; groups?: GroupData[] }) {
  const cardVariant: CardVariant = "classic";

  // Mapa skupina -> pořadí (pro „dopad na skupinu" v detailu).
  const groupMap = useMemo(() => {
    const m: Record<string, StandingRow[]> = {};
    for (const g of groups) m[g.group] = g.rows;
    return m;
  }, [groups]);

  const today = pragueToday();

  // rozsah turnaje z dat; anchor (prostřední den okna) se v něm drží tak,
  // aby okno [anchor-1, anchor, anchor+1] nevyjelo mimo.
  const { minDate, maxDate } = useMemo(() => {
    const dates = matches.map((m) => m.date ?? "").filter(Boolean).sort();
    return { minDate: dates[0] ?? today, maxDate: dates[dates.length - 1] ?? today };
  }, [matches, today]);

  const anchorLo = minDate < maxDate ? addDays(minDate, 1) : minDate;
  const anchorHi = minDate < maxDate ? addDays(maxDate, -1) : maxDate;

  const [anchor, setAnchor] = useState<string>(() => clamp(today, anchorLo, anchorHi));
  const [selectedDate, setSelectedDate] = useState<string>(() => clamp(today, minDate, maxDate));

  const windowDates = [addDays(anchor, -1), anchor, addDays(anchor, 1)];
  const canPrev = windowDates[0] > minDate;
  const canNext = windowDates[2] < maxDate;

  const shift = (dir: 1 | -1) => {
    const next = clamp(addDays(anchor, dir), anchorLo, anchorHi);
    setAnchor(next);
    setSelectedDate(next); // jeden den z posunuté trojice zůstane vybraný (prostřední)
  };

  const dayMatches = useMemo(
    () => matches.filter((m) => m.date === selectedDate),
    [matches, selectedDate]
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const openMatch: Match | null = openId ? matches.find((m) => m.id === openId) ?? null : null;
  const groupRows = openMatch?.group ? groupMap[openMatch.group] ?? null : null;

  // Deep-link: #zapas=<id> drží otevřený detail (sdílitelný odkaz, funguje Zpět).
  useEffect(() => {
    const sync = () => {
      const m = (window.location.hash || "").match(/zapas=([^&]+)/);
      setOpenId(m ? decodeURIComponent(m[1]) : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const openDetail = (id: string) => {
    window.location.hash = "zapas=" + encodeURIComponent(id);
    setOpenId(id);
  };

  const closeDetail = () => {
    setClosing(true);
    setTimeout(() => {
      setOpenId(null);
      setClosing(false);
      if (/zapas=/.test(window.location.hash)) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }, 420);
  };

  return (
    <div style={{ minHeight: "100dvh", width: "100%", display: "flex", justifyContent: "center",
      position: "relative", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>

      {/* ambient blobs behind the phone (desktop) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none",
        background: "#050506" }}>
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

        {/* in-app ambient glow top */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 360, height: 280, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(50% 50% at 50% 50%, var(--accent-glow), transparent 70%)",
          opacity: "var(--glow-opacity)" as never, filter: "blur(30px)" }} />

        {/* scrollable content */}
        <div className="noscroll" style={{ position: "relative", zIndex: 1, height: "100dvh",
          overflowY: "auto", WebkitOverflowScrolling: "touch" as never,
          padding: "max(14px, env(safe-area-inset-top)) 18px 110px" }}>

          <Header />
          <HeroCountdown
            daysToStart={NEXT_CZE.daysToStart}
            dateLabel={NEXT_CZE.dateLabel}
            opponent={NEXT_CZE.opponent}
          />
          <DatePicker
            windowDates={windowDates}
            selectedDate={selectedDate}
            today={today}
            yesterday={addDays(today, -1)}
            tomorrow={addDays(today, 1)}
            onSelect={setSelectedDate}
            onShift={shift}
            canPrev={canPrev}
            canNext={canNext}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            margin: "2px 4px 12px" }}>
            <span style={{ fontSize: 15, fontWeight: 750, color: "#f3f4f6" }}>
              {headerLabel(selectedDate, today)}
            </span>
            <span style={{ fontSize: 12.5, color: "#71757f", fontWeight: 600 }}>
              {dayMatches.length} {plural(dayMatches.length)}
            </span>
          </div>

          <div key={selectedDate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} variant={cardVariant} onOpen={() => openDetail(m.id)} />
            ))}
            {dayMatches.length === 0 && (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#71757f", fontSize: 14 }}>
                Žádné zápasy
              </div>
            )}
          </div>
        </div>

        <BottomNav />

        {/* detail overlay — position: absolute inside the phone container */}
        {openMatch && (
          <MatchDetail match={openMatch} onClose={closeDetail} closing={closing} groupRows={groupRows} />
        )}
      </div>
    </div>
  );
}
