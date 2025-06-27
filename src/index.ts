// Main component
export { DiffChatEditor } from './components/DiffChatEditor';

// Individual components
export { TextEditor } from './components/TextEditor';
export { ChatInterface } from './components/ChatInterface';
export { DiffViewer } from './components/DiffViewer';
export { VersionHistory } from './components/VersionHistory';
export { SuggestionPanel } from './components/SuggestionPanel';

// Hooks
export { useVersionHistory } from './hooks/useVersionHistory';
export { useOpenAI } from './hooks/useOpenAI';

// Utilities
export { OpenAIService } from './utils/openai';
export { DiffUtils } from './utils/diff';

// Types
export type {
  Version,
  TextChange,
  ChatMessage,
  OpenAIMessage,
  DiffViewerProps,
  VersionHistoryProps,
  ChatInterfaceProps,
  DiffChatEditorProps,
  OpenAIConfig,
} from './types'; 