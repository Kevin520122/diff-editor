export interface Version {
  id: number;
  text: string;
  timestamp: Date;
  prompt: string;
}

export interface TextChange {
  original: string;
  revised: string;
  startIndex: number;
  endIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: TextChange[];
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  splitView?: boolean;
  hideLineNumbers?: boolean;
  showDiffOnly?: boolean;
  title?: string;
}

export interface VersionHistoryProps {
  versions: Version[];
  currentVersionId: number;
  onVersionSelect: (versionId: number) => void;
  onVersionDelete?: (versionId: number) => void;
}

export interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isLoading?: boolean;
}

export interface DiffChatEditorProps {
  initialText?: string;
  openAIApiKey: string;
  className?: string;
  placeholder?: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
} 