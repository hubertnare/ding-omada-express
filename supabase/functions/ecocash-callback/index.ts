// Lovable Cloud function: ecocash-callback
// Webhook endpoint for EcoCash payment notifications
// Updates voucher status based on payment result

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const admin = createClient(supabaseUrl ?? "", serviceRoleKey ?? "");

// EcoCash callback payload structure (adjust based on actual EcoCash API docs)
interface EcoCashCallback {
  reference?: string;
  transaction_id?: string;
  status: string; // e.g., "SUCCESS", "FAILED", "PENDING"
  amount?: number;
  phone_number?: string;
  timestamp?: string;
  // Add other fields as per EcoCash documentation
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log("[EcoCash Callback] Method not allowed:", req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as EcoCashCallback;
    
    console.log("[EcoCash Callback] Received payload:", JSON.stringify(body));

    // Get the reference (support multiple field names)
    const reference = body.reference || body.transaction_id;
    
    if (!reference) {
      console.error("[EcoCash Callback] Missing reference/transaction_id");
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.status) {
      console.error("[EcoCash Callback] Missing status");
      return new Response(JSON.stringify({ error: "Missing status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize status to uppercase for comparison
    const paymentStatus = body.status.toUpperCase();
    
    console.log("[EcoCash Callback] Processing reference:", reference, "status:", paymentStatus);

    // Find voucher by ecocash_ref
    const { data: voucher, error: findError } = await admin
      .from("vouchers")
      .select("id, voucher_code, status, is_sold")
      .eq("ecocash_ref", reference)
      .maybeSingle();

    if (findError) {
      console.error("[EcoCash Callback] Database error finding voucher:", findError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!voucher) {
      console.warn("[EcoCash Callback] No voucher found for reference:", reference);
      return new Response(JSON.stringify({ error: "Voucher not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[EcoCash Callback] Found voucher:", voucher.id, "current status:", voucher.status);

    // Update voucher based on payment status
    if (paymentStatus === "SUCCESS" || paymentStatus === "SUCCESSFUL" || paymentStatus === "COMPLETED") {
      // Payment successful - mark voucher as sold
      const { error: updateError } = await admin
        .from("vouchers")
        .update({
          is_sold: true,
          status: "sold",
          sold_at: new Date().toISOString(),
          sold_to: body.phone_number || null,
        })
        .eq("id", voucher.id);

      if (updateError) {
        console.error("[EcoCash Callback] Error updating voucher to sold:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update voucher" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[EcoCash Callback] Voucher marked as sold:", voucher.id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment confirmed, voucher sold",
        voucher_code: voucher.voucher_code 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "REJECTED") {
      // Payment failed - release the voucher reservation if any
      const { error: updateError } = await admin
        .from("vouchers")
        .update({
          is_sold: false,
          status: "active",
          ecocash_ref: null, // Clear the reference so it can be purchased again
          sold_to: null,
        })
        .eq("id", voucher.id)
        .eq("status", "reserved"); // Only release if it was reserved

      if (updateError) {
        console.error("[EcoCash Callback] Error releasing voucher:", updateError);
      }

      console.log("[EcoCash Callback] Payment failed for voucher:", voucher.id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment failed, voucher released" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // Pending or unknown status - just acknowledge
      console.log("[EcoCash Callback] Payment pending/unknown status:", paymentStatus);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Status acknowledged" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[EcoCash Callback] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
