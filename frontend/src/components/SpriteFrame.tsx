"use client";

import { useEffect, useState } from "react";

type FrameData = { x: number; y: number; w: number; h: number };

/**
 * Renders a single frame from a Phaser-style spritesheet atlas.
 * Looks for `{id}-front` frame in the atlas JSON, falls back to the 2nd frame.
 * Uses CSS clip via overflow:hidden + negative translate on the full atlas image.
 */
export default function SpriteFrame({
  characterId,
  className,
  scale = 4,
}: {
  characterId: string;
  className?: string;
  scale?: number;
}) {
  const [frame, setFrame] = useState<FrameData | null>(null);
  const [atlasSize, setAtlasSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/assets/characters/${characterId}/atlas.json`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const keys = Object.keys(data.frames);
        const frontKey =
          keys.find((k) => k.includes("front") && !k.includes("walk") && !k.includes("attack")) ??
          keys[1] ??
          keys[0];
        const f = data.frames[frontKey]?.frame;
        if (f) setFrame(f);
        if (data.meta?.size) setAtlasSize(data.meta.size);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [characterId]);

  if (!frame) {
    return <div className={className} style={{ width: 30 * scale, height: 48 * scale }} />;
  }

  const w = frame.w * scale;
  const h = frame.h * scale;

  return (
    <div
      className={className}
      style={{
        width: w,
        height: h,
        overflow: "hidden",
        position: "relative",
        imageRendering: "pixelated",
      }}
    >
      <img
        src={`/assets/characters/${characterId}/atlas.png`}
        alt={characterId}
        style={{
          position: "absolute",
          top: -frame.y * scale,
          left: -frame.x * scale,
          width: atlasSize ? atlasSize.w * scale : "auto",
          height: atlasSize ? atlasSize.h * scale : "auto",
          imageRendering: "pixelated",
          maxWidth: "none",
        }}
        draggable={false}
      />
    </div>
  );
}
