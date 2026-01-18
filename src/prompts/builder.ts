/**
 * Prompt builder - constructs full prompts from context
 */

import { DocumentContext, CursorPosition } from '../analysis/document-context';
import { DocumentType } from '../llm/types';
import { STRUCTURE_SYSTEM_PROMPT, CONTENT_SYSTEM_PROMPT } from './templates';

/**
 * Built prompt result
 */
export interface BuiltPrompt {
    systemPrompt: string;
    userPrompt: string;
}

/**
 * Build a prompt for structure continuation
 */
function buildStructurePrompt(context: DocumentContext): BuiltPrompt {
    const typeContext = context.documentType
        ? `\nDocument type: ${context.documentType.name}\n${context.documentType.workingPrompt}`
        : '';

    const sectionContext = context.currentSection
        ? `\nCurrent section: ${context.currentSection}`
        : '';

    const structureSummary = context.precedingStructure
        .slice(-10) // Last 10 structure elements
        .map(n => {
            const prefix = n.type === 'header' ? '#'.repeat(n.level) + ' ' :
                n.type === 'bullet' ? '  '.repeat(n.level - 1) + '- ' :
                    n.type === 'numbered' ? '  '.repeat(n.level - 1) + '1. ' : '';
            return prefix + n.content;
        })
        .join('\n');

    const userPrompt = `${typeContext}${sectionContext}

Recent document structure:
${structureSummary}

Current content before cursor (DO NOT REPEAT THIS):
${context.textBeforeCursor}

Generate ONLY the new structural elements to add. Do not repeat any existing text.`;

    return {
        systemPrompt: STRUCTURE_SYSTEM_PROMPT,
        userPrompt,
    };
}

/**
 * Build a prompt for content filling
 */
function buildContentPrompt(context: DocumentContext): BuiltPrompt {
    const typeContext = context.documentType
        ? `\nDocument type: ${context.documentType.name}\n${context.documentType.workingPrompt}`
        : '';

    const sectionContext = context.currentSection
        ? `\nCurrent section: ${context.currentSection}`
        : '';

    const userPrompt = `${typeContext}${sectionContext}

Content before cursor (DO NOT REPEAT THIS):
${context.textBeforeCursor}

Current line: ${context.currentLine}

Content after cursor:
${context.textAfterCursor}

Generate ONLY the new text to insert at the cursor. Do not repeat any existing text. Continue or complete the current point naturally.`;

    return {
        systemPrompt: CONTENT_SYSTEM_PROMPT,
        userPrompt,
    };
}

/**
 * Build appropriate prompt based on cursor position
 */
export function buildPrompt(context: DocumentContext): BuiltPrompt {
    if (context.cursorPosition === 'structure') {
        return buildStructurePrompt(context);
    } else {
        return buildContentPrompt(context);
    }
}

/**
 * Build prompt for a specific mode (overriding automatic detection)
 */
export function buildPromptForMode(
    context: DocumentContext,
    mode: CursorPosition
): BuiltPrompt {
    if (mode === 'structure') {
        return buildStructurePrompt(context);
    } else {
        return buildContentPrompt(context);
    }
}
