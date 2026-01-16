
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData, Chapter } from "../types.ts";

/**
 * Creates a Gemini client. The API_KEY is obtained exclusively from the environment.
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("The API_KEY environment variable is not configured. Please ensure it is set in your environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
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
      model: 'gemini-3-flash-preview',
      contents: `Generate a high-authority ebook for "${brandName}" in the "${niche}" niche about "${topic}" with a "${tone}" tone.

Requirements:
1. Chapters: Exactly 7 expert-level chapters.
2. Structure: Captivating title, subtitle, introduction, and bonuses.
3. Content: Expert depth, professional formatting, JSON output only.`,
      config: {
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
                  description: { type: Type.STRING }
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
    throw new Error(err.message || "Failed to generate ebook. Please ensure your API key is valid and active.");
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
      model: 'gemini-3-flash-preview',
      contents: `Add a new chapter to "${ebookTitle}" about "${newChapterTopic}". Maintaining tone: ${tone}. JSON output.`,
      config: {
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
    console.error("Gemini Error:", err);
    throw new Error(err.message || "Failed to generate additional chapter.");
  }
};
