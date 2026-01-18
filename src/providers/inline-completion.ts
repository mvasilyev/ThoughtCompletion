/**
 * Inline completion provider for ThoughtCompletion
 */

import * as vscode from 'vscode';
import { LLMProvider, DocumentType } from '../llm/types';
import { analyzeDocument } from '../analysis/document-context';
import { buildPrompt } from '../prompts/builder';
import { resolveDocumentType } from '../prompts/type-detector';

/**
 * Trigger mode for completions
 */
export type TriggerMode = 'auto' | 'manual';

/**
 * Provides inline completions for thought organization
 */
export class ThoughtCompletionProvider implements vscode.InlineCompletionItemProvider {
    private llm: LLMProvider;
    private customTypes: DocumentType[];
    private activeTypeName: string;
    private enabled: boolean;
    private triggerMode: TriggerMode;
    private maxTokens: number;
    private cachedType: DocumentType | null = null;
    private cachedDocVersion: number = -1;

    constructor(
        llm: LLMProvider,
        customTypes: DocumentType[],
        activeTypeName: string,
        enabled: boolean,
        triggerMode: TriggerMode = 'auto',
        maxTokens: number = 1000
    ) {
        this.llm = llm;
        this.customTypes = customTypes;
        this.activeTypeName = activeTypeName;
        this.enabled = enabled;
        this.triggerMode = triggerMode;
        this.maxTokens = maxTokens;
    }

    /**
     * Update provider configuration
     */
    updateConfig(
        llm: LLMProvider,
        customTypes: DocumentType[],
        activeTypeName: string,
        enabled: boolean,
        triggerMode: TriggerMode = 'auto',
        maxTokens: number = 1000
    ): void {
        this.llm = llm;
        this.customTypes = customTypes;
        this.activeTypeName = activeTypeName;
        this.enabled = enabled;
        this.triggerMode = triggerMode;
        this.maxTokens = maxTokens;
        // Reset cache when config changes
        this.cachedType = null;
        this.cachedDocVersion = -1;
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList | null> {
        console.log('[ThoughtCompletion] provideInlineCompletionItems called');
        console.log(`[ThoughtCompletion] enabled: ${this.enabled}, triggerMode: ${this.triggerMode}, triggerKind: ${context.triggerKind}`);

        if (!this.enabled) {
            console.log('[ThoughtCompletion] Disabled, returning null');
            return null;
        }

        // In manual mode, only respond to explicit invocations (Ctrl+Space)
        if (this.triggerMode === 'manual') {
            if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
                console.log('[ThoughtCompletion] Manual mode - ignoring automatic trigger');
                return null;
            }
        }

        // In auto mode, still check we're not mid-word
        if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
            const line = document.lineAt(position.line);
            // Don't trigger mid-word
            if (position.character < line.text.length && !/\s/.test(line.text[position.character])) {
                console.log('[ThoughtCompletion] Mid-word, skipping');
                return null;
            }
        }

        console.log('[ThoughtCompletion] Processing completion request...');

        try {
            const text = document.getText();

            // Resolve document type (with caching)
            let docType = this.cachedType;
            if (document.version !== this.cachedDocVersion) {
                docType = await resolveDocumentType(
                    text,
                    this.activeTypeName,
                    this.customTypes,
                    this.llm
                );
                this.cachedType = docType;
                this.cachedDocVersion = document.version;
            }

            if (token.isCancellationRequested) {
                return null;
            }

            // Analyze document context
            const docContext = analyzeDocument(
                text,
                position.line,
                position.character,
                docType
            );

            // Build prompt
            const { systemPrompt, userPrompt } = buildPrompt(docContext);
            console.log('[ThoughtCompletion] Built prompt, calling LLM...');
            console.log('[ThoughtCompletion] Cursor position:', docContext.cursorPosition);
            console.log('[ThoughtCompletion] Max tokens:', this.maxTokens);

            // Get completion from LLM
            const completion = await this.llm.complete(userPrompt, {
                systemPrompt,
                maxTokens: this.maxTokens,
                temperature: 0.7,
            });

            console.log('[ThoughtCompletion] LLM response:', completion?.slice(0, 100));

            if (token.isCancellationRequested || !completion) {
                return null;
            }

            // Create inline completion item
            const item = new vscode.InlineCompletionItem(
                completion,
                new vscode.Range(position, position)
            );

            return new vscode.InlineCompletionList([item]);
        } catch (error) {
            console.error('[ThoughtCompletion] Error:', error);
            return null;
        }
    }
}
