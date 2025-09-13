'use server';

import {
  generateTestCasesFromPrompt,
  type GenerateTestCasesFromPromptOutput,
} from '@/ai/flows/generate-test-cases-from-prompt';

export async function handleGenerateTestCases(
  prompt: string
): Promise<GenerateTestCasesFromPromptOutput> {
  if (!prompt) {
    return { testCases: [] };
  }

  try {
    const result = await generateTestCasesFromPrompt({ prompt });
    return result;
  } catch (error) {
    console.error('Error generating test cases:', error);
    // Re-throwing the error will be caught by the client and displayed in the toast
    throw new Error('An unexpected error occurred while generating test cases.');
  }
}
