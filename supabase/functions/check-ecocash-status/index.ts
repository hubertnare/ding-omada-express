import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ECOCASH_BASE_URL = "https://developers.ecocash.co.zw/api/ecocash_pay";
const ECOCASH_STATUS_ENDPOINT = "/api/v1/transaction/c2b/status/sandbox";

interface StatusRequest {
  sourceReference: string;
  sourceMobileNumber: string;
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

    const { sourceReference, sourceMobileNumber }: StatusRequest = await req.json();

    if (!sourceReference || !sourceMobileNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sourceReference, sourceMobileNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking EcoCash status for ref: ${sourceReference}, phone: ${sourceMobileNumber}`);

    // Call EcoCash status API
    const statusPayload = {
      sourceMobileNumber: sourceMobileNumber,
      sourceReference: sourceReference,
    };

    const statusResponse = await fetch(`${ECOCASH_BASE_URL}${ECOCASH_STATUS_ENDPOINT}`, {
      method: "POST",
      headers: {
        "X-API-KEY": ECOCASH_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(statusPayload),
    });

    const responseText = await statusResponse.text();
    console.log("EcoCash status raw response:", responseText, "Status:", statusResponse.status);

    let statusData: Record<string, unknown> = {};
    if (responseText) {
      try {
        statusData = JSON.parse(responseText);
      } catch {
        console.log("EcoCash status response is not JSON");
      }
    }

    console.log("EcoCash status parsed:", JSON.stringify(statusData));

    // Check if payment is successful
    const status = (statusData.status as string)?.toUpperCase();
    
    if (status === "SUCCESS") {
      // Payment successful - update voucher
      const { data: voucher, error: updateError } = await supabase
        .from("vouchers")
        .update({
          status: "sold",
          is_sold: true,
          sold_at: new Date().toISOString(),
        })
        .eq("ecocash_ref", sourceReference)
        .eq("status", "reserved")
        .select("voucher_code, id")
        .single();

      if (updateError) {
        console.error("Error updating voucher:", updateError);
      }

      return new Response(
        JSON.stringify({
          status: "SUCCESS",
          voucherCode: voucher?.voucher_code,
          ecocashReference: statusData.ecocashReference,
          message: "Payment successful",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (status === "FAILED") {
      // Payment failed - release voucher
      await supabase
        .from("vouchers")
        .update({
          status: "active",
          ecocash_ref: null,
          sold_to: null,
        })
        .eq("ecocash_ref", sourceReference);

      return new Response(
        JSON.stringify({
          status: "FAILED",
          message: "Payment failed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Still pending
    return new Response(
      JSON.stringify({
        status: status || "PENDING",
        message: "Payment pending",
        rawStatus: statusData.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-ecocash-status:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
