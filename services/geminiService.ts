
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData, Chapter } from "../types.ts";

export const generateEbook = async (
  topic: string,
  niche: string,
  brandName: string,
  tone: string
): Promise<EbookData> => {
  try {
    // Initializing with named parameter as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-preview for high-authority complex ebook generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a high-authority, expert-level ebook for "${brandName}" in the "${niche}" niche about "${topic}" with a "${tone}" tone.

Requirements:
1. Chapters: Exactly 7 chapters of deep, insightful content.
2. Structure: Catchy title, subtitle, introduction, 7 chapters, bonuses, and a professional Call to Action (CTA).
3. Formatting: Use expert terminology, actionable advice, and professional structure. 
4. Output: Valid JSON matching the schema precisely.`,
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
            cta: { 
              type: Type.STRING,
              description: "A professional closing call to action for the reader."
            },
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
          required: ["title", "subtitle", "introduction", "chapters", "bonuses", "author", "niche", "cta"]
        },
      },
    });

    // Access .text property directly instead of calling it as a function
    const text = response.text;
    if (!text) throw new Error("The AI returned an empty response.");
    return JSON.parse(text.trim()) as EbookData;
  } catch (err: any) {
    console.error("Gemini Generation Error:", err);
    throw new Error(err.message || "An unexpected error occurred during ebook generation.");
  }
};

export const generateAdditionalChapter = async (
  ebookTitle: string,
  existingChapters: Chapter[],
  newChapterTopic: string,
  tone: string
): Promise<Chapter> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-preview for detailed chapter generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Add a new expert-level chapter to the ebook "${ebookTitle}" about "${newChapterTopic}". Tone: ${tone}. JSON output.`,
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

    // Access .text property directly instead of calling it as a function
    const text = response.text;
    if (!text) throw new Error("Empty response from AI.");
    return JSON.parse(text.trim()) as Chapter;
  } catch (err: any) {
    console.error("Gemini Chapter Addition Error:", err);
    throw new Error(err.message || "Failed to generate the additional chapter.");
  }
};
