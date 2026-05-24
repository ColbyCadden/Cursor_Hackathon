import Image from "next/image";
import Link from "next/link";

const SIZES = { sm: 64, md: 104, lg: 176 } as const;

const BRAND_TEXT = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

const BRAND_TAGLINE = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

interface PrepDeckLogoProps {
  size?: keyof typeof SIZES;
  className?: string;
  /** Accessible label; set false for decorative use beside visible text. */
  title?: string | false;
}

const LOGO_SRC = "/prepdeck-logo.png?v=4";

export function PrepDeckLogo({
  size = "md",
  className = "",
  title = "PrepDeck logo",
}: PrepDeckLogoProps) {
  const px = SIZES[size];

  return (
    <Image
      src={LOGO_SRC}
      alt={title === false ? "" : title}
      width={px}
      height={px}
      unoptimized
      className={`h-auto w-auto object-contain ${className}`}
      style={{ width: px, height: px }}
      priority={size === "lg"}
      aria-hidden={title === false}
    />
  );
}

export function PrepDeckBrand({
  href = "/mealdex",
  size = "sm",
  showTagline = false,
  className = "",
  onClick,
}: {
  href?: string;
  size?: keyof typeof SIZES;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <PrepDeckLogo size={size} title={false} className="shrink-0" />
      <div className="min-w-0">
        <span
          className={`block font-bold leading-tight tracking-tight text-[var(--text)] ${BRAND_TEXT[size]}`}
        >
          PrepDeck
        </span>
        {showTagline && (
          <span
            className={`mt-0.5 block font-medium leading-snug text-[var(--text-muted)] ${BRAND_TAGLINE[size]}`}
          >
            meals made easy
          </span>
        )}
      </div>
    </>
  );

  const cls = `flex items-center gap-3 ${className}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}
