// server/index.js
require("dotenv").config({ path: "../.env" });

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const providerRoutes = require("./routes/provider");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

const rawEnvKey = process.env.OPENAI_API_KEY;
const OPENAI_API_KEY = rawEnvKey ? rawEnvKey.trim() : "";

if (!OPENAI_API_KEY) {
  console.error(
    "❌ Missing OPENAI_API_KEY in environment. Set it in server/.env before starting the server."
  );
  // If you want to hard fail on startup, uncomment:
  // process.exit(1);
}

console.log(
  "OPENAI_API_KEY present in env?",
  !!rawEnvKey,
  "final key length:",
  OPENAI_API_KEY.length
);

// ===== debug route =====
app.get("/api/debug-openai", (_req, res) => {
  res.json({
    hasKey: !!rawEnvKey,
    keyPrefix: OPENAI_API_KEY.slice(0, 8),
  });
});

// ===== your existing routes =====
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

// ===== NEW: AI drug interaction endpoint (chat/completions) =====
app.post("/api/drug-interactions", async (req, res) => {
  try {
    const rawDrugs = Array.isArray(req.body.drugs) ? req.body.drugs : [];

    const drugs = Array.from(
      new Set(
        rawDrugs
          .map((d) => (d || "").trim())
          .filter((d) => d.length > 0)
      )
    );

    if (drugs.length < 2) {
      return res.json({
        summary: "Need at least two medications to check interactions.",
        interactions: [],
      });
    }

    const systemPrompt = `
You are a cautious clinical pharmacist.

Given a list of medication names a single patient is taking, you will:

1. Identify all clinically relevant DRUG–DRUG interactions between them.
2. For each interaction, assign a severity:
   - "none"
   - "minor"
   - "moderate"
   - "major"
3. Provide a short, clear description of the risk.
4. Suggest a brief recommended action:
   (e.g., "monitor closely", "avoid combination", "dose adjustment may be required", etc.)

You MUST respond ONLY as a JSON object with this shape:

{
  "summary": "short overall summary string",
  "interactions": [
    {
      "drugs": ["drug name 1", "drug name 2"],
      "severity": "none | minor | moderate | major",
      "description": "short description of the interaction",
      "action": "short recommended action for clinicians"
    }
  ]
}

If you are not sure about an interaction, either omit it or mark severity as "none" with a cautious description.
Do NOT include any extra keys, text, or explanations outside the JSON.
`;

    const userPrompt = `
The patient is taking these medications:

${drugs.join(", ")}

Please check all drug–drug interactions for this specific combination and respond in the JSON format described above.
`;

    // 🔥 Call OpenAI chat/completions directly with axios
    const openaiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // a real, lightweight model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const content =
      openaiRes.data?.choices?.[0]?.message?.content?.trim() || "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from OpenAI:", content);
      return res.status(500).json({
        error: "Failed to parse JSON from OpenAI",
        raw: content,
      });
    }

    return res.json({
      summary: parsed.summary || "",
      interactions: parsed.interactions || [],
    });
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err?.message || err;

    console.error("Error in /api/drug-interactions:", status, data);

    return res.status(status).json({
      error: "OpenAI error",
      details: data,
    });
  }
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
