
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData, Chapter } from "../types.ts";

/**
 * Creates a fresh AI instance using the current environment key.
 * This ensures that if the user selects a new key via the dialog, 
 * the next request uses the updated credential.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEbook = async (
  topic: string,
  niche: string,
  brandName: string,
  tone: string
): Promise<EbookData> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Act as a world-class author and content strategist. Generate a high-authority ebook for "${brandName}" in the "${niche}" niche about "${topic}" with a "${tone}" tone.

CRITICAL CONTENT REQUIREMENTS:
1. CHAPTERS: Exactly 7 chapters with expert-level depth.
2. INTRODUCTION: Compelling and detailed (at least 10 sentences).
3. MANUSCRIPT RULES: Short paragraphs, clear separation, deep-dive expertise.
4. PDF CONSTRAINTS: No tables, no code blocks, valid JSON only.`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
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
    if (err.message === "API_KEY_MISSING") throw err;
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
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Extend ebook "${ebookTitle}" with a new chapter on "${newChapterTopic}". Tone: ${tone}. JSON output.`,
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
    if (err.message === "API_KEY_MISSING") throw err;
    console.error("Gemini Add Chapter Error:", err);
    throw new Error(err.message || "Failed to generate additional chapter.");
  }
};
