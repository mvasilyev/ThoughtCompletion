/**
 * Analysis module exports
 */

export {
    DocumentContext,
    StructureNode,
    CursorPosition,
    analyzeDocument,
    extractStructure,
    findCurrentSection,
    detectCursorPosition,
    calculateDepth,
} from './document-context';

export {
    PositionInfo,
    analyzePosition,
    shouldContinueStructure,
    shouldFillContent,
} from './position-detector';
