import { useState, useCallback } from 'react';
import { Version } from '../types';

export interface UseVersionHistoryReturn {
  versions: Version[];
  currentVersion: Version | null;
  currentVersionIndex: number;
  addVersion: (text: string, prompt: string) => void;
  goToVersion: (versionId: number) => void;
  deleteVersion: (versionId: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export function useVersionHistory(initialText: string = ''): UseVersionHistoryReturn {
  const [versions, setVersions] = useState<Version[]>([
    {
      id: Date.now(),
      text: initialText,
      timestamp: new Date(),
      prompt: 'Initial version',
    },
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  const currentVersion = versions[currentVersionIndex] || null;

  const addVersion = useCallback((text: string, prompt: string) => {
    const newVersion: Version = {
      id: Date.now(),
      text,
      timestamp: new Date(),
      prompt,
    };

    setVersions(prevVersions => {
      // If we're not at the latest version, remove all versions after current
      const currentIndex = prevVersions.findIndex(v => v.id === currentVersion?.id);
      const newVersions = currentIndex >= 0 
        ? [...prevVersions.slice(0, currentIndex + 1), newVersion]
        : [...prevVersions, newVersion];
      
      return newVersions;
    });

    // Move to the new version
    setCurrentVersionIndex(_ => {
      const currentIndex = versions.findIndex(v => v.id === currentVersion?.id);
      return currentIndex >= 0 ? currentIndex + 1 : versions.length;
    });
  }, [currentVersion, versions]);

  const goToVersion = useCallback((versionId: number) => {
    const index = versions.findIndex(v => v.id === versionId);
    if (index >= 0) {
      setCurrentVersionIndex(index);
    }
  }, [versions]);

  const deleteVersion = useCallback((versionId: number) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.filter(v => v.id !== versionId);
      return updatedVersions.length > 0 ? updatedVersions : prevVersions;
    });

    // Adjust current index if necessary
    setCurrentVersionIndex(prevIndex => {
      const deletedIndex = versions.findIndex(v => v.id === versionId);
      if (deletedIndex < prevIndex) {
        return Math.max(0, prevIndex - 1);
      } else if (deletedIndex === prevIndex) {
        return Math.min(prevIndex, versions.length - 2);
      }
      return prevIndex;
    });
  }, [versions]);

  const canUndo = currentVersionIndex > 0;
  const canRedo = currentVersionIndex < versions.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentVersionIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentVersionIndex(prev => prev + 1);
    }
  }, [canRedo]);

  return {
    versions,
    currentVersion,
    currentVersionIndex,
    addVersion,
    goToVersion,
    deleteVersion,
    canUndo,
    canRedo,
    undo,
    redo,
  };
} 