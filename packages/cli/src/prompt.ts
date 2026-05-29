import prompts from "prompts";

export class PromptCancelledError extends Error {}

export type PromptRunner = <T extends object>(question: prompts.PromptObject<string>) => Promise<T>;

export function createPromptRunner(): PromptRunner {
  return async function runPrompt<T extends object>(question: prompts.PromptObject<string>): Promise<T> {
    return prompts(question, {
      onCancel: () => {
        throw new PromptCancelledError();
      }
    }) as Promise<T>;
  };
}
