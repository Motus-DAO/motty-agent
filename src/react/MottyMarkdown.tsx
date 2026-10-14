"use client";

import ReactMarkdown from "react-markdown";

export type MottyMarkdownProps = {
  children: string;
};

export function MottyMarkdown({ children }: MottyMarkdownProps) {
  return (
    <div className="motty-md">
      <ReactMarkdown
        allowedElements={[
          "p",
          "strong",
          "em",
          "a",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "blockquote",
          "code",
          "pre",
          "hr",
          "br",
        ]}
        unwrapDisallowed
        components={{
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
