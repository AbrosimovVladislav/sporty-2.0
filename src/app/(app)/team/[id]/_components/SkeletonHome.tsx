export function SkeletonHome() {
  return (
    <>
      <div
        className="rounded-[20px] h-[224px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
      <div
        className="rounded-[16px] h-[156px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
      <div
        className="rounded-[16px] h-[148px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    </>
  );
}
