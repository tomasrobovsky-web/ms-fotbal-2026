import Image from "next/image";
import type { TeamCode } from "@/lib/match-data";
import { TEAM_COLOR } from "@/lib/match-data";
import type { CSSProperties } from "react";

// ISO 3166-1 alpha-2 codes for circle-flags CDN
// https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@latest/flags/{code}.svg
const FLAG_ISO2: Partial<Record<TeamCode, string>> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HTI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  POR: "pt",
  PRY: "py",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

const CDN = "https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@latest/flags";

type Props = { code: TeamCode | string; size?: number; ring?: boolean };

export default function Flag({ code, size = 34, ring = true }: Props) {
  const iso2 = FLAG_ISO2[code as TeamCode];
  const color = (TEAM_COLOR as Record<string, string>)[code as string] ?? "#444";

  const wrap: CSSProperties = {
    width: size, height: size, borderRadius: "50%", position: "relative",
    overflow: "hidden", flex: "0 0 auto",
    boxShadow: ring
      ? "0 0 0 1.5px rgba(255,255,255,.22), 0 4px 10px rgba(0,0,0,.45)"
      : "none",
  };

  if (iso2) {
    return (
      <div style={wrap} aria-label={String(code)}>
        <Image
          src={`${CDN}/${iso2}.svg`}
          alt={String(code)}
          fill
          style={{ objectFit: "cover" }}
          sizes={`${size}px`}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      style={{ ...wrap, background: `linear-gradient(135deg, ${color}cc, ${color}55)` }}
      aria-label={String(code)}
    />
  );
}
