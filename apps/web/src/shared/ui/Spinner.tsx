export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-[3px] border-bg-3 border-t-accent"
    />
  );
}
