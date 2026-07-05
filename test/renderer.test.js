import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Window } from "happy-dom";
import {
  PRIMITIVES,
  TYPES,
  registerPrimitive,
  render,
  renderDocument,
  resolveBind,
} from "../src/renderer.js";

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.Node = window.Node;
globalThis.HTMLElement = window.HTMLElement;

beforeEach(() => {
  document.body.replaceChildren();
});

describe("renderer contract", () => {
  it("registers the closed vocabulary of 14 primitives", () => {
    assert.equal(TYPES.length, 14);
    assert.deepEqual(Object.keys(PRIMITIVES).sort(), [...TYPES].sort());
  });

  it("resolves dotted bindings from local scope before document data", () => {
    const ctx = { data: { user: { name: "root" } }, scope: { user: { name: "row" } } };
    assert.equal(resolveBind("user.name", ctx), "row");
  });

  it("renders a valid document root", () => {
    const result = renderDocument({
      root: { type: "text", bind: "message" },
      data: { message: "Hello Facet" },
    });
    assert.equal(result.textContent, "Hello Facet");
    assert(result.classList.contains("facet-node--text"));
  });

  it("never throws for unknown, null, cyclic, or failed nodes", () => {
    const cyclic = { type: "unknown" };
    cyclic.self = cyclic;

    for (const node of [null, {}, { type: "unknown" }, cyclic]) {
      assert.doesNotThrow(() => render(node));
      assert.equal(render(node).dataset.fallback, "true");
    }

    const original = PRIMITIVES.text;
    registerPrimitive("text", () => {
      throw new Error("primitive failed");
    });
    try {
      assert.doesNotThrow(() => render({ type: "text", text: "bad" }));
      assert.equal(render({ type: "text", text: "bad" }).dataset.fallback, "true");
    } finally {
      registerPrimitive("text", original);
    }
  });

  it("supports NEST including a chart inside a table cell", () => {
    const result = renderDocument({
      root: {
        type: "table",
        rows: { source: "rows" },
        columns: [
          { label: "Name", cell: { type: "text", bind: "name" } },
          { label: "Trend", cell: { type: "chart", data: { bind: "trend" } } },
        ],
      },
      data: { rows: [{ name: "Alpha", trend: [2, 4, 3] }] },
    });

    assert.equal(result.querySelector("tbody .facet-text").textContent, "Alpha");
    assert.equal(result.querySelectorAll("tbody .facet-chart__bar").length, 3);
  });

  it("maps all fixed annotations to deterministic affordances", () => {
    const result = render({
      type: "card",
      title: "Annotated",
      annotations: {
        confidence: { value: "95%" },
        provenance: { value: "source.json" },
        freshness: { value: "2m" },
        uncertainty: { value: "±3" },
        risk: { value: "medium" },
      },
    });

    for (const kind of ["confidence", "provenance", "freshness", "uncertainty", "risk"]) {
      assert(result.querySelector(`.facet-annotation--${kind}`), `${kind} affordance missing`);
    }
  });

  it("marks summary and full zoom levels without changing the renderer API", () => {
    assert.equal(render({ type: "card", zoom: "summary" }).dataset.zoom, "summary");
    assert.equal(render({ type: "card", zoom: "full" }).dataset.zoom, "full");
  });

  it("emits row selections through the shared ctx interface", () => {
    const events = [];
    const result = renderDocument({
      root: {
        type: "table",
        id: "results",
        rows: [{ name: "Selected" }],
        columns: [{ label: "Name", key: "name" }],
      },
    }, {
      emit: (...args) => events.push(args),
    });

    result.querySelector("tbody tr").click();
    assert.deepEqual(events, [["select", "results", { name: "Selected" }]]);
  });

  it("lets the interaction layer replace the gate slot", () => {
    const original = PRIMITIVES.gate;
    registerPrimitive("gate", () => {
      const output = document.createElement("button");
      output.textContent = "Approve";
      return output;
    });
    try {
      assert.equal(render({ type: "gate" }).textContent, "Approve");
    } finally {
      registerPrimitive("gate", original);
    }
  });
});
