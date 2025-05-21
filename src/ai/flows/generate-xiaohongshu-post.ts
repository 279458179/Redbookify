// This is an AI-powered function that generates a XiaoHongShu-style blog post based on a given book title.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview Generates a XiaoHongShu-style blog post from a book title.
 *
 * - generateXiaoHongShuPost - A function that generates a XiaoHongShu-style blog post.
 * - GenerateXiaoHongShuPostInput - The input type for the generateXiaoHongShuPost function.
 * - GenerateXiaoHongShuPostOutput - The return type for the generateXiaoHongShuPost function.
 */

const GenerateXiaoHongShuPostInputSchema = z.object({
  bookTitle: z.string().describe('The title of the book to generate a blog post for.'),
  scrapedContent: z.string().optional().describe('The scraped content from websites.'),
});

export type GenerateXiaoHongShuPostInput = z.infer<typeof GenerateXiaoHongShuPostInputSchema>;

const GenerateXiaoHongShuPostOutputSchema = z.object({
  blogPost: z.string().describe('The generated XiaoHongShu-style blog post.'),
});

export type GenerateXiaoHongShuPostOutput = z.infer<typeof GenerateXiaoHongShuPostOutputSchema>;

export async function generateXiaoHongShuPost(
  input: GenerateXiaoHongShuPostInput
): Promise<GenerateXiaoHongShuPostOutput> {
  return generateXiaoHongShuPostFlow(input);
}

const generateXiaoHongShuPostPrompt = ai.definePrompt({
  name: 'generateXiaoHongShuPostPrompt',
  input: {schema: GenerateXiaoHongShuPostInputSchema},
  output: {schema: GenerateXiaoHongShuPostOutputSchema},
  prompt: `You are an expert social media content creator, specializing in the XiaoHongShu platform.
  Your task is to create a blog post in the style of XiaoHongShu based on the given book title and scraped content.

  Book Title: {{{bookTitle}}}
  Scraped Content: {{{scrapedContent}}}

  Please generate an engaging and informative blog post that captures the essence of the book, highlights popular themes,
  and is optimized for the XiaoHongShu audience. The blog post should include emojis, hashtags, and a conversational tone.
  The ideal length is around 300-500 words.
  The blog post should be structured into short paragraphs with headings.
  The language should be Chinese.
`,
});

const generateXiaoHongShuPostFlow = ai.defineFlow(
  {
    name: 'generateXiaoHongShuPostFlow',
    inputSchema: GenerateXiaoHongShuPostInputSchema,
    outputSchema: GenerateXiaoHongShuPostOutputSchema,
  },
  async input => {
    const {output} = await generateXiaoHongShuPostPrompt(input);
    return output!;
  }
);
