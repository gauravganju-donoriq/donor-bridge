import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { follow_up_id } = await req.json();
    
    if (!follow_up_id) {
      return new Response(JSON.stringify({ error: "follow_up_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY");
    const RETELL_AGENT_ID = Deno.env.get("RETELL_AGENT_ID");
    const RETELL_FROM_NUMBER = Deno.env.get("RETELL_FROM_NUMBER");

    if (!RETELL_API_KEY || !RETELL_AGENT_ID || !RETELL_FROM_NUMBER) {
      console.error("Missing Retell credentials");
      return new Response(JSON.stringify({ error: "Retell credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if Voice AI is enabled
    const { data: enabledSetting } = await supabase
      .from("voice_ai_settings")
      .select("setting_value")
      .eq("setting_key", "enabled")
      .single();

    if (enabledSetting?.setting_value !== "true") {
      return new Response(JSON.stringify({ error: "Voice AI is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch follow-up with donor and appointment details
    const { data: followUp, error: followUpError } = await supabase
      .from("follow_ups")
      .select(`
        id,
        donor_id,
        appointment_id,
        donors:donor_id (
          first_name,
          last_name,
          cell_phone
        ),
        appointments:appointment_id (
          appointment_date
        )
      `)
      .eq("id", follow_up_id)
      .single();

    if (followUpError || !followUp) {
      console.error("Follow-up not found:", followUpError);
      return new Response(JSON.stringify({ error: "Follow-up not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const donor = followUp.donors as unknown as { first_name: string; last_name: string; cell_phone: string | null };
    const appointment = followUp.appointments as unknown as { appointment_date: string };

    if (!donor?.cell_phone) {
      return new Response(JSON.stringify({ error: "Donor has no phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all voice AI settings
    const { data: settings } = await supabase
      .from("voice_ai_settings")
      .select("setting_key, setting_value");

    const settingsMap: Record<string, string> = {};
    settings?.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    // Format donation date
    const donationDate = appointment?.appointment_date
      ? new Date(appointment.appointment_date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      : "your recent donation";

    // Build dynamic variables for Retell agent
    const dynamicVariables = {
      donor_name: `${donor.first_name}`,
      donor_full_name: `${donor.first_name} ${donor.last_name}`,
      donation_date: donationDate,
      agent_name: settingsMap.agent_name || "Sarah",
      greeting: settingsMap.greeting_template || "",
      closing_message: settingsMap.closing_message || "",
      question_pain_level: settingsMap.question_pain_level || "",
      question_current_pain: settingsMap.question_current_pain || "",
      question_pain_medication: settingsMap.question_pain_medication || "",
      question_aspiration_sites: settingsMap.question_aspiration_sites || "",
      question_infection_signs: settingsMap.question_infection_signs || "",
      question_unusual_symptoms: settingsMap.question_unusual_symptoms || "",
      question_doctor_rating: settingsMap.question_doctor_rating || "",
      question_nurse_rating: settingsMap.question_nurse_rating || "",
      question_staff_rating: settingsMap.question_staff_rating || "",
      question_donate_again: settingsMap.question_donate_again || "",
      question_feedback: settingsMap.question_feedback || "",
      escalation_message: settingsMap.escalation_message || "",
    };

    // Format phone number (ensure E.164 format)
    let toNumber = donor.cell_phone.replace(/\D/g, "");
    if (!toNumber.startsWith("1") && toNumber.length === 10) {
      toNumber = "1" + toNumber;
    }
    toNumber = "+" + toNumber;

    console.log(`Initiating call to ${toNumber} for follow-up ${follow_up_id}`);

    // Call Retell API
    const retellResponse = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: RETELL_AGENT_ID,
        from_number: RETELL_FROM_NUMBER,
        to_number: toNumber,
        retell_llm_dynamic_variables: dynamicVariables,
        metadata: {
          follow_up_id: follow_up_id,
          donor_id: followUp.donor_id,
        },
      }),
    });

    const retellData = await retellResponse.json();

    if (!retellResponse.ok) {
      console.error("Retell API error:", retellData);
      return new Response(JSON.stringify({ error: "Failed to initiate call", details: retellData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Call initiated successfully:", retellData.call_id);

    // Update follow-up with call info
    const { error: updateError } = await supabase
      .from("follow_ups")
      .update({
        ai_call_id: retellData.call_id,
        ai_call_status: "initiated",
        ai_called_at: new Date().toISOString(),
      })
      .eq("id", follow_up_id);

    if (updateError) {
      console.error("Error updating follow-up:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      call_id: retellData.call_id,
      message: "Call initiated successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in retell-initiate-call:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
