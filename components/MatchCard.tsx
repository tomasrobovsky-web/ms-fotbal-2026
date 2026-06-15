"use client";

import Image from "next/image";
import type { Match } from "@/lib/match-data";
import { TEAMS, TEAM_COLOR } from "@/lib/match-data";
import Flag from "./Flag";
import { IconBall, IconClock } from "./Icons";

export type CardVariant = "classic" | "split" | "minimal";

function glassStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: "var(--glass-bg)",
    backdropFilter: "blur(var(--glass-blur))",
    WebkitBackdropFilter: "blur(var(--glass-blur))" as never,
    border: "1px solid var(--glass-border)",
    borderRadius: 22,
    ...extra,
  };
}

function StatusBadge({ match }: { match: Match }) {
  if (match.status === "live") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
        borderRadius: 999, background: "rgba(217,30,54,.16)", border: "1px solid rgba(255,80,110,.35)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4d6a",
          boxShadow: "0 0 8px #ff4d6a", animation: "pulse 1.3s infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#ff7a90", letterSpacing: .3 }}>
          {match.minute}′ ŽIVĚ
        </span>
      </div>
    );
  }
  if (match.status === "finished") {
    return <span style={{ fontSize: 11.5, fontWeight: 700, color: "#9aa0aa", letterSpacing: .6 }}>KONEC</span>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#cfd3da" }}>
      <IconClock size={13} stroke="#cfd3da" sw={2.2} /> {match.kickoff}
    </div>
  );
}

function RedDot({ show }: { show?: boolean }) {
  if (!show) return null;
  return <span style={{ width: 9, height: 12, borderRadius: 2, background: "#e0273a",
    display: "inline-block", boxShadow: "0 0 6px rgba(224,39,58,.6)", marginLeft: 6, verticalAlign: "middle" }} />;
}

function ScorerLine({ ev }: { ev: Match["events"][0] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#b9bdc6" }}>
      <IconBall size={13} />
      <span style={{ color: "#dfe2e7", fontWeight: 500 }}>{ev.player}</span>
      <span style={{ color: "#7e828c" }}>{ev.minute}′</span>
    </div>
  );
}

function CardScore({ match, size = 30 }: { match: Match; size?: number }) {
  if (match.status === "upcoming") {
    return <span style={{ fontSize: size * 0.62, fontWeight: 800, color: "#6b7280", letterSpacing: 1 }}>VS</span>;
  }
  const live = match.status === "live";
  return (
    <span style={{ fontSize: size, fontWeight: 820, letterSpacing: 1, lineHeight: 1,
      color: live ? "#fff" : "#f4f4f5", fontVariantNumeric: "tabular-nums",
      textShadow: live ? "0 0 18px rgba(255,77,106,.5)" : "none" }}>
      {match.score.h}<span style={{ color: "#6b7280", margin: "0 4px" }}>:</span>{match.score.a}
    </span>
  );
}

function TvBadge({ channel }: { channel: "ct_sport" | "nova_action" }) {
  if (channel === "ct_sport") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto" }}>
        <svg width="17" height="17" viewBox="0 0 60 60">
          <path fill="#3CB54A" fillRule="evenodd"
            d="M30 2 A28 28 0 0 1 30 58 A28 28 0 0 1 30 2 Z M4 20 L38 20 L38 40 L4 40 Z" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#3CB54A",
          fontStyle: "italic", letterSpacing: 0.2, whiteSpace: "nowrap" }}>sport</span>
      </div>
    );
  }
  return (
    <Image src="/assets/nova_action_logo.webp" alt="Nova Action" width={54} height={18}
      style={{ height: 18, width: "auto", display: "block", flex: "0 0 auto" }} />
  );
}

function venueLine(match: Match): string {
  const place = [match.stadium, match.city].filter(Boolean).join(", ");
  const group = match.group ? `Skupina ${match.group}` : "";
  return [group, place].filter(Boolean).join(" • ");
}

function Footer({ match }: { match: Match }) {
  const showTv = (match.status === "live" || match.status === "upcoming") && match.tv;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingTop: 11, marginTop: 11, borderTop: "1px solid rgba(255,255,255,.07)" }}>
      <span style={{ fontSize: 11.5, color: "#71757f", fontWeight: 500 }}>
        {venueLine(match)}
      </span>
      {showTv && <TvBadge channel={match.tv!} />}
    </div>
  );
}

type Props = { match: Match; variant: CardVariant; onOpen: () => void };

export default function MatchCard({ match, variant, onOpen }: Props) {
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  const ch = TEAM_COLOR[match.home];
  const ca = TEAM_COLOR[match.away];
  const homeScorers = match.events.filter((e) => e.type === "goal" && e.team === "h");
  const awayScorers = match.events.filter((e) => e.type === "goal" && e.team === "a");
  const live = match.status === "live";

  const baseGrad = `linear-gradient(90deg, ${ch}72 0%, ${ch}44 18%, ${ch}14 33%, transparent 40%, transparent 60%, ${ca}14 67%, ${ca}44 82%, ${ca}72 100%)`;
  const liveGlow = live ? `, radial-gradient(120% 80% at 50% -10%, rgba(255,77,106,.16), transparent 60%)` : "";

  // IMPORTANT: backdrop-filter must not be combined with transform on an ancestor —
  // Chromium isolates the backdrop and the card renders black. No entrance transforms.
  const wrapBase: React.CSSProperties = {
    ...glassStyle(),
    position: "relative", overflow: "hidden", padding: 16,
    boxShadow: live ? "0 10px 30px -12px rgba(255,77,106,.25)" : "0 10px 26px -16px rgba(0,0,0,.7)",
  };

  let inner: React.ReactNode;

  if (variant === "classic") {
    inner = (
      <div style={{ ...wrapBase, background: `${baseGrad}${liveGlow}, var(--glass-bg)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <StatusBadge match={match} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Flag code={match.home} size={46} />
            <span style={{ fontSize: 14, color: "#f3f4f6", textAlign: "center", fontWeight: 700 }}>
              {home.name}<RedDot show={match.reds.h} />
            </span>
          </div>
          <CardScore match={match} size={34} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Flag code={match.away} size={46} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#f3f4f6", textAlign: "center" }}>
              {away.name}<RedDot show={match.reds.a} />
            </span>
          </div>
        </div>
        {(homeScorers.length > 0 || awayScorers.length > 0) &&
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 13 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {homeScorers.map((e, i) => <ScorerLine key={i} ev={e} />)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              {awayScorers.map((e, i) => <ScorerLine key={i} ev={e} />)}
            </div>
          </div>
        }
        <Footer match={match} />
      </div>
    );
  } else if (variant === "split") {
    inner = (
      <div style={{ ...wrapBase, padding: 0, background: "var(--glass-bg)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "stretch", minHeight: 132 }}>
          <div style={{ background: `linear-gradient(160deg, ${ch}33, ${ch}0a)`, padding: "18px 14px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Flag code={match.home} size={48} />
            <span style={{ fontWeight: 750, fontSize: 13.5, color: "#fff", textAlign: "center" }}>
              {home.short}<RedDot show={match.reds.h} />
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "0 6px", background: "rgba(0,0,0,.18)" }}>
            <StatusBadge match={match} />
            <CardScore match={match} size={32} />
          </div>
          <div style={{ background: `linear-gradient(200deg, ${ca}33, ${ca}0a)`, padding: "18px 14px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Flag code={match.away} size={48} />
            <span style={{ fontWeight: 750, fontSize: 13.5, color: "#fff", textAlign: "center" }}>
              {away.short}<RedDot show={match.reds.a} />
            </span>
          </div>
        </div>
        <div style={{ padding: "0 16px 14px" }}><Footer match={match} /></div>
      </div>
    );
  } else {
    inner = (
      <div style={{ ...wrapBase, padding: "13px 15px", borderRadius: 18,
        background: live ? `radial-gradient(120% 80% at 50% -10%, rgba(255,77,106,.16), transparent 60%), var(--glass-bg)` : "var(--glass-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, flex: "0 0 auto" }}><StatusBadge match={match} /></div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Flag code={match.home} size={26} />
                <span style={{ fontWeight: 650, fontSize: 14.5, color: "#f3f4f6" }}>{home.name}<RedDot show={match.reds.h} /></span>
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: match.status === "upcoming" ? "#6b7280" : "#fff",
                fontVariantNumeric: "tabular-nums" }}>
                {match.status !== "upcoming" ? match.score.h : ""}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Flag code={match.away} size={26} />
                <span style={{ fontWeight: 650, fontSize: 14.5, color: "#f3f4f6" }}>{away.name}<RedDot show={match.reds.a} /></span>
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: match.status === "upcoming" ? "#6b7280" : "#fff",
                fontVariantNumeric: "tabular-nums" }}>
                {match.status !== "upcoming" ? match.score.a : ""}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <span style={{ fontSize: 11, color: "#71757f" }}>
            {[match.group ? `Sk. ${match.group}` : "", match.city || match.stadium].filter(Boolean).join(" • ")}
          </span>
          {match.status === "upcoming" && match.tv
            ? <TvBadge channel={match.tv} />
            : match.status === "upcoming"
            ? <span style={{ fontSize: 11.5, color: "#9aa0aa", fontWeight: 600 }}>{match.kickoff}</span>
            : match.status === "live" && match.tv
            ? <TvBadge channel={match.tv} />
            : null}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onOpen} style={{ cursor: "pointer" }}>
      {inner}
    </div>
  );
}
