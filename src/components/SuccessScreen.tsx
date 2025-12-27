import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SuccessScreenProps {
  voucherCode: string;
  phoneNumber: string;
  amount: number;
  onBuyAnother: () => void;
}

const SuccessScreen = ({ voucherCode, phoneNumber, amount, onBuyAnother }: SuccessScreenProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Voucher code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center animate-scale-in">
          <div className="w-14 h-14 bg-success rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-success-foreground" strokeWidth={3} />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2 animate-fade-up animate-delay-100">
          <h2 className="text-2xl font-bold text-primary">Payment Successful!</h2>
          <p className="text-muted-foreground">Your ${amount} OMADA voucher is ready</p>
        </div>

        {/* Voucher Code */}
        <div className="bg-card border-2 border-primary/20 rounded-xl p-6 space-y-3 animate-fade-up animate-delay-200">
          <p className="text-sm font-medium text-muted-foreground">Your Voucher Code</p>
          <p className="text-2xl md:text-3xl font-mono font-bold text-foreground tracking-wider">
            {voucherCode}
          </p>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </Button>
        </div>

        {/* SMS Confirmation */}
        <div className="flex items-center justify-center gap-2 text-success animate-fade-up animate-delay-300">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">SMS sent to +263 {phoneNumber}</span>
        </div>

        {/* Buy Another Button */}
        <Button
          onClick={onBuyAnother}
          variant="outline"
          className="gap-2 animate-fade-up animate-delay-300"
        >
          <RefreshCw className="w-4 h-4" />
          Buy Another Voucher
        </Button>
      </div>
    </div>
  );
};

export default SuccessScreen;
