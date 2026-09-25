"use client";

import { useState } from "react";
import type { ScoredOption } from "@/lib/types";

interface FitGridProps {
  options: ScoredOption[];
  members: { id: string; name: string }[];
}

function bucket(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

const BUCKET_CLASSES: Record<string, string> = {
  green: "bg-green-bg text-green border-green/30",
  amber: "bg-amber-bg text-amber border-amber/30",
  red: "bg-red-bg text-red border-red/30",
};

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function FitGrid({ options, members }: FitGridProps) {
  const [active, setActive] = useState<{ optionId: string; memberId: string } | null>(
    options[0] && members[0] ? { optionId: options[0].id, memberId: members[0].id } : null,
  );

  const activeOption = options.find((o) => o.id === active?.optionId);
  const activeReason = active ? activeOption?.reasons[active.memberId] : null;
  const activeMember = members.find((m) => m.id === active?.memberId);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-separate border-spacing-1.5 min-w-[420px]">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-muted pb-1 pl-1">Option</th>
              {members.map((m) => (
                <th key={m.id} className="text-xs font-semibold text-muted pb-1 w-12">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary text-[10px] font-bold">
                    {initials(m.name)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id}>
                <td className="text-sm font-semibold pr-2 py-1 max-w-[110px] truncate">{option.destination}</td>
                {members.map((m) => {
                  const score = option.memberScores[m.id]?.total ?? 0;
                  const b = bucket(score);
                  const isActive = active?.optionId === option.id && active?.memberId === m.id;
                  return (
                    <td key={m.id} className="p-0">
                      <button
                        type="button"
                        onClick={() => setActive({ optionId: option.id, memberId: m.id })}
                        className={`tap-target flex h-11 w-11 items-center justify-center rounded-xl border-2 text-sm font-bold transition-transform ${BUCKET_CLASSES[b]} ${
                          isActive ? "ring-2 ring-offset-1 ring-primary scale-105" : ""
                        }`}
                      >
                        {score}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted border-t border-border pt-3">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-green-bg border border-green/40" /> fits
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-amber-bg border border-amber/40" /> stretch
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-red-bg border border-red/40" /> clash
        </span>
        <span className="ml-auto italic">tap a cell for why</span>
      </div>

      {activeReason && activeMember && activeOption && (
        <div className="mt-3 rounded-xl bg-primary-light px-3 py-2.5 text-sm text-primary-dark animate-fade-in-up">
          <span className="font-semibold">
            {activeMember.name} &times; {activeOption.destination}:
          </span>{" "}
          {activeReason}
        </div>
      )}
    </div>
  );
}
