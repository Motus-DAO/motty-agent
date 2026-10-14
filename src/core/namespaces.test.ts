import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NamespaceNotAllowedError,
  assertPublicKnowledgeNamespace,
  isPublicKnowledgeNamespace,
} from "./namespaces.js";

test("allows brand and product", () => {
  assert.equal(isPublicKnowledgeNamespace("brand"), true);
  assert.equal(isPublicKnowledgeNamespace("product"), true);
  assert.equal(assertPublicKnowledgeNamespace("brand"), "brand");
});

test("rejects internal namespaces", () => {
  assert.equal(isPublicKnowledgeNamespace("clinical-policy"), false);
  assert.throws(
    () => assertPublicKnowledgeNamespace("engineering"),
    (err: unknown) => err instanceof NamespaceNotAllowedError,
  );
});
