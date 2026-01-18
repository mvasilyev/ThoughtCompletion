/**
 * Prompts module exports
 */

export {
    STRUCTURE_SYSTEM_PROMPT,
    CONTENT_SYSTEM_PROMPT,
    DEFAULT_DOCUMENT_TYPES,
    getAllDocumentTypes,
    findDocumentType,
} from './templates';

export {
    detectDocumentType,
    resolveDocumentType,
} from './type-detector';

export {
    BuiltPrompt,
    buildPrompt,
    buildPromptForMode,
} from './builder';
