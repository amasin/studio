// src/ai/flows/enhanced-bill-item-normalization.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for normalizing bill item names using GenAI.
 *
 * It uses a language model to understand the context and variations in item names, providing a more accurate normalized name.
 *
 * @function normalizeBillItem - The main function that normalizes a bill item name.
 * @typedef {Object} NormalizeBillItemInput - The input type for the normalizeBillItem function, containing the raw item name.
 * @typedef {Object} NormalizeBillItemOutput - The output type for the normalizeBillItem function, containing the normalized item name.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NormalizeBillItemInputSchema = z.object({
  rawName: z
    .string()
    .describe("The raw, unnormalized name of the bill item as it appears on the bill."),
});
export type NormalizeBillItemInput = z.infer<typeof NormalizeBillItemInputSchema>;

const NormalizeBillItemOutputSchema = z.object({
  normalizedName: z
    .string()
    .describe("The normalized name of the bill item, suitable for price comparison and product matching."),
});
export type NormalizeBillItemOutput = z.infer<typeof NormalizeBillItemOutputSchema>;

export async function normalizeBillItem(input: NormalizeBillItemInput): Promise<NormalizeBillItemOutput> {
  return normalizeBillItemFlow(input);
}

const normalizeBillItemPrompt = ai.definePrompt({
  name: 'normalizeBillItemPrompt',
  input: { schema: NormalizeBillItemInputSchema },
  output: { schema: NormalizeBillItemOutputSchema },
  prompt: `You are an expert in normalizing product names from bills.

  Given the raw product name from a bill, your task is to generate a normalized product name that is suitable for comparing prices across different shops and bills.
  The normalized name should be concise, descriptive, and free of any shop-specific information or extraneous details.

  Raw Product Name: {{{rawName}}}

  Normalized Product Name:`, // Removed curly braces around output for clarity
});

const normalizeBillItemFlow = ai.defineFlow(
  {
    name: 'normalizeBillItemFlow',
    inputSchema: NormalizeBillItemInputSchema,
    outputSchema: NormalizeBillItemOutputSchema,
  },
  async input => {
    const { output } = await normalizeBillItemPrompt(input);
    return output!;
  }
);
