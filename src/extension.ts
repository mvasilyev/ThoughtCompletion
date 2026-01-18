/**
 * ThoughtCompletion Extension Entry Point
 * 
 * AI-powered thought organization assistant for documents.
 */

import * as vscode from 'vscode';
import { createProviderFromSettings, LLMProvider } from './llm';
import { getSettings, onSettingsChanged } from './config';
import { ThoughtCompletionProvider } from './providers';
import { registerCommands, CommandContext } from './commands';
import { ExtensionSettings } from './llm/types';

let provider: ThoughtCompletionProvider | null = null;
let currentLLM: LLMProvider | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;

/**
 * Create LLM provider from current settings
 */
function initLLM(settings: ExtensionSettings): LLMProvider {
    return createProviderFromSettings(settings);
}

/**
 * Update status bar with provider info
 */
async function updateStatusBar(llm: LLMProvider, settings: ExtensionSettings): Promise<void> {
    if (!statusBarItem) return;

    const available = await llm.isAvailable();
    const providerName = settings.provider === 'ollama'
        ? `Ollama (${settings.ollama.model})`
        : `OpenAI (${settings.openai.model})`;

    if (available) {
        statusBarItem.text = `$(sparkle) ${providerName}`;
        statusBarItem.tooltip = 'ThoughtCompletion: Connected';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = `$(warning) ${providerName}`;
        statusBarItem.tooltip = 'ThoughtCompletion: Not connected - check provider settings';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

/**
 * Get command context for command handlers
 */
function getCommandContext(): CommandContext {
    const settings = getSettings();
    return {
        llm: currentLLM!,
        customTypes: settings.documentTypes,
        activeTypeName: settings.activeDocumentType,
        maxTokens: settings.maxTokens,
    };
}

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('ThoughtCompletion is activating...');

    // Initialize settings and LLM
    const settings = getSettings();
    currentLLM = initLLM(settings);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'thoughtCompletion.selectType';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Update status bar
    updateStatusBar(currentLLM, settings);

    // Create completion provider
    provider = new ThoughtCompletionProvider(
        currentLLM,
        settings.documentTypes,
        settings.activeDocumentType,
        settings.autoComplete,
        settings.triggerMode,
        settings.maxTokens
    );

    // Register inline completion provider for markdown and plaintext
    const selector: vscode.DocumentSelector = [
        { language: 'markdown' },
        { language: 'plaintext' },
    ];

    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(selector, provider)
    );

    // Register commands
    registerCommands(context, getCommandContext);

    // Watch for settings changes
    context.subscriptions.push(
        onSettingsChanged(newSettings => {
            console.log('ThoughtCompletion settings changed, updating...');

            // Recreate LLM if provider changed
            currentLLM = initLLM(newSettings);

            // Update provider
            provider?.updateConfig(
                currentLLM,
                newSettings.documentTypes,
                newSettings.activeDocumentType,
                newSettings.autoComplete,
                newSettings.triggerMode,
                newSettings.maxTokens
            );

            // Update status bar
            updateStatusBar(currentLLM, newSettings);
        })
    );

    console.log('ThoughtCompletion activated successfully');
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
    console.log('ThoughtCompletion deactivated');
    provider = null;
    currentLLM = null;
    statusBarItem = null;
}
