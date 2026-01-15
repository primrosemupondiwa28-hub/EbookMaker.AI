
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData } from "../types.ts";

export const generateEbook = async (
  topic: string,
  niche: string,
  brandName: string,
  tone: string
): Promise<EbookData> => {
  // Always obtain the key from process.env.API_KEY as per guidelines.
  // We initialize inside the function to ensure the environment is fully ready.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please ensure it is set in your Vercel Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-flash-preview for faster response times and better reliability for large text tasks
      model: 'gemini-3-flash-preview',
      contents: `You are an AI Ebook Generator that creates premium, authority-level ebooks designed for lead generation and expert positioning. 

Topic: "${topic}"
Niche: "${niche}"
Author/Brand: "${brandName}"
Tone: ${tone}

CRITICAL INSTRUCTIONS:
1. Generate exactly 15 chapters.
2. Each chapter must be fully written expert prose. 
3. Include:
   - Captivating title and subtitle.
   - Comprehensive introduction.
   - 3 unique bonus offers (checklists, mini-guides, or templates).

The final output must be in valid JSON format.`,
      config: {
        thinkingConfig: { thinkingBudget: 24576 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            introduction: { type: Type.STRING },
            author: { type: Type.STRING },
            niche: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ["title", "content"]
              }
            },
            bonuses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["type", "title", "description"]
              }
            }
          },
          required: ["title", "subtitle", "introduction", "chapters", "bonuses", "author", "niche"]
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("The AI model returned an empty response.");
    
    return JSON.parse(text) as EbookData;
  } catch (err: any) {
    console.error("Gemini API detailed error:", err);
    // Extract a more meaningful error message if possible
    const message = err.message || "Unknown API Error";
    throw new Error(message);
  }
};
