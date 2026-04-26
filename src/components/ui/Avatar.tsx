import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: Size;
  className?: string;
};

const sizeMap: Record<Size, { px: number; cls: string; text: string }> = {
  sm: { px: 32, cls: "w-8 h-8", text: "text-[11px]" },
  md: { px: 44, cls: "w-11 h-11", text: "text-[14px]" },
  lg: { px: 64, cls: "w-16 h-16", text: "text-[18px]" },
  xl: { px: 96, cls: "w-24 h-24", text: "text-[24px]" },
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const { px, cls, text } = sizeMap[size];
  const base = `${cls} rounded-full bg-background-muted overflow-hidden flex items-center justify-center shrink-0 ${className}`;

  if (src) {
    return (
      <div className={base}>
        <Image src={src} alt={name ?? "Аватар"} width={px} height={px} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={base}>
      <span className={`${text} font-semibold text-foreground-secondary`}>{initials(name)}</span>
    </div>
  );
}

type AvatarStackProps = {
  users: { id: string; name?: string; avatar_url?: string | null }[];
  max?: number;
  size?: Size;
};

export function AvatarStack({ users, max = 4, size = "sm" }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const rest = users.length - visible.length;
  const { cls, text } = sizeMap[size];

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((u) => (
        <Avatar key={u.id} src={u.avatar_url} name={u.name} size={size} className="ring-2 ring-background-card" />
      ))}
      {rest > 0 && (
        <div
          className={`${cls} rounded-full bg-background-muted flex items-center justify-center ring-2 ring-background-card ${text} font-semibold text-foreground-secondary tabular-nums`}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
