import { formatDateRange, formatINR } from "@/lib/format";
import { VIBES, type ScoredOption } from "@/lib/types";
import { Button } from "./Button";

interface OptionCardProps {
  option: ScoredOption;
  rank: number;
  votesForThis: number;
  totalMembers: number;
  votable: boolean;
  isMyVote: boolean;
  hasVotedAlready: boolean;
  voting: boolean;
  onVote: () => void;
}

const RANK_LABEL = ["Best overall fit", "Runner-up", "Third pick"];

export function OptionCard({
  option,
  rank,
  votesForThis,
  totalMembers,
  votable,
  isMyVote,
  hasVotedAlready,
  voting,
  onVote,
}: OptionCardProps) {
  const costs = Object.values(option.costPerPerson);
  const min = Math.min(...costs);
  const max = Math.max(...costs);

  return (
    <div
      className={`rounded-2xl border-2 bg-card p-5 transition-colors ${
        isMyVote ? "border-coral" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-coral">{RANK_LABEL[rank] ?? "Option"}</span>
          <h3 className="text-xl font-extrabold leading-tight">{option.destination}</h3>
          <p className="text-sm text-muted mt-0.5">{formatDateRange(option.dateStart, option.dateEnd)}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted">min fit</div>
          <div className="text-2xl font-extrabold text-primary">{option.minScore}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {option.vibeTags.map((tag) => {
          const v = VIBES.find((x) => x.key === tag);
          return (
            <span key={tag} className="text-xs font-medium bg-primary-light text-primary-dark rounded-full px-2.5 py-1">
              {v?.emoji} {v?.label ?? tag}
            </span>
          );
        })}
      </div>

      <p className="text-sm mt-3 leading-relaxed">{option.planSummary}</p>

      <div className="mt-3 text-sm">
        <span className="font-semibold">{formatINR(min)}</span>
        {max !== min && <span className="text-muted"> - {formatINR(max)}</span>}
        <span className="text-muted"> per person, incl. travel</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {votesForThis}/{totalMembers} locked in
        </span>
        {isMyVote ? (
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-coral/10 text-coral px-4 py-3 text-sm font-bold">
            {"✓"} You’re in
          </span>
        ) : (
          <Button
            variant={votable ? "coral" : "outline"}
            disabled={!votable || hasVotedAlready || voting}
            onClick={onVote}
            className="text-sm px-4 py-2.5"
          >
            {voting ? "Locking in..." : hasVotedAlready ? "Vote locked" : "I'm in"}
          </Button>
        )}
      </div>
    </div>
  );
}
