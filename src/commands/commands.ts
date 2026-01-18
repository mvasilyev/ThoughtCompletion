/**
 * Extension commands
 */

import * as vscode from 'vscode';
import { LLMProvider, DocumentType } from '../llm/types';
import { analyzeDocument } from '../analysis/document-context';
import { buildPromptForMode } from '../prompts/builder';
import { resolveDocumentType, getAllDocumentTypes } from '../prompts';
import { getSettings, updateSetting } from '../config/settings';

/**
 * Command context passed to command functions
 */
export interface CommandContext {
    llm: LLMProvider;
    customTypes: DocumentType[];
    activeTypeName: string;
    maxTokens: number;
}

/**
 * Insert completion at cursor position
 */
async function insertCompletion(
    editor: vscode.TextEditor,
    completion: string
): Promise<void> {
    await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, completion);
    });
}

/**
 * Continue Structure command - forces structure completion mode
 */
export async function continueStructureCommand(ctx: CommandContext): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    try {
        const text = editor.document.getText();
        const position = editor.selection.active;

        // Resolve document type
        const docType = await resolveDocumentType(
            text,
            ctx.activeTypeName,
            ctx.customTypes,
            ctx.llm
        );

        // Analyze context
        const docContext = analyzeDocument(
            text,
            position.line,
            position.character,
            docType
        );

        // Build structure prompt
        const { systemPrompt, userPrompt } = buildPromptForMode(docContext, 'structure');

        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'ThoughtCompletion',
                cancellable: true,
            },
            async (progress, token) => {
                progress.report({ message: 'Generating structure...' });

                const completion = await ctx.llm.complete(userPrompt, {
                    systemPrompt,
                    maxTokens: ctx.maxTokens,
                    temperature: 0.7,
                });

                if (!token.isCancellationRequested && completion) {
                    await insertCompletion(editor, completion);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`ThoughtCompletion error: ${error}`);
    }
}

/**
 * Fill Blank command - forces content filling mode
 */
export async function fillBlankCommand(ctx: CommandContext): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    try {
        const text = editor.document.getText();
        const position = editor.selection.active;

        // Resolve document type
        const docType = await resolveDocumentType(
            text,
            ctx.activeTypeName,
            ctx.customTypes,
            ctx.llm
        );

        // Analyze context
        const docContext = analyzeDocument(
            text,
            position.line,
            position.character,
            docType
        );

        // Build content prompt
        const { systemPrompt, userPrompt } = buildPromptForMode(docContext, 'content');

        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'ThoughtCompletion',
                cancellable: true,
            },
            async (progress, token) => {
                progress.report({ message: 'Generating content...' });

                const completion = await ctx.llm.complete(userPrompt, {
                    systemPrompt,
                    maxTokens: ctx.maxTokens,
                    temperature: 0.7,
                });

                if (!token.isCancellationRequested && completion) {
                    await insertCompletion(editor, completion);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`ThoughtCompletion error: ${error}`);
    }
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
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    try {
        const text = editor.document.getText();
        const position = editor.selection.active;

        // Resolve document type
        const docType = await resolveDocumentType(
            text,
            ctx.activeTypeName,
            ctx.customTypes,
            ctx.llm
        );

        // Analyze context - this determines if we're at structure or content position
        const docContext = analyzeDocument(
            text,
            position.line,
            position.character,
            docType
        );

        // Use detected cursor position to choose mode
        const mode = docContext.cursorPosition;
        const { buildPrompt } = await import('../prompts/builder');
        const { systemPrompt, userPrompt } = buildPrompt(docContext);

        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'ThoughtCompletion',
                cancellable: true,
            },
            async (progress, token) => {
                progress.report({ message: `Generating ${mode}...` });

                const completion = await ctx.llm.complete(userPrompt, {
                    systemPrompt,
                    maxTokens: ctx.maxTokens,
                    temperature: 0.7,
                });

                if (!token.isCancellationRequested && completion) {
                    await insertCompletion(editor, completion);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`ThoughtCompletion error: ${error}`);
    }
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
