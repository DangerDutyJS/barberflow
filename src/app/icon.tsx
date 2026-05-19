import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#09090b",
          borderRadius: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "12px solid #d4a853",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 220, color: "#d4a853", lineHeight: 1 }}>✂</div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
