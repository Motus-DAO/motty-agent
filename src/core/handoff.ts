export type HandoffKind = "disabled" | "url" | "email";

export type HandoffAdapter = {
  id: string;
  kind: HandoffKind;
  href?: string;
  label?: string;
};

export function getHandoffAdapter(
  env: NodeJS.ProcessEnv = process.env,
): HandoffAdapter {
  const kind = parseKind(env.MOTTY_HANDOFF_KIND);
  const href = env.MOTTY_HANDOFF_URL?.trim() || undefined;
  const label = env.MOTTY_HANDOFF_LABEL?.trim() || undefined;

  if (kind === "disabled" && href) {
    return {
      id: "env",
      kind: href.startsWith("mailto:") ? "email" : "url",
      href,
      label,
    };
  }

  return { id: "env", kind, href, label };
}

function parseKind(value: string | undefined): HandoffKind {
  if (value === "url" || value === "email" || value === "disabled") return value;
  return "disabled";
}
