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

    const userPrompt = `CONTEXT & FRAMEWORK:
${typeContext}${sectionContext}

RECENT STRUCTURE:
${structureSummary}

CONTENT BEFORE CURSOR (DO NOT REPEAT):
${context.textBeforeCursor}

INSTRUCTIONS:
1. Analyze the logic flow above.
2. Suggest the MAJOR structural elements (headers/bullets) that should come next.
3. Use the framework specified directly above (e.g., SWOT, Negotiations).
4. DO NOT write content. DO NOT repeat existing text.
5. If the argument is weak, suggest a header like "### Critical Gaps" or "### Evidence Required".

Generate ONLY the new structure.`;

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

    const userPrompt = `CONTEXT & FRAMEWORK:
${typeContext}${sectionContext}

CONTENT BEFORE CURSOR (DO NOT REPEAT):
${context.textBeforeCursor}

CURRENT LINE:
${context.currentLine}

CONTENT AFTER CURSOR:
${context.textAfterCursor}

INSTRUCTIONS:
1. You are coaching the user to write this section.
2. Provide *leading sentences* that force specific logic (e.g., "The root cause of this is...").
3. Insert *probing questions* as comments (e.g., "<!-- Is this assumption valid? -->").
4. DO NOT simply autocomplete generic text.
5. DO NOT repeat existing text.

Generate ONLY the new text/scaffolding.`;

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
