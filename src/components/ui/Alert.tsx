import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tone = "info" | "success" | "warning" | "danger";

const styles: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: "bg-accent-soft text-accent", Icon: Info },
  success: { box: "bg-success-soft text-success", Icon: CheckCircle2 },
  warning: { box: "bg-warning-soft text-warning", Icon: AlertTriangle },
  danger: { box: "bg-danger-soft text-danger", Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  onClose,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const { box, Icon } = styles[tone];
  return (
    <div role="status" className={cn("flex gap-3 rounded-lg px-3.5 py-3 text-sm", box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-text/80 mt-0.5 text-xs leading-relaxed">{children}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
