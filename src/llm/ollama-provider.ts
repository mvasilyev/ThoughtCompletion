/**
 * Ollama LLM provider
 * Connects to local Ollama instance via OpenAI-compatible API
 * Uses undici for direct HTTP requests (bypasses VS Code proxy)
 */

import { LLMProvider, CompletionOptions, ChatMessage, OllamaProviderConfig } from './types';
import { Agent, fetch as undiciFetch } from 'undici';

interface OllamaModelResponse {
    models: Array<{ name: string }>;
}

interface OllamaChatResponse {
    choices: Array<{
        message: {
            content: string;
            reasoning?: string; // Qwen3 and other reasoning models put thinking here
        };
    }>;
    error?: string;
}

// Create a no-proxy agent for direct connections
const noProxyAgent = new Agent({
    connect: {
        // This bypasses any proxy settings
    }
});

export class OllamaProvider implements LLMProvider {
    readonly name = 'Ollama';

    private baseUrl: string;
    private model: string;

    constructor(config: OllamaProviderConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.model = config.model;
    }

    async complete(prompt: string, options?: CompletionOptions): Promise<string> {
        const messages: ChatMessage[] = [];

        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        return this.chat(messages, options);
    }

    async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<string> {
        const url = `${this.baseUrl}/chat/completions`;
        console.log(`[Ollama] Calling: ${url}`);
        console.log(`[Ollama] Model: ${this.model}`);

        try {
            const response = await undiciFetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    max_tokens: options?.maxTokens ?? 500,
                    temperature: options?.temperature ?? 0.7,
                    stop: options?.stopSequences,
                }),
                dispatcher: noProxyAgent,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as OllamaChatResponse;
            console.log('[Ollama] Raw response:', JSON.stringify(data, null, 2));

            if (data.error) {
                throw new Error(`Ollama API error: ${data.error}`);
            }

            const message = data.choices[0]?.message;
            let content = message?.content ?? '';

            // For reasoning models like qwen3, if content is empty but reasoning exists,
            // the model ran out of tokens during thinking.
            if (!content && message?.reasoning) {
                console.log('[Ollama] Warning: Model returned reasoning but no content. Use a non-thinking model (e.g., qwen3:4b-q4_0).');
            }

            console.log('[Ollama] Success, response length:', content.length);
            return content.trim();
        } catch (error: unknown) {
            console.error('[Ollama] Fetch error:', error);
            if (error instanceof Error && 'cause' in error) {
                console.error('[Ollama] Error cause:', (error as Error & { cause: unknown }).cause);
            }
            throw error;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Use native Ollama API to check availability
            const nativeUrl = this.baseUrl.replace('/v1', '');
            console.log(`[Ollama] Checking availability at: ${nativeUrl}/api/tags`);
            const response = await undiciFetch(`${nativeUrl}/api/tags`, {
                method: 'GET',
                dispatcher: noProxyAgent,
            });
            console.log(`[Ollama] Available: ${response.ok}`);
            return response.ok;
        } catch (error) {
            console.error('[Ollama] Availability check failed:', error);
            return false;
        }
    }

    async listModels(): Promise<string[]> {
        try {
            // Use native Ollama API for model listing
            const nativeUrl = this.baseUrl.replace('/v1', '');
            const response = await undiciFetch(`${nativeUrl}/api/tags`, {
                method: 'GET',
                dispatcher: noProxyAgent,
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json() as OllamaModelResponse;
            return data.models.map(m => m.name);
        } catch {
            return [];
        }
    }
}
