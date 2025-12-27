import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";
import PhoneInput from "@/components/PhoneInput";
import EcoCashButton from "@/components/EcoCashButton";
import SuccessScreen from "@/components/SuccessScreen";
import Stepper from "@/components/Stepper";
import PixelBackground from "@/components/PixelBackground";
import ConnectionModeSelector, { ConnectionMode } from "@/components/ConnectionModeSelector";
import { Wifi, ArrowRight, ArrowLeft, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const wifiPackages = [
  { gigs: 1, price: 5, duration: "1 Day" },
  { gigs: 3, price: 10, duration: "7 Days", popular: true },
  { gigs: 5, price: 15, duration: "14 Days" },
  { gigs: 10, price: 25, duration: "30 Days" },
  { gigs: 20, price: 40, duration: "30 Days" },
];

const voucherSteps = [
  { label: "Select Package", description: "Choose WiFi data" },
  { label: "Enter Number", description: "Your mobile" },
  { label: "Payment", description: "Pay with EcoCash" },
];

const deviceSteps = [
  { label: "Select Package", description: "Choose WiFi data" },
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
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("device");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<{ gigs: number; price: number } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  const steps = connectionMode === "voucher" ? voucherSteps : deviceSteps;
  const maxStep = steps.length - 1;

  const handlePhoneChange = useCallback((value: string) => {
    setPhoneNumber(value);
    setPhoneError("");
  }, []);

  const handleModeChange = (mode: ConnectionMode) => {
    setConnectionMode(mode);
    setCurrentStep(0);
    setSelectedPackage(null);
    setPhoneNumber("");
    setPhoneError("");
  };

  const handleNext = () => {
    if (connectionMode === "device") {
      // Device mode: Package -> Payment
      if (currentStep === 0 && selectedPackage) {
        setCurrentStep(1);
      }
    } else {
      // Voucher mode: Package -> Phone -> Payment
      if (currentStep === 0 && selectedPackage) {
        setCurrentStep(1);
      } else if (currentStep === 1) {
        if (!validateZWPhone(phoneNumber)) {
          setPhoneError("Please enter a valid Zimbabwean mobile number");
          return;
        }
        setCurrentStep(2);
      }
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

    if (connectionMode === "voucher") {
      const code = generateVoucherCode();
      setVoucherCode(code);
    }
    
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

  // Device connection success screen
  if (purchaseComplete && connectionMode === "device") {
    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <PixelBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 container py-8 flex items-center justify-center">
            <div className="max-w-md w-full text-center space-y-6 animate-fade-up">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">You're Connected!</h2>
                <p className="text-muted-foreground">
                  This device now has WiFi access
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <span className="font-medium">Device Authorized</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Package</span>
                  <span className="font-semibold">{selectedPackage?.gigs} GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold text-primary">${selectedPackage?.price}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Your device is now connected to the network. Enjoy browsing!
              </p>

              <Button
                variant="outline"
                onClick={handleBuyAnother}
                className="w-full"
              >
                Buy More Data
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Voucher success screen
  if (purchaseComplete && connectionMode === "voucher") {
    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <PixelBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <SuccessScreen
            voucherCode={voucherCode}
            phoneNumber={phoneNumber}
            amount={selectedPackage!.price}
            onBuyAnother={handleBuyAnother}
          />
          <Footer />
        </div>
      </div>
    );
  }

  // Check if we're on the payment step
  const isPaymentStep = connectionMode === "device" ? currentStep === 1 : currentStep === 2;
  const isPhoneStep = connectionMode === "voucher" && currentStep === 1;

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <PixelBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
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
            Buy WiFi data, connect instantly or receive a code via SMS.
          </p>
        </section>

        {/* Connection Mode Selector */}
        <section className="animate-fade-up">
          <ConnectionModeSelector mode={connectionMode} onChange={handleModeChange} />
        </section>

        {/* Stepper */}
        <section className="max-w-2xl mx-auto animate-fade-up">
          <Stepper steps={steps} currentStep={currentStep} />
        </section>

        {/* Step Content */}
        <section className="animate-fade-up animate-delay-100">
          {/* Step 1: Select Package (both modes) */}
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
                    duration={pkg.duration}
                    popular={pkg.popular}
                    selected={selectedPackage?.gigs === pkg.gigs}
                    onClick={() => setSelectedPackage(pkg)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2 (Voucher mode only): Enter Phone */}
          {isPhoneStep && (
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

          {/* Payment Step (both modes) */}
          {isPaymentStep && (
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-foreground text-center">
                Confirm & Pay
              </h3>
              
              {/* Order Summary */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Connection Type</span>
                  <span className="font-semibold">
                    {connectionMode === "device" ? "This Device" : "Voucher Code"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-semibold">{selectedPackage?.gigs} GB WiFi</span>
                </div>
                {connectionMode === "voucher" && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Send to</span>
                    <span className="font-semibold">+263 {phoneNumber}</span>
                  </div>
                )}
                {connectionMode === "device" && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Device</span>
                    <span className="font-semibold text-sm">Current Device</span>
                  </div>
                )}
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
          {currentStep < maxStep && (
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
    </div>
  );
};

export default Index;
