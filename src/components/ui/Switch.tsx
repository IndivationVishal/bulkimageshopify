import { cn } from "@/lib/utils/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
};

export function Switch({ checked, onChange, label, description, id }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span className="flex flex-col">
        <span className="text-sm text-text">{label}</span>
        {description && <span className="text-xs text-subtle">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-surface shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
    </label>
  );
}
