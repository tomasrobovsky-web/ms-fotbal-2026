"use client";

import { IconChevronLeft, IconChevronRight } from "./Icons";

const chevBtn: React.CSSProperties = {
  width: 40, height: 40, flex: "0 0 auto", borderRadius: 13,
  display: "grid", placeItems: "center",
  background: "var(--glass-bg)", border: "1px solid var(--glass-border)",
  backdropFilter: "blur(var(--glass-blur))",
  WebkitBackdropFilter: "blur(var(--glass-blur))" as never,
  cursor: "pointer",
};

// Popisek tlačítka: kolem dneška relativně (Včera/Dnes/Zítra), jinak "14.6.".
function buttonLabel(date: string, today: string, yesterday: string, tomorrow: string): string {
  if (date === today) return "Dnes";
  if (date === yesterday) return "Včera";
  if (date === tomorrow) return "Zítra";
  const [, m, d] = date.split("-");
  return `${Number(d)}.${Number(m)}.`;
}

type Props = {
  windowDates: string[]; // 3 data "YYYY-MM-DD" zleva doprava
  selectedDate: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  onSelect: (date: string) => void;
  onShift: (dir: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
};

export default function DatePicker({
  windowDates, selectedDate, today, yesterday, tomorrow, onSelect, onShift, canPrev, canNext,
}: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <button onClick={() => onShift(-1)} disabled={!canPrev}
        style={{ ...chevBtn, opacity: canPrev ? 1 : .3, cursor: canPrev ? "pointer" : "default" }}>
        <IconChevronLeft size={18} stroke="#cfd3da" />
      </button>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, padding: 4,
        background: "var(--glass-bg)", backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))" as never,
        border: "1px solid var(--glass-border)", borderRadius: 16 }}>
        {windowDates.map((date) => {
          const active = date === selectedDate;
          return (
            <button key={date} onClick={() => onSelect(date)} style={{
              padding: "9px 4px", borderRadius: 12, cursor: "pointer", border: "none",
              fontSize: 13.5, fontWeight: 750, letterSpacing: .2,
              color: active ? "#0b0b0d" : "#cfd3da",
              background: active ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "transparent",
              boxShadow: active ? "0 4px 16px var(--accent-glow)" : "none",
              transition: "all .2s",
            }}>{buttonLabel(date, today, yesterday, tomorrow)}</button>
          );
        })}
      </div>

      <button onClick={() => onShift(1)} disabled={!canNext}
        style={{ ...chevBtn, opacity: canNext ? 1 : .3, cursor: canNext ? "pointer" : "default" }}>
        <IconChevronRight size={18} stroke="#cfd3da" />
      </button>
    </div>
  );
}
