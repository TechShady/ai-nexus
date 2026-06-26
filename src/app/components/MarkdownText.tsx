import React from 'react';

/** Simple markdown renderer supporting: bold, italic, code blocks, inline code, links, lists, headings */
export const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const renderInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(<code key={key++} className="md-inline-code">{codeMatch[1]}</code>);
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      // Bold
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      // Italic
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      // Link
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(<a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="md-link">{linkMatch[1]}</a>);
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }
      // Plain text (up to next special char)
      const nextSpecial = remaining.slice(1).search(/[`*\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else {
        parts.push(remaining.slice(0, nextSpecial + 1));
        remaining = remaining.slice(nextSpecial + 1);
      }
    }
    return parts;
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={elements.length} className="md-code-block">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      elements.push(
        <div key={elements.length} className={`md-heading md-h${level}`}>{renderInline(headingMatch[2])}</div>
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        const content = lines[i].replace(/^\s*[-*]\s+/, '');
        listItems.push(<li key={listItems.length}>{renderInline(content)}</li>);
        i++;
      }
      elements.push(<ul key={elements.length} className="md-list">{listItems}</ul>);
      continue;
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        const content = lines[i].replace(/^\s*\d+\.\s+/, '');
        listItems.push(<li key={listItems.length}>{renderInline(content)}</li>);
        i++;
      }
      elements.push(<ol key={elements.length} className="md-list">{listItems}</ol>);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(<p key={elements.length} className="md-paragraph">{renderInline(line)}</p>);
    i++;
  }

  return <div className="md-content">{elements}</div>;
};
