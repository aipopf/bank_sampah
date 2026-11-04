import Link from "next/link";

const variants = {
  primary:
    "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10 hover:bg-emerald-800 focus-visible:outline-emerald-700",
  secondary:
    "border border-emerald-900/15 bg-white text-emerald-950 hover:border-emerald-900/30 hover:bg-emerald-50 focus-visible:outline-emerald-700",
  subtle:
    "text-emerald-900 hover:bg-emerald-900/5 focus-visible:outline-emerald-700",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${variants[variant] ?? variants.primary} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
