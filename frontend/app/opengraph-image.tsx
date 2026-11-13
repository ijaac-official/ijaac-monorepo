import { ImageResponse } from "next/og";

export const alt = "IJAAC - International Journal of Applied AI & Computing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share card. Uses the built-in font only (no external fetches). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(120deg, #4a1017 0%, #7a1f2b 55%, #8f2a37 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 14, height: 64, background: "#d4a017" }} />
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: 6, color: "#d4a017" }}>IJAAC</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
            International Journal of Applied AI &amp; Computing
          </div>
          <div style={{ fontSize: 32, opacity: 0.9, maxWidth: 980, lineHeight: 1.35 }}>
            Peer-reviewed, open-access research in applied artificial intelligence and computing
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26 }}>
          <div style={{ display: "flex", gap: 28, opacity: 0.9 }}>
            <span>Monthly</span>
            <span style={{ color: "#d4a017" }}>-</span>
            <span>Open Access</span>
            <span style={{ color: "#d4a017" }}>-</span>
            <span>CC BY 4.0</span>
          </div>
          <div style={{ color: "#d4a017", fontWeight: 700 }}>www.ijaac.in</div>
        </div>
      </div>
    ),
    size
  );
}
