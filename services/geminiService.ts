
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export async function optimizeItemDescription(description: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Melhore e profissionalize a seguinte descrição de item para um orçamento comercial. Seja conciso e use termos técnicos adequados se necessário. Descrição original: "${description}"`,
      config: {
        temperature: 0.7,
        // Fix: According to @google/genai guidelines, when setting maxOutputTokens, a thinkingBudget must also be set for Gemini 3 models.
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 50 },
      }
    });
    // Fix: Access response.text property directly as per guidelines
    return response.text?.trim() || description;
  } catch (error) {
    console.error("Gemini Error:", error);
    return description;
  }
}

export async function generateSmartProposal(budgetData: any): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crie um texto persuasivo de apresentação (corpo de email) para este orçamento. Cliente: ${budgetData.customer.name}. Valor Total: R$ ${budgetData.totalAmount.toFixed(2)}. Itens inclusos: ${budgetData.items.map((i: any) => i.description).join(', ')}.`,
      config: {
        temperature: 0.8,
        // Fix: According to @google/genai guidelines, when setting maxOutputTokens, a thinkingBudget must also be set for Gemini 3 models.
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 100 },
      }
    });
    // Fix: Access response.text property directly as per guidelines
    return response.text || "Olá, segue em anexo o orçamento solicitado.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Olá, segue em anexo o orçamento solicitado.";
  }
}
