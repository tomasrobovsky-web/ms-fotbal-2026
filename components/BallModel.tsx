"use client";

import Script from "next/script";

/**
 * Dekorativní 3D míč MS 2026 (Trionda) – web komponenta <model-viewer> z Google.
 * Skript se načítá lazy z CDN (až po zbytku stránky), takže neblokuje první
 * vykreslení. Model `public/models/ball.glb` je optimalizovaný (~198 KB:
 * 512px WebP textury + Draco komprese geometrie).
 *
 * Bez `camera-controls` je míč jen dekorace (žádná interakce), sám se otáčí.
 */
export default function BallModel({ size = 104 }: { size?: number }) {
  return (
    <>
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"
        strategy="lazyOnload"
      />
      <model-viewer
        src="/models/ball.glb"
        alt="Oficiální míč MS 2026 – Trionda"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="26deg"
        interaction-prompt="none"
        shadow-intensity="0"
        exposure="1.15"
        loading="lazy"
        reveal="auto"
        style={{
          width: size,
          height: size,
          background: "transparent",
          pointerEvents: "none",
          ["--poster-color" as never]: "transparent",
        }}
      />
    </>
  );
}
