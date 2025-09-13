'use server';

import {
  generateTestCasesFromPrompt,
  type GenerateTestCasesFromPromptOutput,
} from '@/ai/flows/generate-test-cases-from-prompt';

export async function handleGenerateTestCases(
  prompt: string
): Promise<GenerateTestCasesFromPromptOutput> {
  if (!prompt) {
    return { testCases: 'Prompt cannot be empty.' };
  }

  try {
    const result = await generateTestCasesFromPrompt({ prompt });
    return result;
  } catch (error) {
    console.error('Error generating test cases:', error);
    throw new Error('An unexpected error occurred while generating test cases.');
  }
}
