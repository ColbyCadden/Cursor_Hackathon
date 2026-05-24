import Image from "next/image";
import Link from "next/link";

const SIZES = { sm: 52, md: 80, lg: 160 } as const;

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
        <span className="block text-lg font-bold leading-tight tracking-tight text-[var(--text)]">
          PrepDeck
        </span>
        {showTagline && (
          <span className="block text-xs text-[var(--text-muted)]">
            meals made easy
          </span>
        )}
      </div>
    </>
  );

  const cls = `flex items-center gap-2.5 ${className}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}
