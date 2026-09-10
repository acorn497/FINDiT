interface LogoProps {
  className?: string;
}

export function Logo({ className = 'text-2xl' }: LogoProps) {
  return (
    <span className={`font-extrabold tracking-tight text-tx-1 ${className}`} aria-label="FINDiT">
      FIND<span className="text-accent">iT</span>
    </span>
  );
}
