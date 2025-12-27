import { cn } from "@/lib/utils";
import { Check, Wifi } from "lucide-react";

interface VoucherCardProps {
  gigs: number;
  price: number;
  popular?: boolean;
  selected?: boolean;
  onClick: () => void;
}

const VoucherCard = ({ gigs, price, popular, selected, onClick }: VoucherCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "voucher-card w-full text-left",
        popular && "popular",
        selected && "selected"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            selected ? "bg-primary" : "bg-gradient-to-br from-accent via-pink-500 to-primary"
          )}>
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {gigs} GB
            </p>
            <p className="text-sm text-muted-foreground">
              WiFi Data
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-semibold text-primary">
            ${price}
          </p>
          {selected && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in mt-1 ml-auto">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default VoucherCard;
