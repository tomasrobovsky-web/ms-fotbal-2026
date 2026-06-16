// Typová deklarace pro web komponentu <model-viewer> (@google/model-viewer),
// kterou načítáme lazy z CDN. Umožní použít ji v JSX bez TS chyb.
import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "manual";
        exposure?: string;
        "shadow-intensity"?: string;
        "auto-rotate"?: boolean;
        "auto-rotate-delay"?: string;
        "rotation-per-second"?: string;
        "interaction-prompt"?: "auto" | "none";
        "camera-controls"?: boolean;
        "disable-zoom"?: boolean;
      };
    }
  }
}

export {};
