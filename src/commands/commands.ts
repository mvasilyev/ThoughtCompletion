import * as vscode from 'vscode';
import { LLMProvider, DocumentType } from '../llm/types';
import { resolveDocumentType, getAllDocumentTypes } from '../prompts';
import { buildPrompt, buildPromptForMode } from '../prompts/builder';
import { analyzeDocument } from '../analysis/document-context';
import { updateSetting } from '../config/settings';
import { ThoughtCompletionProvider } from '../providers';

/**
 * Command context passed to command functions
 */
export interface CommandContext {
    llm: LLMProvider;
    customTypes: DocumentType[];
    activeTypeName: string;
    maxTokens: number;
    provider: ThoughtCompletionProvider;
}

/**
 * Trigger inline suggestion at cursor position
 * This shows the suggestion as grayed-out text that can be accepted or dismissed
 */
async function triggerInlineSuggestion(): Promise<void> {
    await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
}

/**
 * Pre-fetch a completion from the LLM with a progress notification,
 * cache it on the provider, then trigger inline suggest.
 */
async function prefetchAndTrigger(
    ctx: CommandContext,
    mode: 'structure' | 'content' | null,
    progressMessage: string
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    try {
        const completion = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'ThoughtCompletion',
                cancellable: true,
            },
            async (progress, token) => {
                progress.report({ message: progressMessage });

                const document = editor.document;
                const position = editor.selection.active;
                const text = document.getText();

                // Resolve document type
                const docType = await resolveDocumentType(
                    text,
                    ctx.activeTypeName,
                    ctx.customTypes,
                    ctx.llm
                );

                if (token.isCancellationRequested) { return null; }

                // Analyze document context
                const docContext = analyzeDocument(
                    text,
                    position.line,
                    position.character,
                    docType
                );

                // Build prompt
                const { systemPrompt, userPrompt } = mode
                    ? buildPromptForMode(docContext, mode)
                    : buildPrompt(docContext);

                if (token.isCancellationRequested) { return null; }

                // Call LLM
                return ctx.llm.complete(userPrompt, {
                    systemPrompt,
                    maxTokens: ctx.maxTokens,
                    temperature: 0.7,
                });
            }
        );

        if (completion) {
            ctx.provider.setCachedCompletion(completion);
            // Also set forced mode as fallback
            if (mode) {
                ctx.provider.setForcedMode(mode);
            }
            await triggerInlineSuggestion();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`ThoughtCompletion error: ${error}`);
    }
}

/**
 * Continue Structure command - forces structure completion mode
 */
export async function continueStructureCommand(ctx: CommandContext): Promise<void> {
    await prefetchAndTrigger(ctx, 'structure', 'Generating structure completion...');
}

/**
 * Fill Blank command - forces content filling mode
 */
export async function fillBlankCommand(ctx: CommandContext): Promise<void> {
    await prefetchAndTrigger(ctx, 'content', 'Generating content completion...');
}

/**
 * Detect Type command - runs type detection and shows result
 */
export async function detectTypeCommand(ctx: CommandContext): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    try {
        const text = editor.document.getText();

        const docType = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'ThoughtCompletion',
                cancellable: false,
            },
            async progress => {
                progress.report({ message: 'Detecting document type...' });
                return resolveDocumentType(text, 'auto', ctx.customTypes, ctx.llm);
            }
        );

        if (docType) {
            vscode.window.showInformationMessage(
                `Detected document type: ${docType.name}`
            );
        } else {
            vscode.window.showInformationMessage(
                'Document type: general (no specific type detected)'
            );
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Detection error: ${error}`);
    }
}

/**
 * Select Type command - shows picker for manual type selection
 */
export async function selectTypeCommand(ctx: CommandContext): Promise<void> {
    const allTypes = getAllDocumentTypes(ctx.customTypes);

    const items: vscode.QuickPickItem[] = [
        {
            label: 'auto',
            description: 'Automatically detect document type',
        },
        ...allTypes.map(t => ({
            label: t.name,
            description: t.detectionPrompt,
        })),
    ];

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select document type',
    });

    if (selected) {
        await updateSetting('activeDocumentType', selected.label);
        vscode.window.showInformationMessage(
            `Document type set to: ${selected.label}`
        );
    }
}

/**
 * Trigger Completion command - auto-detects mode based on cursor position
 */
export async function triggerCommand(ctx: CommandContext): Promise<void> {
    await prefetchAndTrigger(ctx, null, 'Generating completion...');
}

/**
 * Register all extension commands
 */
export function registerCommands(
    context: vscode.ExtensionContext,
    getCtx: () => CommandContext
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'thoughtCompletion.continueStructure',
            () => continueStructureCommand(getCtx())
        ),
        vscode.commands.registerCommand(
            'thoughtCompletion.fillBlank',
            () => fillBlankCommand(getCtx())
        ),
        vscode.commands.registerCommand(
            'thoughtCompletion.detectType',
            () => detectTypeCommand(getCtx())
        ),
        vscode.commands.registerCommand(
            'thoughtCompletion.selectType',
            () => selectTypeCommand(getCtx())
        ),
        vscode.commands.registerCommand(
            'thoughtCompletion.trigger',
            () => triggerCommand(getCtx())
        )
    );
}
