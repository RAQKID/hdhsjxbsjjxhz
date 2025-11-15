import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Load keys safely
const keys = (process.env.MY_KEYS || "")
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

// ✅ Load endpoints safely
const endpoints = (process.env.ENDPOINTS || "")
  .split(",")
  .map(x => x.trim())
  .filter(Boolean);

// ✅ Map route names to endpoints
const endpointMap = {
  error_networks: endpoints[0],
  cohere: endpoints[1],
  llama: endpoints[2],
  deepseek: endpoints[3],
  nemotron: endpoints[4],
  gemma: endpoints[5],
  qwen: endpoints[6],
  axentra: endpoints[7],
  popcat: endpoints[8],
  grok: endpoints[9],
  claude: endpoints[10],
  gpt5: endpoints[11],
  stable_diff: endpoints[12]
};

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Go to https://discord.com/invite/fSYqDszJcy for API Keys and API Informations.");
});

// ✅ Dynamic routes
app.get("/:model", async (req, res) => {
  const { model } = req.params;
  const { prompt, key } = req.query;

  const endpoint = endpointMap[model];
  if (!endpoint) return res.redirect("/");

  if (!prompt) {
    return res.status(400).json({ status: false, error: "Missing prompt" });
  }

  if (!key || !keys.includes(key)) {
    return res.status(403).json({ status: false, error: "Invalid API key" });
  }

  try {
    const url = `${endpoint}?prompt=${encodeURIComponent(prompt)}&key=${process.env.KASTG_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    // ✅ Handle direct false or missing status
    if (!data || data.status === false || typeof data.status === "undefined") {
      return res.status(503).json({
        status: false,
        error: "The server is busy, try again later."
      });
    }

    // ✅ Extract AI response
    let aiResponse =
      data?.result?.[0]?.response ??
      data?.response ??
      JSON.stringify(data);

    // ✅ Detect if aiResponse is actually JSON string with "status":"false"
    try {
      const parsed = JSON.parse(aiResponse);
      if (
        parsed &&
        (parsed.status === false ||
          parsed.status === "false" ||
          parsed.error ||
          parsed.message?.toLowerCase()?.includes("error"))
      ) {
        return res.status(503).json({
          status: false,
          error: "The server is busy, try again later."
        });
      }
    } catch {
      // ignore if not JSON
    }

    // ✅ Detect known busy/reject phrases
    const busyMessages = [  
      "Rejected: Try again later!",  
      '{"status":true,"result":[{"response":"Rejected: Try again later!"}]}'  
    ];

    if (
      busyMessages.some(msg =>
        aiResponse.trim().toLowerCase().includes(msg.toLowerCase())
      )
    ) {
      return res.status(503).json({
        status: false,
        error: "The server is busy, try again later."
      });
    }

    // ✅ Return success
    return res.json({
      status: true,
      result: [{ response: aiResponse }]
    });
  } catch (error) {
    const networkErrors = ["ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"];
    if (networkErrors.some(code => error.message.includes(code))) {
      return res.status(503).json({
        status: false,
        error: "The server is having a errors, make a ticket in the Official Server and report this quickly."
      });
    }

    return res.status(500).json({
      status: false,
      error: "Error fetching AI response",
      details: error.message
    });
  }
});

app.use((req, res) => res.redirect("/"));

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
