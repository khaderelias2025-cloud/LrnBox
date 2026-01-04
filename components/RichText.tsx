import React from 'react';

interface RichTextProps {
  content: string;
  onHashtagClick?: (tag: string) => void;
  onMentionClick?: (handle: string) => void;
  className?: string;
}

const RichText: React.FC<RichTextProps> = ({ content, onHashtagClick, onMentionClick, className = '' }) => {
  if (!content) return null;

  // Split by whitespace first to preserve spaces, then check tokens? 
  // OR Split capturing the delimiter. 
  // Regex: Split by hashtags (#...) or mentions (@...) keeping delimiters
  // \s matches whitespace. We want to find patterns that start with # or @ followed by word characters.
  
  const parts = content.split(/([#@][\w_]+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return (
            <span 
              key={i} 
              onClick={(e) => { 
                if (onHashtagClick) {
                  e.stopPropagation(); 
                  onHashtagClick(part);
                }
              }}
              className="text-primary-600 font-medium hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }
        if (part.startsWith('@')) {
          return (
            <span 
              key={i} 
              onClick={(e) => { 
                 if (onMentionClick) {
                   e.stopPropagation(); 
                   onMentionClick(part); 
                 }
              }}
              className="text-indigo-600 font-medium hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export default RichText;