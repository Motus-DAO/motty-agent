"use client";

import { useState } from "react";
import type { MottyAction } from "../core/types.js";

export type MottyActionCardProps = {
  action: MottyAction;
  /** Host signs/executes the action. The SDK never holds keys. */
  onSign?: (action: MottyAction) => Promise<void> | void;
  className?: string;
};

export function MottyActionCard({
  action,
  onSign,
  className = "",
}: MottyActionCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fallback =
    action.kind === "transfer"
      ? action.link
      : action.kind === "escrow"
        ? action.payPath
        : action.url;

  const label =
    action.kind === "transfer"
      ? "Firmar y enviar"
      : action.kind === "escrow"
        ? "Depositar"
        : "Pagar con Stripe";

  async function run() {
    if (!onSign) {
      if (fallback) window.open(fallback, "_blank", "noopener,noreferrer");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSign(action);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`motty-action-card mt-2 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-xs ${className}`}
    >
      {action.kind === "transfer" ? (
        <>
          <p className="font-semibold text-current">{action.toName}</p>
          <p className="mt-0.5 break-all font-mono text-[10px] opacity-60">
            {action.toAddress}
          </p>
          <p className="mt-2 text-sm font-bold">
            {action.amount} {action.token}
          </p>
        </>
      ) : action.kind === "escrow" ? (
        <>
          <p className="font-semibold text-current">
            {action.psmName ? `Sesión con ${action.psmName}` : "Depósito de sesión"}
          </p>
          {action.startsAt ? (
            <p className="mt-0.5 text-[11px] opacity-60">
              {new Intl.DateTimeFormat("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(action.startsAt))}
            </p>
          ) : null}
          <p className="mt-2 text-sm font-bold">{action.amountWmxn} wMXN</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-current">{action.name}</p>
          <p className="mt-2 text-sm font-bold">
            {action.amountMxn} MXN{action.interval ? ` · ${action.interval}` : ""}
          </p>
        </>
      )}

      {error ? <p className="mt-2 text-[11px] text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Firmando…" : label}
      </button>

      {fallback && onSign ? (
        <a
          href={fallback}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 inline-flex text-[11px] underline opacity-60"
        >
          Ver página
        </a>
      ) : null}
    </div>
  );
}
