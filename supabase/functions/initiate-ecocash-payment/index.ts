import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ECOCASH_BASE_URL = "https://developers.ecocash.co.zw/api/ecocash_pay";
const ECOCASH_ENDPOINT = "/api/v2/payment/instant/c2b/sandbox";

interface PaymentRequest {
  phone: string;
  amount: number;
  price_value: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ECOCASH_API_KEY = Deno.env.get("ECOCASH_API_KEY");
    if (!ECOCASH_API_KEY) {
      throw new Error("ECOCASH_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone, amount, price_value }: PaymentRequest = await req.json();

    // Validate inputs
    if (!phone || !amount || !price_value) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone, amount, price_value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number to 263XXXXXXXXX format
    let formattedPhone = phone.replace(/\s+/g, "").replace(/^0/, "263");
    if (!formattedPhone.startsWith("263")) {
      formattedPhone = "263" + formattedPhone;
    }

    // Generate UUID for sourceReference
    const sourceReference = crypto.randomUUID();

    console.log(`Initiating EcoCash payment: ${formattedPhone}, $${amount}, ref: ${sourceReference}`);

    // Reserve a voucher first
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id, voucher_code")
      .eq("price_value", price_value)
      .eq("status", "active")
      .eq("is_sold", false)
      .limit(1)
      .single();

    if (voucherError || !voucher) {
      console.error("No voucher available:", voucherError);
      return new Response(
        JSON.stringify({ error: "No vouchers available for this price" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reserve the voucher with the transaction reference
    const { error: reserveError } = await supabase
      .from("vouchers")
      .update({
        status: "reserved",
        ecocash_ref: sourceReference,
        sold_to: formattedPhone,
      })
      .eq("id", voucher.id)
      .eq("status", "active");

    if (reserveError) {
      console.error("Failed to reserve voucher:", reserveError);
      return new Response(
        JSON.stringify({ error: "Failed to reserve voucher" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call EcoCash API
    const ecocashPayload = {
      customerMsisdn: formattedPhone,
      amount: amount,
      reason: "WiFi Voucher Purchase",
      currency: "USD",
      sourceReference: sourceReference,
    };

    console.log("Calling EcoCash API with payload:", JSON.stringify(ecocashPayload));

    const ecocashResponse = await fetch(`${ECOCASH_BASE_URL}${ECOCASH_ENDPOINT}`, {
      method: "POST",
      headers: {
        "X-API-KEY": ECOCASH_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ecocashPayload),
    });

    const ecocashData = await ecocashResponse.json();
    console.log("EcoCash API response:", JSON.stringify(ecocashData));

    if (!ecocashResponse.ok) {
      // Release the reserved voucher on failure
      await supabase
        .from("vouchers")
        .update({
          status: "active",
          ecocash_ref: null,
          sold_to: null,
        })
        .eq("id", voucher.id);

      return new Response(
        JSON.stringify({ 
          error: "EcoCash payment initiation failed", 
          details: ecocashData 
        }),
        { status: ecocashResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success with reference for tracking
    return new Response(
      JSON.stringify({
        success: true,
        reference: sourceReference,
        voucherId: voucher.id,
        message: "Payment initiated. Please check your phone to complete the transaction.",
        ecocashResponse: ecocashData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in initiate-ecocash-payment:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
