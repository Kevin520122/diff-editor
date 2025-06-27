import React from 'react';
import { History, Clock, Trash2, Undo, Redo } from 'lucide-react';
import { Version } from '../types';

export interface VersionHistoryProps {
  versions: Version[];
  currentVersionIndex: number;
  onVersionSelect: (versionId: number) => void;
  onVersionDelete?: (versionId: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersionIndex,
  onVersionSelect,
  onVersionDelete,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleString([], {
      month: 'short',  
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const currentVersion = versions[currentVersionIndex];

  return (
    <div className="version-history w-full flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="bg-white border border-gray-300 rounded-lg">
          <div className="header bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-gray-600" />
                <h3 className="text-sm font-medium text-gray-800">Version History</h3>
                <span className="text-xs text-gray-500">({versions.length})</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={14} />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="versions-list max-h-64 overflow-y-auto">
            {versions.map((version, index) => {
              const isCurrentVersion = index === currentVersionIndex;
              const isFutureVersion = index > currentVersionIndex;
              
              return (
                <div
                  key={version.id}
                  className={`version-item border-b border-gray-100 last:border-0 ${
                    isCurrentVersion
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : isFutureVersion
                      ? 'bg-gray-50 opacity-60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onVersionSelect(version.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTime(version.timestamp)}
                          </span>
                          {isCurrentVersion && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        
                        <div className="mb-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {version.prompt}
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {truncateText(version.text)}
                          </p>
                        </div>

                        <div className="text-xs text-gray-400">
                          {version.text.length} characters
                        </div>
                      </div>

                      {onVersionDelete && versions.length > 1 && !isCurrentVersion && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVersionDelete(version.id);
                          }}
                          className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Delete version"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {currentVersion && (
            <div className="current-version-info bg-gray-50 px-4 py-2 border-t border-gray-200 rounded-b-lg">
              <div className="text-xs text-gray-600">
                <strong>Current:</strong> {currentVersion.prompt}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 