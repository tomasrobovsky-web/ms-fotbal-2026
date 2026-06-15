import type { CSSProperties } from "react";

type IconProps = { size?: number; stroke?: string; sw?: number; fill?: string; style?: CSSProperties };

function Icon({ d, size = 20, stroke = "currentColor", sw = 2, fill = "none", style, children }: IconProps & { d?: string; children?: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const IconChevronLeft  = (p: IconProps) => <Icon {...p} d="M15 18l-6-6 6-6" />;
export const IconChevronRight = (p: IconProps) => <Icon {...p} d="M9 18l6-6-6-6" />;
export const IconHome    = (p: IconProps) => <Icon {...p} d="M3 11l9-8 9 8M5 10v10h14V10" />;
export const IconTable   = (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></Icon>;
export const IconNews    = (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 13h10M7 16h7" /></Icon>;
export const IconStadium = (p: IconProps) => <Icon {...p}><ellipse cx="12" cy="9" rx="9" ry="4" /><path d="M3 9v6c0 2.2 4 4 9 4s9-1.8 9-4V9" /></Icon>;
export const IconPlay    = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none" /></Icon>;
export const IconClock   = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
export const IconWhistle = (p: IconProps) => <Icon {...p}><path d="M3 12a5 5 0 005 5h4l7 3v-9a4 4 0 00-4-4H8a5 5 0 00-5 5z" /><circle cx="8" cy="12" r="1.6" /></Icon>;

// Ikona míče = kruhová miniatura fotky míče MS 2026 (assets/ball.png).
export function IconBall({ size = 16, style }: { size?: number; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/ball.png"
      alt=""
      style={{
        width: size, height: size, borderRadius: "50%", flex: "0 0 auto",
        objectFit: "cover", display: "block", ...style,
      }}
    />
  );
}
