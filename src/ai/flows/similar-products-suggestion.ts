'use server';

/**
 * @fileOverview Provides similar product suggestions based on a normalized product name and category.
 *
 * - getSimilarProducts - An async function that retrieves similar product suggestions.
 * - SimilarProductsInput - The input type for the getSimilarProducts function.
 * - SimilarProductsOutput - The return type for the getSimilarProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimilarProductsInputSchema = z.object({
  normalizedName: z.string().describe('The normalized name of the product.'),
  category: z.string().describe('The category of the product.'),
});
export type SimilarProductsInput = z.infer<typeof SimilarProductsInputSchema>;

const SimilarProductsOutputSchema = z.object({
  normalizedName: z.string().describe('The normalized name of the product.'),
  exampleRawNames: z.array(z.string()).describe('Example raw names of similar products.'),
  unit: z.string().describe('The unit of the product (e.g., kg, lb, piece).'),
  averagePrice: z.number().describe('The average price of the product.'),
  minimumPrice: z.number().describe('The minimum price of the product.'),
  occurrences: z.number().describe('The number of occurrences of the product.'),
});
export type SimilarProductsOutput = z.infer<typeof SimilarProductsOutputSchema>;

export async function getSimilarProducts(input: SimilarProductsInput): Promise<SimilarProductsOutput[]> {
  return similarProductsFlow(input);
}

const similarProductsPrompt = ai.definePrompt({
  name: 'similarProductsPrompt',
  input: {schema: SimilarProductsInputSchema},
  output: {schema: z.array(SimilarProductsOutputSchema)},
  prompt: `You are an AI assistant helping users find similar products based on a normalized name and category.

  Given the following product information:
  - Normalized Name: {{{normalizedName}}}
  - Category: {{{category}}}

  Suggest similar products, including example raw names, unit, average price, minimum price and occurrences.
  Return your suggestions in JSON format.
  `,
});

const similarProductsFlow = ai.defineFlow(
  {
    name: 'similarProductsFlow',
    inputSchema: SimilarProductsInputSchema,
    outputSchema: z.array(SimilarProductsOutputSchema),
  },
  async input => {
    const {output} = await similarProductsPrompt(input);
    return output!;
  }
);
