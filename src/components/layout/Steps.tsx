import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Horizontal step indicator: UPLOAD → DETAILS → … */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                done && "bg-success-soft text-success",
                active && "bg-accent-soft text-accent",
                !done && !active && "bg-surface-2 text-subtle",
              )}
            >
              {done ? <Check className="size-3" /> : <span className="tabular-nums">{i + 1}</span>}
              {step}
            </span>
            {i < steps.length - 1 && <span className="h-px w-3 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
