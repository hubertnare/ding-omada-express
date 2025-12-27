import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const PhoneInput = ({ value, onChange, error }: PhoneInputProps) => {
  const [focused, setFocused] = useState(false);

  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");
    
    // Limit to 9 digits (without country code)
    const limited = digits.slice(0, 9);
    
    // Format as XX XXX XXXX
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Enter your Zimbabwean number
      </label>
      
      <div className={cn(
        "phone-input-wrapper",
        error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
      )}>
        <div className="phone-prefix">
          <span className="text-lg">🇿🇼</span>
          <span>+263</span>
        </div>
        
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="77 123 4567"
          className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg font-medium"
        />
      </div>
      
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Voucher code will be SMSed to this number
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
