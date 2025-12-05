import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScreeningRule {
  id: string;
  rule_type: "hard_disqualify" | "soft_flag" | "threshold";
  rule_name: string;
  rule_key: string;
  rule_value: { value: number | boolean | string; operator: string };
  field_path: string;
  description: string;
  is_active: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

interface EvaluationFlag {
  rule_key: string;
  rule_name: string;
  severity: string;
  message: string;
  rule_type: string;
  actual_value?: string | number | boolean;
}

interface EvaluationResult {
  score: number;
  recommendation: "suitable" | "unsuitable" | "review_required";
  flags: EvaluationFlag[];
  summary: string;
  evaluated_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id, use_ai = false } = await req.json();

    if (!submission_id) {
      throw new Error("submission_id is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the submission
    const { data: submission, error: subError } = await supabase
      .from("webform_submissions")
      .select("*")
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      throw new Error(`Submission not found: ${subError?.message}`);
    }

    // Fetch active screening rules
    const { data: rules, error: rulesError } = await supabase
      .from("screening_rules")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    console.log(`Evaluating submission ${submission_id} against ${rules?.length || 0} rules`);

    // Calculate derived fields
    const calculatedFields: Record<string, number | boolean | null> = {};

    // Calculate age
    if (submission.birth_date) {
      const birthDate = new Date(submission.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      calculatedFields.calculated_age = age;
    }

    // Calculate BMI
    if (submission.height_feet && submission.weight) {
      const totalInches = (submission.height_feet * 12) + (submission.height_inches || 0);
      if (totalInches > 0) {
        const bmi = (submission.weight / (totalInches * totalInches)) * 703;
        calculatedFields.calculated_bmi = Math.round(bmi * 10) / 10;
      }
    }

    // Apply rules and collect flags
    const flags: EvaluationFlag[] = [];
    let hasHardDisqualifier = false;

    for (const rule of (rules || []) as ScreeningRule[]) {
      let fieldValue: number | boolean | string | null = null;

      // Get the field value (either calculated or from submission)
      if (rule.field_path.startsWith("calculated_")) {
        fieldValue = calculatedFields[rule.field_path] ?? null;
      } else {
        fieldValue = (submission as Record<string, unknown>)[rule.field_path] as typeof fieldValue ?? null;
      }

      // Skip if field is null/undefined
      if (fieldValue === null || fieldValue === undefined) {
        continue;
      }

      const ruleConfig = rule.rule_value;
      let triggered = false;

      // Evaluate based on operator
      switch (ruleConfig.operator) {
        case "gt":
          triggered = typeof fieldValue === "number" && fieldValue > (ruleConfig.value as number);
          break;
        case "gte":
          triggered = typeof fieldValue === "number" && fieldValue >= (ruleConfig.value as number);
          break;
        case "lt":
          triggered = typeof fieldValue === "number" && fieldValue < (ruleConfig.value as number);
          break;
        case "lte":
          triggered = typeof fieldValue === "number" && fieldValue <= (ruleConfig.value as number);
          break;
        case "eq":
          triggered = fieldValue === ruleConfig.value;
          break;
        case "neq":
          triggered = fieldValue !== ruleConfig.value;
          break;
        default:
          console.log(`Unknown operator: ${ruleConfig.operator}`);
      }

      if (triggered) {
        console.log(`Rule triggered: ${rule.rule_name} (${rule.rule_type})`);
        
        flags.push({
          rule_key: rule.rule_key,
          rule_name: rule.rule_name,
          severity: rule.severity,
          message: rule.description,
          rule_type: rule.rule_type,
          actual_value: fieldValue,
        });

        if (rule.rule_type === "hard_disqualify") {
          hasHardDisqualifier = true;
        }
      }
    }

    // Calculate score and recommendation
    let score: number;
    let recommendation: "suitable" | "unsuitable" | "review_required";
    let summary: string;

    if (hasHardDisqualifier) {
      score = 15;
      recommendation = "unsuitable";
      const hardFlags = flags.filter(f => f.rule_type === "hard_disqualify");
      summary = `Automatically disqualified due to: ${hardFlags.map(f => f.rule_name).join(", ")}.`;
    } else if (flags.length > 0) {
      // Calculate score based on soft flags
      const severityScores: Record<string, number> = {
        critical: 25,
        high: 15,
        medium: 10,
        low: 5,
      };
      const totalDeduction = flags.reduce((sum, f) => sum + (severityScores[f.severity] || 5), 0);
      score = Math.max(40, 85 - totalDeduction);
      recommendation = "review_required";
      summary = `${flags.length} flag(s) require manual review: ${flags.map(f => f.rule_name).join(", ")}.`;
    } else {
      score = 95;
      recommendation = "suitable";
      summary = "No flags triggered. Submission appears suitable for donor approval.";
    }

    // Optional: Use AI for deeper analysis on review_required cases
    if (use_ai && recommendation === "review_required") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          console.log("Calling Lovable AI for deeper analysis...");
          
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `You are a medical screening assistant helping evaluate bone marrow donor eligibility. 
Analyze the submission data and provide a brief, professional assessment. Focus on:
1. The significance of each flagged condition
2. Whether the combination of factors increases or decreases concern
3. A clear recommendation (suitable, unsuitable, or needs further review)
Keep your response under 150 words and be direct.`,
                },
                {
                  role: "user",
                  content: `Evaluate this donor submission:
Age: ${calculatedFields.calculated_age || "Unknown"}
BMI: ${calculatedFields.calculated_bmi || "Unknown"}
Sex: ${submission.assigned_sex}

Flagged conditions:
${flags.map(f => `- ${f.rule_name}: ${f.actual_value} (${f.severity} severity)`).join("\n")}

Additional details from submission:
${submission.chronic_illness_details ? `Chronic illness: ${submission.chronic_illness_details}` : ""}
${submission.surgery_details ? `Surgery: ${submission.surgery_details}` : ""}
${submission.medication_details ? `Medications: ${submission.medication_details}` : ""}
${submission.travel_details ? `Travel: ${submission.travel_details}` : ""}

Provide your assessment.`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiSummary = aiData.choices?.[0]?.message?.content;
            if (aiSummary) {
              summary = aiSummary;
            }
          }
        } catch (aiError) {
          console.error("AI analysis failed, using rule-based summary:", aiError);
        }
      }
    }

    const evaluation: EvaluationResult = {
      score,
      recommendation,
      flags,
      summary,
      evaluated_at: new Date().toISOString(),
    };

    // Update the submission with evaluation results
    const { error: updateError } = await supabase
      .from("webform_submissions")
      .update({
        ai_evaluation: evaluation,
        ai_score: score,
        ai_recommendation: recommendation,
        evaluation_flags: flags,
        evaluated_at: evaluation.evaluated_at,
      })
      .eq("id", submission_id);

    if (updateError) {
      throw new Error(`Failed to update submission: ${updateError.message}`);
    }

    console.log(`Evaluation complete: ${recommendation} (score: ${score})`);

    return new Response(JSON.stringify({ success: true, evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
