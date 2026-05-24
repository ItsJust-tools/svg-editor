'use client';

import { useCallback } from 'react';

interface ToolCanvasProps {
  text: string;
  fontSize: number;
  readOnly?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (text: string) => void;
}

export function ToolCanvas({
  text,
  fontSize,
  readOnly = false,
  canvasRef,
  onChange,
}: ToolCanvasProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  return (
    <div ref={canvasRef} className="notepad-canvas" role="application" aria-label="Notepad canvas">
      <textarea
        className="notepad-textarea"
        value={text}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder="Start typing your notes here..."
        aria-label="Note text"
        spellCheck={false}
        style={{ fontSize: `${fontSize}px` }}
      />
    </div>
  );
}
