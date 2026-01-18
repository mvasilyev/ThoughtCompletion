/**
 * Factory for creating LLM providers based on configuration
 */

import { LLMProvider, ProviderConfig, ExtensionSettings } from './types';
import { OpenAIProvider } from './openai-provider';
import { OllamaProvider } from './ollama-provider';

/**
 * Creates an LLM provider based on the given configuration
 */
export function createProvider(config: ProviderConfig): LLMProvider {
    switch (config.type) {
        case 'openai':
            return new OpenAIProvider(config);
        case 'ollama':
            return new OllamaProvider(config);
        default:
            throw new Error(`Unknown provider type: ${(config as ProviderConfig).type}`);
    }
}

/**
 * Creates an LLM provider from extension settings
 */
export function createProviderFromSettings(settings: ExtensionSettings): LLMProvider {
    if (settings.provider === 'openai') {
        return createProvider({
            type: 'openai',
            baseUrl: settings.openai.baseUrl,
            apiKey: settings.openai.apiKey,
            model: settings.openai.model,
        });
    } else {
        return createProvider({
            type: 'ollama',
            baseUrl: settings.ollama.baseUrl,
            model: settings.ollama.model,
        });
    }
}
