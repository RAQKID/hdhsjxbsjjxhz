import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Load keys safely
const keys = (process.env.MY_KEYS || "")
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

// Load endpoints safely
const endpoints = (process.env.ENDPOINTS || "")
  .split(",")
  .map(x => x.trim())
  .filter(Boolean);

// Map route names to endpoints
const endpointMap = {
  gpt4: endpoints[0],
  cohere: endpoints[1],
  llama: endpoints[2],
  deepseek: endpoints[3],
  nemotron: endpoints[4],
  gemma: endpoints[5],
  qwen: endpoints[6],
  glm: endpoints[7]
};

// root route
app.get("/", (req, res) => {
  res.send("Go to https://discord.com/invite/fSYqDszJcy for more information.");
});

// dynamic routes
app.get("/:model", async (req, res) => {
  const { model } = req.params;
  const { prompt, key } = req.query;

  if (!prompt) {
    return res.status(400).json({ status: false, error: "Missing prompt" });
  }

  if (!key || !keys.includes(key)) {
    return res.status(403).json({ status: false, error: "Invalid API key" });
  }

  const endpoint = endpointMap[model];
  if (!endpoint) {
    return res.redirect("/");
  }

  try {
    const url = `${endpoint}?prompt=${encodeURIComponent(
      prompt
    )}&key=${process.env.KASTG_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    // ✅ Normalize response
    let aiResponse;
    if (data?.result && Array.isArray(data.result) && data.result[0]?.response) {
      aiResponse = data.result[0].response;
    } else if (data?.response) {
      aiResponse = data.response;
    } else {
      aiResponse = JSON.stringify(data); // fallback
    }

    return res.json({
      status: true,
      result: [{ response: aiResponse }]
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: "Error fetching AI response",
      details: error.message
    });
  }
});

// catch-all redirect
app.use((req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
