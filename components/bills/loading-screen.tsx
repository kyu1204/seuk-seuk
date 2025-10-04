import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center flex-col h-[400px] w-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
