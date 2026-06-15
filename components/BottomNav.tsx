"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconTable, IconNews, IconStadium } from "./Icons";

const items = [
  { href: "/",        label: "Domů",    Icon: IconHome    },
  { href: "/skupiny", label: "Tabulky", Icon: IconTable   },
  { href: "/zpravy",  label: "Zprávy",  Icon: IconNews    },
  { href: "/stadiony",label: "Stadiony",Icon: IconStadium },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30,
      padding: "10px 18px calc(10px + env(safe-area-inset-bottom))",
      background: "linear-gradient(to top, rgba(9,9,11,.96), rgba(9,9,11,.78))",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" as never,
      borderTop: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
        {items.map(({ href, label, Icon }) => {
          const on = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              textDecoration: "none", padding: "4px 0",
            }}>
              <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
                {on && (
                  <span style={{ position: "absolute", inset: -7, borderRadius: "50%",
                    background: "radial-gradient(circle, var(--accent-glow), transparent 70%)",
                    filter: "blur(4px)" }} />
                )}
                <Icon size={22} stroke={on ? "var(--accent)" : "#7e828c"} sw={on ? 2.4 : 2} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: on ? 750 : 600,
                color: on ? "var(--accent)" : "#7e828c" }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
