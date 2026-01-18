/**
 * Configuration management - reads from VS Code settings
 */

import * as vscode from 'vscode';
import { ExtensionSettings, DocumentType } from '../llm/types';

/**
 * Get extension settings from VS Code configuration
 */
export function getSettings(): ExtensionSettings {
    const config = vscode.workspace.getConfiguration('thoughtCompletion');

    return {
        provider: config.get<'openai' | 'ollama'>('provider', 'ollama'),
        openai: {
            baseUrl: config.get<string>('openai.baseUrl', 'https://api.openai.com/v1'),
            apiKey: config.get<string>('openai.apiKey', ''),
            model: config.get<string>('openai.model', 'gpt-4o-mini'),
        },
        ollama: {
            baseUrl: config.get<string>('ollama.baseUrl', 'http://localhost:11434/v1'),
            model: config.get<string>('ollama.model', 'llama3.2'),
        },
        autoComplete: config.get<boolean>('autoComplete', true),
        triggerMode: config.get<'auto' | 'manual'>('triggerMode', 'auto'),
        completionDelay: config.get<number>('completionDelay', 2500),
        maxTokens: config.get<number>('maxTokens', 1000),
        activeDocumentType: config.get<string>('activeDocumentType', 'auto'),
        documentTypes: config.get<DocumentType[]>('documentTypes', []),
    };
}

/**
 * Update a specific setting
 */
export async function updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K],
    global = true
): Promise<void> {
    const config = vscode.workspace.getConfiguration('thoughtCompletion');
    await config.update(key, value, global);
}

/**
 * Watch for settings changes
 */
export function onSettingsChanged(
    callback: (settings: ExtensionSettings) => void
): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('thoughtCompletion')) {
            callback(getSettings());
        }
    });
}
