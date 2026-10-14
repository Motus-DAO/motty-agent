/**
 * Public Motty always runs the in-process tool loop.
 * OpenClaw / Hermes stays out of the visitor path.
 * Motty Personal (later) may use an OpenClaw provisioner — seam only.
 */
export type MottyRuntimeKind = "in-process-loop" | "openclaw";
export type MottyProvisioner = "none" | "openclaw-launcher";

export function getPublicMottyRuntime(): MottyRuntimeKind {
  return "in-process-loop";
}

export function getPublicMottyProvisioner(): MottyProvisioner {
  return "none";
}
