import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";
import PhoneInput from "@/components/PhoneInput";
import EcoCashButton from "@/components/EcoCashButton";
import SuccessScreen from "@/components/SuccessScreen";
import Stepper from "@/components/Stepper";
import PixelBackground from "@/components/PixelBackground";
import { Wifi, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const wifiPackages = [
  { gigs: 1, price: 5 },
  { gigs: 3, price: 10, popular: true },
  { gigs: 5, price: 15 },
  { gigs: 10, price: 25 },
  { gigs: 20, price: 40 },
];

const steps = [
  { label: "Select Package", description: "Choose WiFi data" },
  { label: "Enter Number", description: "Your mobile" },
  { label: "Payment", description: "Pay with EcoCash" },
];

// Validate Zimbabwean phone number
const validateZWPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  const validPrefixes = ["71", "73", "77", "78"];
  return digits.length === 9 && validPrefixes.some(prefix => digits.startsWith(prefix));
};

// Generate a mock voucher code
const generateVoucherCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `WIFI-${part1}-${part2}`;
};

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<{ gigs: number; price: number } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  const handlePhoneChange = useCallback((value: string) => {
    setPhoneNumber(value);
    setPhoneError("");
  }, []);

  const handleNext = () => {
    if (currentStep === 0 && selectedPackage) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!validateZWPhone(phoneNumber)) {
        setPhoneError("Please enter a valid Zimbabwean mobile number");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const code = generateVoucherCode();
    setVoucherCode(code);
    setPurchaseComplete(true);
    setIsProcessing(false);
  };

  const handleBuyAnother = () => {
    setCurrentStep(0);
    setSelectedPackage(null);
    setPhoneNumber("");
    setPhoneError("");
    setPurchaseComplete(false);
    setVoucherCode("");
  };

  if (purchaseComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PixelBackground />
        <Header />
        <SuccessScreen
          voucherCode={voucherCode}
          phoneNumber={phoneNumber}
          amount={selectedPackage!.price}
          onBuyAnother={handleBuyAnother}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PixelBackground />
      <Header />

      <main className="flex-1 container py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent via-pink-500 to-primary rounded-2xl mb-2">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            WiFi Data Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Buy WiFi data, receive via SMS instantly. Connect anywhere.
          </p>
        </section>

        {/* Stepper */}
        <section className="max-w-2xl mx-auto animate-fade-up">
          <Stepper steps={steps} currentStep={currentStep} />
        </section>

        {/* Step Content */}
        <section className="animate-fade-up animate-delay-100">
          {/* Step 1: Select Package */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground text-center">
                Choose Your Data Package
              </h3>
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                {wifiPackages.map((pkg) => (
                  <VoucherCard
                    key={pkg.gigs}
                    gigs={pkg.gigs}
                    price={pkg.price}
                    popular={pkg.popular}
                    selected={selectedPackage?.gigs === pkg.gigs}
                    onClick={() => setSelectedPackage(pkg)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Enter Phone */}
          {currentStep === 1 && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-foreground text-center">
                Enter Your Mobile Number
              </h3>
              <PhoneInput
                value={phoneNumber}
                onChange={handlePhoneChange}
                error={phoneError}
              />
              <p className="text-sm text-muted-foreground text-center">
                Your WiFi access code will be sent to this number
              </p>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 2 && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-foreground text-center">
                Confirm & Pay
              </h3>
              
              {/* Order Summary */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-semibold">{selectedPackage?.gigs} GB WiFi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-semibold">+263 {phoneNumber}</span>
                </div>
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">${selectedPackage?.price}</span>
                </div>
              </div>

              <EcoCashButton
                amount={selectedPackage?.price || 0}
                disabled={!selectedPackage}
                loading={isProcessing}
                onClick={handlePayment}
              />
            </div>
          )}
        </section>

        {/* Navigation Buttons */}
        <section className="flex justify-center gap-4 pt-4">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep < 2 && (
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 && !selectedPackage}
              className="px-6 bg-primary hover:bg-primary/90"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
