import { Check, CircleMinus, Clock4, Pause, SquarePen } from "lucide-react";
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";

interface Props {
  status: string;
}

interface StatusInfo {
  [key: string]: { color: string; icon: ReactNode };
}

const StatusInfo: StatusInfo = {
  active: { color: "#25F497", icon: <Check size={16} /> },
  paid: { color: "#25F497", icon: <Check size={16} /> },
  completed: { color: "#25F497", icon: <Check size={16} /> },
  trialing: { color: "#E0E0EB", icon: <Clock4 size={16} /> },
  draft: { color: "#797C7C", icon: <SquarePen size={16} /> },
  ready: { color: "#797C7C", icon: <SquarePen size={16} /> },
  canceled: { color: "#797C7C", icon: <CircleMinus size={16} /> },
  inactive: { color: "#F42566", icon: <CircleMinus size={16} /> },
  past_due: { color: "#F79636", icon: <Clock4 size={16} /> },
  paused: { color: "#F79636", icon: <Pause size={16} /> },
  billed: { color: "#F79636", icon: <Clock4 size={16} /> },
};

export function Status({ status }: Props) {
  const { t } = useLanguage();
  const normalized = (status || "").toLowerCase();
  const primaryStatuses = new Set(["active", "completed", "complete"]);
  const isPrimary = primaryStatuses.has(normalized);
  const mapping = StatusInfo[normalized];
  return (
    <div
      className={`flex items-center gap-2 border rounded-sm border-border py-1 px-2 w-fit text-sm ${
        isPrimary ? "text-primary" : ""
      }`}
      style={isPrimary ? undefined : { color: mapping?.color }}
    >
      {mapping?.icon}
      <span>{t(`status.${normalized}`) || status}</span>
    </div>
  );
}
