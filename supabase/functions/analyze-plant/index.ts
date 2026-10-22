const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisResult {
  health_score: number;
  growth_stage: string;
  leaf_condition: string;
  stress_risk: number;
  ai_analysis: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Read the key inside the handler so updates take effect without redeploy
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "AI analysis is not configured. The project owner must set the OPENAI_API_KEY secret in Supabase." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect placeholder values that were saved instead of real keys
    const trimmedKey = openaiKey.trim();
    if (!trimmedKey.startsWith("sk-")) {
      return new Response(
        JSON.stringify({ error: "The OpenAI API key appears to be invalid. It should start with 'sk-'. Ask the project owner to update the OPENAI_API_KEY secret with a real key from https://platform.openai.com/api-keys." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const imageUrl: string | undefined = body.image_url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing image_url in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that the image URL belongs to our Supabase storage bucket
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    if (!imageUrl.startsWith(supabaseUrl)) {
      return new Response(
        JSON.stringify({ error: "Image URL is not from this project's storage." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI Vision API to analyze the plant image
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${trimmedKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are PLANT-X, an AI plant health assessment system for a science research project. You analyze plant photos and provide a structured health assessment.

Respond ONLY with a JSON object (no markdown, no code fences, no preamble) with exactly these fields:
{
  "health_score": <integer 0-100, your estimate of overall plant health>,
  "growth_stage": <one of: "seedling", "vegetative", "flowering", "fruiting", "mature">,
  "leaf_condition": <one of: "healthy", "slight-curling", "wilting", "yellowing", "dropping">,
  "stress_risk": <integer 0-100, your estimate of current stress risk>,
  "ai_analysis": <2-4 sentence explanation of what you observe: leaf color, area, wilting signs, growth indicators, and any stress signals>
}

Be honest and conservative. If you cannot clearly assess something, give a mid-range value and explain in the analysis. This is a science project — accuracy and transparency matter more than optimism.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plant photo and provide a structured health assessment."
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);

      // Map known OpenAI error statuses to safe user-facing messages (no key leakage)
      let userMessage = "The AI service returned an error. Please try again.";
      if (openaiResponse.status === 401) {
        userMessage = "The OpenAI API key is invalid or expired. The project owner must update the OPENAI_API_KEY secret with a valid key from https://platform.openai.com/api-keys.";
      } else if (openaiResponse.status === 403) {
        userMessage = "OpenAI rejected the request. Check that your OpenAI account has billing set up and credits available.";
      } else if (openaiResponse.status === 429) {
        userMessage = "The AI service is rate-limited. Please wait a moment and try again.";
      } else if (openaiResponse.status === 404) {
        userMessage = "The AI model 'gpt-4o' is not available on your OpenAI account. Check your model access settings.";
      } else if (openaiResponse.status >= 500) {
        userMessage = "The AI service is temporarily unavailable. Please try again in a moment.";
      }

      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI returned no content. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response — strip any markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let result: AnalysisResult;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON:", cleaned);
      return new Response(
        JSON.stringify({ error: "AI returned an unexpected format. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and clamp numeric fields
    result.health_score = Math.max(0, Math.min(100, Math.round(result.health_score ?? 50)));
    result.stress_risk = Math.max(0, Math.min(100, Math.round(result.stress_risk ?? 50)));

    // Validate string fields against allowed values
    const validStages = ["seedling", "vegetative", "flowering", "fruiting", "mature"];
    const validConditions = ["healthy", "slight-curling", "wilting", "yellowing", "dropping"];

    if (!validStages.includes(result.growth_stage)) {
      result.growth_stage = "vegetative";
    }
    if (!validConditions.includes(result.leaf_condition)) {
      result.leaf_condition = "healthy";
    }
    if (!result.ai_analysis || typeof result.ai_analysis !== "string") {
      result.ai_analysis = "Unable to generate a detailed analysis for this image.";
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred during analysis." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
