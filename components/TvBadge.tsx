import Image from "next/image";
import type { TvChannel } from "@/lib/match-data";

// ČT sport – oficiální logo ze složky assets.
function CtSportMark() {
  return (
    <Image src="/assets/ct_sport_logo.png" alt="ČT sport" width={63} height={14}
      style={{ height: 14, width: "auto", display: "block", flex: "0 0 auto" }} />
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
