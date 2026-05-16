import React from 'react';

/**
 * Converts **bold** inline markdown syntax into React <strong> elements.
 * Any token that doesn't match **text** passes through as a plain string.
 * Safe — no dangerouslySetInnerHTML, no external deps.
 */
export function renderInlineMarkdown(text: string): React.ReactNode {
  // Split on **…** markers, keeping the delimiters as captured groups
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);

  // Fast path: no bold markers present
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: '#092B2F' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part || null;
  });
}

/**
 * Strips all **bold** markdown markers from a string, returning plain text.
 * Use this before truncating a body for preview snippets.
 */
export function stripInlineMarkdown(text: string): string {
  return text.replace(/\*\*([^*\n]+)\*\*/g, '$1');
}
