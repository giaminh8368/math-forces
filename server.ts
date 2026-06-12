import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parsing with large threshold for image uploads
app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Google Gemini client to prevent crash on startup if missing API Key
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Configure it in Settings > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// ==========================================
// API ROUTES
// ==========================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Route 1: Parse standard math problem image screenshot using Gemini Multimodal Vision API
app.post("/api/parse-problem", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
       res.status(400).json({ error: "Missing image base64 data" });
       return;
    }

    const ai = getGeminiClient();

    // Prepare multimodal parts
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: image,
      },
    };

    const textPart = {
      text: `You are a legendary KAIST Mathematics Professor and KAIST-Forces Problem Coordinator.
Analyze this quiz, exam, or handwritten mathematical problem screenshot.
Extract the math problem, solve it completely, and convert it into a Codeforces-style grading task.

Formulate a response in strict JSON format. The JSON must contain the following keys:
1. "title": A concise, engaging, and professional problem name (e.g., "Hermitian Symmetric Form Solver" or "Oscillating Trigonometric Core"). Keep it clean and literal.
2. "rating": An integer representing Codeforces difficulty rating (MUST be: 800-1200 for basic calculation, 1300-1800 for analytical, 1900-2400 for multi-layered applied, 2500-3000 for complex theorems and proofs).
3. "category": One of these strings: "Calculus", "Linear Algebra", "Series", "3D Geometry", "Proofs".
4. "statement": The detailed mathematical description in clean LaTeX notation. Use standard markdown. Write expressions wrapped in $$ for block displays and $ for inline equations.
5. "sampleInput": A mock explanation of what the user should submit (e.g., "State the parameterized vector equation").
6. "sampleOutput": The correct closed-form analytical answer or final values (e.g. "a = 2, b = -3" or "\\pi/3") formatted in LaTeX.
7. "solution": The step-by-step rigorous analytical proof or calculations, demonstrating how to solve it.
8. "intuition": A paragraph explaining the "Geometric & Visual Intuition" of this problem, and how it directly relates to real-world models (e.g. Deep Learning, Signal Processing, Computer Vision, or Optimization).
9. "tags": An array of string tags (e.g., ["eigenvalues", "determinant", "3D-planes", "taylor", "kaist-exam"]).

Ensure that all math symbols inside string values are correctly double-escaped if necessary so the JSON remains entirely valid. Do not wrap the JSON output in backticks or markdown formatting. Return raw JSON.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            rating: { type: Type.INTEGER },
            category: { type: Type.STRING },
            statement: { type: Type.STRING },
            sampleInput: { type: Type.STRING },
            sampleOutput: { type: Type.STRING },
            solution: { type: Type.STRING },
            intuition: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["title", "rating", "category", "statement", "solution", "intuition", "tags"],
        },
      },
    });

    const parsedJsonText = response.text || "{}";
    const data = JSON.parse(parsedJsonText);
    res.json(data);
  } catch (err: any) {
    console.error("Error in parse-problem api:", err);
    res.status(500).json({ error: err.message || "Failed to parse problem image." });
  }
});

// Route 2: Strict Automated Math Judge using Gemini Reasoning
app.post("/api/judge", async (req, res) => {
  try {
    const { problemTitle, rating, category, statement, code, language, sampleOutput } = req.body;

    if (!code || !statement) {
       res.status(400).json({ error: "Missing submission steps or problem information." });
       return;
    }

    const ai = getGeminiClient();

    const judgePrompt = `You are the legendary "KAIST-Forces Judge" - a rigorous, strict, and brilliant Codeforces-style automated grader for Core Mathematics at KAIST.
Your task is to grade the user's submitted mathematical steps or code logic for the problem "${problemTitle}".

PROBLEM CONTEXT:
- Category: ${category}
- Rating: ${rating}
- Statement: ${statement}
- Expected Correct Target: ${sampleOutput || "Valid proof or matching derivation"}

USER SUBMISSION:
- Submitting Format: ${language}
- User's Solution Steps:
${code}

YOUR INSTRUCTIONS:
Analyze the user's mathematical reasoning, notation, calculations, and intermediate expansions.
Check for any math flaws:
- Is there a simple computation error (for example, negative sign swapped, adding elements incorrectly)? Match with verdict: WA (Wrong Answer)
- Is there a severe logical error, division by zero, invalid operation (e.g. dividing by a singular matrix, projecting on a zero vector, or wrong bounds)? Match with verdict: RTE (Runtime Error)
- Is the solving logic 100% correct, resulting in the correct final analytic expression/proof? Match with verdict: AC (Accepted)
- Is the math and logic technically correct, but incredibly bloated, brute-force, long, or inefficient (e.g., writing 50 full terms of a expansion when a symmetry rule can simplify it instantly in one line)? Match with verdict: TLE (Time Limit Exceeded) and instruct them to optimize.

IMPORTANT CONSTRAINTS FOR [Wrong Answer - WA] VERDICT:
- If you issue WA, you MUST pinpoint precisely which line or transition is incorrect (e.g., "Error in row reduction at step 2" or "Sign mistake when integrating the cosine part").
- But you are STRICTLY FORBIDDEN from revealing the correct transition mathematical expression or final scalar values! Keep those hidden so the user must fix it themselves.

Return your evaluation in strict JSON format.
The JSON must contain:
1. "verdict": One of the strings: "AC", "WA", "RTE", "TLE".
2. "feedback": A highly precise, analytical, and structured explanation of your grading. Be strict, academic, and direct. Use mathematical notations where appropriate.

Format your output as raw JSON string without any added markdown formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: judgePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            feedback: { type: Type.STRING },
          },
          required: ["verdict", "feedback"],
        },
      },
    });

    const parsedJsonText = response.text || "{}";
    const result = JSON.parse(parsedJsonText);
    res.json(result);
  } catch (err: any) {
    console.error("Error in judge api:", err);
    res.status(500).json({ error: err.message || "Execution failure in math grading. Server-side error." });
  }
});

// ==========================================
// VITE DEV / PRODUCTION DIRECT ROUTING MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite's HMR and dev middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite Dev Server middleware.");
  } else {
    // Production Mode: Serve static production assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KAIST-Forces Judge] Server running at http://0.0.0.0:${PORT}`);
    console.log(`Database with ${process.env.GEMINI_API_KEY ? "valid" : "missing"} GEMINI_API_KEY configured.`);
  });
}

startServer();
