"use client";

import { useRouter } from "next/navigation";
import type { Match, StandingRow } from "@/lib/match-data";
import MatchDetail from "./MatchDetail";

// Samostatná stránka detailu (sdílitelný odkaz /zapas/<id>). Detail se vykreslí
// jako celostránkový overlay; zavření vrací na domovskou obrazovku.
export default function ZapasDetailClient({
  match, groupRows,
}: { match: Match; groupRows: StandingRow[] | null }) {
  const router = useRouter();
  const close = () => router.push("/");

  return (
    <div style={{ minHeight: "100dvh", width: "100%", display: "flex", justifyContent: "center",
      background: "#050506", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", position: "relative",
        background: "#09090b", overflow: "hidden",
        borderLeft: "1px solid rgba(255,255,255,.05)", borderRight: "1px solid rgba(255,255,255,.05)" }}>
        <MatchDetail match={match} onClose={close} closing={false} groupRows={groupRows} />
      </div>
    </div>
  );
}
