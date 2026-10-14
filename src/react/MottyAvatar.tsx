"use client";

export type MottyAvatarProps = {
  size: number;
  className?: string;
  /** Defaults to `/motty/motty.gif` — copy assets from this package's `assets/motty/`. */
  gifSrc?: string;
  stillSrc?: string;
};

export function MottyAvatar({
  size,
  className = "",
  gifSrc = "/motty/motty.gif",
  stillSrc = "/motty/motty-still.png",
}: MottyAvatarProps) {
  return (
    <picture>
      <source srcSet={stillSrc} media="(prefers-reduced-motion: reduce)" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gifSrc}
        alt=""
        width={size}
        height={size}
        className={`pointer-events-none select-none object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    </picture>
  );
}
