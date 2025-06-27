import React from 'react';
import { Check, X, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { TextChange } from '../types';

export interface SuggestionPanelProps {
  suggestions: TextChange[];
  onAcceptSuggestion: (index: number) => void;
  onRejectSuggestion: (index: number) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onPreviewSuggestion?: (index: number) => void;
  previewIndex?: number;
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  suggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  onAcceptAll,
  onRejectAll,
  onPreviewSuggestion,
  previewIndex,
}) => {
  if (suggestions.length === 0) {
    return (
      <div className="suggestion-panel w-full flex justify-center">
        <div className="w-full max-w-md lg:max-w-none">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-center text-gray-500 text-sm">
              <p>No suggestions available</p>
              <p className="text-xs mt-1">Chat with the AI to get text improvement suggestions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <div className="suggestion-panel w-full flex justify-center">
      <div className="w-full max-w-md lg:max-w-none">
        <div className="bg-white border border-gray-300 rounded-lg">
          <div className="header bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">
                AI Suggestions ({suggestions.length})
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onRejectAll}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={onAcceptAll}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  Accept All
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
            
            {/* Workflow guidance */}
            <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="font-medium">💡 Tip:</span>
                <span>Accept changes to see a diff view comparing your original content with AI modifications</span>
              </div>
            </div>
          </div>

          <div className="suggestions-list max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              const isPreviewActive = previewIndex === index;
              
              return (
                <div
                  key={index}
                  className={`suggestion-item border-b border-gray-100 last:border-0 p-4 ${
                    isPreviewActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-2">
                        Change {index + 1} • Position {suggestion.startIndex}-{suggestion.endIndex}
                      </div>
                      
                      {suggestion.original && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-red-700 mb-1">Remove:</div>
                          <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                            <code className="text-xs text-red-800">
                              {truncateText(suggestion.original)}
                            </code>
                          </div>
                        </div>
                      )}
                      
                      {suggestion.revised && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-green-700 mb-1">
                            {suggestion.original ? 'Replace with:' : 'Add:'}
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                            <code className="text-xs text-green-800">
                              {truncateText(suggestion.revised)}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {onPreviewSuggestion && (
                        <button
                          onClick={() => onPreviewSuggestion(index)}
                          className={`p-1.5 rounded transition-colors ${ 
                            isPreviewActive
                              ? 'bg-blue-200 text-blue-800'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title={isPreviewActive ? 'Hide preview' : 'Preview change'}
                        >
                          {isPreviewActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRejectSuggestion(index)}
                        className="p-1.5 rounded hover:bg-red-100 hover:text-red-600 text-gray-500 transition-colors"
                        title="Reject suggestion"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => onAcceptSuggestion(index)}
                        className="p-1.5 rounded hover:bg-green-100 hover:text-green-600 text-gray-500 transition-colors flex items-center gap-1"
                        title="Accept suggestion and view diff"
                      >
                        <Check size={14} />
                        {suggestions.length === 1 && <ArrowRight size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}; 