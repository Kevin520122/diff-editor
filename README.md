# 📝 Diff Chat Editor

A self-contained React + TypeScript component that enables users to chat with OpenAI directly in the browser, receive rewrite suggestions, see inline diffs, accept/reject edits, and navigate between historic versions—all without any backend.

## ✨ Features

- **AI-Powered Text Editing**: Chat with OpenAI to get intelligent text improvements
- **Real-time Diff Viewing**: See changes highlighted with inline diffs
- **Version History**: Complete version management with undo/redo functionality
- **Suggestion Management**: Accept or reject individual suggestions
- **Frontend-Only**: No backend required - runs entirely in the browser
- **Export/Import**: Save and restore your work
- **Keyboard Shortcuts**: Efficient editing with Ctrl+Z/Y support

## 🛠️ Tech Stack

- **React 18** + **TypeScript** - Modern frontend framework
- **OpenAI API** - AI-powered text suggestions (via frontend fetch)
- **react-diff-viewer-continued** - Advanced diff rendering
- **diff-match-patch** - Text diff algorithm
- **Lucide React** - Beautiful icons
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast development and build tool

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd diff-chat-editor
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:5173`

4. **Configure your OpenAI API key:**
- Click the Settings icon in the header
- Enter your OpenAI API key (starts with `sk-...`)
- Get your API key from: https://platform.openai.com/api-keys

## 📖 Usage

### Basic Workflow

1. **Write or paste your text** in the editor
2. **Chat with the AI** - Ask for improvements like:
   - "Make this more professional"
   - "Fix grammar and spelling"
   - "Rewrite paragraph 2 to be more concise"
   - "Add examples to explain the concept better"
3. **Review suggestions** in the diff viewer
4. **Accept or reject** individual changes
5. **Navigate history** to see all versions

### OpenAI Configuration

The editor uses the following OpenAI settings by default:

```typescript
{
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7
}
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── DiffChatEditor.tsx   # Main editor component
│   ├── TextEditor.tsx       # Text input area
│   ├── ChatInterface.tsx    # AI chat interface
│   ├── DiffViewer.tsx       # Diff display
│   ├── VersionHistory.tsx   # Version management
│   └── SuggestionPanel.tsx  # Suggestion controls
├── hooks/                # Custom React hooks
│   ├── useVersionHistory.ts # Version management logic
│   └── useOpenAI.ts        # OpenAI integration
├── utils/                # Utility functions
│   ├── openai.ts          # OpenAI API wrapper
│   └── diff.ts            # Diff utilities
├── types/                # TypeScript definitions
│   └── index.ts          # All type definitions
└── index.ts              # Main export file
```

### Custom OpenAI Prompts

Modify the system prompt in `src/utils/openai.ts`:

```typescript
const systemPrompt = `Your custom system prompt here...`;
```



## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm install` to install dependencies
   - Check that all peer dependencies are installed

2. **OpenAI API errors**
   - Verify your API key is correct
   - Check your OpenAI account has sufficient credits
   - Ensure the key has the correct permissions

3. **Diff viewer not displaying**
   - Check browser console for JavaScript errors
   - Verify the text changes are properly formatted

4. **Performance issues with large texts**
   - The editor is optimized for documents under 10,000 characters
   - Consider breaking very large documents into sections

