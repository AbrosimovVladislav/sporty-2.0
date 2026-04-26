type Props = { className?: string };

export function Skeleton({ className = "" }: Props) {
  return <div className={`bg-background-muted rounded animate-pulse ${className}`} />;
}

export function SkeletonLine({ className = "" }: Props) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard({ className = "" }: Props) {
  return (
    <div className={`bg-background-card rounded-lg p-4 shadow-card flex flex-col gap-2 ${className}`}>
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-1/3 h-3" />
    </div>
  );
}

export function SkeletonAvatar({ className = "" }: Props) {
  return <Skeleton className={`h-10 w-10 rounded-full ${className}`} />;
}

export function SkeletonList({ count = 3, className = "" }: Props & { count?: number }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
