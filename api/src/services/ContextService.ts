import { TransactionType, TransactionFlow } from "@prisma/client";
import prisma from "../client";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
Eres un asistente financiero experto. Analiza este recibo (imagen) o nota de voz (audio). 
1. Identifica todos los artículos comprados, su cantidad y precio unitario incluyendo el impuesto si es que tiene.
2. Calcula el valor total (totalValue).
3. Clasifica la transacción (type) estrictamente como 'NEEDS' (necesidades básicas como mercado, renta), 'WANTS' (deseos como café, salidas), o 'SAVINGS' (ahorros o inversiones).
4. Define el flujo (flow) como 'OUT' (gasto) o 'IN' (ingreso).
5. IMPORTANTE: Traduce todos los nombres de los artículos y el resumen (context) al ESPAÑOL, sin importar el idioma original del archivo.

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura y sin markdown de código:
{
  "context": "Resumen breve",
  "totalValue": 10.5,
  "type": "NEEDS",
  "flow": "OUT",
  "items": [
    { "name": "Cebolla", "quantity": 3, "unitPrice": 0.5, "totalPrice": 1.5 }
  ]
}
`;

export class ContextService {
  private async processWithGemini(fileUrl: string, fileType: string) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        "[ContextService] GEMINI_API_KEY missing. Returning mock data.",
      );
      return this.getMockData(fileType);
    }

    try {
      let mimeType = fileType === "AUDIO" ? "audio/mpeg" : "image/jpeg";
      const fileBase64 = fs.readFileSync(fileUrl).toString("base64");

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: fileBase64,
                },
              },
            ],
          },
        ],
      });

      const rawText = response.text || "{}";
      const cleanJson = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("[ContextService] Error calling Gemini API:", error);
      throw new Error("Failed to process media with AI.");
    } finally {
      // Clean up the file to prevent storage bloat
      if (fs.existsSync(fileUrl)) {
        fs.unlinkSync(fileUrl);
      }
    }
  }

  private getMockData(fileType: string) {
    if (fileType === "AUDIO") {
      return {
        context:
          "[AI Audio Transcript]: Compré 3 cebollas, un café y una galleta.",
        items: [
          { name: "Cebolla", quantity: 3, unitPrice: 0.5, totalPrice: 1.5 },
          { name: "Café", quantity: 1, unitPrice: 3.0, totalPrice: 3.0 },
          { name: "Galleta", quantity: 1, unitPrice: 1.5, totalPrice: 1.5 },
        ],
        totalValue: 6.0,
        type: "NEEDS",
        flow: "OUT",
      };
    }

    return {
      context:
        "[AI Image Analysis]: Extracto de recibo: 'Compra confirmada. Monto: $500.00'",
      items: [
        {
          name: "Artículo de recibo",
          quantity: 1,
          unitPrice: 500.0,
          totalPrice: 500.0,
        },
      ],
      totalValue: 500.0,
      type: "WANTS",
      flow: "OUT",
    };
  }

  async createTransactionFromMedia(
    accountId: number,
    fileUrl: string,
    fileType: string,
    defaultSymbol: string = "USD", // Keeping argument for potential future use or backward compat, but won't save to transaction table.
  ) {
    console.log(`[ContextService] Starting AI processing for new media...`);

    const aiResult = await this.processWithGemini(fileUrl, fileType);

    console.log(`[ContextService] Context generated: "${aiResult.context}"`);

    // Create the Transaction with Media and Items all at once
    const transaction = await prisma.transaction.create({
      data: {
        accountId,
        totalValue: aiResult.totalValue > 0 ? aiResult.totalValue : 0,
        type: (aiResult.type as TransactionType) || "WANTS",
        flow: (aiResult.flow as TransactionFlow) || "OUT",
        context: aiResult.context,
        status: "COMPLETED",
        items:
          aiResult.items && aiResult.items.length > 0
            ? {
                create: aiResult.items,
              }
            : undefined,
        media: {
          create: {
            url: fileUrl, // Note: the physical file is deleted, but we keep the URL record for history or future cloud upload logic
            type: fileType,
          },
        },
      },
      include: {
        items: true,
        media: true,
      },
    });

    console.log(
      `[ContextService] Transaction created successfully with ID #${transaction.id}.`,
    );
    return transaction;
  }
}
