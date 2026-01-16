
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData, Chapter } from "../types.ts";

export const generateEbook = async (
  topic: string,
  niche: string,
  brandName: string,
  tone: string
): Promise<EbookData> => {
  // Directly initialize inside the function to ensure we use the most up-to-date env state
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable in your Vercel dashboard.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a world-class author and content strategist. Generate a high-authority ebook for "${brandName}" in the "${niche}" niche about "${topic}" with a "${tone}" tone.

CRITICAL CONTENT REQUIREMENTS (STRICT):
1. CHAPTERS: Exactly 7 chapters. Each chapter MUST be at least 15 sentences long.
2. INTRODUCTION: At least 10 sentences.
3. MANUSCRIPT RULES:
   - Use short, readable paragraphs (3-4 sentences each).
   - Avoid long compound sentences and complex jargon.
   - Leave clear separation between paragraphs in the text.
   - Each chapter must provide deep-dive expertise, not just surface-level tips.

STRUCTURE: 
- Captivating Title: Professional, short, and punchy (max 6 words).
- Descriptive Subtitle: Elaborate on the value proposition.
- 3 Bonus Assets: Checklists or guides. Each bonus must have a title, type, and detailed description.

PDF-SAFE LAYOUT CONSTRAINTS:
- No markdown tables or code blocks.
- Bullet points must be concise and not overflow page width.
- Chapter titles must be short (1-2 lines).

Output strictly as a valid JSON object matching the schema.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are extending a high-authority ebook titled "${ebookTitle}".
The existing chapters cover: ${existingChapters.map(c => c.title).join(', ')}.
Generate a NEW chapter focusing on: "${newChapterTopic}".

STRICT MANUSCRIPT REQUIREMENTS:
1. CONTENT LENGTH: Must be AT LEAST 15 sentences long.
2. TONE: Maintain a "${tone}" tone consistent with the rest of the book.
3. FORMATTING: Use short paragraphs (3-4 sentences). Leave space between them.
4. PDF-SAFETY: No markdown, no tables, no oversized words.
5. QUALITY: Provide expert-level depth.

Output strictly as a valid JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A punchy chapter title (max 2 lines)" },
            content: { type: Type.STRING, description: "The full chapter content (minimum 15 sentences)" }
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
