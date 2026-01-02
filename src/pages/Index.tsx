import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";
import PhoneInput from "@/components/PhoneInput";
import EcoCashButton from "@/components/EcoCashButton";
import SuccessScreen from "@/components/SuccessScreen";
import Stepper from "@/components/Stepper";
import PixelBackground from "@/components/PixelBackground";
import ConnectionModeSelector, { ConnectionMode } from "@/components/ConnectionModeSelector";
import { Wifi, ArrowRight, ArrowLeft, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoucherPackage {
  price_value: number;
  price_display: string;
  duration_display: string | null;
  count: number;
}

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

const Index = () => {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("device");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<VoucherPackage | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [packages, setPackages] = useState<VoucherPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  const steps = connectionMode === "voucher" ? voucherSteps : deviceSteps;
  const maxStep = steps.length - 1;

  // Check for returnUrl parameter from captive portal
  // IMPORTANT: Do NOT decode again.
  // `URLSearchParams.get()` already decodes the query parameter once.
  // Double-decoding will break nested/encoded parameters that the captive portal requires.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrlParam = urlParams.get("returnUrl");
    const modeParam = urlParams.get("mode");

    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }

    // If mode=voucher is specified, switch to voucher mode
    if (modeParam === "voucher") {
      setConnectionMode("voucher");
    }
  }, []);

  // Fetch available voucher packages from database
  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        // Get available vouchers grouped by price
        const { data, error } = await supabase
          .from('vouchers')
          .select('price_value, price_display, duration_display')
          .eq('status', 'active')
          .eq('is_sold', false);

        if (error) {
          console.error('Error fetching vouchers:', error);
          toast.error('Failed to load packages');
          return;
        }

        // Group by price and count available
        const grouped = (data || []).reduce((acc, voucher) => {
          const key = voucher.price_value;
          if (!acc[key]) {
            acc[key] = {
              price_value: voucher.price_value,
              price_display: voucher.price_display,
              duration_display: voucher.duration_display,
              count: 0
            };
          }
          acc[key].count++;
          return acc;
        }, {} as Record<number, VoucherPackage>);

        // Sort by price
        const sortedPackages = Object.values(grouped).sort((a, b) => a.price_value - b.price_value);
        setPackages(sortedPackages);
      } catch (err) {
        console.error('Error:', err);
        toast.error('Failed to load packages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [purchaseComplete]); // Refetch when purchase completes

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
      if (currentStep === 0 && selectedPackage) {
        setCurrentStep(1);
      }
    } else {
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
    
    try {
      // Purchase via backend function (bypasses client-side RLS issues on some devices)
      const { data, error } = await supabase.functions.invoke('purchase-voucher', {
        body: { price_value: selectedPackage.price_value },
      });

      if (error) {
        console.error('Error purchasing voucher:', error);
        toast.error(`Failed to complete purchase: ${error.message}`);
        setIsProcessing(false);
        return;
      }

      if (!data?.voucher_code) {
        console.error('Purchase function returned no voucher_code:', data);
        toast.error('Failed to complete purchase: No voucher available');
        setIsProcessing(false);
        return;
      }

      if (connectionMode === "voucher") {
        setVoucherCode(String(data.voucher_code));
      }

      toast.success('Purchase successful!');
      setPurchaseComplete(true);
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('An error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
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
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-semibold">{selectedPackage?.price_display}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold text-primary">${selectedPackage?.price_value}</span>
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

  // Voucher success screen - redirect back to portal if returnUrl exists
  if (purchaseComplete && connectionMode === "voucher") {
    // If we have a return URL, redirect back to the captive portal with the voucher code
    if (returnUrl && voucherCode) {
      const redirectUrl = new URL(returnUrl);
      redirectUrl.searchParams.set('voucherCode', voucherCode);
      redirectUrl.searchParams.set('purchaseSuccess', 'true');
      
      // Redirect after a short delay to show success
      setTimeout(() => {
        window.location.href = redirectUrl.toString();
      }, 2000);
      
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
                  <h2 className="text-2xl font-bold text-foreground">Purchase Successful!</h2>
                  <p className="text-muted-foreground">Redirecting you back to connect...</p>
                  <p className="text-sm text-primary font-mono mt-4">{voucherCode}</p>
                </div>
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            </main>
            <Footer />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <PixelBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <SuccessScreen
            voucherCode={voucherCode}
            phoneNumber={phoneNumber}
            amount={selectedPackage!.price_value}
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
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No packages available at the moment.</p>
                  <p className="text-sm text-muted-foreground mt-2">Please check back later.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                  {packages.map((pkg) => (
                    <VoucherCard
                      key={pkg.price_value}
                      gigs={pkg.price_value} // Using price as identifier
                      price={pkg.price_value}
                      duration={pkg.duration_display || 'Data Package'}
                      popular={pkg.count > 5}
                      selected={selectedPackage?.price_value === pkg.price_value}
                      onClick={() => setSelectedPackage(pkg)}
                    />
                  ))}
                </div>
              )}
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
                  <span className="font-semibold">{selectedPackage?.price_display || `$${selectedPackage?.price_value}`}</span>
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
                  <span className="text-2xl font-bold text-primary">${selectedPackage?.price_value}</span>
                </div>
              </div>

              <EcoCashButton
                amount={selectedPackage?.price_value || 0}
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
              disabled={(currentStep === 0 && !selectedPackage) || isLoading}
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
