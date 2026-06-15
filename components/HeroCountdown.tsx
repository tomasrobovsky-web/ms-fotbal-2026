"use client";

import { useState, useEffect, useRef } from "react";
import type { TeamCode } from "@/lib/match-data";
import { TEAMS } from "@/lib/match-data";
import Flag from "./Flag";

function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(targetRef.current * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);

  return v;
}

type Props = {
  daysToStart: number;
  dateLabel: string;
  opponent: TeamCode;
};

export default function HeroCountdown({ daysToStart, dateLabel, opponent }: Props) {
  const big = useCountUp(daysToStart, 850);
  const opp = TEAMS[opponent];

  return (
    <div style={{
      position: "relative", overflow: "hidden", padding: "26px 22px 22px", marginBottom: 18,
      background: "var(--glass-bg)",
      backdropFilter: "blur(var(--glass-blur))",
      WebkitBackdropFilter: "blur(var(--glass-blur))" as never,
      border: "1px solid var(--glass-border)",
      borderRadius: 22,
      aspectRatio: "1799/1200",
      display: "flex", flexDirection: "column",
    }}>

      {/* rotating field background image */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/field-bg.jpg" alt="" style={{
          position: "absolute", top: "50%", left: "50%",
          height: "150%", width: "auto", maxWidth: "none",
          transform: "translate(-50%, -50%) rotate(90deg)",
          opacity: 0.72, transformOrigin: "center center",
        }} />
      </div>

      {/* dark gradient overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(165deg, rgba(9,9,11,.38) 0%, rgba(9,9,11,.62) 55%, rgba(9,9,11,.9) 100%)" }} />

      {/* neon glow */}
      <div style={{ position: "absolute", left: "50%", top: "8%", width: 280, height: 180,
        transform: "translateX(-50%)", pointerEvents: "none", mixBlendMode: "screen",
        background: "radial-gradient(60% 60% at 50% 40%, var(--accent-glow), transparent 70%)",
        filter: "blur(18px)", opacity: "var(--glow-opacity)" as never }} />

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* kicker top */}
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#e6e7ea",
            textTransform: "uppercase", textShadow: "0 1px 8px rgba(0,0,0,.6)" }}>
            Odpočet do startu
          </span>
        </div>

        {/* number + chip bottom */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <span style={{ fontWeight: 860, lineHeight: .85, letterSpacing: -3, color: "#fff",
              fontVariantNumeric: "tabular-nums",
              textShadow: "0 2px 16px rgba(0,0,0,.55), 0 0 34px var(--accent-glow)",
              width: "60px", fontSize: "108px" }}>{big}</span>
            <span style={{ fontSize: 20, fontWeight: 750, color: "#f3f4f6", paddingBottom: 10, lineHeight: 1.05,
              textShadow: "0 1px 8px rgba(0,0,0,.6)" }}>
              den<br />šampionátu
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9,
            padding: "10px 12px", borderRadius: 14, background: "rgba(9,9,11,.42)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" as never,
            border: "1px solid rgba(255,255,255,.10)" }}>
            <Flag code="CZE" size={26} />
            <Flag code={opponent} size={26} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 2 }}>
              <span style={{ fontSize: 11, color: "#c3c6cc", fontWeight: 600, letterSpacing: .3 }}>Nejbližší zápas ČR</span>
              <span style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>
                Česko – {opp.name} · {dateLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
