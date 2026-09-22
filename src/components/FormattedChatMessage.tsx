import React, { useState } from 'react';
import { useTimeout } from '../hooks/useTimeout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
  };

  useTimeout(() => {
    setCopied(false);
  }, copied ? 2000 : null);

  return (
    <div className="relative rounded-lg overflow-hidden bg-[#1E1E1E] my-4 border border-gray-700/50 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-gray-700/50">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300 m-0 p-0 bg-transparent">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};

interface FormattedChatMessageProps {
  content: string;
  className?: string;
}

export const FormattedChatMessage: React.FC<FormattedChatMessageProps> = ({ content, className }) => {
  return (
    <div className={cn('prose prose-sm md:prose-base dark:prose-invert max-w-none break-words', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline) {
              return <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className="bg-gray-800/50 text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-700/50 border border-gray-700/50 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="px-4 py-2 bg-gray-800/50 text-left text-sm font-semibold text-gray-200">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700/50">{children}</td>;
          },
          p({ children }) {
            return <p className="mb-4 last:mb-0 leading-relaxed text-gray-300">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-1">{children}</ol>;
          },
          a({ children, href }) {
            return <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-gray-100">{children}</strong>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
