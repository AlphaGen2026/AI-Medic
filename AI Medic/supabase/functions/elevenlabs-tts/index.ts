import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, lang, persona = "aziz" } = await req.json();

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }

    if (!text) {
      throw new Error("Text is required");
    }

    // Voice IDs
    // Adam (deep, male): pNInz6obpgDQGcFmaJgB
    // Rachel (calm, female): 21m00Tcm4TlvDq8ikWAM
    const voiceId = persona === "aziza" ? "21m00Tcm4TlvDq8ikWAM" : "pNInz6obpgDQGcFmaJgB";

    // Use eleven_multilingual_v2 for better language support
    const modelId = "eleven_multilingual_v2";

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API Error:", errorData);
      throw new Error(`ElevenLabs API Error: ${response.status}`);
    }

    // Return the audio stream
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("elevenlabs-tts error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate speech" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
