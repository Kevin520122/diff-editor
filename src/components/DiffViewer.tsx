import React from 'react';
import { TextChange } from '../types';

export interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  changes?: TextChange[];
  splitView?: boolean;
  hideLineNumbers?: boolean;
  showDiffOnly?: boolean;
  title?: string;
}

interface DiffSegment {
  type: 'unchanged' | 'deleted' | 'added' | 'modified';
  oldText?: string;
  newText?: string;
  startIndex: number;
  endIndex: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldValue,
  newValue,
  changes,
  splitView = true,
  hideLineNumbers = false,
  showDiffOnly = false,
  title = 'Diff View',
}) => {
  // Create diff segments using the actual AI suggestions
  const createDiffSegments = (): DiffSegment[] => {
    console.log('🔍 Creating diff segments...');
    console.log('Old value:', oldValue.substring(0, 100) + '...');
    console.log('New value:', newValue.substring(0, 100) + '...');
    console.log('Changes provided:', changes?.length || 0);

    if (!changes || changes.length === 0) {
      // No changes - show as completely unchanged
      return [{
        type: 'unchanged',
        oldText: oldValue,
        newText: newValue,
        startIndex: 0,
        endIndex: oldValue.length
      }];
    }

    const segments: DiffSegment[] = [];
    let lastProcessedIndex = 0;

    // Validate and fix changes first
    const validatedChanges = changes.map(change => {
      // Check if the change indices are valid
      if (change.startIndex >= 0 && change.endIndex <= oldValue.length) {
        const actualText = oldValue.substring(change.startIndex, change.endIndex);
        if (actualText === change.original) {
          return change; // Change is valid
        }
      }
      
      // Try to find the original text in oldValue
      const foundIndex = oldValue.indexOf(change.original);
      if (foundIndex !== -1) {
        console.log(`Fixed change indices: "${change.original}" found at ${foundIndex}`);
        return {
          ...change,
          startIndex: foundIndex,
          endIndex: foundIndex + change.original.length
        };
      }
      
      console.warn(`Could not validate change: "${change.original}"`);
      return null;
    }).filter(Boolean) as TextChange[];

    // Sort changes by start index
    const sortedChanges = [...validatedChanges].sort((a, b) => a.startIndex - b.startIndex);

    console.log('Valid changes:', sortedChanges.length);

    // Process each change and create segments
    sortedChanges.forEach((change, index) => {
      // Add unchanged text before this change
      if (change.startIndex > lastProcessedIndex) {
        const unchangedText = oldValue.substring(lastProcessedIndex, change.startIndex);
        segments.push({
          type: 'unchanged',
          oldText: unchangedText,
          newText: unchangedText, // Same text in both sides
          startIndex: lastProcessedIndex,
          endIndex: change.startIndex
        });
      }

      // Add the change segment
      segments.push({
        type: 'modified',
        oldText: change.original,   // Yellow highlighted text on left
        newText: change.revised,    // Green highlighted text on right
        startIndex: change.startIndex,
        endIndex: change.endIndex
      });

      lastProcessedIndex = change.endIndex;
    });

    // Add remaining unchanged text after all changes
    if (lastProcessedIndex < oldValue.length) {
      const remainingText = oldValue.substring(lastProcessedIndex);
      segments.push({
        type: 'unchanged',
        oldText: remainingText,
        newText: remainingText, // Same text in both sides
        startIndex: lastProcessedIndex,
        endIndex: oldValue.length
      });
    }

    console.log('✅ Created segments:', segments.length);
    return segments;
  };

  // Render original content with YELLOW highlighting for changed parts
  const renderOriginalContent = (segments: DiffSegment[]) => {
    return (
      <div className="whitespace-pre-wrap font-mono text-sm p-4 leading-relaxed break-words">
        {segments.map((segment, index) => {
          if (segment.type === 'unchanged') {
            return (
              <span key={index} className="text-gray-700">
                {segment.oldText}
              </span>
            );
          } else if (segment.type === 'modified') {
            return (
              <span
                key={index}
                className="bg-yellow-200 text-yellow-900 px-1 rounded"
                title={`Original text: "${segment.oldText}" → AI changed to: "${segment.newText}"`}
              >
                {segment.oldText}
              </span>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Render modified content with GREEN highlighting for changed parts
  const renderModifiedContent = (segments: DiffSegment[]) => {
    return (
      <div className="whitespace-pre-wrap font-mono text-sm p-4 leading-relaxed break-words">
        {segments.map((segment, index) => {
          if (segment.type === 'unchanged') {
            return (
              <span key={index} className="text-gray-700">
                {segment.newText || segment.oldText}
              </span>
            );
          } else if (segment.type === 'modified') {
            return (
              <span
                key={index}
                className="bg-green-200 text-green-900 px-1 rounded"
                title={`AI changed from: "${segment.oldText}" → to: "${segment.newText}"`}
              >
                {segment.newText}
              </span>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const diffSegments = createDiffSegments();
  const hasChanges = diffSegments.some(segment => segment.type !== 'unchanged');

  return (
    <div className="diff-viewer-container w-full flex justify-center">
      <div className="w-full max-w-7xl">
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Title Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-800 text-center">{title}</h3>
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <div className="bg-blue-50 border-b border-gray-200 p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2 text-center">
                AI Suggestions Applied ({diffSegments.filter(s => s.type !== 'unchanged').length})
              </h4>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                {diffSegments.filter(s => s.type === 'added').length > 0 && (
                  <span className="text-green-700">
                    <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1"></span>
                    {diffSegments.filter(s => s.type === 'added').length} Added
                  </span>
                )}
                {diffSegments.filter(s => s.type === 'deleted').length > 0 && (
                  <span className="text-red-700">
                    <span className="inline-block w-3 h-3 bg-red-100 rounded mr-1"></span>
                    {diffSegments.filter(s => s.type === 'deleted').length} Deleted
                  </span>
                )}
                {diffSegments.filter(s => s.type === 'modified').length > 0 && (
                  <span className="text-yellow-700">
                    <span className="inline-block w-3 h-3 bg-yellow-100 rounded mr-1"></span>
                    {diffSegments.filter(s => s.type === 'modified').length} Modified
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Diff Display */}
          {splitView ? (
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Original Content */}
              <div className="border-r border-gray-200">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 text-center">
                    Original
                    {!hasChanges && <span className="text-gray-500 ml-2">(No changes)</span>}
                  </h4>
                </div>
                <div className="min-h-96 max-h-[600px] overflow-y-auto">
                  {renderOriginalContent(diffSegments)}
                </div>
              </div>

              {/* Modified Content */}
              <div>
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 text-center">
                    AI Modified
                    {!hasChanges && <span className="text-gray-500 ml-2">(No changes)</span>}
                  </h4>
                </div>
                <div className="min-h-96 max-h-[600px] overflow-y-auto">
                  {renderModifiedContent(diffSegments)}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 text-center">AI Modified Content</h4>
              </div>
              <div className="min-h-96 max-h-[600px] overflow-y-auto">
                {renderModifiedContent(diffSegments)}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
            <div className="flex flex-wrap justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-100 rounded"></span>
                <span className="text-green-700 font-medium">Added</span>
                <span className="text-gray-600">New content</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-100 rounded"></span>
                <span className="text-red-700 font-medium">Deleted</span>
                <span className="text-gray-600">Removed content</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-yellow-100 rounded"></span>
                <span className="text-yellow-700 font-medium">Modified</span>
                <span className="text-gray-600">AI improvements</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-mono">Plain</span>
                <span className="text-gray-600">Unchanged content</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 