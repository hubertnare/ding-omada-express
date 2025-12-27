import { cn } from "@/lib/utils";
import { Smartphone, QrCode } from "lucide-react";

type ConnectionMode = "device" | "voucher";

interface ConnectionModeSelectorProps {
  mode: ConnectionMode;
  onChange: (mode: ConnectionMode) => void;
}

const ConnectionModeSelector = ({ mode, onChange }: ConnectionModeSelectorProps) => {
  return (
    <div className="flex gap-3 max-w-md mx-auto">
      <button
        onClick={() => onChange("device")}
        className={cn(
          "flex-1 p-4 rounded-2xl border-2 transition-all duration-200",
          "flex flex-col items-center gap-3 text-center",
          "hover:shadow-md active:scale-[0.98]",
          mode === "device"
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border bg-card/80 hover:border-primary/50"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          mode === "device"
            ? "bg-primary"
            : "bg-gradient-to-br from-accent/20 via-pink-500/20 to-primary/20"
        )}>
          <Smartphone className={cn(
            "w-6 h-6",
            mode === "device" ? "text-white" : "text-primary"
          )} />
        </div>
        <div>
          <p className="font-semibold text-foreground">Connect This Device</p>
          <p className="text-xs text-muted-foreground mt-1">
            Instant access on this phone/laptop
          </p>
        </div>
      </button>

      <button
        onClick={() => onChange("voucher")}
        className={cn(
          "flex-1 p-4 rounded-2xl border-2 transition-all duration-200",
          "flex flex-col items-center gap-3 text-center",
          "hover:shadow-md active:scale-[0.98]",
          mode === "voucher"
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border bg-card/80 hover:border-primary/50"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          mode === "voucher"
            ? "bg-primary"
            : "bg-gradient-to-br from-accent/20 via-pink-500/20 to-primary/20"
        )}>
          <QrCode className={cn(
            "w-6 h-6",
            mode === "voucher" ? "text-white" : "text-primary"
          )} />
        </div>
        <div>
          <p className="font-semibold text-foreground">Get Voucher Code</p>
          <p className="text-xs text-muted-foreground mt-1">
            Receive code via SMS to use later
          </p>
        </div>
      </button>
    </div>
  );
};

export default ConnectionModeSelector;
export type { ConnectionMode };
