
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData, Chapter } from "../types.ts";

export const generateEbook = async (
  topic: string,
  niche: string,
  brandName: string,
  tone: string
): Promise<EbookData> => {
  // Always create a new instance to pick up the most recent key from the selection dialog
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("No API Key detected. Please click 'Connect API Key' to continue.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for complex, high-quality writing
      contents: `Act as a world-class author and content strategist. Generate a high-authority ebook for "${brandName}" in the "${niche}" niche about "${topic}" with a "${tone}" tone.

CRITICAL CONTENT REQUIREMENTS (STRICT):
1. CHAPTERS: Exactly 7 chapters. Each chapter MUST be substantial and provide expert-level depth.
2. INTRODUCTION: Compelling and at least 10 sentences.
3. MANUSCRIPT RULES:
   - Use short, readable paragraphs (3-4 sentences each).
   - Avoid long compound sentences and complex jargon.
   - Leave clear separation between paragraphs in the text.
   - Provide deep-dive expertise, not surface-level tips.

STRUCTURE: 
- Captivating Title: Professional, short, and punchy (max 6 words).
- Descriptive Subtitle: Elaborate on the value proposition.
- 3 Bonus Assets: Practical tools (checklists, guides, etc.) that add real value.

PDF-SAFE LAYOUT CONSTRAINTS:
- No markdown tables or code blocks.
- Bullet points must be concise.
- All output must be valid JSON.`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }, // High reasoning for better structure
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
    if (!text) throw new Error("Empty response from AI.");
    return JSON.parse(text) as EbookData;
  } catch (err: any) {
    console.error("Gemini Error:", err);
    throw new Error(err.message || "Failed to generate ebook content.");
  }
};

export const generateAdditionalChapter = async (
  ebookTitle: string,
  existingChapters: Chapter[],
  newChapterTopic: string,
  tone: string
): Promise<Chapter> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are extending a high-authority ebook titled "${ebookTitle}".
Generate a NEW chapter focusing on: "${newChapterTopic}".
Maintain a "${tone}" tone and expert depth.

Output strictly as a valid JSON object.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI.");
    return JSON.parse(text) as Chapter;
  } catch (err: any) {
    console.error("Gemini Add Chapter Error:", err);
    throw new Error(err.message || "Failed to generate additional chapter.");
  }
};
