import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface WasteClassification {
  category: "Recyclable" | "Organic" | "Hazardous" | "Non-Recyclable" | "Unknown";
  item: string;
  ecoScore: number;
  co2Savings: string;
  guidance: string;
  insight: string;
  materials: string[];
  binColor: string;
  contaminationTips?: string[];
  rewardBadge?: string;
  impactFact?: string;
  offlineMode?: boolean;
}

const offlineRules: Array<{ keywords: string[]; result: Omit<WasteClassification, 'offlineMode'> }> = [
  {
    keywords: ['plastic bottle', 'water bottle', 'pet bottle', 'soda bottle', 'bottle'],
    result: {
      category: 'Recyclable',
      item: 'Plastic Bottle',
      ecoScore: 86,
      co2Savings: '0.42kg',
      guidance: 'Empty the bottle, give it a quick rinse, squash it if possible, and place it in the Blue recycling bin.',
      insight: 'Clear PET bottles are among the easiest household plastics to recycle when kept clean.',
      materials: ['PET plastic'],
      binColor: 'Blue',
      contaminationTips: ['Rinse out sugary drinks', 'Keep it dry before disposal', 'Check if the cap should stay on locally'],
      rewardBadge: 'Plastic Saver',
      impactFact: 'Recycling one bottle can save enough energy to power a light bulb for hours.'
    }
  },
  {
    keywords: ['banana peel', 'food waste', 'leftovers', 'fruit peel', 'vegetable scrap', 'organic'],
    result: {
      category: 'Organic',
      item: 'Food Scraps',
      ecoScore: 91,
      co2Savings: '0.31kg',
      guidance: 'Collect the scraps separately and place them in the Green organic bin or compost unit.',
      insight: 'Organic waste becomes a resource again when composted instead of landfilled.',
      materials: ['biodegradable matter'],
      binColor: 'Green',
      contaminationTips: ['Keep plastic wrappers out', 'Drain excess liquid', 'Use a compostable liner if available'],
      rewardBadge: 'Compost Champion',
      impactFact: 'Composting food waste reduces methane emissions from landfills.'
    }
  },
  {
    keywords: ['battery', 'cell', 'power bank'],
    result: {
      category: 'Hazardous',
      item: 'Battery',
      ecoScore: 72,
      co2Savings: '0.18kg',
      guidance: 'Do not place this in general trash. Tape the terminals if possible and take it to a Red hazardous-waste collection point.',
      insight: 'Batteries contain metals that can leak into soil and water if dumped carelessly.',
      materials: ['lithium', 'metal', 'chemical electrolyte'],
      binColor: 'Red',
      contaminationTips: ['Keep away from heat', 'Do not crush or puncture', 'Store separately from paper or metal scraps'],
      rewardBadge: 'Hazard Handler',
      impactFact: 'Proper battery recycling recovers valuable metals and prevents toxic leakage.'
    }
  },
  {
    keywords: ['paper', 'newspaper', 'notebook', 'cardboard', 'carton'],
    result: {
      category: 'Recyclable',
      item: 'Paper / Cardboard',
      ecoScore: 82,
      co2Savings: '0.27kg',
      guidance: 'Fold or flatten the paper item, keep it dry, and place it in the Blue recycling bin.',
      insight: 'Dry paper fibers can be recycled multiple times before they wear out.',
      materials: ['paper fiber'],
      binColor: 'Blue',
      contaminationTips: ['Avoid greasy pizza-box sections', 'Remove plastic tape where possible', 'Keep it dry'],
      rewardBadge: 'Paper Protector',
      impactFact: 'Recycling paper cuts water and energy use compared with making fresh paper pulp.'
    }
  },
  {
    keywords: ['can', 'aluminium', 'tin', 'metal can'],
    result: {
      category: 'Recyclable',
      item: 'Metal Can',
      ecoScore: 88,
      co2Savings: '0.38kg',
      guidance: 'Rinse the can, crush lightly if safe, and place it in the Blue recycling bin.',
      insight: 'Aluminum can be recycled repeatedly with very little quality loss.',
      materials: ['aluminum', 'metal'],
      binColor: 'Blue',
      contaminationTips: ['Rinse food residue', 'Avoid sharp edges while crushing', 'Keep separate from hazardous waste'],
      rewardBadge: 'Metal Loop Hero',
      impactFact: 'Recycling aluminum saves up to 95% of the energy needed to make new metal.'
    }
  },
  {
    keywords: ['chip packet', 'wrapper', 'multi-layer packet', 'snack packet'],
    result: {
      category: 'Non-Recyclable',
      item: 'Multi-layer Wrapper',
      ecoScore: 34,
      co2Savings: '0.05kg',
      guidance: 'This usually goes into the Black residual-waste bin unless your city has special plastic collection.',
      insight: 'Multi-layer packaging is difficult to recycle because the materials are fused together.',
      materials: ['mixed plastic film', 'foil'],
      binColor: 'Black',
      contaminationTips: ['Empty crumbs before disposal', 'Do not mix with paper recycling', 'Check for store take-back programs'],
      rewardBadge: 'Waste Watcher',
      impactFact: 'Choosing refill packs or reusable containers can reduce this kind of waste significantly.'
    }
  }
];

function getUnknownOfflineResult(reason?: string): WasteClassification {
  return {
    category: 'Unknown',
    item: 'Unverified Waste Item',
    ecoScore: 40,
    co2Savings: '0.08kg',
    guidance: `Use the text box to describe the item for a stronger offline match, or retry when AI is available.${reason ? ` Reason: ${reason}.` : ''}`,
    insight: 'Even without live AI, separating wet, dry, and hazardous waste is a strong first step.',
    materials: ['mixed material'],
    binColor: 'Check locally',
    contaminationTips: ['Keep hazardous items separate', 'Remove visible food residue', 'When unsure, avoid contaminating the recycling bin'],
    rewardBadge: 'Eco Explorer',
    impactFact: 'Careful sorting prevents one incorrect item from contaminating an entire batch.',
    offlineMode: true,
  };
}

function classifyWasteOffline(input: string | { data: string; mimeType: string }, reason?: string): WasteClassification {
  if (typeof input !== 'string') {
    return getUnknownOfflineResult(reason);
  }

  const normalized = input.toLowerCase().trim();
  const matchedRule = offlineRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));

  if (!matchedRule) {
    return getUnknownOfflineResult(reason);
  }

  return {
    ...matchedRule.result,
    guidance: `${matchedRule.result.guidance}${reason ? ` Offline smart mode stepped in because ${reason}.` : ' Offline smart mode used cached disposal rules.'}`,
    offlineMode: true,
  };
}

export async function classifyWaste(input: string | { data: string; mimeType: string }): Promise<WasteClassification> {
  const model = "gemini-2.0-flash";

  if (!apiKey || !ai) {
    return classifyWasteOffline(input, 'the Gemini API key is missing');
  }

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
  - binColor: the bin color to use (e.g. "Blue", "Green", "Red", "Black", "Yellow")
  - contaminationTips: short array of things the user should clean/remove before disposal
  - rewardBadge: a short celebratory badge title
  - impactFact: one short and memorable sustainability fact`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents:
        typeof input === 'string'
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
            binColor: { type: Type.STRING },
            contaminationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            rewardBadge: { type: Type.STRING },
            impactFact: { type: Type.STRING }
          },
          required: ["category", "item", "ecoScore", "co2Savings", "guidance", "insight", "materials", "binColor"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(text) as WasteClassification;
    return {
      ...parsed,
      contaminationTips: parsed.contaminationTips ?? [],
      offlineMode: false,
    };
  } catch (err) {
    console.error("Gemini classification error:", err);

    const status = (err as { status?: number })?.status;
    const message = err instanceof Error ? err.message : String(err);

    if (status === 429 || /quota|resource_exhausted/i.test(message)) {
      return classifyWasteOffline(input, 'the AI quota is exhausted');
    }

    if (status === 401 || /api key|permission|unauthorized/i.test(message)) {
      return classifyWasteOffline(input, 'the API key is invalid or lacks access');
    }

    return classifyWasteOffline(input, 'the AI service is temporarily unavailable');
  }
}
