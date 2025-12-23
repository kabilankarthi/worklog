
import { GoogleGenAI } from "@google/genai";
import { WorkEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWorkInsights = async (entries: WorkEntry[]) => {
  if (entries.length === 0) return "Start logging your hours to get AI insights!";

  const prompt = `
    Analyze my recent work log and provide a short, motivating 2-sentence feedback:
    ${JSON.stringify(entries.slice(-7))}
    
    Rules:
    - Keep it under 200 characters.
    - Be professional yet encouraging.
    - Focus on consistency and productivity.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Keep up the great work!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Your work schedule looks solid. Stay focused!";
  }
};
