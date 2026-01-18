/**
 * LLM-based document type detection
 */

import { LLMProvider, DocumentType } from '../llm/types';
import { getAllDocumentTypes } from './templates';

/**
 * Build prompt for document type detection
 */
function buildDetectionPrompt(documentText: string, types: DocumentType[]): string {
    const typeDescriptions = types
        .map((t, i) => `${i + 1}. ${t.name}: ${t.detectionPrompt}`)
        .join('\n');

    return `Analyze the following document and determine which type it most closely matches.

Available document types:
${typeDescriptions}
${types.length + 1}. general: Does not match any specific type above

Document excerpt:
---
${documentText.slice(0, 2000)}
---

Respond with ONLY the type name (e.g., "negotiation" or "general"). No explanation.`;
}

/**
 * Detect document type using LLM
 */
export async function detectDocumentType(
    documentText: string,
    customTypes: DocumentType[],
    llm: LLMProvider
): Promise<DocumentType | null> {
    const allTypes = getAllDocumentTypes(customTypes);

    if (allTypes.length === 0) {
        return null;
    }

    const prompt = buildDetectionPrompt(documentText, allTypes);

    try {
        const response = await llm.complete(prompt, {
            maxTokens: 50,
            temperature: 0.1, // Low temperature for consistent detection
        });

        const typeName = response.trim().toLowerCase().replace(/['"]/g, '');

        // Handle "general" response
        if (typeName === 'general') {
            return null;
        }

        // Find matching type
        const matchedType = allTypes.find(
            t => t.name.toLowerCase() === typeName
        );

        return matchedType ?? null;
    } catch (error) {
        console.error('Document type detection failed:', error);
        return null;
    }
}

/**
 * Get document type - either from explicit selection or auto-detect
 */
export async function resolveDocumentType(
    documentText: string,
    activeTypeName: string,
    customTypes: DocumentType[],
    llm: LLMProvider
): Promise<DocumentType | null> {
    // If 'auto', detect from content
    if (activeTypeName === 'auto') {
        return detectDocumentType(documentText, customTypes, llm);
    }

    // Otherwise, find the specified type
    const allTypes = getAllDocumentTypes(customTypes);
    return allTypes.find(t => t.name === activeTypeName) ?? null;
}
