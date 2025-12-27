import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface VoucherCardProps {
  value: number;
  currency: string;
  popular?: boolean;
  selected?: boolean;
  onClick: () => void;
}

const VoucherCard = ({ value, currency, popular, selected, onClick }: VoucherCardProps) => {
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
        <div>
          <p className="text-3xl font-bold text-foreground">
            ${value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currency} Voucher
          </p>
        </div>
        
        {selected && (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-scale-in">
            <Check className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
};

export default VoucherCard;
