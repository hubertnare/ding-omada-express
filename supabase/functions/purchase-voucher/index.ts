// Lovable Cloud function: purchase-voucher
// Public endpoint (callable with anon key). Performs voucher allocation using service role.

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
  // eslint-disable-next-line no-console
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const admin = createClient(supabaseUrl ?? "", serviceRoleKey ?? "");

type PurchaseVoucherRequest = {
  price_value: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<PurchaseVoucherRequest>;

    if (typeof body.price_value !== "number" || Number.isNaN(body.price_value)) {
      return new Response(JSON.stringify({ error: "Invalid price_value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try a few times in case of a race (two buyers selecting the same voucher).
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: candidate, error: pickError } = await admin
        .from("vouchers")
        .select("id, voucher_code")
        .eq("price_value", body.price_value)
        .eq("status", "active")
        .eq("is_sold", false)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (pickError) {
        return new Response(JSON.stringify({ error: pickError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!candidate) {
        return new Response(JSON.stringify({ error: "No vouchers available" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updated, error: updateError } = await admin
        .from("vouchers")
        .update({
          is_sold: true,
          status: "sold",
        })
        .eq("id", candidate.id)
        .eq("status", "active")
        .eq("is_sold", false)
        .select("id, voucher_code")
        .maybeSingle();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (updated?.voucher_code) {
        return new Response(
          JSON.stringify({
            id: updated.id,
            voucher_code: updated.voucher_code,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response(JSON.stringify({ error: "Please try again" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
