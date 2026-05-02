import React from "react";
import logoTransparent from "@/assets/logo-zibda-active-20260427-v4.png";

/** 사진 가운데 집다 로고 워터마크 */
interface PhotoWatermarkProps {
  size?: "sm" | "md" | "lg";
}

const PhotoWatermark = ({ size = "md" }: PhotoWatermarkProps) => {
  const widthClass =
    size === "sm" ? "w-1/2 max-w-[80px]" :
    size === "lg" ? "w-2/5 max-w-[220px]" :
    "w-1/2 max-w-[140px]";
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none overflow-hidden">
      <img
        src={logoTransparent}
        alt=""
        draggable={false}
        className={`${widthClass} opacity-40 select-none`}
        style={{
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55)) drop-shadow(0 0 2px rgba(255,255,255,0.4))",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};

export default PhotoWatermark;
