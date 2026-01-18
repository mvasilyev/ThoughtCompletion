# ThoughtCompletion

AI-powered thought organization assistant for VS Code. Helps structure documents like negotiation plans, brainstorms, project evaluations, and more.

## Features

- **Structure Continuation** - Suggests next headers, bullet points, and sections based on document context
- **Blank Filling** - Elaborates on specific points when you're inside content
- **Document Type Detection** - Automatically detects document type or lets you configure custom types
- **Local LLM Support** - Works with Ollama and any OpenAI-compatible API (LM Studio, LocalAI, LiteLLM, etc.)
- **Semi-Automatic Mode** - Configure auto-trigger with delay or manual-only mode to save API costs
- **Configurable Token Limits** - Adjust max tokens for thinking models like Qwen3

## Requirements

- VS Code 1.85.0 or higher
- Ollama running locally (`ollama serve`), or access to an OpenAI-compatible API

## Installation

### From VSIX
```bash
cd ThoughtCompletion
npm install
npm run compile
vsce package
# Install the generated .vsix file from VS Code Extensions menu
```

### Development
Press `F5` in VS Code to launch Extension Development Host.

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `thoughtCompletion.provider` | `ollama` | LLM provider (`openai` or `ollama`) |
| `thoughtCompletion.triggerMode` | `auto` | `auto` triggers after delay, `manual` only on command |
| `thoughtCompletion.completionDelay` | `2500` | Delay in ms before auto-triggering (500-10000) |
| `thoughtCompletion.maxTokens` | `1000` | Max tokens for LLM response (100-4000, increase for thinking models) |
| `thoughtCompletion.autoComplete` | `true` | Enable inline completions (when triggerMode is auto) |
| `thoughtCompletion.activeDocumentType` | `auto` | Document type (`auto` for LLM detection, or specific type) |
| `thoughtCompletion.documentTypes` | `[]` | Custom document type definitions |

### OpenAI Provider Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `thoughtCompletion.openai.baseUrl` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `thoughtCompletion.openai.apiKey` | `` | API key |
| `thoughtCompletion.openai.model` | `gpt-4o-mini` | Model name |

### Ollama Provider Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `thoughtCompletion.ollama.baseUrl` | `http://localhost:11434/v1` | Ollama API endpoint |
| `thoughtCompletion.ollama.model` | `llama3.2` | Ollama model name |

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Cmd+Shift+Enter` | Trigger completion (auto-detects mode) |
| `Cmd+Shift+]` | Force structure continuation |
| `Cmd+Shift+[` | Force content filling |

> Note: Shortcuts only work in Markdown and plaintext files.

## Commands

- `ThoughtCompletion: Trigger Completion` - Generate completion at cursor (auto-detects mode)
- `ThoughtCompletion: Continue Structure` - Force structure continuation
- `ThoughtCompletion: Fill Blank` - Force content elaboration
- `ThoughtCompletion: Detect Document Type` - Run document type detection
- `ThoughtCompletion: Select Document Type` - Manually select document type

## Built-in Document Types

- **negotiation** - Negotiation plans with parties, interests, BATNA
- **brainstorm** - Creative ideation and exploration
- **project-evaluation** - Project assessment with criteria and metrics
- **meeting-notes** - Meeting documentation with action items
- **research-notes** - Research organization with sources
- **decision-document** - Decision analysis with options and criteria

## Custom Document Types

Add custom document types in settings:

```json
{
  "thoughtCompletion.documentTypes": [
    {
      "name": "sales-proposal",
      "detectionPrompt": "Document contains pricing, value proposition, or client benefits",
      "workingPrompt": "Structure the proposal with clear value points, address objections, include pricing rationale."
    }
  ]
}
```

## Troubleshooting

### Thinking Models (Qwen3, etc.)
If using thinking/reasoning models, increase `maxTokens` to 2000-4000 to allow the model to complete its reasoning and generate actual content.

### Proxy Issues
If you're behind a corporate proxy, the extension uses direct connections (bypasses VS Code proxy settings). This works well for local services but may need adjustment for external APIs.

## License

MIT
