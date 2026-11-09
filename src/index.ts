/** @motusdao/motty — lightweight MotusDAO guide agent (MCP + funnel + session). */

export {
  configureMotty,
  hasMottyInference,
  mottyConfig,
  resolveMottyConfig,
  type MottyConfig,
  type MottyConfigInput,
} from "./core/config.js";

export { runMottyTurn, type RunMottyTurnInput } from "./core/agent-loop.js";

export {
  searchPublicKnowledge,
  formatKnowledgeForVisitor,
  formatKnowledgeForModel,
  type KnowledgeHit,
} from "./core/mcp.js";

export {
  PUBLIC_KNOWLEDGE_NAMESPACES,
  DEFAULT_KNOWLEDGE_NAMESPACES,
  NamespaceNotAllowedError,
  assertPublicKnowledgeNamespace,
  isPublicKnowledgeNamespace,
  type PublicKnowledgeNamespace,
} from "./core/namespaces.js";

export {
  appendTurn,
  createEmptySession,
  decodeMottyCookie,
  encodeMottyCookie,
  readMottySessionFromJar,
  writeMottySessionToJar,
  type CookieJar,
} from "./core/session.js";

export {
  createChatCompletion,
  type ProviderMessage,
  type ProviderTool,
  type ProviderToolCall,
  type ChatCompletion,
} from "./core/provider.js";

export { getHandoffAdapter, type HandoffAdapter, type HandoffKind } from "./core/handoff.js";
export {
  configureMottyPayments,
  getMottyPaymentsAdapter,
  isMottyAction,
  type MottyPaymentsAdapter,
  type MottyPaymentOutcome,
  type MottyProductInput,
  type MottyTransferInput,
} from "./core/payments.js";
export { getOffer, recommendOffer } from "./core/offers.js";
export {
  getPublicMottyRuntime,
  getPublicMottyProvisioner,
  type MottyRuntimeKind,
  type MottyProvisioner,
} from "./core/runtime.js";

export type {
  MottyLocale,
  MottyMessage,
  MottySession,
  MottyLead,
  MottyAudience,
  MottyOffer,
  MottyLearningContext,
  MottyAction,
  ToolResult,
} from "./core/types.js";

export {
  ALL_MOTTY_TOOL_NAMES,
  DEFAULT_ENABLED_TOOLS,
  enabledToolSchemas,
  executeMottyTool,
  PAYMENT_ENABLED_TOOLS,
  type MottyToolName,
} from "./tools/index.js";
export {
  PAYMENT_TOOL_NAMES,
  type PaymentToolName,
} from "./tools/payments.js";

export {
  publicEcosystemPrompt,
  hubCompanionPrompt,
  paymentsPrompt,
} from "./presets/prompts.js";

export * from "./chain/index.js";
