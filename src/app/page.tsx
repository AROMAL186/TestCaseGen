'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WandSparkles, ClipboardCopy, Check, Loader2, FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateTestCases } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import type { GenerateTestCasesFromPromptOutput } from '@/ai/flows/generate-test-cases-from-prompt';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: 'Prompt must be at least 10 characters long.',
  }),
});

type TestCase = GenerateTestCasesFromPromptOutput['testCases'][0];

export default function Home() {
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedTestCases([]);
    try {
      const result = await handleGenerateTestCases(values.prompt);
      if (result.testCases.length === 0) {
        toast({
            title: 'No Test Cases Generated',
            description: 'The prompt may not have been specific enough. Please try again with a more detailed description.',
            variant: 'destructive',
          });
      }
      setGeneratedTestCases(result.testCases);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate test cases. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const formatTestCasesForDownload = () => {
    return generatedTestCases
      .map((tc) => {
        return `Test Case ID: ${tc.id}\nDescription: ${tc.description}\nExpected Result: ${tc.expected_result}`;
      })
      .join('\n\n------------------------------------\n\n');
  };

  const copyToClipboard = () => {
    if (generatedTestCases.length === 0 || isCopied) return;
    const textToCopy = formatTestCasesForDownload();
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        toast({
          title: 'Copy Error',
          description: 'Could not copy test cases to clipboard.',
          variant: 'destructive',
        });
      });
  };

  const downloadAsDocument = () => {
    if (generatedTestCases.length === 0) return;
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Test Cases</title>
          </head>
          <body>
            <h1>Generated Test Cases</h1>
            ${generatedTestCases
              .map(
                (tc) => `
              <div style="margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
                <h2>Test Case ID: ${tc.id}</h2>
                <p><strong>Description:</strong> ${tc.description}</p>
                <h3>Expected Result:</h3>
                <p>${tc.expected_result}</p>
              </div>`
              )
              .join('')}
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-cases.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download: ', err);
      toast({
        title: 'Download Error',
        description: 'Could not download test cases.',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl space-y-8">
          <header className="text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Test Case Generator
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Describe a feature, and let AI generate comprehensive test cases
              for you.
            </p>
          </header>

          <Card className="w-full border-primary/20 bg-card/50 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Your Feature Prompt
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            suppressHydrationWarning
                            placeholder="e.g., A user login form with email and password fields, including a 'remember me' checkbox."
                            className="min-h-[120px] resize-y bg-background/50 focus:bg-background"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full py-6 text-lg font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <WandSparkles className="mr-2 h-5 w-5 text-accent" />
                    )}
                    {isLoading ? 'Generating...' : 'Generate Test Cases'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {(isLoading || generatedTestCases.length > 0) && (
            <Card className="w-full animate-in fade-in-50 duration-500 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Generated Test Cases</CardTitle>
                {generatedTestCases.length > 0 && !isLoading && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      aria-label="Copy to clipboard"
                    >
                      {isCopied ? (
                        <Check className="h-5 w-5 text-accent transition-transform duration-300 scale-110" />
                      ) : (
                        <ClipboardCopy className="h-5 w-5 text-accent/80 hover:text-accent transition-colors" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={downloadAsDocument}
                      aria-label="Download document"
                    >
                      <FileDown className="h-5 w-5 text-accent/80 hover:text-accent transition-colors" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-[95%]" />
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none rounded-lg bg-secondary/30 p-4 space-y-4">
                    {generatedTestCases.map((tc, index) => (
                      <div key={index} className="rounded-md bg-background p-6 shadow-inner">
                        <h3 className="not-prose text-lg font-semibold text-primary-foreground">Test Case ID: {tc.id}</h3>
                        <p className="text-muted-foreground">{tc.description}</p>
                        <h4 className="not-prose mt-4 font-semibold">Expected Result:</h4>
                        <p className="text-foreground">{tc.expected_result}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
