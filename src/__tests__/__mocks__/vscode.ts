/**
 * Mock for VS Code API - used in unit tests
 */

export const window = {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showQuickPick: jest.fn(),
    withProgress: jest.fn((options, task) => task({ report: jest.fn() }, { isCancellationRequested: false })),
    createStatusBarItem: jest.fn(() => ({
        show: jest.fn(),
        hide: jest.fn(),
        dispose: jest.fn(),
        text: '',
        tooltip: '',
        command: '',
    })),
    activeTextEditor: undefined,
};

export const workspace = {
    getConfiguration: jest.fn(() => ({
        get: jest.fn((key: string, defaultValue: unknown) => defaultValue),
        update: jest.fn(),
    })),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
};

export const commands = {
    registerCommand: jest.fn(),
};

export const languages = {
    registerInlineCompletionItemProvider: jest.fn(),
};

export const StatusBarAlignment = {
    Left: 1,
    Right: 2,
};

export const ProgressLocation = {
    Notification: 15,
    SourceControl: 1,
    Window: 10,
};

export const InlineCompletionTriggerKind = {
    Automatic: 0,
    Invoke: 1,
};

export class Range {
    constructor(
        public start: { line: number; character: number },
        public end: { line: number; character: number }
    ) { }
}

export class Position {
    constructor(public line: number, public character: number) { }
}

export class InlineCompletionItem {
    constructor(public insertText: string, public range: Range) { }
}

export class InlineCompletionList {
    constructor(public items: InlineCompletionItem[]) { }
}

export const ThemeColor = jest.fn();
