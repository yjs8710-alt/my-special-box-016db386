import React from "react";

/** 사진 가운데 가로 한 줄 텍스트 워터마크 (집다부동산) */
interface PhotoWatermarkProps {
  size?: "sm" | "md" | "lg";
}

const PhotoWatermark = ({ size = "md" }: PhotoWatermarkProps) => {
  const fontSize =
    size === "sm" ? "clamp(9px, 3.5vw, 13px)" :
    size === "lg" ? "clamp(16px, 5vw, 26px)" :
    "clamp(12px, 4vw, 18px)";
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none overflow-hidden">
      <span
        className="text-white/85 font-bold whitespace-nowrap select-none"
        style={{
          fontSize,
          letterSpacing: "0.35em",
          textShadow: "0 1px 4px rgba(0,0,0,0.65), 0 0 12px rgba(0,0,0,0.4)",
          mixBlendMode: "overlay",
        }}
      >
        집&nbsp;다&nbsp;부&nbsp;동&nbsp;산
      </span>
    </div>
  );
};

export default PhotoWatermark;
