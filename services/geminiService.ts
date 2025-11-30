import { GoogleGenAI } from "@google/genai";
import { ScrapeResult } from "../types";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

export const analyzeUrlContent = async (url: string): Promise<ScrapeResult> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Perform a deep analysis of the following URL: ${url}. 
      Act as a web scraper and content analyzer. 
      Use Google Search to find the most recent content associated with this URL to ensure accuracy.
      
      You MUST return the result as a raw valid JSON object (no markdown formatting, no code blocks) with the following specific structure:
      {
        "title": "Page Title",
        "summary": "A concise summary (max 3 sentences).",
        "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "sentiment": "Positive" | "Neutral" | "Negative",
        "mainEntities": ["Entity1", "Entity2", "Entity3"],
        "estimatedReadingTimeMinutes": 5
      }
      
      Ensure "sentiment" is exactly one of: "Positive", "Neutral", "Negative".
      Ensure "estimatedReadingTimeMinutes" is a number.
      `,
      config: {
        tools: [{ googleSearch: {} }], // Enable grounding to "visit" the web
        // Note: responseMimeType: "application/json" is NOT supported when using tools like googleSearch.
        // We must parse the text manually.
      },
    });

    // 1. Parse the JSON text content
    let text = response.text || "{}";
    // Clean up any potential markdown code blocks the model might add despite instructions
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data: ScrapeResult;
    try {
      data = JSON.parse(text) as ScrapeResult;
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("Failed to parse the analysis result. The model output was not valid JSON.");
    }

    // 2. Extract Grounding Metadata (Sources)
    // The Gemini API returns grounding information in candidates[0].groundingMetadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract web sources
    const sources = groundingChunks
      .map(chunk => chunk.web)
      .filter(web => web !== undefined && web !== null)
      .map(web => ({
        title: web.title || 'Source',
        uri: web.uri || ''
      }))
      // Simple deduplication based on URI
      .filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    data.sources = sources;

    return data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};