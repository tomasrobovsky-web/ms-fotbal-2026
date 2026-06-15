import { getMatches } from "@/lib/schedule";
import { getGroups } from "@/lib/standings";
import ZapasyClient from "@/components/ZapasyClient";

// Čte se za běhu, aby se po `npm run init-data` projevila nová data bez rebuildu.
export const dynamic = "force-dynamic";

export default async function ZapasyPage() {
  const [matches, groups] = await Promise.all([getMatches(), getGroups()]);
  return <ZapasyClient matches={matches} groups={groups} />;
}
