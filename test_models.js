import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

async function run() {
  try {
    // Actually the SDK doesn't expose listModels directly easily in older versions, 
    // let's try calling gemini-pro instead.
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Test");
    console.log(result.response.text());
  } catch(e) {
    console.error(e);
  }
}
run();
