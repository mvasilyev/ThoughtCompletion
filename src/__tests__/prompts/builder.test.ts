/**
 * Unit tests for prompt builder module
 */

import { buildPrompt, buildPromptForMode } from '../../prompts/builder';
import { DocumentContext } from '../../analysis/document-context';

describe('buildPrompt', () => {
    const baseContext: DocumentContext = {
        textBeforeCursor: 'Some text before',
        textAfterCursor: 'Some text after',
        currentLine: 'Current line',
        cursorPosition: 'content',
        precedingStructure: [],
        currentSection: 'Test Section',
        currentDepth: 0,
        documentType: null,
    };

    it('should build content prompt for content cursor position', () => {
        const { systemPrompt, userPrompt } = buildPrompt(baseContext);

        expect(systemPrompt).toContain('writing assistant');
        expect(userPrompt).toContain('Test Section');
        expect(userPrompt).toContain('Some text before');
    });

    it('should build structure prompt for structure cursor position', () => {
        const structureContext: DocumentContext = {
            ...baseContext,
            cursorPosition: 'structure',
        };

        const { systemPrompt, userPrompt } = buildPrompt(structureContext);

        expect(systemPrompt).toContain('structuring assistant');
    });

    it('should include document type info when available', () => {
        const contextWithType: DocumentContext = {
            ...baseContext,
            documentType: {
                name: 'negotiation',
                detectionPrompt: 'Test detection',
                workingPrompt: 'Help with negotiation points',
            },
        };

        const { userPrompt } = buildPrompt(contextWithType);

        expect(userPrompt).toContain('negotiation');
        expect(userPrompt).toContain('Help with negotiation points');
    });
});

describe('buildPromptForMode', () => {
    const baseContext: DocumentContext = {
        textBeforeCursor: 'Text',
        textAfterCursor: '',
        currentLine: 'Line',
        cursorPosition: 'content',
        precedingStructure: [],
        currentSection: null,
        currentDepth: 0,
        documentType: null,
    };

    it('should force structure mode regardless of cursor position', () => {
        const { systemPrompt } = buildPromptForMode(baseContext, 'structure');
        expect(systemPrompt).toContain('structuring assistant');
    });

    it('should force content mode regardless of cursor position', () => {
        const structureContext: DocumentContext = {
            ...baseContext,
            cursorPosition: 'structure',
        };

        const { systemPrompt } = buildPromptForMode(structureContext, 'content');
        expect(systemPrompt).toContain('writing assistant');
    });
});
