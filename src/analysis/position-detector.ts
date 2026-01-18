/**
 * Position detection for cursor location analysis
 */

export interface PositionInfo {
    /** Is cursor at end of line */
    atEndOfLine: boolean;
    /** Is line a structural element (header, list) */
    isStructuralLine: boolean;
    /** Is line empty or whitespace only */
    isEmptyLine: boolean;
    /** Number of empty lines before cursor */
    emptyLinesBefore: number;
    /** Is cursor after a colon (suggesting list to follow) */
    afterColon: boolean;
}

/**
 * Analyze cursor position within a line
 */
export function analyzePosition(
    lines: string[],
    lineNumber: number,
    column: number
): PositionInfo {
    const line = lines[lineNumber] ?? '';
    const textBeforeCursor = line.slice(0, column);

    // Check if at end of line
    const atEndOfLine = column >= line.trimEnd().length;

    // Check if structural line
    const isStructuralLine = /^(#{1,6}\s|[-*+]\s|\d+\.\s)/.test(line);

    // Check if empty
    const isEmptyLine = /^\s*$/.test(line);

    // Count empty lines before
    let emptyLinesBefore = 0;
    for (let i = lineNumber - 1; i >= 0; i--) {
        if (/^\s*$/.test(lines[i])) {
            emptyLinesBefore++;
        } else {
            break;
        }
    }

    // Check if after colon
    const afterColon = textBeforeCursor.trimEnd().endsWith(':');

    return {
        atEndOfLine,
        isStructuralLine,
        isEmptyLine,
        emptyLinesBefore,
        afterColon,
    };
}

/**
 * Determine if position suggests structure continuation
 */
export function shouldContinueStructure(position: PositionInfo): boolean {
    // After colon usually means list follows
    if (position.afterColon) return true;

    // Empty line after content = continue structure
    if (position.isEmptyLine && position.emptyLinesBefore === 0) return true;

    // At end of structural line
    if (position.isStructuralLine && position.atEndOfLine) return true;

    return false;
}

/**
 * Determine if position suggests content filling
 */
export function shouldFillContent(position: PositionInfo): boolean {
    // In middle of content = fill
    if (!position.isStructuralLine && !position.isEmptyLine) return true;

    // At structural element with content following
    if (position.isStructuralLine && !position.atEndOfLine) return true;

    return false;
}
