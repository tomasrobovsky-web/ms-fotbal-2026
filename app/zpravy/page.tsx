"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { IconClock, IconNews } from "@/components/Icons";
import {
  type NewsItem,
  gradientFor,
  relativeDate,
} from "@/lib/news-data";

// Náhled: skutečný obrázek z RSS, jinak (nebo při chybě načtení) gradient.
function Thumb({
  item,
  height,
  radius,
}: {
  item: NewsItem;
  height: number | string;
  radius: number;
}) {
  const [ok, setOk] = useState(Boolean(item.imageUrl));
  const [from, to] = gradientFor(item.source);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: radius,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {ok && item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setOk(false)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
}

function ReadMeta({
  source,
  date,
  light,
}: {
  source: string;
  date: string;
  light?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 600,
        color: light ? "#cfd3da" : "#8a8f99",
      }}
    >
      <span style={{ color: "var(--accent)", fontWeight: 750 }}>{source}</span>
      {date && (
        <>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "currentColor",
              opacity: 0.6,
            }}
          />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <IconClock size={13} stroke="currentColor" sw={2.1} /> {date}
          </span>
        </>
      )}
    </div>
  );
}

function HeroArticle({ article }: { article: NewsItem }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: 22,
          overflow: "hidden",
          marginBottom: 18,
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative" }}>
          <Thumb item={article} height={212} radius={0} />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "60%",
              pointerEvents: "none",
              background:
                "linear-gradient(to top, rgba(9,9,11,.92), transparent)",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              padding: "5px 11px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#0b0b0d",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-2))",
              boxShadow: "0 4px 14px var(--accent-glow)",
            }}
          >
            {article.source}
          </span>
        </div>
        <div style={{ padding: "16px 18px 18px" }}>
          <h2
            style={{
              fontSize: 23,
              fontWeight: 850,
              lineHeight: 1.12,
              letterSpacing: -0.5,
              color: "#fff",
              margin: "0 0 9px",
            }}
          >
            {article.title}
          </h2>
          {article.description && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "#aeb2ba",
                margin: "0 0 14px",
              }}
            >
              {article.description}
            </p>
          )}
          <ReadMeta
            source={article.source}
            date={relativeDate(article.publishedAt)}
          />
        </div>
      </div>
    </a>
  );
}

function NewsRow({ article, last }: { article: NewsItem; last: boolean }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 4px",
          borderBottom: last ? "none" : "1px solid rgba(255,255,255,.07)",
          cursor: "pointer",
        }}
      >
        <div style={{ flex: "0 0 auto", width: 84, height: 84 }}>
          <Thumb item={article} height={84} radius={14} />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.22,
              color: "#f3f4f6",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.title}
          </h3>
          <ReadMeta
            source={article.source}
            date={relativeDate(article.publishedAt)}
          />
        </div>
      </div>
    </a>
  );
}

function StateBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: 18,
        padding: "40px 20px",
        textAlign: "center",
        color: "#8a8f99",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

const PAGE_SIZE = 20; // kolik článků (vč. hlavního) ukázat na jedno načtení

export default function ZpravyPage() {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    fetch("/data/news.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: NewsItem[]) => {
        if (active) setNews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) {
          setNews([]);
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const loading = news === null;
  const featured = news && news.length > 0 ? news[0] : null;
  const rest = news && news.length > 1 ? news.slice(1) : [];
  // Hlavní článek se počítá do limitu → ze seznamu „dalších" ukážeme visible − 1.
  const visibleRest = rest.slice(0, Math.max(0, visible - 1));
  const hasMore = news !== null && visible < news.length;

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "relative",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* ambient background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          background: "#050506",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            top: "-8%",
            left: "-12%",
            borderRadius: "50%",
            filter: "blur(80px)",
            background: "rgba(165,217,255,.45)",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            bottom: "-10%",
            right: "-12%",
            borderRadius: "50%",
            filter: "blur(80px)",
            background: "rgba(1,64,234,.4)",
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            top: "40%",
            left: "55%",
            borderRadius: "50%",
            filter: "blur(80px)",
            background: "rgba(56,120,255,.18)",
          }}
        />
      </div>

      {/* phone container */}
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100dvh",
          position: "relative",
          background: "#09090b",
          overflow: "hidden",
          zIndex: 1,
          boxShadow: "0 0 80px rgba(0,0,0,.6)",
          borderLeft: "1px solid rgba(255,255,255,.05)",
          borderRight: "1px solid rgba(255,255,255,.05)",
        }}
      >
        {/* in-app ambient top */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 360,
            height: 280,
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(165,217,255,.45), transparent 70%)",
            opacity: 0.95,
            filter: "blur(30px)",
          }}
        />

        <div
          className="noscroll"
          style={{
            position: "relative",
            zIndex: 1,
            height: "100dvh",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" as never,
            padding: "max(14px, env(safe-area-inset-top)) 18px 110px",
          }}
        >
          <Header />

          {/* Page hero banner */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "30px 24px 26px",
              marginBottom: 18,
              background: "var(--glass-bg)",
              backdropFilter: "blur(26px)",
              WebkitBackdropFilter: "blur(26px)" as never,
              border: "1px solid var(--glass-border)",
              borderRadius: 22,
              aspectRatio: "4/3",
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
                borderRadius: "inherit",
                clipPath: "inset(0 round 22px)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/field-bg.jpg"
                alt=""
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  height: "150%",
                  width: "auto",
                  maxWidth: "none",
                  transform: "translate(-50%, -50%) rotate(90deg)",
                  opacity: 0.72,
                  transformOrigin: "center center",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(165deg, rgba(9,9,11,.38) 0%, rgba(9,9,11,.62) 55%, rgba(9,9,11,.9) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "8%",
                width: 280,
                height: 180,
                transform: "translateX(-50%)",
                pointerEvents: "none",
                mixBlendMode: "screen",
                background:
                  "radial-gradient(60% 60% at 50% 40%, rgba(165,217,255,.45), transparent 70%)",
                filter: "blur(18px)",
                opacity: 0.95,
              }}
            />
            <div
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 750,
                  letterSpacing: 2.2,
                  color: "#e6e7ea",
                  textTransform: "uppercase",
                  textShadow: "0 1px 8px rgba(0,0,0,.6)",
                  display: "block",
                }}
              >
                Nejnovější
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <span
                    style={{
                      fontSize: 46,
                      fontWeight: 860,
                      lineHeight: 0.9,
                      letterSpacing: -2,
                      color: "#fff",
                      textShadow:
                        "0 2px 16px rgba(0,0,0,.55), 0 0 34px rgba(165,217,255,.45)",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Zprávy
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 650,
                      color: "#c3c6cc",
                      letterSpacing: -0.2,
                      textShadow: "0 1px 8px rgba(0,0,0,.6)",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Dění kolem šampionátu
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: "rgba(9,9,11,.42)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)" as never,
                    border: "1px solid rgba(255,255,255,.10)",
                  }}
                >
                  <IconNews size={18} stroke="var(--accent)" sw={2.2} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#c3c6cc",
                        fontWeight: 600,
                        letterSpacing: 0.3,
                      }}
                    >
                      Právě teď
                    </span>
                    <span
                      style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}
                    >
                      {loading
                        ? "Načítám zprávy…"
                        : `${news!.length} aktuálních článků`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && <StateBox>Načítám nejnovější zprávy…</StateBox>}

          {!loading && news!.length === 0 && (
            <StateBox>
              {failed
                ? "Zprávy se teď nepodařilo načíst. Zkuste to prosím později."
                : "Zatím žádné zprávy. Brzy se tu objeví novinky z šampionátu."}
            </StateBox>
          )}

          {!loading && featured && <HeroArticle article={featured} />}

          {!loading && rest.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "2px 4px 4px",
                }}
              >
                <span
                  style={{ fontSize: 15, fontWeight: 750, color: "#f3f4f6" }}
                >
                  Další zprávy
                </span>
                <span
                  style={{ fontSize: 12.5, color: "#71757f", fontWeight: 600 }}
                >
                  {visibleRest.length} z {rest.length} článků
                </span>
              </div>

              <div
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 18,
                  padding: "2px 14px",
                  marginTop: 8,
                }}
              >
                {visibleRest.map((article, i) => (
                  <NewsRow
                    key={article.id}
                    article={article}
                    last={i === visibleRest.length - 1}
                  />
                ))}
              </div>

              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "13px 16px",
                    borderRadius: 14,
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    color: "#f3f4f6",
                    fontSize: 14,
                    fontWeight: 750,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)" as never,
                  }}
                >
                  Načíst další ({news!.length - visible})
                </button>
              )}
            </>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
