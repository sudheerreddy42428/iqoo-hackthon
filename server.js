import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json()); // Essential for parsing frontend data

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are ReproX Crash Investigation Assistant.
Your sole purpose is to help developers investigate software crashes, reproduction, and debugging.

STRICT RULES:
1. ONLY answer questions about software crashes or the provided ReproX incident data.
2. If the user asks anything unrelated, respond EXACTLY: "I’m ReproX Crash Assistant. I can only help with crash investigation."
3. Use the supplied <crash_context> data as your primary source of truth.
4. If riskLevel is HIGH, advise developer review.
5. If verificationStatus is not 'PASSED', do not claim the fix is verified.
6. Give only answers about the crash. Explain the developer report clearly and briefly. Do not be overly verbose.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, crashContext } = req.body; // Correct way to access data in Express
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const incidentData = crashContext ? `
<crash_context>
Error: ${crashContext.errorType}: ${crashContext.message}
Stack Trace: ${crashContext.stackTrace}
Recent Actions: ${JSON.stringify(crashContext.recentActions)}
Analysis: ${JSON.stringify(crashContext.analysis)}
Verification: ${crashContext.verificationStatus}
Risk Level: ${crashContext.analysis?.riskLevel || 'UNKNOWN'}
</crash_context>` : "No active crash incident currently loaded.";

    const userQuery = messages[messages.length - 1].content;
    const finalPrompt = `${SYSTEM_PROMPT}\n\nDATA:\n${incidentData}\n\nUSER: ${userQuery}`;

    const result = await model.generateContent(finalPrompt);
    res.json({ content: result.response.text() });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to communicate with AI" });
  }
});

app.listen(3001, () => console.log('✅ Backend: http://localhost:3001'));
