import { diff_match_patch } from 'diff-match-patch';
import { TextChange } from '../types';

export class DiffUtils {
  private dmp: any;

  constructor() {
    this.dmp = new diff_match_patch();
  }

  // Create a unified diff between two texts
  createDiff(oldText: string, newText: string) {
    const diffs = this.dmp.diff_main(oldText, newText);
    this.dmp.diff_cleanupSemantic(diffs);
    return diffs;
  }

  // Apply text changes to the original text
  applyChanges(originalText: string, changes: TextChange[]): string {
    if (changes.length === 0) return originalText;

    // Validate and fix indices first
    const validChanges = this.validateAndFixIndices(originalText, changes);
    if (validChanges.length === 0) return originalText;

    // Sort changes by startIndex in descending order to avoid index shifting
    const sortedChanges = [...validChanges].sort((a, b) => b.startIndex - a.startIndex);
    
    // Apply changes one by one from end to beginning
    let result = originalText;
    
    for (const change of sortedChanges) {
      // Double-check the text at this position matches what we expect to replace
      const actualText = result.substring(change.startIndex, change.endIndex);
      
      if (actualText === change.original) {
        // Simple, clean replacement
        const before = result.substring(0, change.startIndex);
        const after = result.substring(change.endIndex);
        result = before + change.revised + after;
        
        console.log(`✅ Replaced "${change.original}" with "${change.revised}" at position ${change.startIndex}-${change.endIndex}`);
      } else {
        console.warn(`❌ Text mismatch at ${change.startIndex}-${change.endIndex}: expected "${change.original}", found "${actualText}"`);
        
        // Try to find the text in the current result and replace the first occurrence
        const index = result.indexOf(change.original);
        if (index !== -1) {
          result = result.substring(0, index) + change.revised + result.substring(index + change.original.length);
          console.log(`✅ Found and replaced "${change.original}" with "${change.revised}" at position ${index}`);
        } else {
          console.warn(`❌ Could not find "${change.original}" in text for replacement`);
        }
      }
    }
    
    return result;
  }

  // Validate and fix indices for changes
  private validateAndFixIndices(text: string, changes: TextChange[]): TextChange[] {
    return changes.map((change, index) => {
      let { startIndex, endIndex, original, revised } = change;
      
      // Validate basic properties
      if (!original || !revised) {
        console.warn(`Invalid change ${index}: missing original or revised text`);
        return null;
      }
      
      // If indices are invalid, try to find the correct position
      if (startIndex < 0 || endIndex > text.length || startIndex >= endIndex) {
        console.warn(`Invalid indices for change ${index}: ${startIndex}-${endIndex}, attempting to find correct position`);
        
        // Find the first occurrence of the original text
        const foundIndex = text.indexOf(original);
        
        if (foundIndex === -1) {
          console.warn(`Text "${original}" not found in document`);
          return null;
        }
        
        startIndex = foundIndex;
        endIndex = startIndex + original.length;
        
        console.log(`Fixed indices to ${startIndex}-${endIndex}`);
      }
      
      // Verify the text at the position matches
      const actualText = text.substring(startIndex, endIndex);
      if (actualText !== original) {
        console.warn(`Text mismatch: expected "${original}", found "${actualText}"`);
        
        // Try to find the correct occurrence
        const foundIndex = text.indexOf(original);
        if (foundIndex !== -1) {
          startIndex = foundIndex;
          endIndex = startIndex + original.length;
          console.log(`Corrected indices to ${startIndex}-${endIndex}`);
        } else {
          console.warn(`Cannot find "${original}" in text, skipping this change`);
          return null;
        }
      }
      
      return {
        original,
        revised,
        startIndex,
        endIndex
      };
    }).filter(Boolean) as TextChange[];
  }

  // Find all occurrences of a substring
  private findAllOccurrences(text: string, substring: string): number[] {
    const occurrences: number[] = [];
    let index = text.indexOf(substring);
    
    while (index !== -1) {
      occurrences.push(index);
      index = text.indexOf(substring, index + 1);
    }
    
    return occurrences;
  }

  // Remove overlapping changes to avoid conflicts
  private removeOverlappingChanges(changes: TextChange[]): TextChange[] {
    // Sort by start index
    const sorted = [...changes].sort((a, b) => a.startIndex - b.startIndex);
    const result: TextChange[] = [];
    
    for (const change of sorted) {
      // Check if this change overlaps with any previous change
      const hasOverlap = result.some(existing => 
        this.changesOverlap(existing, change)
      );
      
      if (!hasOverlap) {
        result.push(change);
      } else {
        console.warn('Skipping overlapping change:', change);
      }
    }
    
    return result;
  }

  // Check if two changes overlap
  private changesOverlap(change1: TextChange, change2: TextChange): boolean {
    return !(change1.endIndex <= change2.startIndex || change2.endIndex <= change1.startIndex);
  }

  // Find text changes between two versions
  findChanges(oldText: string, newText: string): TextChange[] {
    const diffs = this.createDiff(oldText, newText);
    const changes: TextChange[] = [];
    let currentIndex = 0;

    for (const [operation, text] of diffs) {
      if (operation === -1) { // Deletion
        const nextDiff = diffs[diffs.indexOf([operation, text]) + 1];
        if (nextDiff && nextDiff[0] === 1) { // Next is insertion
          changes.push({
            original: text,
            revised: nextDiff[1],
            startIndex: currentIndex,
            endIndex: currentIndex + text.length,
          });
        } else {
          changes.push({
            original: text,
            revised: '',
            startIndex: currentIndex,
            endIndex: currentIndex + text.length,
          });
        }
        currentIndex += text.length;
      } else if (operation === 1) { // Insertion
        const prevDiff = diffs[diffs.indexOf([operation, text]) - 1];
        if (!prevDiff || prevDiff[0] !== -1) { // Previous is not deletion
          changes.push({
            original: '',
            revised: text,
            startIndex: currentIndex,
            endIndex: currentIndex,
          });
        }
      } else { // No change
        currentIndex += text.length;
      }
    }

    return changes;
  }

  // Calculate similarity between two texts (0-1)
  calculateSimilarity(text1: string, text2: string): number {
    const diffs = this.createDiff(text1, text2);
    let totalLength = 0;
    let unchangedLength = 0;

    for (const [operation, text] of diffs) {
      totalLength += text.length;
      if (operation === 0) {
        unchangedLength += text.length;
      }
    }

    return totalLength === 0 ? 1 : unchangedLength / totalLength;
  }
} 