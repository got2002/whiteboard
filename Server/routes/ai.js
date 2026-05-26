const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ============================================================
// Rate Limiting - จำกัดจำนวน request ต่อ IP (10 ครั้ง/นาที)
// ============================================================
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);

  // กรองเฉพาะ timestamp ที่ยังอยู่ใน window
  const timestamps = rateLimitMap.get(ip).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) return false;

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// ============================================================
// Helper - สร้าง Gemini model instance
// ============================================================
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "Do not use any Markdown formatting like **, *, or # in your response. Output plain text only. If you need to make a list, use standard numbers (1., 2.) or hyphens (-).",
  });
}

// ============================================================
// POST /generate - สร้างเนื้อหาจาก prompt (รองรับรูปภาพ)
// ============================================================
router.post("/generate", async (req, res) => {
  try {
    // ตรวจสอบ API Key
    const model = getGeminiModel();
    if (!model) {
      return res
        .status(503)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    // ตรวจสอบ Rate Limit
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Max 10 requests per minute." });
    }

    const { prompt, imageBase64 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required." });
    }

    let result;

    if (imageBase64) {
      // Multimodal: ส่งทั้งข้อความและรูปภาพ
      const imagePart = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: "image/png",
        },
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Text only
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    res.json({ result: text });
  } catch (err) {
    console.error("❌ AI Error:", err.message || err);
    res.status(500).json({ error: "AI generation failed: " + err.message });
  }
});

// ============================================================
// POST /translate - แปลภาษาข้อความ (รองรับรูปภาพ)
// ============================================================
router.post("/translate", async (req, res) => {
  try {
    // ตรวจสอบ API Key
    const model = getGeminiModel();
    if (!model) {
      return res
        .status(503)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    // ตรวจสอบ Rate Limit
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Max 10 requests per minute." });
    }

    const { text, targetLang, imageBase64 } = req.body;

    if (!targetLang) {
      return res.status(400).json({ error: "targetLang is required." });
    }

    let result;

    if (imageBase64) {
      // Multimodal: ดึงข้อความจากรูปภาพแล้วแปล
      const translationPrompt = `Extract any text from this image and translate it to ${targetLang}. Return only the translated text.`;
      const imagePart = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: "image/png",
        },
      };
      result = await model.generateContent([translationPrompt, imagePart]);
    } else {
      // Text only: แปลข้อความ
      if (!text) {
        return res.status(400).json({ error: "text is required when no image is provided." });
      }
      const translationPrompt = `Translate the following text to ${targetLang}. Only return the translation, nothing else:\n\n${text}`;
      result = await model.generateContent(translationPrompt);
    }

    const response = await result.response;
    const translatedText = response.text();

    res.json({ result: translatedText });
  } catch (err) {
    console.error("❌ AI Error:", err.message || err);
    res.status(500).json({ error: "AI translation failed: " + err.message });
  }
});

module.exports = router;
