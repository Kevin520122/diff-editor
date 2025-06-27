import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, FileText, MessageSquare, History, Download, Upload } from 'lucide-react';

import { TextEditor, TextEditorRef } from './TextEditor';
import { ChatInterface } from './ChatInterface';
import { DiffViewer } from './DiffViewer';
import { VersionHistory } from './VersionHistory';
import { SuggestionPanel } from './SuggestionPanel';

import { useVersionHistory } from '../hooks/useVersionHistory';
import { useOpenAI } from '../hooks/useOpenAI';
import { DiffUtils } from '../utils/diff';
import { TextChange, DiffChatEditorProps } from '../types';

type TabType = 'editor' | 'chat' | 'diff' | 'history';

export const DiffChatEditor: React.FC<DiffChatEditorProps> = ({
  initialText = '',
  openAIApiKey,
  className = '',
  placeholder = 'Start typing your text here...',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [currentSuggestions, setCurrentSuggestions] = useState<TextChange[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(openAIApiKey);
  const [tempApiKey, setTempApiKey] = useState(openAIApiKey);
  const [isApiKeySaved, setIsApiKeySaved] = useState(!!openAIApiKey);
  const [originalContent, setOriginalContent] = useState(initialText);
  const [preAIContent, setPreAIContent] = useState<string>('');
  const [showAcceptedChanges, setShowAcceptedChanges] = useState(false);
  const [lastAppliedChanges, setLastAppliedChanges] = useState<TextChange[]>([]);
  
  const textEditorRef = useRef<TextEditorRef>(null);
  const diffUtils = new DiffUtils();
  
  const versionHistory = useVersionHistory(initialText);
  const openAI = useOpenAI({ apiKey });

  const currentText = versionHistory.currentVersion?.text || '';

  useEffect(() => {
    if (originalContent === initialText && currentText && currentText !== initialText) {
      setOriginalContent(currentText);
    }
  }, [currentText, initialText, originalContent]);

  const handleSendMessage = useCallback(async (message: string) => {
    console.log('=== AI Chat Debug ===');
    console.log('1. API Key saved:', !!apiKey && apiKey.trim() !== '');
    console.log('2. API Key format:', apiKey.startsWith('sk-') ? 'Valid' : 'Invalid');
    console.log('3. Current text length:', currentText.length);
    console.log('4. User message:', message);
    
    if (!apiKey.trim()) {
      console.log('❌ No API key provided');
      alert('Please enter your OpenAI API key in settings');
      setShowSettings(true);
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      console.log('❌ Invalid API key format');
      alert('Please enter a valid OpenAI API key (should start with "sk-")');
      setShowSettings(true);
      return;
    }

    if (!currentText || currentText.trim().length === 0) {
      console.log('❌ No text content to work with');
      alert('Please add some text to the editor first');
      setActiveTab('editor');
      return;
    }

    console.log('✅ All checks passed, sending to AI...');

    setPreAIContent(currentText);

    try {
      const suggestions = await openAI.sendMessage(message, currentText);
      console.log('5. AI response received:', suggestions.length, 'suggestions');
      setCurrentSuggestions(suggestions);
      setShowAcceptedChanges(false);
      
      if (suggestions.length > 0) {
        console.log('✅ Switching to editor to show suggestions');
        setActiveTab('editor');
      } else {
        console.log('ℹ️ No suggestions returned');
      }
    } catch (error) {
      console.error('❌ AI request failed:', error);
      alert(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [apiKey, currentText, openAI]);

  const handleAcceptSuggestion = useCallback((index: number) => {
    const suggestion = currentSuggestions[index];
    if (!suggestion) return;

    const newText = diffUtils.applyChanges(currentText, [suggestion]);
    versionHistory.addVersion(newText, `Applied suggestion: ${suggestion.original ? 'Replace' : 'Add'} text`);
    
    // Store this single change for diff display
    setLastAppliedChanges([suggestion]);
    
    const remainingSuggestions = currentSuggestions.filter((_, i) => i !== index);
    setCurrentSuggestions(remainingSuggestions);
    setPreviewIndex(undefined);
    
    // Navigate to diff if this was the last suggestion
    if (remainingSuggestions.length === 0) {
      setShowAcceptedChanges(true);
      setActiveTab('diff');
    }
  }, [currentSuggestions, currentText, diffUtils, versionHistory]);

  const handleRejectSuggestion = useCallback((index: number) => {
    const remainingSuggestions = currentSuggestions.filter((_, i) => i !== index);
    setCurrentSuggestions(remainingSuggestions);
    setPreviewIndex(undefined);
    
    // If this was the last suggestion and there are applied changes, navigate to diff
    if (remainingSuggestions.length === 0 && lastAppliedChanges.length > 0) {
      setShowAcceptedChanges(true);
      setActiveTab('diff');
    }
  }, [currentSuggestions, lastAppliedChanges.length]);

  const handleAcceptAll = useCallback(() => {
    if (currentSuggestions.length === 0) return;

    const newText = diffUtils.applyChanges(currentText, currentSuggestions);
    versionHistory.addVersion(newText, `Applied ${currentSuggestions.length} suggestions`);
    
    // Store all applied changes for diff display
    setLastAppliedChanges(currentSuggestions);
    
    setCurrentSuggestions([]);
    setPreviewIndex(undefined);
    setShowAcceptedChanges(true);
    
    setActiveTab('diff');
  }, [currentSuggestions, currentText, diffUtils, versionHistory]);

  const handleRejectAll = useCallback(() => {
    setCurrentSuggestions([]);
    setPreviewIndex(undefined);
    setShowAcceptedChanges(false);
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    if (newText !== currentText && newText.trim() !== currentText.trim()) {
      versionHistory.addVersion(newText, 'Manual edit');
    }
  }, [currentText, versionHistory]);

  const handleSaveApiKey = useCallback(() => {
    const trimmedKey = tempApiKey.trim();
    if (!trimmedKey) {
      alert('Please enter a valid API key');
      return;
    }
    
    if (!trimmedKey.startsWith('sk-')) {
      alert('API key should start with "sk-"');
      return;
    }
    
    setApiKey(trimmedKey);
    setIsApiKeySaved(true);
    
    // Close settings popup after 1 second
    setTimeout(() => {
      setShowSettings(false);
    }, 1000);
  }, [tempApiKey]);

  useEffect(() => {
    if (tempApiKey !== apiKey) {
      setIsApiKeySaved(false);
    }
  }, [tempApiKey, apiKey]);

  const handlePreviewSuggestion = useCallback((index: number) => {
    setPreviewIndex(prev => prev === index ? undefined : index);
  }, []);

  const getPreviewText = () => {
    if (previewIndex === undefined) return currentText;
    const suggestion = currentSuggestions[previewIndex];
    if (!suggestion) return currentText;
    return diffUtils.applyChanges(currentText, [suggestion]);
  };

  const getDiffContent = () => {
    if (showAcceptedChanges) {
      // Use the pre-AI content as the original, and current text as modified
      return {
        oldValue: preAIContent || originalContent,
        newValue: currentText,
        changes: lastAppliedChanges,
        title: 'Before AI vs After AI'
      };
    } else {
      // For preview mode, show the single suggestion being previewed
      const previewChanges = previewIndex !== undefined ? [currentSuggestions[previewIndex]] : [];
      
      return {
        oldValue: currentText,
        newValue: getPreviewText(),
        changes: previewChanges,
        title: 'Current vs Preview'
      };
    }
  };

  const handleExport = () => {
    const data = {
      versions: versionHistory.versions,
      currentVersionIndex: versionHistory.currentVersionIndex,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff-chat-editor-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Import data:', data);
        alert('Import functionality would be implemented here');
      } catch (error) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              versionHistory.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            versionHistory.redo();
            break;
          case 'Z':
            if (e.shiftKey) {
              e.preventDefault();
              versionHistory.redo();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [versionHistory]);

  const tabs = [
    { id: 'editor' as TabType, label: 'Editor', icon: FileText },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'diff' as TabType, label: 'Diff', icon: FileText },
    { id: 'history' as TabType, label: 'History', icon: History },
  ];

  return (
    <div className={`diff-chat-editor ${className} w-full min-h-screen bg-gray-50`}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="header mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-800 text-center sm:text-left">Diff Chat Editor</h1>
            
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <button
                onClick={handleExport}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Export"
              >
                <Download size={16} />
              </button>
              
              <label className="p-2 rounded hover:bg-gray-200 transition-colors cursor-pointer" title="Import">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Settings"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 w-full max-w-md mx-auto sm:max-w-none sm:mx-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
                  title="Close settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!tempApiKey.trim() || (tempApiKey === apiKey && isApiKeySaved)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        isApiKeySaved && tempApiKey === apiKey
                          ? 'bg-green-600 text-white cursor-default'
                          : tempApiKey.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isApiKeySaved && tempApiKey === apiKey ? '✓ Saved' : 'Save'}
                    </button>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="mt-2 text-xs">
                    {isApiKeySaved && tempApiKey === apiKey ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        API key saved for this session
                      </span>
                    ) : tempApiKey && tempApiKey !== apiKey ? (
                      <span className="text-orange-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Click "Save" to use this API key
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Enter your OpenAI API key to enable AI features
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs border-b border-gray-200">
            <nav className="flex flex-wrap justify-center sm:justify-start space-x-4 sm:space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                // Determine badge content and color
                let badge = null;
                if (tab.id === 'chat' && openAI.messages.length > 0) {
                  badge = (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {openAI.messages.length}
                    </span>
                  );
                } else if (tab.id === 'editor' && currentSuggestions.length > 0) {
                  badge = (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                      {currentSuggestions.length}
                    </span>
                  );
                } else if (tab.id === 'diff' && showAcceptedChanges) {
                  badge = (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      ✓
                    </span>
                  );
                }
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.charAt(0)}</span>
                    {badge}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {activeTab === 'editor' && (
            <div className="w-full flex justify-center">
              <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6 justify-items-center">
                  <div className="xl:col-span-2 lg:col-span-1 w-full max-w-4xl">
                    <TextEditor
                      ref={textEditorRef}
                      value={currentText}
                      onChange={handleTextChange}
                      placeholder={placeholder}
                    />
                  </div>
                  <div className="xl:col-span-1 lg:col-span-1 w-full max-w-md lg:max-w-none">
                    <SuggestionPanel
                      suggestions={currentSuggestions}
                      onAcceptSuggestion={handleAcceptSuggestion}
                      onRejectSuggestion={handleRejectSuggestion}
                      onAcceptAll={handleAcceptAll}
                      onRejectAll={handleRejectAll}
                      onPreviewSuggestion={handlePreviewSuggestion}
                      previewIndex={previewIndex}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl mx-auto">
                <div className="flex justify-center">
                  <div className="w-full">
                    <ChatInterface
                      messages={openAI.messages}
                      onSendMessage={handleSendMessage}
                      isLoading={openAI.isLoading}
                      error={openAI.error}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="w-full flex justify-center">
              <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col items-center w-full">
                  {/* Back to Editor Button */}
                  {showAcceptedChanges && (
                    <div className="mb-4 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <button
                        onClick={() => setActiveTab('editor')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        <FileText size={16} />
                        Back to Editor
                      </button>
                      <div className="text-sm text-gray-600 text-center sm:text-right">
                        ✅ Changes have been applied successfully
                      </div>
                    </div>
                  )}
                  
                  <div className="w-full flex justify-center">
                    <div className="w-full">
                      <DiffViewer
                        {...getDiffContent()}
                        splitView={true}
                        showDiffOnly={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl mx-auto">
                <div className="flex justify-center">
                  <div className="w-full">
                    <VersionHistory
                      versions={versionHistory.versions}
                      currentVersionIndex={versionHistory.currentVersionIndex}
                      onVersionSelect={versionHistory.goToVersion}
                      onVersionDelete={versionHistory.deleteVersion}
                      canUndo={versionHistory.canUndo}
                      canRedo={versionHistory.canRedo}
                      onUndo={versionHistory.undo}
                      onRedo={versionHistory.redo}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 