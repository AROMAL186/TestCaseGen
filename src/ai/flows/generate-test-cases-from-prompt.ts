'use server';

/**
 * @fileOverview Generates test cases from a user-provided prompt using the Gemini API.
 *
 * - generateTestCasesFromPrompt - A function that takes a text prompt and generates test cases.
 * - GenerateTestCasesFromPromptInput - The input type for the generateTestCasesFromPrompt function.
 * - GenerateTestCasesFromPromptOutput - The return type for the generateTestCasesFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const GenerateTestCasesFromPromptInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the functionality to test.'),
});
export type GenerateTestCasesFromPromptInput = z.infer<
  typeof GenerateTestCasesFromPromptInputSchema
>;

// Define the output schema
const GenerateTestCasesFromPromptOutputSchema = z.object({
  testCases: z
    .string()
    .describe('Generated test cases based on the input prompt.'),
});
export type GenerateTestCasesFromPromptOutput = z.infer<
  typeof GenerateTestCasesFromPromptOutputSchema
>;

// Define the tool to validate the input prompt
const isValidPrompt = ai.defineTool({
  name: 'isValidPrompt',
  description: 'Checks if the prompt is valid and safe for generating test cases.',
  inputSchema: z.object({
    prompt: z.string().describe('The prompt to validate.'),
  }),
  outputSchema: z.boolean(),
},
async (input) => {
  // Basic validation logic (can be expanded with more sophisticated checks)
  const prompt = input.prompt.trim();
  if (!prompt || prompt.length < 10) {
    return false; // Prompt is too short or empty
  }

  // Add more checks for harmful or inappropriate content if needed
  // Example: profanity filtering, checking for PII, etc.
  return true; // Assume prompt is valid for now
});

// Define the prompt for generating test cases
const generateTestCasesPrompt = ai.definePrompt({
  name: 'generateTestCasesPrompt',
  input: {schema: GenerateTestCasesFromPromptInputSchema},
  output: {schema: GenerateTestCasesFromPromptOutputSchema},
  tools: [isValidPrompt],
  system: `You are a test case generation expert. Use the provided prompt to generate a set of test cases. Before generating the test cases, use the \`isValidPrompt\` tool to check if the prompt is valid.
If the prompt is not valid, respond that you cannot generate test cases due to invalid input. Otherwise, generate the test cases.
Test cases should be comprehensive and cover various scenarios, including positive, negative, and edge cases.
The output must be plain text. Do not put the output in code blocks.
`,
  prompt: `Generate test cases for the following functionality:

{{prompt}}`,
});

// Define the flow for generating test cases from a prompt
const generateTestCasesFromPromptFlow = ai.defineFlow(
  {
    name: 'generateTestCasesFromPromptFlow',
    inputSchema: GenerateTestCasesFromPromptInputSchema,
    outputSchema: GenerateTestCasesFromPromptOutputSchema,
  },
  async input => {
    const isValid = await isValidPrompt({prompt: input.prompt});

    if (!isValid) {
      return {testCases: 'Could not generate test cases due to invalid input. Please provide a more detailed prompt.'};
    }

    const {output} = await generateTestCasesPrompt(input);
    return output!;
  }
);

/**
 * Generates test cases from a user-provided prompt.
 * @param input The input containing the text prompt.
 * @returns The generated test cases.
 */
export async function generateTestCasesFromPrompt(
  input: GenerateTestCasesFromPromptInput
): Promise<GenerateTestCasesFromPromptOutput> {
  return generateTestCasesFromPromptFlow(input);
}
