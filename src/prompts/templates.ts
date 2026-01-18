/**
 * Prompt templates for document completion
 * Includes default document types and system prompts
 */

import { DocumentType } from '../llm/types';

/**
 * System prompt for structure continuation mode
 */
export const STRUCTURE_SYSTEM_PROMPT = `You are a Strategic Document Architect acting as a thought partner.

Your role is NOT to write the content, but to design the *structure* that guides the user's thinking.
You suggest logical frameworks, gap analysis, and structural elements that force the user to cover critical angles.

CRITICAL: Output ONLY the NEW structural elements (headers, bullets). Do NOT repeat existing content.

Guidelines:
- Suggest specific, probing headers (e.g., "### Potential Risks (Operational vs Financial)" instead of just "Risks")
- Use standard frameworks relevant to the document type (e.g., SWOT, First Principles, SCAMPER)
- Highlight missing logic or gaps in the argument
- Keep suggestions concise but directive
- Force the user to think, don't do the thinking for them

Return ONLY the new structure.`;

/**
 * System prompt for content filling mode
 */
export const CONTENT_SYSTEM_PROMPT = `You are a Socratic Editor and Thought Coach.

Your role is NOT to write the content for the user, but to help them clarify and expand their own thoughts.
You provide "scaffolding" — probing questions, leading sentences, and placeholders that guide the user to a deeper analysis.

CRITICAL: Output ONLY new text to append. Do NOT repeat existing content.

Guidelines:
- Use "Socratic questioning" in comments or brackets (e.g., "<!-- What is the root cause? -->")
- Provide *leading* sentences that force specific detail (e.g., "The primary constraint here is...")
- Don't flowery language; focus on logic, evidence, and precision
- If the cursor is in a blank section, provide a template or key questions to answer
- Enforce best practices for the specific document type

Return ONLY the new text/scaffolding.`;

/**
 * Default built-in document types
 */
export const DEFAULT_DOCUMENT_TYPES: DocumentType[] = [
    {
        name: 'negotiation',
        detectionPrompt: 'Document discusses parties, positions, interests, BATNA, alternatives, deal terms, concessions, or negotiation strategy',
        workingPrompt: 'Enforce the "Harvard Negotiation Project" framework. Focus on: Interests vs Positions, Options for Mutual Gain, Objective Criteria, and BATNA/WATNA. Ask: "What is their underlying interest?" "What is your walk-away point?"',
    },
    {
        name: 'brainstorm',
        detectionPrompt: 'Document contains idea generation, creative exploration, free-form thoughts, possibilities, or "what if" scenarios',
        workingPrompt: 'Use "SCAMPER" (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse) or "First Principles" thinking. Encourage diverse angles. Ask: "What if we inverted the assumption?" "What is the fundamental truth here?"',
    },
    {
        name: 'project-evaluation',
        detectionPrompt: 'Document evaluates a project with criteria, metrics, risks, recommendations, pros/cons, or assessment of outcomes',
        workingPrompt: 'Use rigorous evaluation frameworks. For strategy: SWOT or PEEST. For execution: "Keep/Stop/Start" or ROI/Risk matrix. Ask for specific evidence and quantitative metrics. "What is the data source?" "What are the second-order effects?"',
    },
    {
        name: 'meeting-notes',
        detectionPrompt: 'Document contains agenda items, attendees, discussion points, decisions made, or action items',
        workingPrompt: 'Focus on Action and Accountability. Ensure every decision has an owner and deadline. Distinguish between "Discussion", "Decision", and "Action". Ask: "Who owns this?" "by When?" "What is the definition of done?"',
    },
    {
        name: 'research-notes',
        detectionPrompt: 'Document contains research findings, sources, quotes, hypotheses, or analysis of information',
        workingPrompt: 'Enforce "Pyramid Principle" or scientific method. Hypothesis -> Evidence -> Conclusion. Require source citation. Ask: "What disproves this hypothesis?" "Is this correlation or causation?"',
    },
    {
        name: 'decision-document',
        detectionPrompt: 'Document analyzes a decision with options, criteria, trade-offs, or recommendations',
        workingPrompt: 'Enforce "Decision Quality" (DQ) framework. 1. Helpful Frame 2. Creative Alternatives 3. Meaningful Information 4. Clear Values 5. Sound Reasoning 6. Commitment to Action. Ask: "What options did we satisfy?"',
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
