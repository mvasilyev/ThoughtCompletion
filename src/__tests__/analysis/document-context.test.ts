/**
 * Unit tests for document-context module
 */

import {
    extractStructure,
    findCurrentSection,
    detectCursorPosition,
    analyzeDocument,
    StructureNode,
} from '../../analysis/document-context';

describe('extractStructure', () => {
    it('should extract headers from markdown', () => {
        const text = `# Title
Some content
## Section 1
Content here
### Subsection
More content`;

        const structure = extractStructure(text);
        const headers = structure.filter(s => s.type === 'header');

        expect(headers).toHaveLength(3);
        expect(headers[0]).toMatchObject({ type: 'header', level: 1, content: 'Title' });
        expect(headers[1]).toMatchObject({ type: 'header', level: 2, content: 'Section 1' });
        expect(headers[2]).toMatchObject({ type: 'header', level: 3, content: 'Subsection' });
    });

    it('should extract bullet points', () => {
        const text = `# List
- Item 1
- Item 2
  - Nested item`;

        const structure = extractStructure(text);
        const bullets = structure.filter(s => s.type === 'bullet');

        expect(bullets).toHaveLength(3);
        expect(bullets[0]).toMatchObject({ type: 'bullet', level: 1, content: 'Item 1' });
        expect(bullets[2]).toMatchObject({ type: 'bullet', level: 2 });
    });

    it('should extract numbered lists', () => {
        const text = `1. First
2. Second
3. Third`;

        const structure = extractStructure(text);
        const numbered = structure.filter(s => s.type === 'numbered');

        expect(numbered).toHaveLength(3);
        expect(numbered[0]).toMatchObject({ type: 'numbered', level: 1, content: 'First' });
    });
});

describe('findCurrentSection', () => {
    it('should find the current section header', () => {
        const text = `# Title

## Section 1
Content

## Section 2
Current position here`;

        const structure = extractStructure(text);
        const cursorLine = 6; // "Current position here" line (0-indexed)

        const section = findCurrentSection(structure, cursorLine);
        expect(section).toBe('Section 2');
    });

    it('should return null if no section found', () => {
        const text = `Just some text
without any headers`;

        const structure = extractStructure(text);
        const section = findCurrentSection(structure, 1);
        expect(section).toBeNull();
    });
});

describe('detectCursorPosition', () => {
    const emptyStructure: StructureNode[] = [];

    it('should detect structure position at empty line', () => {
        const lines = [''];
        const position = detectCursorPosition(lines, 0, emptyStructure);
        expect(position).toBe('structure');
    });

    it('should detect structure position at empty bullet', () => {
        const lines = ['- '];
        const position = detectCursorPosition(lines, 0, emptyStructure);
        expect(position).toBe('structure');
    });

    it('should detect content position in regular text', () => {
        const lines = ['Some regular content here'];
        const position = detectCursorPosition(lines, 0, emptyStructure);
        expect(position).toBe('content');
    });

    it('should detect structure position at header', () => {
        const lines = ['## Header'];
        const position = detectCursorPosition(lines, 0, emptyStructure);
        expect(position).toBe('structure');
    });
});

describe('analyzeDocument', () => {
    it('should analyze a complete document', () => {
        const text = `# My Document

## Background
Some background info

## Goals
- Goal 1
- Goal 2`;

        const context = analyzeDocument(text, 7, 8, null);

        expect(context.currentSection).toBe('Goals');
        expect(context.precedingStructure.length).toBeGreaterThan(0);
        expect(context.currentLine).toBe('- Goal 2');
    });

    it('should include document type when provided', () => {
        const docType = {
            name: 'test-type',
            detectionPrompt: 'Test detection',
            workingPrompt: 'Test working',
        };

        const context = analyzeDocument('# Test', 0, 0, docType);

        expect(context.documentType).toEqual(docType);
    });
});
