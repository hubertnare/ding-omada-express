import { cn } from "@/lib/utils";
import { Check, Wifi, Clock } from "lucide-react";

interface VoucherCardProps {
  gigs: number;
  price: number;
  duration: string;
  popular?: boolean;
  selected?: boolean;
  onClick: () => void;
}

const VoucherCard = ({ gigs, price, duration, popular, selected, onClick }: VoucherCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200",
        "bg-card/80 backdrop-blur-sm",
        "hover:shadow-lg hover:-translate-y-0.5",
        "active:scale-[0.98] active:shadow-md",
        selected 
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" 
          : "border-border hover:border-primary/50",
        popular && !selected && "border-accent/50"
      )}
    >
      {/* Popular Badge */}
      {popular && (
        <span className="absolute -top-3 left-4 bg-gradient-to-r from-accent to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          Popular
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* WiFi Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200",
            "border-2",
            selected 
              ? "bg-primary border-primary" 
              : "bg-gradient-to-br from-accent/20 via-pink-500/20 to-primary/20 border-transparent group-hover:border-primary/30"
          )}>
            <Wifi className={cn(
              "w-7 h-7 transition-colors",
              selected ? "text-white" : "text-primary"
            )} />
          </div>
          
          {/* Data Info */}
          <div>
            <p className="text-2xl font-bold text-foreground">
              {gigs} GB
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{duration}</span>
            </div>
          </div>
        </div>
        
        {/* Price & Selection */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={cn(
              "text-xl font-bold transition-colors",
              selected ? "text-primary" : "text-foreground"
            )}>
              ${price}
            </p>
            <p className="text-xs text-muted-foreground">
              ${(price / gigs).toFixed(2)}/GB
            </p>
          </div>
          
          {/* Checkbox Circle */}
          <div className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            selected 
              ? "bg-primary border-primary scale-110" 
              : "border-muted-foreground/30 group-hover:border-primary/50"
          )}>
            {selected && (
              <Check className="w-4 h-4 text-white animate-scale-in" />
            )}
          </div>
        </div>
      </div>

      {/* Decorative gradient border glow on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 -z-10",
        "bg-gradient-to-r from-accent/20 via-pink-500/20 to-primary/20 blur-xl",
        "group-hover:opacity-100",
        selected && "opacity-100"
      )} />
    </button>
  );
};

export default VoucherCard;
