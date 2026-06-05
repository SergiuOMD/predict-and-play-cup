import { useState } from "react";
import { resolveTeamFlag } from "@/lib/team-flags";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  xs: "h-4 w-6",
  sm: "h-5 w-7",
  md: "h-6 w-9",
  lg: "h-8 w-12",
  xl: "h-10 w-14",
} as const;

type TeamFlagProps = {
  code?: string | null;
  name?: string | null;
  emoji?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

export function TeamFlag({ code, name, emoji, size = "md", className }: TeamFlagProps) {
  const resolved = resolveTeamFlag(code, name);
  const [imgFailed, setImgFailed] = useState(false);
  const displayEmoji = emoji || resolved.emoji;

  if (resolved.imageUrl && !imgFailed) {
    return (
      <img
        src={resolved.imageUrl}
        srcSet={`https://flagcdn.com/w40/${resolved.iso}.png 1x, https://flagcdn.com/w80/${resolved.iso}.png 2x`}
        alt=""
        width={size === "xl" ? 56 : size === "lg" ? 48 : 36}
        height={size === "xl" ? 40 : size === "lg" ? 32 : 24}
        loading="lazy"
        decoding="async"
        className={cn(
          "shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10",
          SIZE_CLASS[size],
          className,
        )}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn("shrink-0 leading-none", className)}
      style={{ fontSize: size === "xl" ? "2.5rem" : size === "lg" ? "2rem" : size === "sm" ? "1.25rem" : "1.5rem" }}
      aria-hidden
    >
      {displayEmoji}
    </span>
  );
}
