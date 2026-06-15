import { getMatchById } from "@/lib/schedule";
import { getGroup } from "@/lib/standings";
import ZapasDetailClient from "@/components/ZapasDetailClient";
import BottomNav from "@/components/BottomNav";

// Čte se za běhu (deep-link na konkrétní zápas s aktuálními daty).
export const dynamic = "force-dynamic";

export default async function ZapasDetailPage({ params }: { params: { id: string } }) {
  const match = await getMatchById(params.id);

  if (!match) {
    return (
      <div style={{ minHeight: "100dvh", width: "100%", display: "flex", justifyContent: "center",
        background: "#050506", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <div style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", position: "relative",
          background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#71757f", borderLeft: "1px solid rgba(255,255,255,.05)",
          borderRight: "1px solid rgba(255,255,255,.05)" }}>
          Zápas nenalezen.
          <BottomNav />
        </div>
      </div>
    );
  }

  const groupRows = match.group ? await getGroup(match.group) : null;
  return <ZapasDetailClient match={match} groupRows={groupRows} />;
}
