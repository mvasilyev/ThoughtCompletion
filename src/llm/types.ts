/**
 * LLM Provider type definitions
 */

/**
 * Options for LLM completion requests
 */
export interface CompletionOptions {
    /** Maximum tokens to generate */
    maxTokens?: number;
    /** Temperature for sampling (0-2) */
    temperature?: number;
    /** Stop sequences to end generation */
    stopSequences?: string[];
    /** System message for the conversation */
    systemPrompt?: string;
}

/**
 * Message format for chat completions
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Abstract LLM provider interface
 */
export interface LLMProvider {
    /** Provider name for display */
    readonly name: string;

    /**
     * Generate a completion for the given prompt
     */
    complete(prompt: string, options?: CompletionOptions): Promise<string>;

    /**
     * Generate a chat completion
     */
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<string>;

    /**
     * Check if the provider is available and configured
     */
    isAvailable(): Promise<boolean>;

    /**
     * List available models (if supported)
     */
    listModels?(): Promise<string[]>;
}

/**
 * Configuration for OpenAI-compatible providers
 */
export interface OpenAIProviderConfig {
    type: 'openai';
    baseUrl: string;
    apiKey: string;
    model: string;
}

/**
 * Configuration for Ollama provider
 */
export interface OllamaProviderConfig {
    type: 'ollama';
    baseUrl: string;
    model: string;
}

/**
 * Union type for all provider configurations
 */
export type ProviderConfig = OpenAIProviderConfig | OllamaProviderConfig;

/**
 * Document type definition for thought completion
 */
export interface DocumentType {
    /** Unique name for this document type */
    name: string;
    /** Prompt to help identify this document type */
    detectionPrompt: string;
    /** Prompt for working with this document type */
    workingPrompt: string;
}

/**
 * Extension settings structure
 */
export interface ExtensionSettings {
    provider: 'openai' | 'ollama';
    openai: {
        baseUrl: string;
        apiKey: string;
        model: string;
    };
    ollama: {
        baseUrl: string;
        model: string;
    };
    autoComplete: boolean;
    triggerMode: 'auto' | 'manual';
    completionDelay: number;
    maxTokens: number;
    activeDocumentType: string;
    documentTypes: DocumentType[];
}
