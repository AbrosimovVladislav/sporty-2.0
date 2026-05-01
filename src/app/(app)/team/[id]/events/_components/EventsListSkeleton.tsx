export function EventsListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 mb-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-9 flex-1 rounded-[10px] animate-pulse"
            style={{ background: "var(--gray-100)" }}
          />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3 border-b"
          style={{ borderColor: "var(--gray-100)" }}
        >
          <div
            className="w-11 h-11 rounded-[12px] animate-pulse shrink-0"
            style={{ background: "var(--gray-100)" }}
          />
          <div className="flex-1">
            <div
              className="h-4 w-28 rounded animate-pulse mb-1.5"
              style={{ background: "var(--gray-100)" }}
            />
            <div
              className="h-3 w-40 rounded animate-pulse"
              style={{ background: "var(--gray-100)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
