import type { ReactNode } from "react";

function Shell({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="text-4xl">{icon}</div>
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <div className="text-sm text-muted max-w-xs">{children}</div>}
    </div>
  );
}

export function LoadingState({ title = "Loading...", messages }: { title?: string; messages?: string[] }) {
  return (
    <Shell icon={"\u{1F9F3}"} title={title}>
      {messages && (
        <ul className="space-y-1 text-left mx-auto w-fit">
          {messages.map((m) => (
            <li key={m} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> {m}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

export function ErrorState({ title = "Something went wrong", message }: { title?: string; message?: string }) {
  return (
    <Shell icon={"\u{26A0}\u{FE0F}"} title={title}>
      {message}
    </Shell>
  );
}

export function EmptyState({
  icon = "\u{1F5FA}\u{FE0F}",
  title,
  message,
}: {
  icon?: string;
  title: string;
  message?: string;
}) {
  return (
    <Shell icon={icon} title={title}>
      {message}
    </Shell>
  );
}
