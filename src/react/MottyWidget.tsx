"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import type { MottyAction, MottyLocale, MottyMessage } from "../core/types.js";
import { MottyAvatar } from "./MottyAvatar.js";
import { MottyMarkdown } from "./MottyMarkdown.js";
import { MottyActionCard } from "./MottyActionCard.js";

const REVEAL_MS = 4500;
const REVEAL_SCROLL_RATIO = 0.7;
const MOTTY_Z = 90;
const ACCENT_GRAD =
  "linear-gradient(135deg, #A855F7 0%, #EC4899 52%, #C9C0FF 100%)";

export type MottyWidgetCopy = {
  title: string;
  subtitle: string;
  greeting: string;
  disclaimer: string;
  crisis: string;
  placeholder: string;
  send: string;
  close: string;
  fab: string;
  thinking: string;
  error: string;
  rateLimit: string;
};

export type MottyWidgetProps = {
  locale?: MottyLocale;
  dark?: boolean;
  copy: MottyWidgetCopy;
  /** When false, widget stays hidden (e.g. Hub until authenticated). */
  ready?: boolean;
  /** Delayed FAB reveal (landing). Set false for immediate show. */
  delayedReveal?: boolean;
  chatPath?: string;
  pagePath?: string | null;
  onOpen?: () => void;
  /** Host signs the in-chat action (WaaP / wallet). */
  onSignAction?: (action: MottyAction) => Promise<void> | void;
  className?: string;
};

type ChatLine = MottyMessage & { actions?: MottyAction[] };

export function MottyWidget({
  locale = "es",
  dark = true,
  copy,
  ready = true,
  delayedReveal = true,
  chatPath = "/api/motty/chat",
  pagePath = null,
  onOpen,
  onSignAction,
  className = "",
}: MottyWidgetProps) {
  const [revealed, setRevealed] = useState(!delayedReveal);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!delayedReveal) {
      setRevealed(true);
      return;
    }
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setRevealed(true);
    };
    const onScroll = () => {
      if (window.scrollY >= window.innerHeight * REVEAL_SCROLL_RATIO) show();
    };
    const timer = window.setTimeout(show, REVEAL_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [delayedReveal]);

  useEffect(() => {
    if (!open) return;
    setLines((current) =>
      current.length
        ? current
        : [{ role: "assistant", content: copy.greeting }],
    );
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(focusTimer);
  }, [open, copy.greeting]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || pending) return;

    setInput("");
    setPending(true);
    setLines((current) => [...current, { role: "user", content: message }]);

    try {
      const response = await fetch(chatPath, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale, pagePath }),
      });
      const json = (await response.json()) as {
        reply?: string;
        error?: string;
        actions?: MottyAction[];
      };
      const reply =
        json.reply?.trim() ||
        (response.status === 429 ? copy.rateLimit : copy.error);
      setLines((current) => [
        ...current,
        { role: "assistant", content: reply, actions: json.actions },
      ]);
    } catch {
      setLines((current) => [
        ...current,
        { role: "assistant", content: copy.error },
      ]);
    } finally {
      setPending(false);
    }
  }, [input, pending, locale, chatPath, pagePath, copy.rateLimit, copy.error, onSignAction]);

  if (!ready || !revealed) return null;

  const chrome = dark
    ? {
        panel:
          "linear-gradient(165deg, rgba(16, 10, 30, 0.92), rgba(28, 12, 48, 0.88))",
        text: "rgba(255,255,255,0.92)",
        muted: "rgba(255,255,255,0.55)",
        border: "rgba(255,255,255,0.14)",
      }
    : {
        panel:
          "linear-gradient(165deg, rgba(255,255,255,0.94), rgba(246, 240, 255, 0.92))",
        text: "rgba(14,10,26,0.92)",
        muted: "rgba(14,10,26,0.55)",
        border: "rgba(147,51,234,0.18)",
      };

  return (
    <div
      className={`motty-widget pointer-events-none fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] flex flex-col items-end gap-3 ${className}`}
      style={{ zIndex: MOTTY_Z }}
    >
      {open ? (
        <section
          className="pointer-events-auto flex w-[min(100vw-32px,380px)] flex-col overflow-hidden rounded-2xl border shadow-lg"
          style={{
            background: chrome.panel,
            borderColor: chrome.border,
            maxHeight: "min(640px, 72vh)",
            backdropFilter: "blur(20px)",
          }}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header
            className="flex items-start gap-3 border-b px-4 py-3"
            style={{ borderColor: chrome.border }}
          >
            <div className="mt-0.5 h-10 w-10 shrink-0" aria-hidden>
              <MottyAvatar size={40} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="text-base font-semibold tracking-tight"
                style={{ color: chrome.text }}
              >
                {copy.title}
              </h2>
              <p className="text-xs leading-snug" style={{ color: chrome.muted }}>
                {copy.subtitle}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full p-1.5 transition-opacity hover:opacity-80"
              style={{ color: chrome.muted }}
              onClick={() => setOpen(false)}
              aria-label={copy.close}
            >
              <X size={18} />
            </button>
          </header>

          <p
            className="border-b px-4 py-2 text-[11px] leading-snug"
            style={{ color: chrome.muted, borderColor: chrome.border }}
          >
            {copy.disclaimer}
          </p>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-3"
          >
            {lines.map((line, index) =>
              line.role === "user" ? (
                <p
                  key={`${line.role}-${index}`}
                  className="ml-auto max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed text-white"
                  style={{ backgroundImage: ACCENT_GRAD }}
                >
                  {line.content}
                </p>
              ) : (
                <div
                  key={`${line.role}-${index}`}
                  className="max-w-[92%]"
                  style={{ color: chrome.text }}
                >
                  <MottyMarkdown>{line.content}</MottyMarkdown>
                  {line.actions?.map((action, actionIndex) => (
                    <MottyActionCard
                      key={`${index}-${actionIndex}`}
                      action={action}
                      onSign={onSignAction}
                    />
                  ))}
                </div>
              ),
            )}
            {pending ? (
              <p
                className="flex items-center gap-2 text-xs"
                style={{ color: chrome.muted }}
              >
                <Loader2 size={14} className="animate-spin" />
                {copy.thinking}
              </p>
            ) : null}
          </div>

          <p
            className="px-4 pb-2 text-[11px] leading-snug"
            style={{ color: chrome.muted }}
          >
            {copy.crisis}
          </p>

          <form
            className="flex items-end gap-2 border-t px-3 py-3"
            style={{ borderColor: chrome.border }}
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="motty-input">
              {copy.placeholder}
            </label>
            <textarea
              id="motty-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder={copy.placeholder}
              className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
              style={{ color: chrome.text, borderColor: chrome.border }}
              maxLength={2000}
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
              style={{ backgroundImage: ACCENT_GRAD }}
              disabled={pending || !input.trim()}
              aria-label={copy.send}
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-black/75 shadow-lg ring-1 ring-white/15 transition-transform hover:scale-[1.03]"
        onClick={() => {
          setOpen((value) => {
            if (!value) onOpen?.();
            return !value;
          });
        }}
        aria-expanded={open}
        aria-label={open ? copy.close : copy.fab}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <MottyAvatar size={64} />
        )}
      </button>
    </div>
  );
}
