import Image from "next/image";
import type { TvChannel } from "@/lib/match-data";

// ČT sport – stylizovaná značka ČT (kruh s výřezem) + „sport".
function CtSportMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto" }}>
      <svg width="17" height="17" viewBox="0 0 60 60" aria-hidden="true">
        <path fill="#3CB54A" fillRule="evenodd"
          d="M30 2 A28 28 0 0 1 30 58 A28 28 0 0 1 30 2 Z M4 20 L38 20 L38 40 L4 40 Z" />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#3CB54A",
        fontStyle: "italic", letterSpacing: 0.2, whiteSpace: "nowrap" }}>sport</span>
    </div>
  );
}

// Nova Sport – logo ze složky assets.
function NovaSportMark() {
  return (
    <Image src="/assets/nova_action_logo.webp" alt="Nova Sport" width={54} height={18}
      style={{ height: 18, width: "auto", display: "block", flex: "0 0 auto" }} />
  );
}

function ChannelMark({ channel }: { channel: TvChannel }) {
  return channel === "ct_sport" ? <CtSportMark /> : <NovaSportMark />;
}

// Vykreslí jednu nebo obě stanice (zápasy ČR běží na ČT sport i Nova Sport).
export default function TvBadge({ channels }: { channels: TvChannel[] }) {
  if (!channels?.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
      {channels.map((c) => <ChannelMark key={c} channel={c} />)}
    </div>
  );
}
