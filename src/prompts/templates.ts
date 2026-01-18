/**
 * Prompt templates for document completion
 * Includes default document types and system prompts
 */

import { DocumentType } from '../llm/types';

/**
 * System prompt for structure continuation mode
 */
export const STRUCTURE_SYSTEM_PROMPT = `You are a document structuring assistant helping organize thoughts and ideas.

Your role is to suggest the next logical structural elements (headers, bullet points, sections) based on the document context.

CRITICAL: Output ONLY the NEW text to append. Do NOT repeat or echo any existing content from the document. Your response will be inserted at the cursor position.

Guidelines:
- Analyze the existing structure and suggest natural continuations
- Match the style and formatting of the existing document
- Keep suggestions concise - provide structure, not full content
- Use appropriate heading levels and list formatting
- Consider document type when suggesting structure

Return ONLY the new structural element(s) to add. Never repeat existing text.`;

/**
 * System prompt for content filling mode
 */
export const CONTENT_SYSTEM_PROMPT = `You are a document writing assistant helping elaborate on specific points.

Your role is to expand on the current point or section with relevant content.

CRITICAL: Output ONLY the NEW text to append. Do NOT repeat or echo any existing content from the document. Your response will be inserted at the cursor position.

Guidelines:
- Stay focused on the specific point being elaborated
- Match the tone and style of the existing content
- Provide substantive but concise additions
- Don't introduce new structural elements
- Consider the document type for appropriate content style

Return ONLY the new content to add. Never repeat existing text.`;

/**
 * Default built-in document types
 */
export const DEFAULT_DOCUMENT_TYPES: DocumentType[] = [
    {
        name: 'negotiation',
        detectionPrompt: 'Document discusses parties, positions, interests, BATNA, alternatives, deal terms, concessions, or negotiation strategy',
        workingPrompt: 'Help structure negotiation points. Consider: parties involved, their interests and positions, BATNA (best alternative to negotiated agreement), zone of possible agreement, key issues, potential concessions, and agreement terms.',
    },
    {
        name: 'brainstorm',
        detectionPrompt: 'Document contains idea generation, creative exploration, free-form thoughts, possibilities, or "what if" scenarios',
        workingPrompt: 'Generate diverse ideas and perspectives. Encourage creative thinking, build on existing points, explore tangents, and suggest unexpected connections. Quantity over quality at this stage.',
    },
    {
        name: 'project-evaluation',
        detectionPrompt: 'Document evaluates a project with criteria, metrics, risks, recommendations, pros/cons, or assessment of outcomes',
        workingPrompt: 'Structure evaluation with clear criteria. Include: objectives vs outcomes, strengths and weaknesses, quantitative metrics where possible, risks and mitigations, lessons learned, and actionable recommendations.',
    },
    {
        name: 'meeting-notes',
        detectionPrompt: 'Document contains agenda items, attendees, discussion points, decisions made, or action items',
        workingPrompt: 'Organize meeting information clearly. Structure with: attendees, agenda, key discussion points, decisions made, action items with owners and deadlines, and follow-up items.',
    },
    {
        name: 'research-notes',
        detectionPrompt: 'Document contains research findings, sources, quotes, hypotheses, or analysis of information',
        workingPrompt: 'Structure research systematically. Include: key findings, sources and references, supporting evidence, open questions, methodology notes, and conclusions or implications.',
    },
    {
        name: 'decision-document',
        detectionPrompt: 'Document analyzes a decision with options, criteria, trade-offs, or recommendations',
        workingPrompt: 'Structure decision analysis clearly. Include: problem statement, decision criteria, options with pros/cons, analysis against criteria, recommendation with rationale, and implementation considerations.',
    },
];

/**
 * Get all document types (defaults + custom)
 */
export function getAllDocumentTypes(customTypes: DocumentType[]): DocumentType[] {
    // Custom types can override defaults by name
    const defaultNames = new Set(DEFAULT_DOCUMENT_TYPES.map(t => t.name));
    const customNames = new Set(customTypes.map(t => t.name));

    // Filter out defaults that are overridden
    const filteredDefaults = DEFAULT_DOCUMENT_TYPES.filter(t => !customNames.has(t.name));

    return [...filteredDefaults, ...customTypes];
}

/**
 * Find document type by name
 */
export function findDocumentType(
    name: string,
    customTypes: DocumentType[]
): DocumentType | null {
    const allTypes = getAllDocumentTypes(customTypes);
    return allTypes.find(t => t.name === name) ?? null;
}
