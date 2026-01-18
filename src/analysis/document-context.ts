/**
 * Document context analysis
 * Extracts structure and context from documents to inform completions
 */

import { DocumentType } from '../llm/types';

/**
 * A node in the document structure
 */
export interface StructureNode {
    type: 'header' | 'bullet' | 'numbered' | 'paragraph';
    level: number;
    content: string;
    line: number;
}

/**
 * Cursor position context
 */
export type CursorPosition = 'structure' | 'content';

/**
 * Full document context for completion
 */
export interface DocumentContext {
    /** Detected or selected document type (null = use general prompts) */
    documentType: DocumentType | null;
    /** Current section header the cursor is within */
    currentSection: string | null;
    /** Whether cursor is at a structural position or within content */
    cursorPosition: CursorPosition;
    /** Structure nodes preceding the cursor */
    precedingStructure: StructureNode[];
    /** Current nesting depth (0 = top level) */
    currentDepth: number;
    /** Text content before cursor (limited) */
    textBeforeCursor: string;
    /** Text content after cursor (limited) */
    textAfterCursor: string;
    /** Current line content */
    currentLine: string;
}

/**
 * Regex patterns for document structure detection
 */
const PATTERNS = {
    header: /^(#{1,6})\s+(.+)$/,
    bullet: /^(\s*)[-*+]\s+(.*)$/,
    numbered: /^(\s*)(\d+)\.\s+(.*)$/,
    emptyLine: /^\s*$/,
};

/**
 * Extract structure nodes from document text
 */
export function extractStructure(text: string): StructureNode[] {
    const lines = text.split('\n');
    const nodes: StructureNode[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for headers
        const headerMatch = line.match(PATTERNS.header);
        if (headerMatch) {
            nodes.push({
                type: 'header',
                level: headerMatch[1].length,
                content: headerMatch[2],
                line: i,
            });
            continue;
        }

        // Check for bullet points
        const bulletMatch = line.match(PATTERNS.bullet);
        if (bulletMatch) {
            const indent = bulletMatch[1].length;
            nodes.push({
                type: 'bullet',
                level: Math.floor(indent / 2) + 1,
                content: bulletMatch[2],
                line: i,
            });
            continue;
        }

        // Check for numbered lists
        const numberedMatch = line.match(PATTERNS.numbered);
        if (numberedMatch) {
            const indent = numberedMatch[1].length;
            nodes.push({
                type: 'numbered',
                level: Math.floor(indent / 2) + 1,
                content: numberedMatch[3],
                line: i,
            });
            continue;
        }

        // Non-empty lines are paragraphs
        if (!PATTERNS.emptyLine.test(line)) {
            nodes.push({
                type: 'paragraph',
                level: 0,
                content: line.trim(),
                line: i,
            });
        }
    }

    return nodes;
}

/**
 * Find the current section header for a given line
 */
export function findCurrentSection(structure: StructureNode[], cursorLine: number): string | null {
    // Find the most recent header before or at cursor line
    let currentHeader: string | null = null;

    for (const node of structure) {
        if (node.line > cursorLine) break;
        if (node.type === 'header') {
            currentHeader = node.content;
        }
    }

    return currentHeader;
}

/**
 * Determine cursor position type (structure vs content)
 */
export function detectCursorPosition(
    lines: string[],
    cursorLine: number,
    structure: StructureNode[]
): CursorPosition {
    const line = lines[cursorLine] ?? '';

    // Empty line after structure = structural position
    if (PATTERNS.emptyLine.test(line)) {
        return 'structure';
    }

    // At a header = structural position
    if (PATTERNS.header.test(line)) {
        return 'structure';
    }

    // At the end of a bullet/numbered that's empty = structural
    const bulletMatch = line.match(PATTERNS.bullet);
    if (bulletMatch && bulletMatch[2].trim() === '') {
        return 'structure';
    }

    const numberedMatch = line.match(PATTERNS.numbered);
    if (numberedMatch && numberedMatch[3].trim() === '') {
        return 'structure';
    }

    // Otherwise we're in content
    return 'content';
}

/**
 * Calculate current nesting depth based on structure
 */
export function calculateDepth(structure: StructureNode[], cursorLine: number): number {
    // Find the structure node closest to and before cursor
    let depth = 0;

    for (const node of structure) {
        if (node.line > cursorLine) break;

        if (node.type === 'header') {
            depth = node.level;
        } else if (node.type === 'bullet' || node.type === 'numbered') {
            depth = node.level;
        }
    }

    return depth;
}

/**
 * Analyze document and extract full context for completion
 */
export function analyzeDocument(
    text: string,
    cursorLine: number,
    cursorColumn: number,
    documentType: DocumentType | null = null
): DocumentContext {
    const lines = text.split('\n');
    const structure = extractStructure(text);

    // Get text before and after cursor (limited to ~1000 chars each)
    const linesBefore = lines.slice(Math.max(0, cursorLine - 20), cursorLine + 1);
    const linesAfter = lines.slice(cursorLine + 1, cursorLine + 21);

    // Adjust last line before to cursor position
    if (linesBefore.length > 0) {
        const lastLine = linesBefore[linesBefore.length - 1];
        linesBefore[linesBefore.length - 1] = lastLine.slice(0, cursorColumn);
    }

    const textBeforeCursor = linesBefore.join('\n').slice(-1000);
    const textAfterCursor = linesAfter.join('\n').slice(0, 1000);

    // Get preceding structure nodes
    const precedingStructure = structure.filter(n => n.line <= cursorLine);

    return {
        documentType,
        currentSection: findCurrentSection(structure, cursorLine),
        cursorPosition: detectCursorPosition(lines, cursorLine, structure),
        precedingStructure,
        currentDepth: calculateDepth(structure, cursorLine),
        textBeforeCursor,
        textAfterCursor,
        currentLine: lines[cursorLine] ?? '',
    };
}
