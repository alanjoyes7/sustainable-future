import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WasteClassification {
  category: "Recyclable" | "Organic" | "Hazardous" | "Non-Recyclable" | "Unknown";
  item: string;
  ecoScore: number;
  co2Savings: string;
  guidance: string;
  insight: string;
  materials: string[];
  binColor: string;
}

export async function classifyWaste(input: string | { data: string; mimeType: string }): Promise<WasteClassification> {
  const model = "gemini-2.0-flash";

  const prompt = `You are a waste classification expert. Classify this waste item and provide specific disposal guidance.
  If the image is blurry, does not contain a waste item, or is unrecognizable, set "category" to "Unknown", "ecoScore" to 0, "co2Savings" to "0kg", and "guidance" to "We couldn't identify this as a waste item. Please try a clearer photo."
  
  Return a JSON object with these exact fields:
  - category: one of "Recyclable", "Organic", "Hazardous", "Non-Recyclable", "Unknown"
  - item: the name of the identified item
  - ecoScore: an integer from 0 to 100 representing environmental friendliness of proper disposal
  - co2Savings: estimated CO2 savings as a string (e.g. "0.45kg")
  - guidance: specific step-by-step disposal instructions
  - insight: an interesting sustainability tip about this item
  - materials: array of materials this item is made of
  - binColor: the bin color to use (e.g. "Blue", "Green", "Red", "Black", "Yellow")`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: typeof input === 'string'
        ? [{ parts: [{ text: prompt }, { text: `Item to classify: ${input}` }] }]
        : [{ parts: [{ text: prompt }, { inlineData: input }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            item: { type: Type.STRING },
            ecoScore: { type: Type.NUMBER },
            co2Savings: { type: Type.STRING },
            guidance: { type: Type.STRING },
            insight: { type: Type.STRING },
            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            binColor: { type: Type.STRING }
          },
          required: ["category", "item", "ecoScore", "co2Savings", "guidance", "insight", "materials", "binColor"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini classification error:", err);
    throw err;
  }
}
