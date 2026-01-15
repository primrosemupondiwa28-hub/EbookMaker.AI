
import { GoogleGenAI, Type } from "@google/genai";
import { EbookData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateEbook = async (
  topic: string,
  niche: string,
  brandName: string,
  tone: string
): Promise<EbookData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are an AI Ebook Generator that creates premium, authority-level ebooks designed for high-ticket lead generation and expert positioning. 

Topic: "${topic}"
Niche: "${niche}"
Author/Brand: "${brandName}"
Tone: ${tone}

CRITICAL INSTRUCTIONS:
1. Generate exactly 15 chapters.
2. Each chapter must be fully written, complete, and client-ready prose. 
3. This is NOT an outline, overview, or summary. Do NOT include chapter descriptions or placeholders.
4. QUALITY RULES:
   - Every chapter must contain real, in-depth, expert information.
   - Every chapter must be substantial (aim for 500+ words per chapter). Short content is unacceptable.
   - Use multiple paragraphs and clear sections.
   - Each chapter must be a finished product that positions the author as a trusted high-ticket expert.
5. Also include:
   - A captivating title and subtitle.
   - A comprehensive introduction.
   - 3 unique, irresistible bonus offers (checklists, mini-guides, or templates) that complement the authority positioning.

The final output must be ready for immediate delivery, publishing, or use as a high-value asset. Assume the reader should feel confident paying for a high-ticket offer after reading this content.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
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
                content: { type: Type.STRING, description: "Full, detailed, expert-level prose (Minimum 15 lines/500 words)." },
              },
              required: ["title", "content"]
            },
            minItems: 15,
            maxItems: 15
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
  if (!text) throw new Error("Failed to generate authority ebook content.");
  return JSON.parse(text) as EbookData;
};
