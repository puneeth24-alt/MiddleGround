export function VicinityCircle({ sizePercent = 42 }: { sizePercent?: number }) {
  return (
    <div
      className="pointer-events-none absolute rounded-full border-2 border-dashed border-emerald-500/70 bg-emerald-400/10"
      style={{
        width: `${sizePercent}%`,
        aspectRatio: "1 / 1",
        transform: "translate(-50%, -50%)"
      }}
    />
  );
}
