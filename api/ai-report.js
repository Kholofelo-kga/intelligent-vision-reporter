// This will run as an Edge Function on Vercel.
export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const objectName = body.objectName || "unknown object";

  const userPrompt = `
You are an intelligent municipal field assistant.
Write a short incident report (3-5 sentences) in plain English that a municipality can log.
Object detected: "${objectName}".

Include:
- what was seen,
- possible public risk,
- urgency level.
Keep it professional.
  `.trim();

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        report:
          "OPENAI_API_KEY is not set in Vercel project settings.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Call OpenAI API
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        // IMPORTANT:
        // Use a valid model ID that exists in your OpenAI account.
        // "gpt-4o-mini", "gpt-4o", etc. Here we call a placeholder:
        model: "gpt-4o-mini",
        input: userPrompt,
      }),
    });

    const data = await aiResponse.json();

    const aiText =
      data.output?.[0]?.content?.[0]?.text ||
      data.choices?.[0]?.message?.content ||
      "AI reply not found";

    return new Response(
      JSON.stringify({ report: aiText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        report:
          "AI error. Check billing / model / key / network.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
