import { Smartphone, Zap, Loader2 } from "lucide-react";

interface EcoCashButtonProps {
  amount: number;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

const EcoCashButton = ({ amount, disabled, loading, onClick }: EcoCashButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="ecocash-btn"
    >
      {loading ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <Smartphone className="w-6 h-6" />
            <Zap className="w-4 h-4" />
          </div>
          <span>PAY ${amount} WITH ECOCASH</span>
        </>
      )}
    </button>
  );
};

export default EcoCashButton;
