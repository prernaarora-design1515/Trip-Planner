interface MemberStatus {
  id: string;
  name: string;
  submitted: boolean;
  voted?: boolean;
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function AvatarRow({ members, meId }: { members: MemberStatus[]; meId?: string | null }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      {members.map((m) => (
        <div key={m.id} className="flex flex-col items-center gap-1.5 w-16">
          <div className="relative">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                m.submitted
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted border-dashed border-border"
              }`}
            >
              {initials(m.name)}
            </div>
            {m.voted && (
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-coral text-white text-xs border-2 border-background">
                {"\u{1F512}"}
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-center leading-tight">
            {m.name}
            {meId === m.id ? " (you)" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
