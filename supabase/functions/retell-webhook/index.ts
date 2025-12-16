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
    const payload = await req.json();
    console.log("Received Retell webhook:", JSON.stringify(payload, null, 2));

    const { event, call } = payload;

    if (!call?.call_id) {
      console.log("No call_id in payload, ignoring");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the follow-up by call ID
    const { data: followUp, error: findError } = await supabase
      .from("follow_ups")
      .select("id, donor_id, status")
      .eq("ai_call_id", call.call_id)
      .single();

    if (findError || !followUp) {
      console.log("Follow-up not found for call_id:", call.call_id);
      return new Response(JSON.stringify({ received: true, warning: "Follow-up not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${event} for follow-up ${followUp.id}`);

    if (event === "call_started") {
      await supabase
        .from("follow_ups")
        .update({ ai_call_status: "in_progress" })
        .eq("id", followUp.id);
    } else if (event === "call_ended" || event === "call_analyzed") {
      const updateData: Record<string, unknown> = {
        ai_call_status: call.call_status === "ended" ? "completed" : call.call_status,
        ai_call_duration_ms: call.duration_ms,
        ai_recording_url: call.recording_url,
        ai_call_summary: call.call_analysis || null,
      };

      // Store transcript
      if (call.transcript) {
        updateData.ai_transcript = call.transcript;
      }

      // Parse transcript to extract responses using Lovable AI
      if (call.transcript && call.call_status === "ended") {
        try {
          const parsedResponses = await parseTranscriptWithAI(call.transcript);
          if (parsedResponses) {
            updateData.ai_parsed_responses = parsedResponses;

            // Check if call was successful or callback was requested
            if (parsedResponses.call_successful === false) {
              // Donor requested callback - set specific status and keep follow-up visible
              updateData.ai_call_status = "callback_requested";
              // Update follow-up status to callback_requested so it stays in the dashboard
              updateData.status = "callback_requested";
              console.log("Callback requested by donor - follow-up will remain visible in dashboard");
            } else if (parsedResponses.call_successful === true) {
              updateData.ai_call_status = "completed";
              // Don't auto-complete the follow-up - let staff review and apply data
            }
          }
        } catch (parseError) {
          console.error("Error parsing transcript:", parseError);
        }
      }

      // Handle failed/unsuccessful calls
      if (call.disconnection_reason && 
          ["no_answer", "busy", "voicemail"].includes(call.disconnection_reason)) {
        updateData.ai_call_status = "failed";
      }

      await supabase
        .from("follow_ups")
        .update(updateData)
        .eq("id", followUp.id);

      console.log("Updated follow-up with call results:", JSON.stringify(updateData, null, 2));
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function parseTranscriptWithAI(transcript: string): Promise<Record<string, unknown> | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return null;
  }

  const systemPrompt = `You are an expert at parsing phone call transcripts from donor follow-up calls. 
Extract structured data from the conversation. Return a JSON object with the following fields:

- call_successful: boolean - true if the donor answered and completed the questionnaire. Set to FALSE if:
  - The donor asked to be called back later
  - The donor said they're busy or can't talk now
  - The call was cut short before completing
  - The donor didn't answer all the questions
  - The donor explicitly requested a callback
- callback_requested: boolean - true if the donor explicitly asked to be called back later
- callback_reason: string or null - why they want to call back (busy, not feeling well, bad time, etc.)
- pain_level: number (1-10) or null - pain during procedure
- current_pain_level: number (1-10) or null - current pain level
- doctor_rating: number (1-5) or null
- nurse_rating: number (1-5) or null  
- staff_rating: number (1-5) or null
- took_pain_medication: boolean or null
- pain_medication_details: string or null
- checked_aspiration_sites: boolean or null
- aspiration_sites_notes: string or null
- signs_of_infection: boolean or null
- infection_details: string or null
- unusual_symptoms: boolean or null
- symptoms_details: string or null
- would_donate_again: boolean or null
- procedure_feedback: string or null - any general feedback mentioned
- concerns_flagged: boolean - true if donor mentioned serious concerns
- summary: string - brief summary of the call

Only include fields where you can confidently extract the data. Use null for unclear or missing information.
IMPORTANT: If the conversation indicates the donor couldn't complete the call or asked to call back, set call_successful to false and callback_requested to true.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this follow-up call transcript:\n\n${transcript}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error calling Lovable AI:", error);
  }

  return null;
}
