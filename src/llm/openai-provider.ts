/**
 * OpenAI-compatible LLM provider
 * Works with OpenAI API, LM Studio, LocalAI, and other compatible endpoints
 * Uses undici for direct HTTP requests (bypasses VS Code proxy)
 */

import { LLMProvider, CompletionOptions, ChatMessage, OpenAIProviderConfig } from './types';
import { Agent, fetch as undiciFetch } from 'undici';

interface OpenAIResponse {
    choices: Array<{
        message?: { content: string };
        text?: string;
    }>;
    error?: { message: string };
}

// Create a no-proxy agent for direct connections
const noProxyAgent = new Agent({
    connect: {
        // This bypasses any proxy settings
    }
});

export class OpenAIProvider implements LLMProvider {
    readonly name = 'OpenAI Compatible';

    private baseUrl: string;
    private apiKey: string;
    private model: string;

    constructor(config: OpenAIProviderConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = config.apiKey;
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
        console.log(`[OpenAI] Calling: ${url}`);
        console.log(`[OpenAI] Model: ${this.model}`);

        try {
            const response = await undiciFetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
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
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as OpenAIResponse;

            if (data.error) {
                throw new Error(`OpenAI API error: ${data.error.message}`);
            }

            const content = data.choices[0]?.message?.content ?? data.choices[0]?.text ?? '';
            console.log('[OpenAI] Success, response length:', content.length);
            return content.trim();
        } catch (error: unknown) {
            console.error('[OpenAI] Fetch error:', error);
            if (error instanceof Error && 'cause' in error) {
                console.error('[OpenAI] Error cause:', (error as Error & { cause: unknown }).cause);
            }
            throw error;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await undiciFetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                dispatcher: noProxyAgent,
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await undiciFetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                dispatcher: noProxyAgent,
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json() as { data: Array<{ id: string }> };
            return data.data.map(m => m.id);
        } catch {
            return [];
        }
    }
}
