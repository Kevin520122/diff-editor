import React, { useRef, useImperativeHandle, forwardRef } from 'react';

export interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface TextEditorRef {
  focus: () => void;
  getSelectionRange: () => { start: number; end: number } | null;
  setSelectionRange: (start: number, end: number) => void;
}

export const TextEditor = forwardRef<TextEditorRef, TextEditorProps>(({
  value,
  onChange,
  placeholder = "Start typing your text here...",
  className = "",
  disabled = false,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    getSelectionRange: () => {
      const textarea = textareaRef.current;
      if (!textarea) return null;
      return {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };
    },
    setSelectionRange: (start: number, end: number) => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.setSelectionRange(start, end);
        textarea.focus();
      }
    },
  }));

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key to insert tabs instead of changing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '\t' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the tab
      setTimeout(() => {
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  return (
    <div className={`text-editor ${className} w-full flex justify-center`}>
      <div className="w-full max-w-4xl">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-y font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{
            minHeight: '200px',
            maxHeight: '500px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        />
      </div>
    </div>
  );
}); 