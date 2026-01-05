import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PixelBackground from "@/components/PixelBackground";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, Loader2, Home } from "lucide-react";

type PaymentStatus = "loading" | "success" | "pending" | "failed" | "error";

interface PaymentDetails {
  voucher_code?: string;
  price_display?: string;
  price_value?: number;
  sold_to?: string;
}

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const reference = searchParams.get("reference") || searchParams.get("transaction_id");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!reference) {
        setStatus("error");
        setErrorMessage("No payment reference found in URL");
        return;
      }

      try {
        // Query vouchers by ecocash_ref to check payment status
        const { data, error } = await supabase
          .from("vouchers")
          .select("voucher_code, price_display, price_value, sold_to, is_sold, status, ecocash_ref")
          .eq("ecocash_ref", reference)
          .maybeSingle();

        if (error) {
          console.error("Error checking payment status:", error);
          setStatus("error");
          setErrorMessage("Failed to check payment status");
          return;
        }

        if (!data) {
          // No voucher found with this reference - payment might be pending
          setStatus("pending");
          return;
        }

        // Check voucher status to determine payment outcome
        if (data.is_sold && data.status === "sold") {
          setStatus("success");
          setDetails({
            voucher_code: data.voucher_code,
            price_display: data.price_display,
            price_value: data.price_value,
            sold_to: data.sold_to || undefined,
          });
        } else if (data.status === "active") {
          // Voucher exists but not marked as sold yet - payment pending
          setStatus("pending");
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Error:", err);
        setStatus("error");
        setErrorMessage("An unexpected error occurred");
      }
    };

    checkPaymentStatus();
  }, [reference]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleRetry = () => {
    setStatus("loading");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <PixelBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center space-y-6 animate-fade-up">
            {/* Loading State */}
            {status === "loading" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Checking Payment</h2>
                  <p className="text-muted-foreground">
                    Please wait while we verify your payment...
                  </p>
                </div>
              </>
            )}

            {/* Success State */}
            {status === "success" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Payment Successful!</h2>
                  <p className="text-muted-foreground">
                    Your WiFi voucher is ready to use
                  </p>
                </div>

                {details && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    {details.voucher_code && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Your Voucher Code</p>
                        <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                          {details.voucher_code}
                        </p>
                      </div>
                    )}
                    {details.price_display && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-semibold">{details.price_display}</span>
                      </div>
                    )}
                    {details.price_value && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-semibold text-primary">${details.price_value}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={handleGoHome} className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
              </>
            )}

            {/* Pending State */}
            {status === "pending" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-warning/10 rounded-full">
                  <Clock className="w-12 h-12 text-warning" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Payment Pending</h2>
                  <p className="text-muted-foreground">
                    Your payment is being processed. This may take a few moments.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-sm text-muted-foreground">
                    Reference: <span className="font-mono font-semibold">{reference}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleRetry} variant="outline" className="w-full gap-2">
                    <Loader2 className="w-4 h-4" />
                    Check Again
                  </Button>
                  <Button onClick={handleGoHome} variant="ghost" className="w-full gap-2">
                    <Home className="w-4 h-4" />
                    Back to Home
                  </Button>
                </div>
              </>
            )}

            {/* Failed State */}
            {status === "failed" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Payment Failed</h2>
                  <p className="text-muted-foreground">
                    Unfortunately, your payment could not be processed.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-sm text-muted-foreground">
                    Reference: <span className="font-mono font-semibold">{reference}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <Button onClick={handleGoHome} className="w-full gap-2">
                    <Home className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </>
            )}

            {/* Error State */}
            {status === "error" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Something Went Wrong</h2>
                  <p className="text-muted-foreground">
                    {errorMessage || "An error occurred while checking your payment."}
                  </p>
                </div>

                <Button onClick={handleGoHome} className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default PaymentReturn;
