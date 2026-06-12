import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export function MathRenderer({ text, className = "text-slate-700" }: MathRendererProps) {
  if (!text) return null;

  // Split by $$ first for block equations
  const blocks = text.split(/(\$\$.*?\$\$)/gs);

  return (
    <div className={`math-renderer leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.startsWith('$$') && block.endsWith('$$')) {
          const math = block.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return (
              <div 
                key={bIdx} 
                className="my-3 overflow-x-auto text-center py-4 bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 text-slate-900 shadow-2xs"
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          } catch (e) {
            return (
              <pre key={bIdx} className="overflow-x-auto text-red-650 bg-red-50 p-2 my-2 text-xs font-mono rounded-lg border border-red-200">
                {math}
              </pre>
            );
          }
        } else {
          // Inside this text chunk, find inline $ equations
          const inlines = block.split(/(\$.*?\$)/g);
          return (
            <span key={bIdx}>
              {inlines.map((part, iIdx) => {
                if (part.startsWith('$') && part.endsWith('$')) {
                  const math = part.slice(1, -1).trim();
                  try {
                    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
                    return (
                      <span 
                        key={iIdx} 
                        className="inline-block px-1 align-baseline font-semibold text-blue-600"
                        dangerouslySetInnerHTML={{ __html: html }} 
                      />
                    );
                  } catch (e) {
                    return <code key={iIdx} className="text-red-500 font-mono text-xs">{math}</code>;
                  }
                } else {
                  // Standard text: preserve standard newline spacing
                  return part.split('\n').map((line, lIdx, arr) => (
                    <React.Fragment key={lIdx}>
                      {line}
                      {lIdx < arr.length - 1 && <br />}
                    </React.Fragment>
                  ));
                }
              })}
            </span>
          );
        }
      })}
    </div>
  );
}
