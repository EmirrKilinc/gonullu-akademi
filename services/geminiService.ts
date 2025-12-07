import { GoogleGenAI } from "@google/genai";

// Initialize the API client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

/**
 * Calls the Gemini API to generate a response for a given prompt.
 * Uses the gemini-2.5-flash model for fast responses.
 */
export const callGemini = async (prompt: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock response.");
    return "API Anahtarı bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Üzgünüm, şu an cevap üretemiyorum.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağlantı hatası oluştu. Lütfen daha sonra tekrar deneyin.";
  }
};
