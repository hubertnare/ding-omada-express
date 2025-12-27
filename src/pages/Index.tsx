import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";
import PhoneInput from "@/components/PhoneInput";
import EcoCashButton from "@/components/EcoCashButton";
import SuccessScreen from "@/components/SuccessScreen";
import { ShoppingBag } from "lucide-react";

const voucherValues = [
  { value: 10, currency: "USD" },
  { value: 20, currency: "USD", popular: true },
  { value: 50, currency: "USD" },
  { value: 100, currency: "USD" },
  { value: 250, currency: "USD" },
];

// Validate Zimbabwean phone number
const validateZWPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  // Must be 9 digits and start with valid prefixes (71, 73, 77, 78 for Econet, 71 NetOne, 73 Telecel)
  const validPrefixes = ["71", "73", "77", "78"];
  return digits.length === 9 && validPrefixes.some(prefix => digits.startsWith(prefix));
};

// Generate a mock voucher code
const generateVoucherCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `OMADA-${part1}-${part2}`;
};

const Index = () => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  const handlePhoneChange = useCallback((value: string) => {
    setPhoneNumber(value);
    setPhoneError("");
  }, []);

  const handlePayment = async () => {
    // Validate phone number
    if (!validateZWPhone(phoneNumber)) {
      setPhoneError("Please enter a valid Zimbabwean mobile number");
      return;
    }

    if (!selectedValue) return;

    setIsProcessing(true);

    // Simulate EcoCash payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate voucher code
    const code = generateVoucherCode();
    setVoucherCode(code);
    setPurchaseComplete(true);
    setIsProcessing(false);
  };

  const handleBuyAnother = () => {
    setSelectedValue(null);
    setPhoneNumber("");
    setPhoneError("");
    setPurchaseComplete(false);
    setVoucherCode("");
  };

  if (purchaseComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header mallName="Joina City" />
        <SuccessScreen
          voucherCode={voucherCode}
          phoneNumber={phoneNumber}
          amount={selectedValue!}
          onBuyAnother={handleBuyAnother}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header mallName="Joina City" />

      <main className="flex-1 container py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            OMADA Shopping Vouchers
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Buy digital vouchers, receive via SMS instantly. Redeem at partner stores.
          </p>
        </section>

        {/* Voucher Selection */}
        <section className="space-y-4 animate-fade-up animate-delay-100">
          <h3 className="text-lg font-semibold text-foreground">
            Select Amount
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {voucherValues.map((voucher) => (
              <VoucherCard
                key={voucher.value}
                value={voucher.value}
                currency={voucher.currency}
                popular={voucher.popular}
                selected={selectedValue === voucher.value}
                onClick={() => setSelectedValue(voucher.value)}
              />
            ))}
          </div>
        </section>

        {/* Phone Input */}
        <section className="max-w-md mx-auto animate-fade-up animate-delay-200">
          <PhoneInput
            value={phoneNumber}
            onChange={handlePhoneChange}
            error={phoneError}
          />
        </section>

        {/* Payment Button */}
        <section className="max-w-md mx-auto animate-fade-up animate-delay-300">
          <EcoCashButton
            amount={selectedValue || 0}
            disabled={!selectedValue || !phoneNumber}
            loading={isProcessing}
            onClick={handlePayment}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
