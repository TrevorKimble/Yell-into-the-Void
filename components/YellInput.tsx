'use client';

import { useState, useRef, useEffect } from 'react';

interface YellInputProps {
  on_yell: (text: string) => void;
  is_hidden: boolean;
}

const MAX_CHARS = 250;

export default function YellInput({ on_yell, is_hidden }: YellInputProps) {
  const [text, set_text] = useState('');
  const textarea_ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textarea_ref.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  const handle_yell = () => {
    const trimmed = text.trim();
    if (!trimmed || is_hidden) return;

    on_yell(trimmed);
    set_text('');
  };

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handle_yell();
    }
  };

  // Re-focus when input reappears
  if (!is_hidden && textarea_ref.current && document.activeElement !== textarea_ref.current) {
    setTimeout(() => textarea_ref.current?.focus(), 50);
  }

  return (
    <div
      className={`relative z-10 flex flex-col items-center pt-10 sm:pt-14 px-4 transition-all duration-500 ${
        is_hidden ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white tracking-tight text-center">
        Yell into the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Void</span>
      </h1>
      <p className="text-gray-500 text-sm mb-6 text-center">
        Type something Let it go
      </p>

      <div className="w-full max-w-xl">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-purple-900/10">
          <textarea
            ref={textarea_ref}
            value={text}
            onChange={(e) => set_text(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handle_key_down}
            placeholder="Scream into the void..."
            rows={1}
            className="w-full bg-transparent text-white placeholder-gray-600 resize-none outline-none text-base leading-relaxed overflow-hidden"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">
              {text.length}/{MAX_CHARS}
            </span>
            <button
              onClick={handle_yell}
              disabled={!text.trim() || is_hidden}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                bg-gradient-to-r from-blue-600 to-purple-600 text-white
                hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/25
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              YELL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
